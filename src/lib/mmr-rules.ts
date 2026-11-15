/** Hall of FaZe MMR: deterministic, server-authoritative rules. */
export type Tier = 1 | 2 | 3 | 4 | 5;
export type Rating = { tier: Tier; points: number; demotionShield: boolean; lastActiveAt: string | null; lastDecayAt: string | null };
export type Placement = { place: number; participants: number; votes: number; topVotes: number };
export const TIER_SPAN = 300;
export const NEW_RATING: Rating = { tier: 5, points: 0, demotionShield: false, lastActiveAt: null, lastDecayAt: null };
export const TIER_COLORS: Record<Tier, string> = { 5: "#858585", 4: "#641b24", 3: "#9a2433", 2: "#d32b45", 1: "#ff1744" };
export const ROMAN: Record<Tier, string> = { 5: "V", 4: "IV", 3: "III", 2: "II", 1: "I" };
const DAY = 86400000;
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));
export function normalizeRating(value?: Partial<Rating> | null): Rating {
  return { tier: clamp(Math.trunc(value?.tier ?? 5), 1, 5) as Tier, points: clamp(Math.trunc(value?.points ?? 0), 0, TIER_SPAN - 1), demotionShield: Boolean(value?.demotionShield), lastActiveAt: value?.lastActiveAt ?? null, lastDecayAt: value?.lastDecayAt ?? null };
}
/** First = promotion, two seconds = promotion, three thirds = promotion.
 * Top 10% or top 10 entrants never lose rating. Other placements lose more
 * progressively, while valid votes slightly soften the penalty.
 */
export function placementDelta({ place, participants, votes, topVotes }: Placement): number {
  if (!Number.isInteger(place) || !Number.isInteger(participants) || place < 1 || participants < 1 || place > participants || votes < 0 || topVotes < 0) throw new Error("Invalid placement");
  if (place === 1) return TIER_SPAN;
  if (place === 2) return Math.ceil(TIER_SPAN / 2);
  if (place === 3) return Math.ceil(TIER_SPAN / 3);
  const safe = place <= 10 || place <= Math.ceil(participants * .1);
  const voteRatio = topVotes > 0 ? clamp(votes / topVotes, 0, 1) : 0;
  if (safe) return Math.round(12 + voteRatio * 30);
  const percentile = (place - 1) / Math.max(1, participants - 1);
  return -Math.round(12 + 75 * percentile - voteRatio * 15);
}
/** Promotion carries overflow; demotion requires two distinct negative events.
 * First negative crossing clamps at zero and arms the shield; next loss demotes.
 */
export function applyDelta(input: Rating, delta: number): Rating {
  const rating = normalizeRating(input);
  if (!Number.isFinite(delta)) throw new Error("Invalid rating delta");
  let { tier, points, demotionShield } = rating;
  const amount = Math.trunc(delta);
  if (amount > 0) {
    points += amount;
    demotionShield = false;
    while (points >= TIER_SPAN && tier > 1) { points -= TIER_SPAN; tier = (tier - 1) as Tier; }
    if (tier === 1) points = Math.min(points, TIER_SPAN - 1);
  } else if (amount < 0) {
    if (points + amount <= 0 && tier < 5) {
      if (demotionShield) { tier = (tier + 1) as Tier; points = TIER_SPAN - 1; demotionShield = false; }
      else { points = 0; demotionShield = true; }
    } else { points = Math.max(0, points + amount); if (points > 0) demotionShield = false; }
  }
  return { ...rating, tier, points, demotionShield };
}
/** Decay starts after a 7-day grace period, then once per full inactive day.
 * Tier V is the floor. A return to competition updates lastActiveAt.
 */
export function decayRating(input: Rating, now: Date): Rating {
  const rating = normalizeRating(input);
  const anchor = rating.lastActiveAt ? Date.parse(rating.lastActiveAt) : NaN;
  if (!Number.isFinite(anchor) || !Number.isFinite(now.getTime())) return rating;
  const graceEnd = anchor + 7 * DAY;
  const from = Math.max(graceEnd, rating.lastDecayAt ? Date.parse(rating.lastDecayAt) || graceEnd : graceEnd);
  const days = Math.max(0, Math.floor((now.getTime() - from) / DAY));
  let next = rating;
  for (let i = 0; i < days; i++) next = applyDelta(next, -8);
  return { ...next, lastDecayAt: new Date(from + days * DAY).toISOString() };
}
