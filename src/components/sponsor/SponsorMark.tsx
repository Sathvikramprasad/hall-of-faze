/** Logo mark for the fictional demo sponsor (original artwork, not a real brand). */
export function SponsorMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#c8ff3d" />
      <path d="M18.5 4 8 18h7l-2 10 11-15h-7.2L18.5 4Z" fill="#0b0b0d" />
    </svg>
  );
}
