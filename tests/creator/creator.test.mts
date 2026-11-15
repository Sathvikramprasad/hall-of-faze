import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import test from "node:test";

type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => unknown,
) => unknown;

const registerHooks = (nodeModule as unknown as { registerHooks(hooks: { resolve: ResolveHook }): void }).registerHooks;

// Resolve the app's "@/…" alias and extensionless TypeScript imports the way Next's bundler does.
const srcRoot = new URL("../../src/", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    const mapped = specifier.startsWith("@/") ? new URL(specifier.slice(2), srcRoot).href : specifier;
    try {
      return nextResolve(mapped, context);
    } catch (error) {
      if ((mapped.startsWith(".") || mapped.startsWith("file:")) && !/\.[a-z0-9]+$/i.test(mapped)) {
        return nextResolve(`${mapped}.ts`, context);
      }
      throw error;
    }
  },
});

// Importing the clip model pulls in the database helper, which needs a URI (it never connects here).
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/test";

const links = (await import(new URL("../../src/lib/creator-links.ts", import.meta.url).href)) as typeof import("../../src/lib/creator-links");
const cache = (await import(new URL("../../src/lib/ttl-cache.ts", import.meta.url).href)) as typeof import("../../src/lib/ttl-cache");
const twitch = (await import(new URL("../../src/lib/twitch.ts", import.meta.url).href)) as typeof import("../../src/lib/twitch");
const youtube = (await import(new URL("../../src/lib/youtube.ts", import.meta.url).href)) as typeof import("../../src/lib/youtube");
const linkClips = (await import(new URL("../../src/lib/link-clips.ts", import.meta.url).href)) as typeof import("../../src/lib/link-clips");

/* ------------------------------------------------------------------ */
/* Link parsing                                                        */
/* ------------------------------------------------------------------ */

test("recognises Twitch clip links in every common shape", () => {
  const slug = "AmazonianMoralSwordCharlietheUnicorn-JoRQeBi1QJuyKfu2";
  for (const url of [
    `https://clips.twitch.tv/${slug}`,
    `clips.twitch.tv/${slug}`,
    `https://www.twitch.tv/paymoneywubby/clip/${slug}?filter=clips&range=all`,
    `https://m.twitch.tv/clip/${slug}`,
    `https://clips.twitch.tv/embed?clip=${slug}&parent=example.com`,
  ]) {
    assert.deepEqual(links.parseClipLink(url), { platform: "twitch", id: slug }, url);
  }
});

test("recognises YouTube videos and Shorts", () => {
  const id = "dQw4w9WgXcQ";
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtube.com/watch?v=${id}&t=42s`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ]) {
    assert.deepEqual(links.parseClipLink(url), { platform: "youtube", id }, url);
  }
});

test("rejects links that are not a single clip or video", () => {
  for (const url of [
    "",
    "not a link",
    "https://www.twitch.tv/swagg",
    "https://www.twitch.tv/videos/1234567890",
    "https://www.youtube.com/@FaZeClan",
    "https://www.youtube.com/watch?v=short",
    "https://www.youtube.com/playlist?list=PL123",
    "https://evil.example/clips.twitch.tv/Slug",
    "javascript:alert(1)",
  ]) {
    assert.equal(links.parseClipLink(url), null, url);
  }
});

test("Twitch embeds carry the page's own domain as parent; YouTube uses the privacy-enhanced player", () => {
  const embed = new URL(links.clipEmbedUrl({ platform: "twitch", id: "Slug-1" }, "hall-of-faze.example"));
  assert.equal(embed.hostname, "clips.twitch.tv");
  assert.equal(embed.searchParams.get("clip"), "Slug-1");
  assert.equal(embed.searchParams.get("parent"), "hall-of-faze.example");
  assert.match(links.clipEmbedUrl({ platform: "youtube", id: "dQw4w9WgXcQ" }, "x"), /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  const live = new URL(links.twitchChannelEmbedUrl("swagg", "localhost"));
  assert.equal(live.searchParams.get("channel"), "swagg");
  assert.equal(live.searchParams.get("parent"), "localhost");
  assert.equal(live.searchParams.get("muted"), "true");
});

test("reads YouTube durations and formats lengths and counts", () => {
  assert.equal(links.parseIsoDuration("PT59S"), 59);
  assert.equal(links.parseIsoDuration("PT3M"), 180);
  assert.equal(links.parseIsoDuration("PT3M1S"), 181);
  assert.equal(links.parseIsoDuration("PT1H2M3S"), 3723);
  assert.equal(links.parseIsoDuration("P0D"), 0);
  assert.equal(links.parseIsoDuration("PT"), null);
  assert.equal(links.parseIsoDuration("garbage"), null);
  assert.equal(links.formatClipLength(65), "1:05");
  assert.equal(links.formatClipLength(3723), "1:02:03");
  assert.equal(links.formatClipLength(0), null);
  assert.equal(links.formatCount(999), "999");
  assert.equal(links.formatCount(1234), "1.2K");
  assert.equal(links.formatCount(29_700_000), "29.7M");
  assert.equal(links.formatCount(150_000), "150K");
});

test("turns stored profile links into channel lookups", () => {
  assert.equal(links.twitchLoginFromProfile("https://www.twitch.tv/JasonTheWeen"), "jasontheween");
  assert.equal(links.twitchLoginFromProfile("https://www.youtube.com/@x"), null);
  assert.deepEqual(links.youtubeChannelFromProfile("https://www.youtube.com/@bankshasbank"), { kind: "handle", value: "@bankshasbank" });
  assert.deepEqual(links.youtubeChannelFromProfile("https://www.youtube.com/channel/UCilwZiBBfI9X6yiZRzWty8Q"), {
    kind: "id",
    value: "UCilwZiBBfI9X6yiZRzWty8Q",
  });
  assert.deepEqual(links.youtubeChannelFromProfile("https://www.youtube.com/user/FaZeClan"), { kind: "username", value: "FaZeClan" });
  assert.equal(links.youtubeChannelFromProfile("https://www.youtube.com/c/Custom"), null);
});

/* ------------------------------------------------------------------ */
/* API clients (fetch mocked: no network, no keys)                     */
/* ------------------------------------------------------------------ */

type Call = { url: string; init?: RequestInit };
function mockFetch(handler: (url: URL, init?: RequestInit) => { status?: number; json: unknown }) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    calls.push({ url: url.href, init });
    const { status = 200, json } = handler(url, init);
    return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

function withEnv(values: Record<string, string | undefined>, run: () => Promise<void>) {
  const previous = Object.fromEntries(Object.keys(values).map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  cache.clearCache();
  return run().finally(() => {
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
}

const TWITCH_ENV = { TWITCH_CLIENT_ID: "test-client", TWITCH_CLIENT_SECRET: "test-secret" };

test("looks up a Twitch clip with an app token and normalizes it", () =>
  withEnv(TWITCH_ENV, async () => {
    const mock = mockFetch((url) => {
      if (url.hostname === "id.twitch.tv") return { json: { access_token: "app-token", expires_in: 5000 } };
      assert.equal(url.pathname, "/helix/clips");
      assert.equal(url.searchParams.get("id"), "Slug-1");
      return {
        json: {
          data: [
            {
              id: "Slug-1",
              url: "https://clips.twitch.tv/Slug-1",
              broadcaster_id: "123",
              broadcaster_name: "Swagg",
              title: "Nuke",
              thumbnail_url: "https://clips-media-assets2.twitch.tv/x.jpg",
              duration: 29.96,
              created_at: "2026-11-01T00:00:00Z",
            },
          ],
        },
      };
    });
    try {
      const clip = await twitch.getTwitchClip("Slug-1");
      assert.deepEqual(clip, {
        platform: "twitch",
        id: "Slug-1",
        title: "Nuke",
        url: "https://clips.twitch.tv/Slug-1",
        channelId: "123",
        channelName: "Swagg",
        thumbnailUrl: "https://clips-media-assets2.twitch.tv/x.jpg",
        durationSeconds: 30,
        publishedAt: "2026-11-01T00:00:00Z",
      });
      const helixCall = mock.calls.find((c) => c.url.includes("/helix/"))!;
      const headers = new Headers(helixCall.init?.headers);
      assert.equal(headers.get("Client-Id"), "test-client");
      assert.equal(headers.get("Authorization"), "Bearer app-token");
    } finally {
      mock.restore();
    }
  }));

test("reports a missing Twitch clip and a missing Twitch setup clearly", async () => {
  await withEnv(TWITCH_ENV, async () => {
    const mock = mockFetch((url) => (url.hostname === "id.twitch.tv" ? { json: { access_token: "t", expires_in: 5000 } } : { json: { data: [] } }));
    try {
      await assert.rejects(twitch.getTwitchClip("Gone-1"), { name: "ExternalServiceError", kind: "not_found" });
    } finally {
      mock.restore();
    }
  });
  await withEnv({ TWITCH_CLIENT_ID: undefined, TWITCH_CLIENT_SECRET: undefined }, async () => {
    await assert.rejects(twitch.getTwitchClip("Any-1"), { kind: "not_configured" });
  });
});

test("lists who's live, busiest first, in one request", () =>
  withEnv(TWITCH_ENV, async () => {
    const mock = mockFetch((url) => {
      if (url.hostname === "id.twitch.tv") return { json: { access_token: "t", expires_in: 5000 } };
      assert.deepEqual(url.searchParams.getAll("user_login").sort(), ["faze", "swagg"]);
      return {
        json: {
          data: [
            { user_login: "faze", user_name: "FaZe", title: "a", game_name: "CoD", viewer_count: 10, started_at: "", thumbnail_url: "https://x/{width}x{height}.jpg", type: "live" },
            { user_login: "swagg", user_name: "Swagg", title: "b", game_name: "CoD", viewer_count: 900, started_at: "", thumbnail_url: "https://y/{width}x{height}.jpg", type: "live" },
          ],
        },
      };
    });
    try {
      const live = await twitch.getLiveStreams(["Swagg", "faze", "swagg"]);
      assert.deepEqual(live.map((s) => s.login), ["swagg", "faze"]);
      assert.equal(live[0].thumbnailUrl, "https://y/640x360.jpg");
      assert.equal(mock.calls.filter((c) => c.url.includes("/helix/streams")).length, 1);
      await twitch.getLiveStreams(["faze", "swagg"]); // cached
      assert.equal(mock.calls.filter((c) => c.url.includes("/helix/streams")).length, 1);
    } finally {
      mock.restore();
    }
  }));

function youtubeVideo(overrides: Record<string, unknown> = {}) {
  return {
    id: "dQw4w9WgXcQ",
    snippet: {
      title: "Trickshot",
      channelId: "UCabc",
      channelTitle: "FaZe Clan",
      publishedAt: "2026-01-01T00:00:00Z",
      liveBroadcastContent: "none",
      thumbnails: { high: { url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" } },
    },
    contentDetails: { duration: "PT45S" },
    status: { embeddable: true, privacyStatus: "public" },
    ...overrides,
  };
}

test("looks up YouTube videos and refuses live streams and videos that can't be embedded", () =>
  withEnv({ YOUTUBE_API_KEY: "yt-key" }, async () => {
    let video: Record<string, unknown> = youtubeVideo();
    const mock = mockFetch((url) => {
      assert.equal(url.searchParams.get("key"), "yt-key");
      return { json: { items: [video] } };
    });
    try {
      const clip = await youtube.getYouTubeVideo("dQw4w9WgXcQ");
      assert.equal(clip.durationSeconds, 45);
      assert.equal(clip.channelId, "UCabc");
      assert.equal(clip.url, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");

      cache.clearCache();
      video = youtubeVideo({ snippet: { ...youtubeVideo().snippet, liveBroadcastContent: "live" } });
      await assert.rejects(youtube.getYouTubeVideo("dQw4w9WgXcQ"), { kind: "unsupported" });

      cache.clearCache();
      video = youtubeVideo({ status: { embeddable: false, privacyStatus: "public" } });
      await assert.rejects(youtube.getYouTubeVideo("dQw4w9WgXcQ"), { kind: "unsupported" });
    } finally {
      mock.restore();
    }
  }));

test("explains YouTube quota exhaustion instead of failing silently", () =>
  withEnv({ YOUTUBE_API_KEY: "yt-key" }, async () => {
    const mock = mockFetch(() => ({ status: 403, json: { error: { errors: [{ reason: "quotaExceeded" }] } } }));
    try {
      await assert.rejects(youtube.getYouTubeVideo("dQw4w9WgXcQ"), (error: Error & { kind?: string }) => {
        assert.equal(error.kind, "unavailable");
        assert.match(error.message, /daily lookup limit/);
        return true;
      });
    } finally {
      mock.restore();
    }
  }));

test("reads channel stats and latest uploads for 2 quota units, never search", () =>
  withEnv({ YOUTUBE_API_KEY: "yt-key" }, async () => {
    const mock = mockFetch((url) => {
      if (url.pathname.endsWith("/channels")) {
        assert.equal(url.searchParams.get("forHandle"), "@bankshasbank");
        return {
          json: {
            items: [
              {
                id: "UCbanks",
                snippet: { title: "FaZe Banks", customUrl: "@bankshasbank", thumbnails: { medium: { url: "https://yt3/x.jpg" } } },
                statistics: { subscriberCount: "4870000", hiddenSubscriberCount: false, videoCount: "176" },
                contentDetails: { relatedPlaylists: { uploads: "UUbanks" } },
              },
            ],
          },
        };
      }
      assert.ok(url.pathname.endsWith("/playlistItems"));
      assert.equal(url.searchParams.get("playlistId"), "UUbanks");
      return {
        json: {
          items: [
            { snippet: { title: "New vid", publishedAt: "2026-11-10T00:00:00Z", thumbnails: { medium: { url: "https://i.ytimg.com/a.jpg" } } }, contentDetails: { videoId: "aaaaaaaaaaa" } },
            { snippet: { title: "Private video", publishedAt: "2026-11-09T00:00:00Z", thumbnails: {} }, contentDetails: { videoId: "bbbbbbbbbbb" } },
          ],
        },
      };
    });
    try {
      const channel = await youtube.getYouTubeChannel({ kind: "handle", value: "@bankshasbank" });
      assert.ok(channel);
      assert.equal(channel.subscriberCount, 4_870_000);
      assert.equal(channel.url, "https://www.youtube.com/@bankshasbank");
      assert.deepEqual(channel.latestUploads.map((v) => v.id), ["aaaaaaaaaaa"]);
      assert.equal(mock.calls.length, 2);
      assert.ok(mock.calls.every((c) => !c.url.includes("/search")));
    } finally {
      mock.restore();
    }
  }));

/* ------------------------------------------------------------------ */
/* Link-clip rules                                                     */
/* ------------------------------------------------------------------ */

test("refuses links over 3 minutes and links that aren't clips", () =>
  withEnv({ YOUTUBE_API_KEY: "yt-key" }, async () => {
    const mock = mockFetch(() => ({ json: { items: [youtubeVideo({ contentDetails: { duration: "PT3M1S" } })] } }));
    try {
      await assert.rejects(linkClips.lookupClipLink("https://youtu.be/dQw4w9WgXcQ"), (error: Error & { kind?: string }) => {
        assert.equal(error.kind, "unsupported");
        assert.match(error.message, /at most 3 minutes.*3:01/);
        return true;
      });
      await assert.rejects(linkClips.lookupClipLink("https://www.twitch.tv/swagg"), { kind: "unsupported" });
      await assert.rejects(linkClips.lookupClipLink(42), { kind: "unsupported" });
    } finally {
      mock.restore();
    }
  }));

test("own-channel rule: on while sign-in is available, off with LINK_CLIPS_OWN_CHANNEL_ONLY=false", () =>
  withEnv({ ...TWITCH_ENV, GOOGLE_OAUTH_CLIENT_ID: undefined, GOOGLE_OAUTH_CLIENT_SECRET: undefined, LINK_CLIPS_OWN_CHANNEL_ONLY: undefined }, async () => {
    const clip = {
      platform: "twitch" as const,
      id: "Slug-1",
      title: "t",
      url: "u",
      channelId: "123",
      channelName: "Swagg",
      thumbnailUrl: "",
      durationSeconds: 30,
      publishedAt: null,
    };
    const stranger = { connections: {} };
    const owner = { connections: { twitch: { id: "123", login: "swagg", displayName: "Swagg", verifiedAt: new Date() } } };
    const otherStreamer = { connections: { twitch: { id: "999", login: "other", displayName: "Other", verifiedAt: new Date() } } };

    assert.equal(linkClips.isOwnChannelRequired("twitch"), true);
    assert.equal(linkClips.isOwnChannelRequired("youtube"), false); // Google sign-in not set up
    assert.match(linkClips.ownershipProblem(stranger, clip) ?? "", /Connect Twitch on My Profile/);
    assert.match(linkClips.ownershipProblem(otherStreamer, clip) ?? "", /only enter clips from your own Twitch channel \(Other\)/);
    assert.equal(linkClips.ownershipProblem(owner, clip), null);
    assert.equal(linkClips.isFromOwnChannel(owner, clip), true);

    process.env.LINK_CLIPS_OWN_CHANNEL_ONLY = "false";
    assert.equal(linkClips.ownershipProblem(stranger, clip), null);
    assert.equal(linkClips.isFromOwnChannel(stranger, clip), false); // allowed, but no verified badge
  }));
