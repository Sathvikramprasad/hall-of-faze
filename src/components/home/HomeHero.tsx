"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FocusEvent } from "react";
import { HERO_DEFAULT_IMAGE, HERO_HEADLINE, HERO_MENU, type HeroMenuItem } from "@/lib/home-hero";

/*
 * Wheel geometry, in px of the wheel's own 480×600 design box (the whole box is
 * scaled down on smaller screens). The hub sits on the left; menu labels sit on
 * an arc to its right, and the divider lines run through the gaps between them,
 * so every label stays inside its own slice. The angles were fitted to the
 * labels' widths in Anton at 2rem (with room for the hover zoom); re-check them
 * if a label's text or size changes.
 */
const BOX = { width: 480, height: 600 };
const HUB = { x: 96, y: 300, r: 76 };
const RING_R = 106; // thin arc around the hub
const LABEL_R = 185; // where each label's left edge sits
const LABEL_ANGLES = [-88, -34, 0, 34, 88]; // one per menu item, top to bottom
const DIVIDERS = [-95, -44, -12, 12, 44, 95]; // slice edges: item i spans DIVIDERS[i]..DIVIDERS[i + 1]
const RAY = { from: 116, to: 310 }; // divider line length
const INDICATOR_SPAN = 18; // degrees covered by the bright arc pointing at the active item
const SLICES = HERO_MENU.map((_, i) => ({ from: DIVIDERS[i], to: DIVIDERS[i + 1], mid: (DIVIDERS[i] + DIVIDERS[i + 1]) / 2 }));

const polar = (r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: HUB.x + r * Math.cos(rad), y: HUB.y + r * Math.sin(rad) };
};
const round = (n: number) => Math.round(n * 10) / 10;

/** Annular sector between two angles (degrees, clockwise from 3 o'clock). */
function sectorPath(inner: number, outer: number, from: number, to: number) {
  const a = polar(outer, from);
  const b = polar(outer, to);
  const c = polar(inner, to);
  const d = polar(inner, from);
  const large = to - from > 180 ? 1 : 0;
  return `M${round(a.x)} ${round(a.y)}A${outer} ${outer} 0 ${large} 1 ${round(b.x)} ${round(b.y)}L${round(c.x)} ${round(c.y)}A${inner} ${inner} 0 ${large} 0 ${round(d.x)} ${round(d.y)}Z`;
}

function arcPath(r: number, from: number, to: number) {
  const a = polar(r, from);
  const b = polar(r, to);
  return `M${round(a.x)} ${round(a.y)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${round(b.x)} ${round(b.y)}`;
}

const rotateAboutHub = (deg: number) => ({
  transform: `rotate(${deg}deg)`,
  transformBox: "view-box" as const,
  transformOrigin: `${HUB.x}px ${HUB.y}px`,
});

/**
 * Home page hero: warrior artwork, a radial menu on the left edge (the page's
 * main navigation on Home), the headline, red smoke rising from the bottom and
 * a scroll cue. Hovering or focusing a menu item swaps the background pose.
 */
export function HomeHero() {
  const [hovered, setHovered] = useState<HeroMenuItem["key"] | null>(null);
  const activeIndex = Math.max(0, HERO_MENU.findIndex((item) => item.key === (hovered ?? "home")));
  const active = HERO_MENU[activeIndex];
  const activeImage = active.image ?? HERO_DEFAULT_IMAGE;
  const framing = active.image ? null : active.framing;
  const images = [...new Set([HERO_DEFAULT_IMAGE, ...HERO_MENU.flatMap((item) => (item.image ? [item.image] : []))])];

  function onWheelBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(null);
  }

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate h-[90svh] min-h-[34rem] overflow-hidden bg-background"
    >
      {/* Every pose is rendered (and so downloaded) up front; only the active one is visible. */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {images.map((src) => {
          const visible = src === activeImage;
          return (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              sizes="100vw"
              quality={90}
              {...(src === HERO_DEFAULT_IMAGE ? { preload: true } : { loading: "eager" as const })}
              className={`object-cover transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"}`}
              style={
                visible && framing
                  ? { transform: `scale(${framing.scale})`, transformOrigin: framing.origin }
                  : { transform: "scale(1)", transformOrigin: "50% 50%" }
              }
            />
          );
        })}

        {/* Legibility: darken behind the wheel (left) and the headline (right). */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-black/85 via-black/45 to-transparent lg:w-2/5" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-black/60 via-black/25 to-transparent lg:block" />

        {/* Crimson smoke rising from the bottom, fading into the page below. */}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[radial-gradient(60%_55%_at_50%_100%,rgba(220,38,38,0.5),transparent_70%),radial-gradient(40%_45%_at_15%_100%,rgba(153,27,27,0.55),transparent_70%),radial-gradient(45%_50%_at_85%_100%,rgba(153,27,27,0.5),transparent_70%)] mix-blend-screen" />
        <svg className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-80 mix-blend-screen" preserveAspectRatio="none" viewBox="0 0 1000 400">
          <defs>
            <filter id="hero-smoke" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="4" seed="11" />
              <feColorMatrix values="0 0 0 0 0.86  0 0 0 0 0.12  0 0 0 0 0.13  0 0 0 1.6 -0.55" />
            </filter>
            <linearGradient id="hero-smoke-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0" />
              <stop offset="0.6" stopColor="white" stopOpacity="0.8" />
              <stop offset="1" stopColor="white" stopOpacity="1" />
            </linearGradient>
            <mask id="hero-smoke-mask">
              <rect width="1000" height="400" fill="url(#hero-smoke-fade)" />
            </mask>
          </defs>
          <rect width="1000" height="400" filter="url(#hero-smoke)" mask="url(#hero-smoke-mask)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-1/6 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* Radial menu: the main navigation on Home. */}
      <nav
        aria-label="Primary"
        className="absolute left-0 top-1/2 origin-left -translate-y-1/2 scale-[0.6] sm:scale-75 lg:scale-90 xl:scale-100"
        style={{ width: BOX.width, height: BOX.height }}
        onPointerLeave={() => setHovered(null)}
        onBlur={onWheelBlur}
      >
        <svg className="pointer-events-none absolute inset-0" width={BOX.width} height={BOX.height} viewBox={`0 0 ${BOX.width} ${BOX.height}`} aria-hidden="true">
          <defs>
            <radialGradient id="hero-wedge" gradientUnits="userSpaceOnUse" cx={HUB.x} cy={HUB.y} r={RAY.to}>
              <stop offset="0.3" stopColor="#e4002b" stopOpacity="0.45" />
              <stop offset="1" stopColor="#e4002b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hero-ray-fade" gradientUnits="userSpaceOnUse" cx={HUB.x} cy={HUB.y} r={RAY.to}>
              <stop offset="0.35" stopColor="white" stopOpacity="1" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="hero-ray-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={BOX.width} height={BOX.height}>
              <rect width={BOX.width} height={BOX.height} fill="url(#hero-ray-fade)" />
            </mask>
          </defs>

          {/* Highlight wedge behind the hovered item, filling its slice */}
          {SLICES.map((slice, i) => (
            <path
              key={i}
              d={sectorPath(RING_R + 4, RAY.to, slice.from + 1, slice.to - 1)}
              fill="url(#hero-wedge)"
              className={`transition-opacity duration-300 ease-out motion-reduce:transition-none ${hovered && i === activeIndex ? "opacity-100" : "opacity-0"}`}
            />
          ))}

          {/* Thin divider lines between items, fading outwards */}
          <g mask="url(#hero-ray-mask)" stroke="white" strokeOpacity="0.45" strokeWidth="1">
            {DIVIDERS.map((deg) => {
              const a = polar(RAY.from, deg);
              const b = polar(RAY.to, deg);
              return <line key={deg} x1={round(a.x)} y1={round(a.y)} x2={round(b.x)} y2={round(b.y)} />;
            })}
          </g>

          {/* Arc around the hub, with a bright segment pointing at the active item */}
          <path d={arcPath(RING_R, DIVIDERS[0], DIVIDERS[DIVIDERS.length - 1])} fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" />
          <path
            d={arcPath(RING_R, -INDICATOR_SPAN / 2, INDICATOR_SPAN / 2)}
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            className="transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={rotateAboutHub(SLICES[activeIndex].mid)}
          />
        </svg>

        {/* Hub: the FaZe logo (left untouched, per the brand rules) inside a glowing ring */}
        <div
          className="pointer-events-none absolute flex items-center justify-center rounded-full border-[3px] border-accent-fill bg-[radial-gradient(circle_at_50%_40%,#2a0a0f,#050505_70%)] shadow-[0_0_38px_rgba(228,0,43,0.6),inset_0_0_22px_rgba(228,0,43,0.35)]"
          style={{ left: HUB.x - HUB.r, top: HUB.y - HUB.r, width: HUB.r * 2, height: HUB.r * 2 }}
        >
          <Image src="/brand/faze-logo-white-double-stroke.png" alt="" width={92} height={62} />
        </div>

        <ul>
          {HERO_MENU.map((item, i) => {
            const point = polar(LABEL_R, LABEL_ANGLES[i]);
            const isActive = i === activeIndex;
            return (
              <li key={item.key} className="absolute -translate-y-1/2" style={{ left: round(point.x), top: round(point.y) }}>
                <Link
                  href={item.href}
                  aria-current={item.key === "home" ? "page" : undefined}
                  onPointerEnter={() => setHovered(item.key)}
                  onFocus={() => setHovered(item.key)}
                  className={`block origin-left px-2 py-1 font-display text-[2rem] uppercase leading-none tracking-wide transition-[color,scale] duration-200 [text-shadow:0_0_14px_#000,0_0_4px_#000,0_2px_3px_#000] motion-reduce:transition-none ${
                    isActive ? "scale-110 text-accent-fill" : "text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Headline */}
      <h1
        id="home-hero-heading"
        className="pointer-events-none absolute bottom-20 left-4 right-4 text-right font-display text-[clamp(1.35rem,5.6vw,2.6rem)] uppercase leading-[1.05] tracking-wide [text-shadow:0_4px_18px_rgba(0,0,0,0.95),0_2px_4px_#000] sm:bottom-16 sm:left-2/5 lg:bottom-14 lg:left-auto lg:right-[4vw] lg:max-w-[56rem] lg:text-[clamp(2.15rem,3.25vw,3.6rem)]"
      >
        <span className="sr-only">Hall of FaZe: </span>
        {HERO_HEADLINE.map((line) => (
          <span key={line} className="block">
            <span className="text-accent-fill">Every</span> {line}
          </span>
        ))}
      </h1>

      {/* Scroll cue */}
      <a
        href="#home-content"
        aria-label="Scroll down to the rest of the page"
        className="hero-scroll-cue absolute bottom-5 left-1/2 -ml-5 flex h-10 w-10 items-center justify-center rounded-full text-white/85 hover:text-accent-fill"
      >
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 6l6 6 6-6M6 13l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
