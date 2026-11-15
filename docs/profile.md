# My Profile, email verification and password reset

The nav's **My Profile** link (still at `/account`) shows, for a signed-in user:

- **Profile picture.** Upload a JPEG, PNG or WebP up to 2 MB, or remove it. Without one, the avatar is the first letter or number of the display name on a colour picked from the account ID.
- **Edit name** next to the display name (2–50 characters).
- **My clips.** Every clip the user has submitted, newest first, with its status (In review / Approved / Rejected, plus the reason), votes and date. The challenge name sits under the clip title and links to the challenge page while the challenge is active and hasn't ended; after that it shows the name with an **Ended** tag and no link. Approved clips open their clip page. **Delete clip** asks for confirmation, then removes the clip, its votes and its files. Owners can now delete approved clips too.
- **Reset password.** Emails a 6-digit code to the account's address; entering it with a new password changes the password and signs out every other device.

Signed out, the sign-in form has **Forgot password?**, which runs the same code flow by email address. The reply is identical whether or not an account exists.

## Email verification

New accounts start unverified. Right after sign-up a 6-digit code is emailed and the account page shows **Verify your email** (with *Send a new code* and *Wrong email? Sign out*).

Until the code is entered the account is treated as signed out everywhere else: `getUserFromSessionToken()` returns null for unverified accounts unless the caller passes `{ allowUnverified: true }` (only `GET /api/user/me`, the verify and resend routes, and password reset do). So uploads, votes, moderation and the full nav all require a verified email without each feature checking it. Accounts created before this change have no `emailVerified` value and count as verified. Completing a password reset also verifies the email, because the code arrived there.

Codes: 6 digits, stored only as a SHA-256 hash bound to the account and purpose, valid 15 minutes, 5 wrong tries, 60 seconds between sends, at most 6 sends an hour per purpose.

## Setup

| Variable | Notes |
| --- | --- |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) (free tier: 3,000 emails a month). |
| `EMAIL_FROM` | Sender, e.g. `Hall of FaZe <noreply@your-domain>`. Resend's test sender `onboarding@resend.dev` only delivers to the Resend account owner's own address; verify a domain to email anyone. |

Without these, in development the email (with the code) is printed to the `npm run dev` terminal. In production, sign-up still creates the account but sending fails and the API answers "Email isn't set up on this server yet."

Profile pictures use the same Vultr bucket as clips (`avatars/<userId>/…`), uploaded server-side so no extra CORS rules are needed, and are served through `GET /api/users/<id>/avatar` (a redirect to a 1-hour signed URL).

## API

| Method | Route | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | Creates the account unverified and emails a code. |
| POST | `/api/auth/verify-email` | `{ code }` |
| POST | `/api/auth/verify-email/resend` | |
| POST | `/api/auth/password-reset/request` | `{}` when signed in, `{ email }` when not |
| POST | `/api/auth/password-reset/confirm` | `{ code, newPassword }` (+ `email` when signed out) |
| GET | `/api/user/me` | user now includes `emailVerified`, `avatarUrl` |
| PUT/DELETE | `/api/user/avatar` | multipart `file` |
| GET | `/api/users/[id]/avatar` | redirect, 404 when none |
| GET | `/api/user/clips` | the user's clips with challenge `{ id, slug, title, open }` |
| DELETE | `/api/clips/[id]` | owner (any status) or moderator; also deletes the clip's votes |

Tests: `npm run test:profile`.
