/**
 * Geometry for the Odyssey semi-circle menu. Pure functions (no DOM), unit-tested.
 *
 * The wheel is a half annulus opening to the right: angles run from -90° (top)
 * to +90° (bottom), measured from the +x axis with y pointing down, centred on
 * (0, 0). Each item gets an equal slice. Labels are set horizontally, all at
 * one font size, and placed where they fit inside their slice with a margin.
 */
export type Slice = { start: number; end: number; mid: number };
export type LabelBox = { x: number; y: number; width: number; height: number };
export type WheelLayout = {
  outer: number;
  inner: number;
  fontSize: number;
  slices: (Slice & { path: string; label: { x: number; y: number } })[];
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const round = (n: number) => Math.round(n * 100) / 100;

export function slices(count: number): Slice[] {
  const step = 180 / count;
  return Array.from({ length: count }, (_, i) => {
    const start = -90 + i * step;
    return { start, end: start + step, mid: start + step / 2 };
  });
}

/** SVG path for an annular sector. */
export function sectorPath(inner: number, outer: number, start: number, end: number): string {
  const p = (r: number, a: number) => `${round(r * Math.cos(rad(a)))} ${round(r * Math.sin(rad(a)))}`;
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${p(inner, start)}`,
    `L ${p(outer, start)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${p(outer, end)}`,
    `L ${p(inner, end)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${p(inner, start)}`,
    "Z",
  ].join(" ");
}

/** True when (x, y) lies inside the sector, at least `margin` from every edge. */
export function insideSector(x: number, y: number, s: Slice, inner: number, outer: number, margin: number): boolean {
  const r = Math.hypot(x, y);
  if (r < inner + margin || r > outer - margin) return false;
  // Distance to each bounding ray (the ray from the centre at angle a): positive inside.
  const side = (a: number, sign: 1 | -1) => sign * (x * Math.sin(rad(a)) - y * Math.cos(rad(a)));
  // For the start ray the inside is clockwise (increasing angle) from it.
  return -side(s.start, 1) >= margin && side(s.end, 1) >= margin;
}

export function boxFits(box: LabelBox, s: Slice, inner: number, outer: number, margin: number): boolean {
  const { x, y, width: w, height: h } = box;
  const pts = [
    [x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x - w / 2, y + h / 2], [x + w / 2, y + h / 2],
    [x, y - h / 2], [x, y + h / 2], [x - w / 2, y], [x + w / 2, y],
  ];
  return pts.every(([px, py]) => insideSector(px, py, s, inner, outer, margin));
}

/**
 * Finds a centre for a w×h label inside the slice: searches along the slice's
 * middle row and nearby rows, preferring the point with the most clearance.
 */
export function placeLabel(s: Slice, inner: number, outer: number, w: number, h: number, margin: number) {
  let best: { x: number; y: number; score: number } | null = null;
  for (let rt = inner; rt <= outer; rt += 2) {
    for (let da = -0.45; da <= 0.45; da += 0.05) {
      const a = s.mid + da * (s.end - s.start);
      const x = rt * Math.cos(rad(a));
      const y = rt * Math.sin(rad(a));
      if (!boxFits({ x, y, width: w, height: h }, s, inner, outer, margin)) continue;
      // Score: clearance (grow the box until it no longer fits) plus a pull toward the slice's middle angle.
      let grow = 0;
      while (grow < 60 && boxFits({ x, y, width: w + grow * 2, height: h + grow }, s, inner, outer, margin)) grow += 2;
      const score = grow - Math.abs(da) * 20;
      if (!best || score > best.score) best = { x, y, score };
    }
  }
  return best ? { x: round(best.x), y: round(best.y) } : null;
}

/**
 * Lays out the wheel. `measure(label, fontSize)` returns the label's width in px.
 * Shrinks the shared font size until every label fits its slice.
 */
export function layoutWheel(
  labels: string[],
  outer: number,
  measure: (label: string, fontSize: number) => number,
  { innerRatio = 0.3, maxFont = outer * 0.095, minFont = 12, margin = outer * 0.03, lineHeight = 1.05 } = {},
): WheelLayout {
  const inner = outer * innerRatio;
  const ss = slices(labels.length);
  for (let fontSize = Math.round(maxFont); fontSize >= minFont; fontSize--) {
    const placed = ss.map((s, i) => placeLabel(s, inner, outer, measure(labels[i], fontSize), fontSize * lineHeight, margin));
    if (placed.every(Boolean)) {
      return {
        outer,
        inner,
        fontSize,
        slices: ss.map((s, i) => ({ ...s, path: sectorPath(inner, outer, s.start, s.end), label: placed[i]! })),
      };
    }
  }
  throw new Error("Wheel labels don't fit; make the wheel larger.");
}

/** Width of an uppercase label set in Anton, from the font's advance widths (em units). */
const ANTON_ADVANCE: Record<string, number> = {
  A: 0.55, B: 0.56, C: 0.53, D: 0.56, E: 0.45, F: 0.43, G: 0.55, H: 0.57, I: 0.27, J: 0.33, K: 0.55, L: 0.42, M: 0.72,
  N: 0.57, O: 0.56, P: 0.53, Q: 0.56, R: 0.55, S: 0.51, T: 0.45, U: 0.56, V: 0.53, W: 0.78, X: 0.53, Y: 0.52, Z: 0.45, " ": 0.22,
};
export function antonWidth(label: string, fontSize: number, letterSpacingEm = 0.04): number {
  const em = [...label.toUpperCase()].reduce((sum, c) => sum + (ANTON_ADVANCE[c] ?? 0.55) + letterSpacingEm, 0);
  return em * fontSize;
}
