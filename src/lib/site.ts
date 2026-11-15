// Cross-branch routes the Home/Vault pages link to.
// TODO: confirm these with the teammates who own those pages.

/** At least one Legacy Challenge must be linked from Home (issue #2). */
export const LEGACY_CHALLENGE_HREF = "/challenges";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vault", label: "Vault" },
  { href: LEGACY_CHALLENGE_HREF, label: "Challenges" },
] as const;
