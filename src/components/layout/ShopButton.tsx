/**
 * FaZe's official online store. This is where the SHOP link in fazeclan.com's
 * own navigation points (checked November 2026); update it here if that changes.
 */
export const FAZE_SHOP_URL = "https://fazeclan.com/collections/faze-esports";

/**
 * Floating cart button in the bottom-right corner of every page, opposite FaZe
 * Bot. Opens the official FaZe store in a new tab; the "Shop FaZe" label slides
 * out on hover and keyboard focus.
 */
export function ShopButton() {
  return (
    <a
      href={FAZE_SHOP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Shop official FaZe merch (opens fazeclan.com in a new tab)"
      className="group fixed bottom-4 right-4 z-[60] inline-flex min-h-14 items-center rounded-full border border-white/15 bg-accent-fill px-4 font-semibold text-white shadow-xl shadow-black/50 transition-[translate,background-color] hover:-translate-y-0.5 hover:bg-accent-fill-strong focus-visible:bg-accent-fill-strong motion-reduce:transition-none motion-reduce:hover:translate-y-0 print:hidden"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-6 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.5 3.5h2.6l2.3 10.8a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.5-1.2L21 7.5H6" />
        <circle cx="9.5" cy="19.5" r="1.4" />
        <circle cx="17.5" cy="19.5" r="1.4" />
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-200 group-hover:ml-2 group-hover:max-w-28 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-28 group-focus-visible:opacity-100 motion-reduce:transition-none">
        Shop FaZe
      </span>
    </a>
  );
}
