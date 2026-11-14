# Clips: upload, storage, playback and moderation

Owner: @Anix1865 · Branch: `feat/media` · Issue #4

## How it works

```
Browser                         Next.js API                         S3-compatible bucket (private)
  │ POST /api/clips  (metadata) ─▶ validate, create Clip{processing}
  │ ◀── presigned PUT URLs ───────┘
  │ PUT video + thumbnail ──────────────────────────────────────────▶ clips/<id>/video.mp4, thumbnail.jpg
  │ POST /api/clips/<id>/complete ▶ HEAD + read first bytes of each object:
  │                                 exact size, declared type, real file signature
  │                                 ok  → status pending_review (still private)
  │                                 bad → objects + record deleted, 422
  │
Moderator  /admin/clips ─ PATCH /api/admin/clips/<id> {approve|reject|reopen}
  │                                 approve → status approved, approvedAt set
  │
Anyone  /clips, /clips/<id>, GET /api/clips ─ approved clips only
        media via /api/clips/<id>/media/{video|thumbnail} → 302 to a short-lived signed URL
```

### Status transitions

| From | To | Who |
|---|---|---|
| `processing` | `pending_review` | system, after the stored files pass verification |
| `processing` | `rejected` | system |
| `pending_review` | `approved` | moderator — clip becomes public and vote-eligible |
| `pending_review` | `rejected` | moderator (reason required) |
| `approved` | `rejected` | moderator takedown (reason required) — leaves the feed immediately |
| `rejected` | `pending_review` | moderator reopens |

Every change is appended to `statusHistory`. Transitions use the current status as an optimistic lock, so two moderators can't both act on the same clip.

### Privacy guarantees

- The bucket is private. Object keys are never sent to clients.
- Media is only reachable through `/api/clips/<id>/media/<kind>`, which checks access on every request and redirects to a signed URL (thumbnail 10 min, video 1 h). Responses are `Cache-Control: private, no-store`.
- `processing` media is visible to no one. `pending_review` and `rejected` media is visible only to its uploader and moderators. Everyone else gets **404** (not 403), so private clips aren't revealed to exist.
- Public serialization (`toPublicClip`) throws if it is ever given a non-approved clip, and the feed query always filters on `status: "approved"`.

### Validation (server-side, always)

| | Rules |
|---|---|
| Title | required, ≤ 100 characters |
| Description | optional, ≤ 500 characters |
| Thumbnail | JPG, PNG or WebP · **under 5 MB** · extension matches type · real file signature matches type |
| Video | MP4, WebM or MOV · ≤ 250 MB · extension matches type · real file signature matches type · ≤ 3 min (browser-reported) |

The same checks run in the browser first for fast feedback (`src/lib/clip-rules.ts` is shared).

### Partial and abandoned uploads

- If a PUT fails, the browser deletes the half-created clip (`DELETE /api/clips/<id>`).
- If `complete` is called before a file has landed, it returns `409 upload_incomplete` and the browser retries.
- Uploads that never complete expire after 2 hours. They are removed (record and stored files) automatically after new uploads, and by **Clean up abandoned uploads** in `/admin/clips` (`POST /api/admin/clips/cleanup`).

## Pages

| Route | What |
|---|---|
| `/upload` (`?challengeId=…` optional) | Upload form with custom-thumbnail preview and progress |
| `/clips` (`?challengeId=…`) | Public feed of approved clips |
| `/clips/<id>` | Detail page with player: play/pause, seek, mute, volume, speed (0.25–2×), fullscreen, keyboard shortcuts. The uploader also sees their own pending/rejected clip with a status banner. |
| `/admin/clips` | Moderator review: tabs per status, playback, approve / reject / take down / reopen / delete, AI review |

## API for other features (stable)

All errors use `{ "error": { "code", "message", "details"? } }`.

### `GET /api/clips` — approved clips (public)

Query: `challengeId`, `limit` (1–50, default 24), `cursor` (from `nextCursor`).

```json
{
  "clips": [
    {
      "id": "6736…",
      "title": "1v4 clutch",
      "description": "",
      "challengeId": "legacy-2026-11",
      "uploaderId": "guest_…",
      "status": "approved",
      "voteEligible": true,
      "voteCount": 0,
      "durationSeconds": 42.5,
      "thumbnailUrl": "/api/clips/6736…/media/thumbnail",
      "videoUrl": "/api/clips/6736…/media/video",
      "createdAt": "2026-11-14T23:10:00.000Z",
      "approvedAt": "2026-11-14T23:20:00.000Z"
    }
  ],
  "nextCursor": null
}
```

### `GET /api/clips/<id>`

Approved → the public shape above. Uploader/moderator also get unapproved clips (with `status`, `rejectionReason`). Otherwise 404.

### Server-side helpers (`src/lib/clips.ts`)

For voting and leaderboards (@Sathvikramprasad), import these instead of querying the collection:

```ts
import { listApprovedClips, getApprovedClip, isClipVoteEligible } from "@/lib/clips";

await isClipVoteEligible(clipId, challengeId); // approved + belongs to the challenge
```

`Clip.voteCount` exists (default 0) for the voting feature to maintain. Late/duplicate vote rules stay in the voting feature.

### Other endpoints

| Method + path | Who | Purpose |
|---|---|---|
| `POST /api/clips` | anyone | Start upload → `201 { clip, uploads: { video, thumbnail }, expiresInSeconds }` |
| `POST /api/clips/<id>/complete` | uploader | Verify stored files → `pending_review` |
| `DELETE /api/clips/<id>` | uploader (not approved) / moderator | Delete clip + files |
| `GET /api/clips/<id>/media/{video,thumbnail}` | per access rules | 302 to signed URL |
| `GET/POST/DELETE /api/admin/clips/session` | — | Moderator session status / sign-in / sign-out |
| `GET /api/admin/clips?status=` | moderator | Queue + counts |
| `PATCH /api/admin/clips/<id>` | moderator | `{ action: "approve" \| "reject" \| "reopen", reason? }` |
| `POST /api/admin/clips/<id>/ai-review` | moderator | Run Gemini review |
| `POST /api/admin/clips/cleanup` | moderator | Remove abandoned uploads |

## Gemini moderation (advisory)

Runs only when `GEMINI_API_KEY` is set: from the **Run AI review** button, or automatically after each verified upload when `GEMINI_AUTO_REVIEW=true`. Gemini gets the title, description, thumbnail and (if ≤ 12 MB) the video, and returns structured JSON: `verdict` (approve/review/reject), `confidence`, `categories`, `summary`. The result is shown to the moderator. **It never changes a clip's status** — manual moderation remains the decision.

## Environment variables

Put these in `.env.local` (never commit it):

| Variable | Required | Example / notes |
|---|---|---|
| `MONGODB_URI` | yes | existing |
| `S3_ENDPOINT` | yes | `https://<account>.r2.cloudflarestorage.com`, `https://s3.us-east-1.amazonaws.com`, `http://localhost:9000` (MinIO) |
| `S3_REGION` | AWS: yes | `us-east-1`; R2: `auto` (default) |
| `S3_BUCKET` | yes | `hall-of-faze-clips` (must be **private**) |
| `S3_ACCESS_KEY_ID` | yes | key with Get/Put/Delete on the bucket (+ ListBucket so missing objects return 404) |
| `S3_SECRET_ACCESS_KEY` | yes | |
| `S3_FORCE_PATH_STYLE` | no | default `true`; set `false` for virtual-hosted AWS URLs |
| `S3_SESSION_TOKEN` | no | temporary AWS credentials only |
| `MODERATOR_ACCESS_KEY` | yes for moderation | 12+ random characters; temporary until shared auth roles land |
| `GEMINI_API_KEY` | no | enables AI review |
| `GEMINI_MODEL` | no | default `gemini-3.5-flash` |
| `GEMINI_AUTO_REVIEW` | no | `true` to review every verified upload automatically |

### Bucket CORS (required for browser uploads and playback)

The browser PUTs directly to the bucket, so allow your site's origins:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://<your-staging-domain>"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Range"],
    "MaxAgeSeconds": 3600
  }
]
```

## Test steps

Automated (no services needed):

```bash
npm run test:media   # signing against AWS's published test vectors, validation, file-signature sniffing
npm run lint
npm run build        # needs MONGODB_URI set (existing src/lib/mongodb.ts throws without it)
```

Manual end-to-end (`npm run dev`, env above set):

1. **Upload:** open `/upload`. Pick a `.gif` or a 6 MB image as thumbnail → inline error, no request sent. Rename a `.txt` to `.png` → "not a valid … image". Pick a valid JPG → preview appears.
2. Submit without a title → field error. Submit a valid clip → progress bars → "Clip submitted for review".
3. **Private until approval:** "Preview my clip" plays for you, with a "Waiting for review" banner. In a private window, `/clips/<id>`, `/api/clips/<id>` and `/api/clips/<id>/media/video` all return 404, and `/clips` doesn't list it.
4. **Partial upload:** start an upload and go offline during the PUT → "Nothing was saved"; no `pending_review` clip appears in `/admin/clips`.
5. **Moderation:** open `/admin/clips`, sign in with `MODERATOR_ACCESS_KEY`. Reject without a reason → blocked. Approve → the clip moves to the Approved tab.
6. **Public + vote-eligible:** in the private window, `/clips` now shows the clip; `/api/clips` returns it with `"voteEligible": true`.
7. **Playback:** on `/clips/<id>` check play/pause, seek bar, mute, volume, speed 0.25–2×, fullscreen; keyboard: Space, ←/→, ↑/↓, M, F, `<`/`>`.
8. **Takedown:** in Approved, "Take down" with a reason → disappears from `/clips` and its media URLs 404 for the public.
9. **AI (optional):** with `GEMINI_API_KEY`, "Run AI review" shows a verdict card; the status does not change.

## Known limitations

- **Auth is a stand-in.** Uploaders are identified by a guest cookie and moderators by a shared access key (`src/lib/clip-identity.ts`). Swap that one file for the shared auth from #1 when it lands; no route changes needed.
- **No transcoding.** Clips play in whatever format was uploaded; MOV/HEVC may not play in every browser. The duration limit is checked in the browser only (the server can't decode video without ffprobe).
- **No rate limiting** on uploads yet.
- Signed video URLs last 1 hour; a page left open longer must be refreshed to keep seeking.
- AI review sends inline data, so videos over 12 MB are judged on title, description and thumbnail only.
