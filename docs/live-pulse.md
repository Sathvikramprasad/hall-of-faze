# FaZe Live Pulse

Live Pulse combines official YouTube channel activity with the official FaZe Twitch team directory. It appears as a preview on `/` and as the complete public experience at `/live`.

## Data flow

- YouTube: resolves the channel's uploads playlist, then loads the six newest public uploads and channel statistics.
- Twitch: obtains a server-to-server app token, resolves the `faze` team, checks its channels for live streams, and loads top clips for offline discovery.
- Credentials are used only in the server aggregation module. They are never returned to the browser.
- A failure from one provider does not prevent the other provider or the page shell from rendering.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `YOUTUBE_API_KEY` | yes | YouTube Data API v3 key, restricted to that API. |
| `TWITCH_CLIENT_ID` | yes | Twitch developer application client ID. |
| `TWITCH_CLIENT_SECRET` | yes | Secret from the same confidential Twitch application. |
| `YOUTUBE_CHANNEL_HANDLE` | no | Defaults to `@FaZeClan`. |
| `TWITCH_TEAM_NAME` | no | Defaults to `faze`. |
| `TWITCH_CHANNELS` | no | Comma-separated extra Twitch logins; useful for creators not present in the team response. |

Set the three required variables for Development, Preview, and Production in Vercel, then redeploy. Do not commit them to the repository.

## Refresh behavior

- Twitch live status: 2 minutes.
- YouTube uploads and channel totals: 15 minutes.
- Twitch team directory, creator data, and clips: 1 hour.
- Twitch app tokens are kept only in server memory until shortly before expiration.

## Verification

```bash
npm run test:live
npm run typecheck
npm run lint
npm run build
```

On a deployment with credentials, visit `/live`. Both provider badges should show a green status dot. Twitch can correctly show zero live channels; that is not an error, and top clips remain available.
