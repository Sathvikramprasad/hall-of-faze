import Image from "next/image";
import type { ReactNode } from "react";
import { HERO_DEFAULT_IMAGE } from "@/lib/home-hero";

/** Full-width banner at the top of the Vault: the Home hero's warrior artwork behind the page title. */
export function VaultBanner({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate h-[clamp(20rem,46vh,30rem)] overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Image
          src={HERO_DEFAULT_IMAGE}
          alt=""
          fill
          sizes="100vw"
          quality={90}
          preload
          className="object-cover object-[50%_28%]"
        />
        {/* Darken for the title on the left, add the hero's red smoke, and fade into the page below. */}
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/90 via-black/40 to-transparent sm:w-3/5" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(55%_60%_at_50%_100%,rgba(220,38,38,0.35),transparent_70%),radial-gradient(35%_50%_at_10%_100%,rgba(153,27,27,0.4),transparent_70%)] mix-blend-screen" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-background" />
      </div>
      <div className="mx-auto flex h-full max-w-6xl items-end px-4 pb-10 sm:px-6 sm:pb-12">{children}</div>
    </section>
  );
}

/** Red rule with a centred label, marking where the timeline starts. */
export function VaultDivider({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 sm:gap-6">
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-fill/50 to-accent-fill" />
      <span aria-hidden="true" className="h-2 w-2 rotate-45 bg-accent-fill" />
      <h2 id={id} className="font-display text-2xl uppercase tracking-[0.3em] sm:text-3xl">
        {children}
      </h2>
      <span aria-hidden="true" className="h-2 w-2 rotate-45 bg-accent-fill" />
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent via-accent-fill/50 to-accent-fill" />
    </div>
  );
}
