"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { ODYSSEY_FOCUS, ODYSSEY_ITEMS, ODYSSEY_STATES, ODYSSEY_TARGET, type OdysseyArt, type OdysseyKey } from "@/lib/odyssey";
import type { WheelLayout } from "@/lib/odyssey-wheel";

/* viewBox geometry: the wheel's centre sits on its flat (left) edge. */
const CX = 100;
const CY = 450;
const VIEW_W = 560;
const VIEW_H = 900;
const LOGO_W = 140;
const LOGO_H = Math.round((LOGO_W * 377) / 560); // faze-logo-white-double-stroke.png is 560×377

/** Stand-in "smoke" grounds until the warrior art is added: each state moves the red light. */
const STAND_IN: Record<OdysseyKey, string> = {
  default: "radial-gradient(60% 70% at 72% 45%, rgba(228,0,43,0.30), transparent 60%)",
  home: "radial-gradient(55% 60% at 68% 28%, rgba(228,0,43,0.40), transparent 62%)",
  vault: "radial-gradient(60% 65% at 82% 40%, rgba(255,82,102,0.32), transparent 60%)",
  challenges: "radial-gradient(70% 70% at 70% 55%, rgba(228,0,43,0.45), transparent 58%)",
  leaderboard: "radial-gradient(55% 60% at 85% 70%, rgba(228,0,43,0.38), transparent 60%)",
  account: "radial-gradient(60% 60% at 64% 80%, rgba(184,0,35,0.45), transparent 62%)",
};
const SMOKE =
  "radial-gradient(45% 35% at 30% 20%, rgba(255,255,255,0.05), transparent 70%)," +
  "radial-gradient(40% 50% at 90% 10%, rgba(255,255,255,0.04), transparent 70%)," +
  "radial-gradient(80% 60% at 50% 110%, rgba(0,0,0,0.9), transparent 70%)," +
  "linear-gradient(160deg, #1a1a1a 0%, #0b0b0b 55%, #050505 100%)";

export default function OdysseyHero({
  art,
  layout,
  sponsorName,
  sponsorIsDemo,
}: {
  art: OdysseyArt;
  layout: WheelLayout;
  sponsorName: string;
  sponsorIsDemo: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState<OdysseyKey>("default");

  function go(event: MouseEvent<Element>, href: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    router.push(href);
  }

  return (
    <section
      aria-labelledby="odyssey-heading"
      className="odyssey relative isolate flex min-h-svh w-full overflow-hidden bg-[#0b0b0b]"
    >
      {/* Background states: every image is mounted so swaps are instant; only the active one is visible. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {ODYSSEY_STATES.map((state) => (
          <div
            key={state}
            className="absolute inset-0 transition-opacity duration-500 ease-out motion-reduce:duration-0"
            style={{ opacity: active === state ? 1 : 0 }}
          >
            {art[state] ? (
              <>
                {/* Phones: cover the screen. */}
                <Image
                  src={art[state]!}
                  alt=""
                  fill
                  sizes="100vw"
                  priority={state === "default"}
                  className="object-cover md:hidden"
                  style={{ objectPosition: `${ODYSSEY_FOCUS[state] * 100}% center` }}
                />
                {/* Wider screens: full height, shifted so the warrior stands right of the headline; the left edge fades into the smoke. */}
                <div className="absolute inset-0 hidden [container-type:size] md:block">
                  <Image
                    src={art[state]!}
                    alt=""
                    width={1920}
                    height={1080}
                    sizes="(min-width: 768px) 180vh, 100vw"
                    priority={state === "default"}
                    className="absolute top-0 h-full w-auto max-w-none [mask-image:linear-gradient(90deg,transparent_0%,#000_14%)]"
                    style={{ left: `calc(${ODYSSEY_TARGET * 100}cqw - ${(ODYSSEY_FOCUS[state] * 1600) / 9}cqh)` }}
                  />
                </div>
              </>
            ) : (
              <div className="absolute inset-0" style={{ background: `${STAND_IN[state]}, ${SMOKE}` }} />
            )}
          </div>
        ))}
        {/* Legibility: darken the left edge behind the wheel and headline (a gradient, not a box). */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.15)_45%,rgba(0,0,0,0.55)_100%)] md:bg-[linear-gradient(90deg,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.45)_42%,transparent_66%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#111111] to-transparent" />
      </div>

      <div className="relative grid w-full grid-rows-[auto_1fr] md:grid-cols-[auto_minmax(0,1fr)] md:grid-rows-1">
        {/* Headline: above the wheel on phones, to its right on wider screens. */}
        <div className="order-1 flex items-end px-6 pt-10 md:order-2 md:items-center md:px-0 md:pr-12 md:pt-0">
          <div className="max-w-3xl">
            <p className="font-display text-sm uppercase tracking-[0.3em] text-accent [text-shadow:0_0_12px_#000]">Hall of FaZe</p>
            <h1
              id="odyssey-heading"
              className="mt-4 font-display text-4xl uppercase leading-[1.02] tracking-wide text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85)] sm:text-5xl lg:text-[clamp(2.5rem,3.4vw,3.75rem)]"
            >
              <span className="block xl:whitespace-nowrap">Every battle fought.</span>
              <span className="block xl:whitespace-nowrap">Every trophy claimed.</span>
              <span className="block xl:whitespace-nowrap">Every legend remembered.</span>
            </h1>
          </div>
        </div>

        <nav aria-label="Primary" className="order-2 flex items-center md:order-1">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="odyssey-wheel h-[min(62svh,170vw)] w-auto md:h-[min(96svh,64vw)]"
            role="presentation"
            onMouseLeave={() => setActive("default")}
          >
            <defs>
              {/* Black aura around the letters, as a filter so it follows every glyph. */}
              <filter id="odyssey-aura" x="-30%" y="-60%" width="160%" height="220%">
                <feMorphology in="SourceAlpha" operator="dilate" radius="2.5" result="thick" />
                <feGaussianBlur in="thick" stdDeviation="5" result="blur" />
                <feFlood floodColor="#000" floodOpacity="0.95" />
                <feComposite in2="blur" operator="in" result="aura" />
                <feMerge>
                  <feMergeNode in="aura" />
                  <feMergeNode in="aura" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="odyssey-hub-glow">
                <stop offset="0%" stopColor="#E4002B" stopOpacity="0.75" />
                <stop offset="45%" stopColor="#E4002B" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#E4002B" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g transform={`translate(${CX} ${CY})`}>
              {/* Faint guide arcs so the semi-circle reads without a solid box. */}
              <path
                d={`M 0 ${-layout.outer} A ${layout.outer} ${layout.outer} 0 0 1 0 ${layout.outer}`}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.5"
              />

              {layout.slices.map((slice, i) => {
                const item = ODYSSEY_ITEMS[i];
                const isActive = active === item.key;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    className="odyssey-slice"
                    data-active={isActive || undefined}
                    onMouseEnter={() => {
                      setActive(item.key);
                      router.prefetch(item.href);
                    }}
                    onFocus={() => setActive(item.key)}
                    onBlur={() => setActive("default")}
                    onClick={(e) => go(e, item.href)}
                  >
                    <path d={slice.path} className="odyssey-slice-shape" />
                    <text
                      x={slice.label.x}
                      y={slice.label.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={layout.fontSize}
                      filter="url(#odyssey-aura)"
                      className="odyssey-slice-label"
                    >
                      {item.label.toUpperCase()}
                    </text>
                  </a>
                );
              })}

              {/* Hub: a red light behind the official F logo (the logo itself is never given effects). */}
              <circle r={layout.inner * 0.95} fill="url(#odyssey-hub-glow)" className="odyssey-hub-glow" />
              <path
                d={`M 0 ${-layout.inner} A ${layout.inner} ${layout.inner} 0 0 1 0 ${layout.inner}`}
                fill="none"
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="1.5"
              />
              <image
                href="/brand/faze-logo-white-double-stroke.png"
                x={-LOGO_W / 2}
                y={-LOGO_H / 2}
                width={LOGO_W}
                height={LOGO_H}
                aria-label="FaZe Clan"
              />
            </g>
          </svg>
        </nav>
      </div>

      {/* Sponsor stays visible on the home page now that the top strip is gone (the right-edge tab still shows on wide screens). */}
      <p className="absolute bottom-4 right-6 text-xs text-white/70 [text-shadow:0_0_8px_#000] xl:hidden">
        Challenges presented by <span className="font-semibold text-white">{sponsorName}</span>
        {sponsorIsDemo && <span className="ml-2 rounded-full border border-white/25 px-1.5 py-px text-[10px] uppercase tracking-wide">Demo</span>}
      </p>
    </section>
  );
}
