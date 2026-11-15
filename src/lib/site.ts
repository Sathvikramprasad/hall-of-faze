/** At least one Legacy Challenge must be linked from Home (issue #2). */
export const LEGACY_CHALLENGE_HREF = "/next-up";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vault", label: "Vault" },
  { href: LEGACY_CHALLENGE_HREF, label: "Challenges" },
  { href: "/clips", label: "Clips" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/account", label: "My Profile" },
] as const;
