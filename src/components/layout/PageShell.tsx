import type { ReactNode } from "react";

// Shared page chrome for Home and Vault. Primary navigation lives in the root
// layout so every feature route has the same wayfinding.

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <main id="main" className="flex-1">
        {children}
      </main>
      {/* Extra bottom padding on narrow screens keeps the text clear of the floating FaZe Bot and shop buttons. */}
      <footer className="border-t border-white/10 pt-8 pb-24 text-center text-sm text-muted lg:pb-8">
        <p className="mx-auto max-w-3xl px-4">
          Hall of FaZe was built for the FaZe Clan challenge at HackUTA 2026. FaZe logos and
          Tiger Camo come from FaZe&apos;s official brand toolkit. Vault entries link to their
          sources, and videos are embedded from and credited to their original uploaders.
        </p>
      </footer>
    </>
  );
}
