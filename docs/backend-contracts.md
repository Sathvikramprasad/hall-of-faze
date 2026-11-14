# Backend handoff (issue #1)

## Identity and ownership
The canonical ID is a MongoDB ObjectId as a lowercase 24-character hex string. Cross-feature foreign keys use ID from @/types.
Backend route handlers import getCurrentUser(request) or requireModerator(request) from @/lib/auth. Both accept NextRequest. Never trust an ID or role supplied in a client body. getCurrentUser returns null for missing/expired sessions, or the Mongoose user document. requireModerator returns the document only for moderator accounts.

**Role provisioning:** public registration always creates user accounts; promote moderators using a trusted database administrative operation, not a public endpoint. User documents include passwordHash only if explicitly selected; never return it in API JSON.

## Shared contracts
Import type { User, AccountUser, Clip, Challenge, ID, ApiResponse, Role } from "@/types". User is the public-safe profile; AccountUser includes email (owner-only). Media and community own Clip and Challenge persistence schemas, respectively. API dates are UTC ISO strings. Only give authorized users playback URLs for unapproved media.

## Endpoints
Responses: success: { success: true, data }, error: { success: false, error: { code, message } }. No-store caching. Cookie sessions are HttpOnly, SameSite=Lax, and Secure in production.
- POST /api/auth/register (guest): { email, password (12-128 chars), displayName (2-50 chars) }. Returns 201 and { user } and session cookie. Cannot assign role.
- POST /api/auth/login: { email, password }. Returns 200 and { user } and session cookie.
- POST /api/auth/logout: no body. Revokes session and clears cookie.
- GET /api/user/me: requires session. Returns { user } with stable id, otherwise 401.
- PATCH /api/user/me: requires session. Accepts only displayName and socialLinks. Returns { user }. Never accepts role, email, password, or target user ID.

The socialLinks field replaces the entire set when supplied; include current links to preserve them. Null or empty values clear links. Example: { "socialLinks": { "twitch": "twitch.tv/Creator", "youtube": "youtube.com/@Creator" } }. Twitch URLs are normalized to https://www.twitch.tv/creator and YouTube to https://www.youtube.com/@Creator. These are unverified profile URLs, NOT OAuth-linked accounts.

## Environment and deployments
MONGODB_URI is required on the server and must grant appropriate MongoDB Atlas database access. Create an untracked .env.local for development, and configure deployment-provider environment settings for staging/production. Never commit secrets.
Session documents expire after seven days, checked per request and cleaned with a MongoDB TTL index. Production requires HTTPS.

## Reproducible checks
1. Install dependencies with npm ci, then run npm run lint and npm run build.
2. With a real MONGODB_URI, register a new user and save returned user.id/cookie.
3. GET /api/user/me without cookies returns 401; with valid cookie returns the same id.
4. PATCH profile, confirm normalization and unchanged id. PATCH {role:"moderator"} must return 400.
5. POST logout, then GET profile with the old token must return 401.
6. Register with role: moderator supplied: account must still be role user.
7. Test moderator endpoint guards, upload ownership, vote user ID, and end-to-end staging flow with other feature branches.

## Known limitations
- Actual database-backed integration, lint, and build remain unverified until dependencies and staging MongoDB are available.
- Add distributed rate limiting, account verification/reset, and user-facing session management before a public release.
- Do not launch on public internet before abuse controls are added.
- Cross-branch integration, staging deployment, and demo verification remain pending.
- Temporary /api/db-test diagnostic removed on this branch.
