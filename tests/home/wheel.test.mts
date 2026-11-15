import assert from "node:assert/strict";
import test from "node:test";

const g = await import(new URL("../../src/lib/odyssey-wheel.ts", import.meta.url).href);
const LABELS = ["Home", "Vault", "Challenges", "Leaderboard", "Account"];

test("five equal slices cover the half circle", () => {
  const s = g.slices(5);
  assert.equal(s.length, 5);
  assert.equal(s[0].start, -90);
  assert.equal(s[4].end, 90);
  for (const slice of s) assert.equal(slice.end - slice.start, 36);
});

test("every label fits inside its own slice at one shared font size", () => {
  for (const outer of [410, 300, 220]) {
    const layout = g.layoutWheel(LABELS, outer, (l: string, f: number) => g.antonWidth(l, f));
    assert.ok(layout.fontSize >= 12);
    layout.slices.forEach((slice: { label: { x: number; y: number } } & { start: number; end: number; mid: number }, i: number) => {
      const box = { x: slice.label.x, y: slice.label.y, width: g.antonWidth(LABELS[i], layout.fontSize), height: layout.fontSize * 1.05 };
      assert.ok(g.boxFits(box, slice, layout.inner, layout.outer, 0), `${LABELS[i]} at ${outer}`);
    });
  }
});

test("a wheel too small for its labels is reported", () => {
  assert.throws(() => g.layoutWheel(LABELS, 60, (l: string, f: number) => g.antonWidth(l, f)));
});
