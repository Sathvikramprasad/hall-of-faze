/** The Odyssey home hero: menu items and the background art for each state. */
export const ODYSSEY_ITEMS = [
  { key: "home", label: "Home", href: "/" },
  { key: "vault", label: "Vault", href: "/vault" },
  { key: "challenges", label: "Challenges", href: "/next-up" },
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard" },
  { key: "account", label: "Account", href: "/account" },
] as const;

export type OdysseyKey = (typeof ODYSSEY_ITEMS)[number]["key"] | "default";
export const ODYSSEY_STATES: OdysseyKey[] = ["default", ...ODYSSEY_ITEMS.map((i) => i.key)];

/** Image URL per state, or null while the art hasn't been added (a smoke stand-in is drawn instead). */
export type OdysseyArt = Record<OdysseyKey, string | null>;

/** Art files live in public/odyssey/<state>.(webp|jpg|jpeg|png). */
export const ODYSSEY_ART_DIR = "odyssey";
export const ODYSSEY_ART_EXTENSIONS = ["webp", "jpg", "jpeg", "png"] as const;

/**
 * Where the warrior stands in each picture, as a fraction of its width. On
 * screens 768px and up the picture is shifted so the warrior sits right of the
 * headline (at ODYSSEY_TARGET of the screen width), clear of the wheel.
 * Update these when a picture is replaced.
 */
export const ODYSSEY_FOCUS: Record<OdysseyKey, number> = {
  default: 0.47,
  home: 0.5,
  vault: 0.5,
  challenges: 0.59,
  leaderboard: 0.4,
  account: 0.49,
};
export const ODYSSEY_TARGET = 0.82;
