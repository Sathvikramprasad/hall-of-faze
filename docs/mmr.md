# Competitive ranking

Five divisions run from Tier V (grey) through Tier I (crimson). Each division
spans 300 points. A win adds 300, second adds 150, and third adds 100. Promotion
carries existing progress into the next division; Tier I is capped. Other top
10% finishers (rounded down), and all top-ten finishers, earn modest progress
scaled by their votes relative to the winner. Everyone else loses points based
on placement, with votes softening but never eliminating the penalty.

A loss reaching zero first holds the player in their division with a demotion
warning. The next loss demotes them to the previous division's upper end.
Positive progress clears the warning. Tier V is the floor. After seven inactive
days, each subsequent full day removes eight points under the same warning
rules. Activity is the closing time of a settled challenge the player entered.
Decay is calculated from immutable results at read time: no scheduled job or
write-on-read is required. Daily decay stops at the floor.

## Moderator workflow

Sign in as a moderator, open My Profile → Manage challenge rankings
(`/admin/mmr`). Copy the challenge ID from its API response or upload link.
Save the sponsor's HTTPS badge artwork URL before settlement. Artwork is
optional: without it, winners receive a clearly labelled champion star. Each
round's winning badge snapshots the sponsor, title, and artwork, so subsequent
challenge edits cannot change an earned badge.

After the challenge closes, settle final rankings. Retrying returns the
original participant count and `alreadySettled: true`, even for an empty round.
The UI is backed by role-checked, origin-checked endpoints:

- `PATCH /api/admin/mmr/badge`: `{ challengeId, artworkUrl }`
- `POST /api/admin/mmr/settle`: `{ challengeId }`
- `GET /api/user/mmr`: signed-in player's rank and badges
- `GET /api/users/:id/mmr`: public rank and display name (no email or credentials)
- `GET /api/challenges/:id/standings?page=1`: final player standings, 50 per page

Public profiles are at `/players/:id`, linked from challenge entries, clip
details, and final standings. The question mark supports hover, keyboard focus,
and click/touch. Its explanation intentionally omits point amounts.

## Settlement guarantees and deployment

MongoDB **must be a replica set or Atlas deployment**. Settlement and voting
use transactions and fail closed on standalone MongoDB. Model initialization
awaits unique indexes before writing. A snapshot transaction reads every
eligible clip and vote, writes one result per player and a unique round marker,
and commits them together with majority write concern. A challenge write fence
serializes votes, artwork updates, and settlement. Retried transactions recheck
eligibility/deadlines. No participant/clip cap truncates settlement. Very large
rounds exceeding MongoDB's transaction limits fail atomically for an operator
to investigate; they never publish a partial result.

Only approved clips with approval timestamps within the challenge window count.
Only votes from that round with timestamps within the same window count. Each
player's best clip determines their placement; multiple clips cannot multiply
rewards or inflate the participant count. Ties use earlier approval then lower
clip ID, consistent with the existing leaderboard. AI coaching is excluded.
Settled results remain immutable even if clips are later moderated. Rank replay
orders by challenge closing time, then challenge ID and round, independent of
settlement request order. Only results with a committed marker affect profiles.

Before rollout, inspect any results written by the initial partial implementation.
Rows without a matching `MmrSettlement` marker are deliberately excluded from
public ranks; settlement reports that reconciliation is required. Audit them
against the full standings and reconcile or remove them in a backed-up,
operator-approved migration before re-settling. The application does not delete
or silently recalculate legacy rows.

## Verification

`npm test` includes rules and MongoDB integration tests, including 5,011 players,
simultaneous settlers, rollback after inserted results, repeat requests, empty
rounds, vote cutoffs/rounds, duplicate votes, public API privacy/pagination,
moderator authorization, and immutable sponsor artwork. Tests start an isolated
local replica set, never load `.env.local`, and never touch a deployed database.
First run downloads MongoDB 7.0.14 (pinned for older macOS compatibility).
`npm run test:mmr` runs just that integration suite. Node 22+ is required.
Run `npm run lint`, `npm run typecheck`, and `npm run build` as well. Builds need
Google Fonts access and `MONGODB_URI` defined; CI uses a build-only placeholder.
