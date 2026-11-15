import type { ReactNode } from "react";
import { getSponsor, type Sponsor } from "@/lib/sponsor";
import { SponsorMark } from "./SponsorMark";

/**
 * Site-wide sponsor placement, rendered once in the root layout.
 *
 * - Wide screens (xl, 1280px+): a slim tab on the empty right edge of the page.
 *   It shows the logo and "Sponsor"; hovering or focusing it slides out a card
 *   with the name, tagline and the sponsor link.
 * - Smaller screens: a thin "presented by" strip under the navigation.
 *
 * The link only works when SPONSOR_LINK_ENABLED=true and SPONSOR_URL is set
 * (see src/lib/sponsor.ts); otherwise it is shown as "Link coming soon".
 */
export function SponsorRail() {
  const sponsor = getSponsor();
  return (
    <>
      <SponsorStrip sponsor={sponsor} />
      <SponsorEdgeTab sponsor={sponsor} />
    </>
  );
}

function DemoLabel({ short = false }: { short?: boolean }) {
  return (
    <span className="whitespace-nowrap rounded-full border border-white/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-muted">
      {short ? "Demo" : "Demo sponsor"}
    </span>
  );
}

function SponsorLink({
  sponsor,
  children,
  className,
  disabledLabel = "Link coming soon",
}: {
  sponsor: Sponsor;
  children: ReactNode;
  className: string;
  disabledLabel?: string;
}) {
  if (sponsor.href) {
    return (
      <a
        href={sponsor.href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className={className}
        aria-label={`Visit ${sponsor.name} (opens in a new tab)`}
      >
        {children}
      </a>
    );
  }
  return (
    <span className={`${className} cursor-not-allowed opacity-60`} aria-disabled="true" title="Sponsor link is not active yet">
      {disabledLabel}
    </span>
  );
}

/** Below xl: one thin line under the nav. */
function SponsorStrip({ sponsor }: { sponsor: Sponsor }) {
  return (
    <aside
      aria-label="Sponsor"
      className="hide-on-odyssey border-b border-white/10 bg-surface/80 text-xs text-muted xl:hidden"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 whitespace-nowrap px-4 py-1.5 sm:px-6">
        <span className="hidden sm:inline">Challenges presented by</span>
        <span className="sm:hidden">Presented by</span>
        <SponsorMark className="h-4 w-4 shrink-0" />
        {sponsor.href ? (
          <a
            href={sponsor.href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="font-semibold text-foreground underline decoration-[#c8ff3d] underline-offset-2"
          >
            {sponsor.name}
          </a>
        ) : (
          <span className="font-semibold text-foreground">{sponsor.name}</span>
        )}
        {sponsor.isDemo && <DemoLabel short />}
        <SponsorLink
          sponsor={sponsor}
          disabledLabel="Link soon"
          className="ml-1 hidden font-semibold text-[#c8ff3d] underline-offset-2 hover:underline min-[400px]:inline"
        >
          Visit &rarr;
        </SponsorLink>
      </div>
    </aside>
  );
}

/** xl and up: a tab fixed to the right edge that expands on hover/focus. */
function SponsorEdgeTab({ sponsor }: { sponsor: Sponsor }) {
  return (
    <aside
      aria-label={`Sponsor: ${sponsor.name}${sponsor.isDemo ? " (demo sponsor)" : ""}`}
      className="group fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <div
        tabIndex={sponsor.href ? -1 : 0}
        className="flex items-stretch overflow-hidden rounded-l-2xl border border-r-0 border-white/10 bg-surface/95 shadow-2xl shadow-black/40 outline-none backdrop-blur focus-visible:ring-2 focus-visible:ring-[#c8ff3d]"
      >
        {/* Collapsed tab: always visible */}
        <div className="flex w-11 flex-col items-center gap-3 border-l-2 border-[#c8ff3d] py-4">
          <SponsorMark className="h-6 w-6" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted [writing-mode:vertical-rl]">
            Sponsor
          </span>
        </div>

        {/* Expanded card: slides out on hover or keyboard focus */}
        <div className="w-0 opacity-0 transition-all duration-200 group-focus-within:w-56 group-focus-within:opacity-100 group-hover:w-56 group-hover:opacity-100 motion-reduce:transition-none">
          <div className="flex w-56 flex-col gap-2 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Challenges presented by</p>
            <p className="text-base font-black leading-tight text-foreground">{sponsor.name}</p>
            <p className="text-sm text-muted">{sponsor.tagline}</p>
            {sponsor.isDemo && (
              <div>
                <DemoLabel />
              </div>
            )}
            <SponsorLink
              sponsor={sponsor}
              className="mt-1 inline-flex justify-center rounded-full bg-[#c8ff3d] px-3 py-1.5 text-sm font-bold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8ff3d]"
            >
              Visit sponsor &rarr;
            </SponsorLink>
          </div>
        </div>
      </div>
    </aside>
  );
}
