import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";

// Shared page chrome: skip link, primary nav, footer.
//
// layout.tsx belongs to the backend/integration branch, so for now each of
// our pages wraps itself in <PageShell>. Once SiteNav is mounted in
// layout.tsx (coordinate with SohamxP), drop the skip link and nav from here
// or delete this component.

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent-fill focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <SiteNav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        <p className="mx-auto max-w-3xl px-4">
          Hall of FaZe was built for the FaZe Clan challenge at HackUTA 2026. FaZe logos and
          Tiger Camo come from FaZe&apos;s official brand toolkit. Vault entries link to their
          sources, and videos are embedded from and credited to their original uploaders.
        </p>
      </footer>
    </>
  );
}
