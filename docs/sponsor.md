# Demo sponsor and sponsored challenges

Branch: `sponsor` (from `main` at `f62fcd8`, after PR #9)

Shows how Hall of FaZe makes money from **sponsored challenges** (the revenue
requirement in FaZe's HackUTA brief) using a **fictional** sponsor,
**Voltline Energy**. It is labeled "Demo sponsor" everywhere it appears, and the
prizes are marked as demo prizes, so nothing suggests a real partnership.

## What it adds

| Where | What users see |
|---|---|
| Every page, wide screens (1280px+) | A slim "Sponsor" tab on the empty right edge. Hover or keyboard focus slides out a card: "Challenges presented by Voltline Energy", tagline, *Demo sponsor* label and the sponsor button. |
| Every page, phones and tablets | One thin line under the navigation: "Presented by ⚡ Voltline Energy · DEMO" (plus "Visit →" from 400px wide). |
| `/next-up` | Each sponsored challenge card shows "Presented by Voltline Energy · Demo" and the top prize. |
| `/next-up/[id]` | Title named after the sponsor ("Voltline Energy Legacy Clutch Challenge"), a "Presented by" badge, the closing date, **Prizes** (1st/2nd/3rd cards with a demo-prize notice), **How to win** (5 steps), entries with voting, and **Official rules**. |
| `/leaderboard`, Home Top 3 | Use the sponsored challenge name. |

## Turning the sponsor link on

The link is **off** by default: the banner shows "Link coming soon" and nothing
is clickable. To send people to the sponsor's page, set both in `.env.local`
(local) or the host's environment settings (staging/production):

```
SPONSOR_LINK_ENABLED=true
SPONSOR_URL=https://the-sponsors-page.example.com/hall-of-faze
```

Then restart `npm run dev`, or rebuild and redeploy (the banner is part of the
prerendered page shell, so the value is read at build time). Only `https://`
URLs are accepted; anything else keeps the link off. Links open in a new tab
with `rel="sponsored noopener noreferrer"` (the `sponsored` value tells search
engines it is a paid link).

To turn it off again, remove `SPONSOR_LINK_ENABLED` (or set it to anything other
than `true`) and restart or redeploy.

## Updating the challenge in the database

The challenge text lives in MongoDB. Re-run the seed after pulling this branch
to rename the November challenge and add its prizes and rules (same slug, so
existing links and votes keep working):

```
npm run seed:community
```

Challenges now support two optional fields, editable the same way:

- `prizes`: `[{ place: "1st", reward: "..." }, ...]` (up to 10)
- `howToWin`: `["step", ...]` (up to 10). When empty, the page shows steps
  generated from the real voting rules and the challenge's closing time.

A challenge is "named after its sponsor" by `sponsoredTitle()` in
`src/lib/sponsor.ts`: if `sponsorName` is set and the title does not already
start with it, the sponsor name is put in front.

## Changing the sponsor

Edit `src/lib/sponsor.ts` (name, tagline, `isDemo`), `SponsorMark.tsx` (logo)
and the challenge's `sponsorName`. Only use a real company's name or logo with
that company's written permission; until then keep a fictional sponsor and
the demo labels.

## Tests

`npm run test:sponsor` (4 tests): link off by default, link needs both settings
and an https URL, unsafe URLs rejected, sponsored titles not doubled.
`npm test` now runs backend, media, community and sponsor suites.

## Known limitations

- No admin screen to edit sponsors or prizes; change the seed or the database.
- One site-wide sponsor; per-challenge sponsor branding uses the same banner.
- No impression or click tracking yet (LivePulse analytics are not built).
