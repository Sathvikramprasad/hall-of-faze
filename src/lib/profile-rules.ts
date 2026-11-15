/** Pure profile rules (no database), shared by the server and tests. */

/** A challenge stays linkable from "My clips" until it ends or a moderator closes it. */
export function isChallengeLinkable(challenge: { status: string; endsAt: Date | string }, now = new Date()): boolean {
  const endsAt = new Date(challenge.endsAt).getTime();
  return challenge.status === "active" && Number.isFinite(endsAt) && endsAt > now.getTime();
}
