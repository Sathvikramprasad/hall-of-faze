import assert from "node:assert/strict";
import test from "node:test";

const utilitiesUrl = new URL("../../src/lib/live-pulse-utils.ts", import.meta.url).href;
const {
  DEFAULT_FAZE_TWITCH_LOGINS,
  normalizeTwitchLogins,
  selectYouTubeThumbnail,
  twitchStreamThumbnail,
} = (await import(utilitiesUrl)) as typeof import("../../src/lib/live-pulse-utils");

test("selects the highest-quality secure YouTube thumbnail", () => {
  assert.equal(
    selectYouTubeThumbnail({
      default: { url: "https://img.example/default.jpg" },
      high: { url: "https://img.example/high.jpg" },
      maxres: { url: "https://img.example/maxres.jpg" },
    }),
    "https://img.example/maxres.jpg",
  );
  assert.equal(selectYouTubeThumbnail({ high: { url: "http://unsafe.example/image.jpg" } }), null);
  assert.equal(selectYouTubeThumbnail(undefined), null);
});

test("turns Twitch's thumbnail template into a displayable image URL", () => {
  assert.equal(
    twitchStreamThumbnail("https://static-cdn.jtvnw.net/previews/live_user_faze-{width}x{height}.jpg"),
    "https://static-cdn.jtvnw.net/previews/live_user_faze-640x360.jpg",
  );
  assert.equal(twitchStreamThumbnail("javascript:alert(1)"), "");
});

test("normalizes, validates, deduplicates, and caps Twitch channel logins", () => {
  const extraLogins = Array.from({ length: 30 }, (_, index) => `creator_${index}`);
  assert.deepEqual(
    normalizeTwitchLogins([
      " FaZe ",
      "FAZE",
      "valid_name",
      "bad-name",
      ...extraLogins,
    ]),
    ["faze", "valid_name", ...extraLogins.slice(0, 22)],
  );
});

test("ships a deduplicated current FaZe Twitch lineup", () => {
  assert.equal(DEFAULT_FAZE_TWITCH_LOGINS.length, 8);
  assert.deepEqual(normalizeTwitchLogins([...DEFAULT_FAZE_TWITCH_LOGINS]), [...DEFAULT_FAZE_TWITCH_LOGINS]);
});
