import assert from "node:assert/strict";
import test from "node:test";

const socialsUrl = new URL("../../src/lib/socials.ts", import.meta.url).href;
const { normalizeYouTube } = await import(socialsUrl);

test("normalizes ASCII YouTube handles", () => {
  assert.equal(
    normalizeYouTube("youtube.com/@FaZe_Clan"),
    "https://www.youtube.com/@FaZe_Clan",
  );
});

test("accepts literal and percent-encoded Unicode YouTube handles", () => {
  const expected = "https://www.youtube.com/@" + encodeURIComponent("フェイズ公式");
  assert.equal(normalizeYouTube("https://youtube.com/@フェイズ公式"), expected);
  assert.equal(normalizeYouTube(expected), expected);
});

test("rejects malformed percent encoding and video URLs", () => {
  assert.throws(() => normalizeYouTube("https://youtube.com/@bad%ZZ"));
  assert.throws(() => normalizeYouTube("https://youtube.com/watch?v=abc"));
});
