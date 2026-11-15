# Challenges, voting, and leaderboard

Owner: `@Sathvikramprasad` · Branch: `feat/community` · Issue: `#3`

## What this branch provides

- `Challenge` and `Vote` Mongoose models.
- A database-level unique constraint for one vote per user, clip, challenge, and round.
- Active challenge listing and challenge detail APIs.
- Approved-only, challenge-scoped leaderboard results.
- Deterministic monthly ranking and a Top 3 page.
- Next Up challenge pages and authenticated vote controls.

## Public endpoints

| Method | Route | Behavior |
|---|---|---|
| `GET` | `/api/challenges` | Active challenges whose voting window is currently open. |
| `GET` | `/api/challenges/:id` | One challenge by MongoDB ID or slug. |
| `GET` | `/api/leaderboard?challengeId=...&round=YYYY-MM&limit=3` | Approved eligible clips ordered by valid votes. |
| `POST` | `/api/votes` | Authenticated `{ clipId, challengeId }` vote. |

Responses follow Soham's shared envelope: `{ success: true, data }` or `{ success: false, error }`.

## Vote validation

The server rejects a vote when:

1. The request has no valid `hof_session` database session.
2. The challenge or IDs do not exist.
3. The challenge is not active or the current time is outside `[startsAt, endsAt)`.
4. The clip is not approved or does not belong to the challenge.
5. The same user already voted for that clip in the challenge's configured round.

The compound unique index on `Vote` is the final concurrency-safe duplicate guard. Leaderboard totals are derived from `Vote` records; the API never accepts a client-supplied vote total.

## Deterministic ranking

1. Higher valid vote count.
2. Earlier clip approval timestamp.
3. Lexicographically smaller clip ID.

The closing instant is exclusive, and each item receives a unique ordinal rank. The same records therefore always produce the same Top 3.

## Local setup

```bash
npm run seed:community
npm run test:community
npm run dev
```

Open `/next-up` and `/leaderboard`. The seed command is idempotent and creates or updates one November 2026 demo challenge in `hall_of_faze`.

## Integration notes

- Voting resolves the authenticated user through the shared `getCurrentUser(request)` session contract.
- Vote eligibility uses the media feature's `isClipVoteEligible`, so only approved clips belonging to the selected challenge qualify.
- Approved clip URLs use the stable `/api/clips/:id/media/:kind` routes.
- Homepage Top 3 and public clip cards aggregate the same `Vote` records as the leaderboard.
