import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import test from "node:test";

type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => unknown,
) => unknown;

// Same extensionless-import shim as historian.test.mts (registerHooks is in
// Node 22, which CI uses; the project's Node 20 types predate it).
const registerHooks = (
  nodeModule as unknown as {
    registerHooks(hooks: { resolve: ResolveHook }): void;
  }
).registerHooks;

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.startsWith(".") && !/\.[a-z0-9]+$/i.test(specifier)) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const queriesUrl = new URL("../../src/lib/vault/queries.ts", import.meta.url).href;
const membersUrl = new URL("../../src/lib/vault/members.ts", import.meta.url).href;
const queries = (await import(queriesUrl)) as typeof import("../../src/lib/vault/queries");
const { ROSTER_AS_OF } = (await import(membersUrl)) as typeof import("../../src/lib/vault/members");

const members = queries.getMembers();

test("every member has a unique slug and at least one https source", () => {
  const slugs = members.map((member) => member.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate member slug");
  for (const member of members) {
    assert.match(member.slug, /^[a-z0-9-]+$/, `${member.slug}: slugs are lowercase url-safe`);
    assert.ok(member.sources.length > 0, `${member.slug}: needs a source`);
    for (const source of member.sources) {
      assert.match(source.url, /^https:\/\//, `${member.slug}: ${source.label} should be https`);
    }
  }
});

test("timeline entries only reference members that exist", () => {
  const slugs = new Set(members.map((member) => member.slug));
  for (const entry of queries.getVaultEntries()) {
    for (const slug of entry.memberSlugs ?? []) {
      assert.ok(slugs.has(slug), `${entry.id} references unknown member ${slug}`);
    }
  }
});

test("splits members into current and past without losing anyone", () => {
  const current = queries.getCurrentMembers();
  const past = queries.getPastMembers();

  assert.equal(current.length + past.length, members.length);
  assert.ok(current.length > 0, "no current members");
  assert.ok(current.every((member) => member.currentRoster));
  assert.ok(past.every((member) => !member.currentRoster));
  // Current members stay grouped by team, in MEMBER_DIVISIONS order.
  const order = current.map((member) => queries.MEMBER_DIVISIONS.indexOf(member.currentRoster!));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

test("keeps the original members under past members", () => {
  const pastSlugs = new Set(queries.getPastMembers().map((member) => member.slug));
  for (const slug of ["clipz", "housecat", "resistance", "banks", "temperrr", "apex", "rug", "swagg", "snoop", "karrigan", "jasontheween"]) {
    assert.ok(pastSlugs.has(slug), `${slug} should still be listed`);
  }
});

test("game lists are tidy, and every current member has one", () => {
  for (const member of members) {
    const games = member.games ?? [];
    assert.ok(games.every((game) => game.trim() === game && game.length > 0), `${member.slug}: blank game`);
    assert.equal(new Set(games).size, games.length, `${member.slug}: duplicate game`);
  }
  for (const member of queries.getCurrentMembers()) {
    assert.ok(member.games?.length, `${member.slug}: current members should list a game`);
  }
});

test("roster date is a real ISO day and labels as month and year", () => {
  assert.match(ROSTER_AS_OF, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(ROSTER_AS_OF)));
  assert.match(queries.getRosterAsOfLabel(), /^[A-Z][a-z]{2} \d{4}$/);
});

const channelsUrl = new URL("../../src/lib/vault/channels.ts", import.meta.url).href;
const { getChannelLinks } = (await import(channelsUrl)) as typeof import("../../src/lib/vault/channels");

test("builds YouTube and Twitch links from a member's channels", () => {
  const banks = queries.getMember("banks");
  assert.ok(banks);
  assert.deepEqual(getChannelLinks(banks), [
    { platform: "YouTube", href: "https://www.youtube.com/@bankshasbank", name: "@bankshasbank" },
    { platform: "Twitch", href: "https://www.twitch.tv/fazebanks", name: "fazebanks" },
  ]);

  const zoomaa = queries.getMember("zoomaa");
  assert.ok(zoomaa);
  assert.deepEqual(getChannelLinks(zoomaa).map((link) => link.platform), ["Twitch"]);

  for (const member of members) {
    for (const link of getChannelLinks(member)) {
      assert.match(link.href, /^https:\/\/www\.(youtube\.com|twitch\.tv)\//, `${member.slug}: ${link.href}`);
    }
  }
  assert.deepEqual(getChannelLinks({ ...banks, channels: undefined }), []);
});
