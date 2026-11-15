import { LEGACY_CHALLENGE_HREF } from "@/lib/site";

/**
 * The Home hero's radial menu, and the warrior artwork shown behind it.
 *
 * Hovering (or keyboard-focusing) a menu item swaps the background to that
 * item's pose. To add a pose, export it as a 16:9 image (1920×1080 or larger,
 * warrior centred, no text or menu painted in), save it under
 * public/home/hero/, and set `image` below. Until an item has its own image, it
 * reuses the Home artwork with a different camera framing (`framing`), so the
 * hover still visibly responds.
 */
export type HeroMenuItem = {
  key: "home" | "vault" | "challenges" | "leaderboard" | "account";
  label: string;
  href: string;
  /** This item's warrior pose, or null to reuse the Home artwork. */
  image: string | null;
  /** How to frame the Home artwork while this item has no image of its own. */
  framing: { scale: number; origin: string };
};

export const HERO_DEFAULT_IMAGE = "/home/hero/warrior-home.webp";

export const HERO_MENU: HeroMenuItem[] = [
  { key: "home", label: "Home", href: "/", image: HERO_DEFAULT_IMAGE, framing: { scale: 1, origin: "50% 50%" } },
  // Pose idea: kneeling by a treasure vault.
  { key: "vault", label: "Vault", href: "/vault", image: null, framing: { scale: 1.12, origin: "47% 62%" } },
  // Pose idea: drawing a bow.
  { key: "challenges", label: "Challenges", href: LEGACY_CHALLENGE_HREF, image: null, framing: { scale: 1.16, origin: "33% 30%" } },
  // Pose idea: victorious, dual-wielding.
  { key: "leaderboard", label: "Leaderboard", href: "/leaderboard", image: null, framing: { scale: 1.14, origin: "48% 28%" } },
  // Pose idea: tactical ready stance.
  { key: "account", label: "Account", href: "/account", image: null, framing: { scale: 1.08, origin: "60% 55%" } },
];

export const HERO_HEADLINE = ["Battle fought.", "Trophy claimed.", "Legend remembered."] as const;
