"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/site";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-4" onClick={() => setOpen(false)}>
          {/* One-color FaZe logo: brand rules allow it only between 40px and 60px wide. */}
          <Image
            src="/brand/faze-logo-onecolor-white.png"
            alt=""
            width={56}
            height={37}
            priority
          />
          <span className="font-display text-xl uppercase tracking-wide">Hall of FaZe</span>
        </Link>

        <button
          type="button"
          className="rounded-md border border-white/15 px-3 py-2 text-sm sm:hidden"
          aria-expanded={open}
          aria-controls="primary-nav-links"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>

        <ul
          id="primary-nav-links"
          className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-white/10 bg-background px-4 pb-4 sm:static sm:flex sm:flex-row sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0`}
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-accent-fill text-white" : "text-muted hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
