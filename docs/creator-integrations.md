# Twitch and YouTube integrations

Three features use the Twitch and YouTube channel links stored on each account:

1. **Submit clips by link.** On `/upload`, the **Paste a Twitch or YouTube link** tab accepts a Twitch clip, a YouTube video or a YouTube Short.
   - The server looks the link up through Twitch's clips API or YouTube's video API and fills in the title, thumbnail and length.
   - It refuses anything over 3 minutes, live streams, and videos whose channel blocks embedding.
   - The clip plays in Twitch's or YouTube's own player, so nothing is stored in the bucket. Link clips go through the same moderation and voting as uploads.
2. **Live now and channel stats.**
   - **Home** has a **Live now** strip showing which FaZe channels are streaming on Twitch, with the busiest stream in a player.
   - **Vault member pages** show live status, the real YouTube subscriber count and the latest uploads for members whose channels are listed in `src/lib/vault/members.ts`.
   - **My Profile** shows the same for the user's own linked channels, and is where users enter their links.
3. **Verified creators.**
   - **Connect Twitch** and **Connect YouTube** on My Profile sign the user in to that platform once, to prove a channel is theirs. Verified users get a badge on their profile, and their link clips get one too.
   - While a platform's sign-in is set up, link clips from that platform must come from the submitter's own verified channel, so nobody can enter someone else's highlight.

Everything fails soft. Without keys, the link tab explains that the integration isn't set up, the Live now strip and channel sections are hidden, and the Connect buttons don't appear.

## Setup

| Variable | Needed for | Where to get it |
| --- | --- | --- |
| `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET` | 1, 2, 3 | [dev.twitch.tv/console/apps](https://dev.twitch.tv/console/apps): **Register Your Application**, category Website Integration, client type Confidential. Twitch requires two-factor authentication on the account. |
| `YOUTUBE_API_KEY` | 1, 2 | Google Cloud Console: enable **YouTube Data API v3**, then **Credentials → Create credentials → API key**. Restrict the key to that API. |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | 3 (Connect YouTube) | Same Google Cloud project, **Google Auth Platform**: audience External, add the scope `https://www.googleapis.com/auth/youtube.readonly`, add test users, then create a **Web application** client. |
| `APP_URL` | optional | The site's public origin, e.g. `https://hall-of-faze.example`. Only needed if the app runs behind a proxy that changes the request's origin. |
| `LINK_CLIPS_OWN_CHANNEL_ONLY` | optional | Set to `false` to let anyone enter clips from any channel. They're then shown without the verified badge. |

Register these redirect URLs:

| Platform | Local | Deployed |
| --- | --- | --- |
| Twitch (OAuth Redirect URLs) | `http://localhost:3000/api/connect/twitch/callback` | `https://<your-domain>/api/connect/twitch/callback` |
| Google (Authorized redirect URIs) | `http://localhost:3000/api/connect/youtube/callback` | `https://<your-domain>/api/connect/youtube/callback` |

Twitch's player only loads on the domain named in its `parent` parameter. The players fill that in from the page's own address, so no extra setup is needed after deploying.

## Limits and costs

- **YouTube quota.** The default is 10,000 units a day. Every call here costs 1 unit: looking up a video, a channel, or a channel's latest uploads. The 100-unit search endpoint is never used. Results are cached in memory: videos and channels for 10 minutes.
- **Twitch.** An app access token (client credentials) is cached until it expires. Who's live is cached for 90 seconds and fetched for every channel in one request.
- **Google sign-in in Testing mode.** Only accounts listed as test users (up to 100) can use **Connect YouTube**. Google shows an "unverified app" notice. Because the token is used once and revoked, Google's 7-day token expiry in Testing mode doesn't matter here.
- **Stored data.** Connecting stores the Twitch user id, login and display name, or the YouTube channel id, title and handle. Sign-in tokens are revoked right after use and never stored. A channel can be verified on only one Hall of FaZe account.
- **Subscriber counts** come straight from YouTube, which rounds public counts (for example 29.7M).
- **Twitch clip lengths.** Twitch can't serve its clips to Gemini, so AI review of a Twitch link clip uses the title, description and thumbnail. For YouTube clips, Gemini also watches the video by URL.

## API

| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api/clips/link?url=…` | Signed in. Looks up a link: `{ preview, ownChannelRequired, fromYourChannel }`. |
| POST | `/api/clips/link` | Signed in. Body `{ url, title?, description?, challengeId? }`. Creates the clip in `pending_review`. Returns `409` if the same clip was already entered (and not rejected) for that challenge, and `403` when the own-channel rule blocks it. |
| GET | `/api/user/channels` | Signed in. The user's live status, YouTube stats, and which integrations are set up. |
| GET | `/api/connect/{twitch\|youtube}` | Starts Connect. Redirects to Twitch or Google with a one-time `state` cookie. |
| GET | `/api/connect/{twitch\|youtube}/callback` | Saves the verified channel, then redirects to `/account?connected=…` or `?connect_error=…`. |
| DELETE | `/api/connect/{twitch\|youtube}` | Removes the verified connection. The profile link stays. |

Public clip JSON (`PublicClip`) now includes `source`: `{ platform, id, url, channelName, verifiedOwner }` for link clips, or `null` for uploads. `thumbnailUrl` and `videoUrl` keep working for both kinds: for link clips they redirect to the platform's thumbnail and clip page.
