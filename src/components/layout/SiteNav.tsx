"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT } from "@/lib/client-auth";
import { NAV_LINKS } from "@/lib/site";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [homeNavVisible, setHomeNavVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/user/me", { cache: "no-store" });
        const body = response.ok
          ? ((await response.json().catch(() => null)) as { data?: { user?: { emailVerified?: boolean } } } | null)
          : null;
        // An account counts as signed in for navigation only once its email is verified.
        const verified = response.ok && body?.data?.user?.emailVerified !== false;
        if (!cancelled) {
          setAuthenticated(verified);
          setNeedsVerification(response.ok && !verified);
          if (!verified) setOpen(false);
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
          setOpen(false);
        }
      }
    }

    const handleAuthChange = () => { void checkSession(); };
    void checkSession();
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/") return;

    function updateHomeNav() {
      const content = document.getElementById("home-content");
      setHomeNavVisible(Boolean(content && content.getBoundingClientRect().top <= 72));
    }

    const initialFrame = window.requestAnimationFrame(updateHomeNav);
    window.addEventListener("scroll", updateHomeNav, { passive: true });
    window.addEventListener("resize", updateHomeNav);
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", updateHomeNav);
      window.removeEventListener("resize", updateHomeNav);
    };
  }, [pathname]);

  const visibleLinks = authenticated === true
    ? NAV_LINKS
    : NAV_LINKS.filter((link) => link.href !== "/account");

  // Keep the landing artwork unobstructed at the top. Once the visitor reaches
  // the page content, replace the radial menu with the regular fixed navigation.
  if (pathname === "/" && !homeNavVisible) {
    return (
      <header className="absolute right-0 top-0 z-40 flex items-center gap-2 px-4 pt-10 sm:px-6 xl:pt-5">
        {authenticated === true ? (
          <Link
            href="/account"
            className="inline-flex whitespace-nowrap rounded-full bg-white px-5 py-2 text-sm font-semibold text-black shadow-lg shadow-black/40 transition-colors hover:bg-accent-fill hover:text-white"
          >
            My Profile
          </Link>
        ) : needsVerification ? (
          <Link
            href="/account"
            className="inline-flex whitespace-nowrap rounded-full bg-accent-fill px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/40"
          >
            Verify email
          </Link>
        ) : (
          <>
            <Link
              href="/account?mode=login"
              className="inline-flex whitespace-nowrap rounded-full border border-white/30 bg-black/45 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/40 backdrop-blur transition-colors hover:border-white hover:bg-black/70"
            >
              Sign in
            </Link>
            <Link
              href="/account?mode=register"
              className="inline-flex whitespace-nowrap rounded-full bg-accent-fill px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/40 transition-colors hover:bg-accent-fill-strong"
            >
              Sign up
            </Link>
          </>
        )}
      </header>
    );
  }

  return (
    <header className={`${pathname === "/" ? "fixed inset-x-0" : "sticky"} top-0 z-50 border-b border-white/10 bg-background/90 backdrop-blur`}>
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
          <span className="hidden font-display text-xl uppercase tracking-wide md:inline">Hall of FaZe</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-white/15 px-3 py-2 text-sm lg:hidden"
            aria-expanded={open}
            aria-controls="primary-nav-links"
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>

          <ul
            id="primary-nav-links"
            className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full flex-col gap-1 border-b border-white/10 bg-background px-4 pb-4 lg:static lg:flex lg:flex-row lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0`}
          >
            {visibleLinks.map((link) => {
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

          {authenticated !== true && (
            needsVerification ? (
              <Link
                href="/account"
                aria-current={pathname === "/account" ? "page" : undefined}
                className="whitespace-nowrap rounded-md bg-accent-fill px-4 py-2 text-sm font-semibold text-white"
              >
                Verify email
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/account?mode=login"
                  className="whitespace-nowrap rounded-md border border-white/20 px-3 py-2 text-sm font-semibold text-white transition-colors hover:border-white/50"
                >
                  Sign in
                </Link>
                <Link
                  href="/account?mode=register"
                  className="whitespace-nowrap rounded-md bg-accent-fill px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-fill-strong"
                >
                  Sign up
                </Link>
              </div>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
