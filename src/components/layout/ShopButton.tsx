/**
 * FaZe's official online store. This is where the SHOP link in fazeclan.com's
 * own navigation points (checked November 2026); update it here if that changes.
 */
export const FAZE_SHOP_URL = "https://fazeclan.com/collections/faze-esports";

/**
 * Floating shop button in the bottom-right corner of every page, opposite FaZe
 * Bot. Opens the official FaZe store in a new tab.
 */
export function ShopButton() {
  return (
    <a
      href={FAZE_SHOP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Shop official FaZe merch (opens fazeclan.com in a new tab)"
      className="fixed bottom-4 right-4 z-[60] inline-flex min-h-14 items-center rounded-full border border-white/15 bg-accent-fill px-5 text-sm font-bold text-white shadow-xl shadow-black/50 transition-[translate,background-color] hover:-translate-y-0.5 hover:bg-accent-fill-strong focus-visible:bg-accent-fill-strong motion-reduce:transition-none motion-reduce:hover:translate-y-0 print:hidden"
    >
      Shop FaZe
    </a>
  );
}
