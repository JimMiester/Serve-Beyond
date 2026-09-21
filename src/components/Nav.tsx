"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import Button from "@/components/ui/Button";
import { signOut } from "@/lib/supabase/auth-actions";

const LINKS = [
  { label: "Courts", href: "/courts" },
  { label: "Coaching", href: "/coaching" },
  { label: "Membership", href: "/membership" },
  { label: "Results", href: "/results" },
  { label: "FAQs", href: "/faqs" },
];

export default function Nav({ session }: { session: { email: string } | null }) {
  // Over the hero the bar can stay barely-there glass; past it the bar sits on
  // cream, where white links on a 25% scrim were unreadable. A passive scroll
  // listener reading scrollY is cheaper here than an observer + sentinel.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); // deep links can load mid-page
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[height,background-color,border-color] duration-300 ${
        scrolled ? "h-[60px] border-white/10 bg-navy/95" : "h-[72px] border-white/10 bg-navy/25"
      }`}
    >
      <nav className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky">
          <Logo
            priority
            className={`w-auto transition-[height] duration-300 ${scrolled ? "h-8 sm:h-9" : "h-9 sm:h-12"}`}
          />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="text-[15px] font-light text-white/85 transition-colors hover:text-sky focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={session ? "/account" : "/sign-in"}
              className="text-[15px] font-light text-white/85 transition-colors hover:text-sky focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
            >
              {session ? "Account" : "Sign In"}
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <Button href="/book" variant="white" size="sm">
            Get Started
          </Button>

          {/* Native disclosure — no client bundle for a five-link menu. */}
          <details className="relative lg:hidden">
            <summary
              aria-label="Menu"
              className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/20 text-white [&::-webkit-details-marker]:hidden"
            >
              <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M0 1h16M0 6h16M0 11h16" />
              </svg>
            </summary>
            {/* top-full keeps the panel glued to the bar as it shrinks. */}
            <ul className="menu-panel absolute right-0 top-[calc(100%+14px)] w-52 rounded-2xl border border-white/10 bg-navy/95 p-2 backdrop-blur-xl">
              {LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="block rounded-xl px-4 py-3 text-[15px] text-white/85 hover:bg-white/10">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                {session ? (
                  <>
                    <Link href="/account" className="block rounded-xl px-4 py-3 text-[15px] text-white/85 hover:bg-white/10">
                      Account
                    </Link>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="block w-full rounded-xl px-4 py-3 text-left text-[15px] text-white/85 hover:bg-white/10"
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link href="/sign-in" className="block rounded-xl px-4 py-3 text-[15px] text-white/85 hover:bg-white/10">
                    Sign In
                  </Link>
                )}
              </li>
            </ul>
          </details>
        </div>
      </nav>
    </header>
  );
}
