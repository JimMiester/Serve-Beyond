import { Suspense } from "react";
import { Link } from "next-view-transitions";
import Logo from "./Logo";
import Skeleton from "./ui/Skeleton";
import { signOut } from "@/lib/supabase/auth-actions";
import { getNavSession } from "@/lib/supabase/server";

const LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Coaches", href: "/coaching" },
  { label: "Classes", href: "/classes" },
  { label: "Courts", href: "/courts" },
  { label: "Book a Session", href: "/book" },
  { label: "FAQs", href: "/faqs" },
];

/** Plain server component, not "use client": the mobile menu is a native
 * <details> and every action here is a server action form, so nothing in
 * this file ever needed client JS. The session-dependent pieces (desktop
 * pill + sign-out, mobile menu's last item) are their own async components
 * behind Suspense — getNavSession() is a real auth round-trip, and without
 * that boundary, awaiting it here would block this shared layout chrome
 * from rendering (and the whole page's own data fetching from starting)
 * behind that round-trip on every single page. */
export default function Nav() {
  return (
    <header
      data-site-nav
      className="fixed inset-x-0 top-0 z-50 h-[60px] border-b border-white/10 bg-navy"
    >
      <nav className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky">
          <Logo priority className="h-8 w-auto sm:h-9" />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="text-[15px] font-light text-white/65 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Suspense fallback={<AccountPillSkeleton />}>
            <DesktopAccountArea />
          </Suspense>

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
            <ul className="glass-card menu-panel absolute right-0 top-[calc(100%+14px)] w-52 rounded-2xl border border-white/10 p-2 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)]">
              {LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="block rounded-xl px-4 py-3 text-[15px] text-white/70 hover:bg-white/5">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Suspense fallback={<Skeleton className="mx-4 my-3 h-5 w-16 rounded" />}>
                  <MobileAccountLink />
                </Suspense>
              </li>
            </ul>
          </details>
        </div>
      </nav>
    </header>
  );
}

function AccountPillSkeleton() {
  return <Skeleton className="h-[42px] w-[124px] rounded-full" />;
}

async function DesktopAccountArea() {
  const session = await getNavSession();

  return (
    <>
      <Link
        href={session ? session.dashboardHref : "/sign-in"}
        className="glass-sweep rounded-full px-5 py-2.5 text-[14px] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
      >
        {session ? (
          <span className="flex items-center gap-1.5">
            Dashboard
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h8M8 3.5 11.5 7 8 10.5" />
            </svg>
          </span>
        ) : (
          "Get Started"
        )}
      </Link>

      {/* Desktop-only sign-out: the mobile menu already has one below,
          but that panel is lg:hidden, which left signed-in desktop
          visitors with no way to log out from the nav at all. */}
      {session && (
        <form action={signOut} className="hidden lg:block">
          <button
            type="submit"
            aria-label="Sign out"
            className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </form>
      )}
    </>
  );
}

async function MobileAccountLink() {
  const session = await getNavSession();

  return session ? (
    <form action={signOut}>
      <button
        type="submit"
        className="block w-full rounded-xl px-4 py-3 text-left text-[15px] text-white/70 hover:bg-white/5"
      >
        Sign out
      </button>
    </form>
  ) : (
    <Link href="/sign-in" className="block rounded-xl px-4 py-3 text-[15px] text-white/70 hover:bg-white/5">
      Sign In
    </Link>
  );
}
