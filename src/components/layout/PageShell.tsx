import type { ReactNode } from "react";

// Shared page chrome for Home and Vault. Primary navigation lives in the root
// layout so every feature route has the same wayfinding.

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        <p className="mx-auto max-w-3xl px-4">
          Hall of FaZe is a fan project. Vault entries link to their sources; videos
          are embedded from and credited to their original uploaders.
        </p>
      </footer>
    </>
  );
}
