import assert from "node:assert/strict";
import test from "node:test";

const { getSponsor, safeSponsorUrl, sponsoredTitle, DEMO_SPONSOR_NAME } = await import(
  new URL("../../src/lib/sponsor.ts", import.meta.url).href
);

test("sponsor link is off by default", () => {
  const sponsor = getSponsor({});
  assert.equal(sponsor.name, DEMO_SPONSOR_NAME);
  assert.equal(sponsor.isDemo, true);
  assert.equal(sponsor.href, null);
});

test("sponsor link needs both the switch and an https URL", () => {
  assert.equal(getSponsor({ SPONSOR_URL: "https://example.com/a" }).href, null, "URL alone stays off");
  assert.equal(getSponsor({ SPONSOR_LINK_ENABLED: "true" }).href, null, "switch alone stays off");
  assert.equal(
    getSponsor({ SPONSOR_LINK_ENABLED: "true", SPONSOR_URL: "https://example.com/a" }).href,
    "https://example.com/a",
  );
  assert.equal(getSponsor({ SPONSOR_LINK_ENABLED: "TRUE", SPONSOR_URL: "https://example.com" }).href, "https://example.com/");
  assert.equal(getSponsor({ SPONSOR_LINK_ENABLED: "yes", SPONSOR_URL: "https://example.com" }).href, null);
});

test("only safe https URLs are accepted", () => {
  assert.equal(safeSponsorUrl("http://example.com"), null);
  assert.equal(safeSponsorUrl("javascript:alert(1)"), null);
  assert.equal(safeSponsorUrl("https://user:pass@example.com"), null);
  assert.equal(safeSponsorUrl("not a url"), null);
  assert.equal(safeSponsorUrl(undefined), null);
});

test("sponsored challenges are named after the sponsor without doubling it", () => {
  assert.equal(sponsoredTitle({ title: "Legacy Clutch Challenge", sponsorName: "Voltline Energy" }), "Voltline Energy Legacy Clutch Challenge");
  assert.equal(sponsoredTitle({ title: "Voltline Energy Legacy Clutch Challenge", sponsorName: "Voltline Energy" }), "Voltline Energy Legacy Clutch Challenge");
  assert.equal(sponsoredTitle({ title: "Open Challenge", sponsorName: null }), "Open Challenge");
});
