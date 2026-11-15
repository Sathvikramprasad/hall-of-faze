/**
 * Demo sponsor for Hall of FaZe.
 *
 * "Voltline Energy" is a FICTIONAL sponsor used to demonstrate sponsored
 * challenges (the revenue model). It is always labeled as a demo in the UI.
 * Do not replace it with a real brand without that brand's written approval.
 *
 * The sponsor link is OFF by default. To turn it on, set both in the server
 * environment (e.g. .env.local or the host's settings) and restart:
 *
 *   SPONSOR_LINK_ENABLED=true
 *   SPONSOR_URL=https://www.example-sponsor.com/hall-of-faze
 *
 * Only an https:// URL is accepted; anything else keeps the link off.
 *
 * Pure module (no Next.js imports) so it can be unit-tested directly.
 */

export type Sponsor = {
  /** Full name shown in banners and challenge titles. */
  name: string;
  /** Short line under the name. */
  tagline: string;
  /** Always true for the fictional demo sponsor; drives the "Demo sponsor" label. */
  isDemo: boolean;
  /** Where the sponsor link goes when enabled, or null when the link is off. */
  href: string | null;
};

export const DEMO_SPONSOR_NAME = "Voltline Energy";

const DEMO_SPONSOR = {
  name: DEMO_SPONSOR_NAME,
  tagline: "Fuel for the next clutch.",
  isDemo: true,
} as const;

type SponsorEnv = Record<string, string | undefined>;

/** Returns a safe https URL, or null if the value is missing or not https. */
export function safeSponsorUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** The active sponsor. The link stays off unless explicitly enabled with a valid https URL. */
export function getSponsor(env: SponsorEnv = process.env): Sponsor {
  const enabled = env.SPONSOR_LINK_ENABLED?.trim().toLowerCase() === "true";
  return {
    ...DEMO_SPONSOR,
    href: enabled ? safeSponsorUrl(env.SPONSOR_URL) : null,
  };
}

/**
 * Challenge title shown to users: sponsored challenges are named after their
 * sponsor ("Voltline Energy Legacy Clutch Challenge"), without doubling the
 * name if the stored title already starts with it.
 */
export function sponsoredTitle(challenge: { title: string; sponsorName: string | null }): string {
  const sponsor = challenge.sponsorName?.trim();
  if (!sponsor) return challenge.title;
  return challenge.title.toLowerCase().startsWith(sponsor.toLowerCase())
    ? challenge.title
    : `${sponsor} ${challenge.title}`;
}
