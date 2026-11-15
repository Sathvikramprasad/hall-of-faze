import assert from "node:assert/strict";
import test from "node:test";

const { vaultEntries } = await import(new URL("../../src/lib/vault/entries.ts", import.meta.url).href);
const { vaultNotes } = await import(new URL("../../src/lib/vault/notes.ts", import.meta.url).href);
const { memberProfiles } = await import(new URL("../../src/lib/vault/members.ts", import.meta.url).href);

const slugs = new Set(memberProfiles.map((m: { slug: string }) => m.slug));
const CATEGORIES = new Set(["origins", "esports", "business", "creators", "culture", "controversy"]);

test("every Vault entry is well formed", () => {
  const ids = new Set<string>();
  for (const e of vaultEntries) {
    assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
    ids.add(e.id);
    assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/, e.id);
    assert.ok(!Number.isNaN(Date.parse(e.date)), e.id);
    const year = Number(e.date.slice(0, 4));
    assert.ok(year >= 2010 && year <= 2026, `${e.id} year ${year}`);
    if (e.datePrecision === "year") assert.ok(e.date.endsWith("-01-01"), e.id);
    if (e.datePrecision === "month") assert.ok(e.date.endsWith("-01"), e.id);
    assert.ok(CATEGORIES.has(e.category), e.id);
    assert.ok(e.title.length > 0 && e.summary.length > 0, e.id);
    assert.ok(e.sources.length > 0, e.id);
    for (const s of e.sources) assert.match(s.url, /^https:\/\//, `${e.id} source`);
    for (const slug of e.memberSlugs ?? []) assert.ok(slugs.has(slug), `${e.id} unknown member ${slug}`);
  }
});

test("timeline covers every year from 2010 to 2026", () => {
  const years = new Set(vaultEntries.map((e: { date: string }) => Number(e.date.slice(0, 4))));
  for (let y = 2010; y <= 2026; y++) assert.ok(years.has(y), `no entries for ${y}`);
});

test("Historian notes are well formed and don't reuse entry ids", () => {
  const entryIds = new Set(vaultEntries.map((e: { id: string }) => e.id));
  const ids = new Set<string>();
  for (const n of vaultNotes) {
    assert.ok(!ids.has(n.id) && !entryIds.has(n.id), `duplicate id ${n.id}`);
    ids.add(n.id);
    assert.ok(n.topic && n.text, n.id);
    assert.ok(n.sources.length > 0, n.id);
    for (const s of n.sources) assert.match(s.url, /^https:\/\//, `${n.id} source`);
  }
});
