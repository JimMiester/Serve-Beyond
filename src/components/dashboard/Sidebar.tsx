"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import Logo from "@/components/Logo";
import { signOut } from "@/lib/supabase/auth-actions";
import {
  IconGrid,
  IconCalendar,
  IconPlusCircle,
  IconUsers,
  IconMapPin,
  IconHelp,
  IconGear,
  IconLogOut,
} from "./icons";

// Book a Session and Courts point at their own dashboard-shelled routes
// (/court-booking, /court-list) rather than the public /book and /courts
// pages, even though /court-booking now reuses /book's real data layer —
// those public paths are still linked from the public site itself (Nav's
// "Get Started", etc.), so the dashboard keeps its own URLs rather than
// pulling visitors there.
const MENU = [
  { label: "Dashboard", href: "/dashboard", icon: IconGrid },
  { label: "Book a Session", href: "/court-booking", icon: IconPlusCircle },
  { label: "My Bookings", href: "/bookings", icon: IconCalendar },
  { label: "Coaches", href: "/coaches", icon: IconUsers },
  { label: "Courts", href: "/court-list", icon: IconMapPin },
];

function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[14px] font-medium text-white/60 transition-all duration-200 hover:translate-x-[3px] hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:bg-transparent"
    >
      <IconLogOut className="text-white/40" />
      {pending ? "Logging out…" : "Logout"}
    </button>
  );
}

/**
 * The one place active/hover/focus logic for a sidebar item lives — every
 * current and future nav item goes through this. Three distinct states:
 *   - resting: muted text, no fill
 *   - hover / focus-visible: light neutral fill + 3px lean toward the
 *     content, identical for both, ~200ms fade
 *   - active (current route): soft charcoal-tinted pill, bold dark
 *     text/icon — the accent green stays reserved for actions and status
 *     (buttons, dots, the ring), not for "where am I" navigation state.
 */
function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof IconGrid; active: boolean }) {
  return (
    <Link
      href={href}
      style={active ? { backgroundColor: "rgba(255, 255, 255, 0.08)", color: "#ffffff" } : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-all duration-200 ${
        active
          ? "font-semibold"
          : "text-white/60 hover:translate-x-[3px] hover:bg-white/5 hover:text-white focus-visible:translate-x-[3px] focus-visible:bg-white/5 focus-visible:text-white"
      }`}
    >
      <Icon className={`transition-transform duration-200 group-hover:scale-110 ${active ? "text-white" : "text-white/40 group-hover:text-white/60"}`} />
      {label}
    </Link>
  );
}

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
      <div>
        <p className="px-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">Menu</p>
        <div className="mt-2 flex flex-col gap-1">
          {MENU.map((item) => (
            <NavLink key={item.label} {...item} active={pathname === item.href} />
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <p className="px-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">General</p>
        <div className="mt-2 flex flex-col gap-1">
          <NavLink href="/help" label="Help" icon={IconHelp} active={pathname === "/help"} />
          {/* Disabled: no hover fill, no focus-visible lean, no pointer
              cursor — deliberately none of NavLink's interactive states. */}
          <div
            aria-disabled
            className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-white/30"
          >
            <IconGear className="text-white/25" />
            Settings
            <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/40">Soon</span>
          </div>
          <form action={signOut}>
            <LogoutButton />
          </form>
        </div>
      </div>
    </nav>
  );
}

function BrandMark() {
  return (
    <div className="flex justify-center px-5 py-8">
      <Logo className="h-14 w-auto" />
    </div>
  );
}

export default function Sidebar() {
  return (
    <>
      {/* Desktop: fixed 252px column, same glass-card surface as every
          other panel — border-right instead of a full border, per spec. */}
      <aside className="glass-card fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col rounded-none border-r border-white/10 lg:flex">
        <Link href="/">
          <BrandMark />
        </Link>
        <SidebarNav />
      </aside>

      {/* Mobile: native disclosure, no client menu-open state needed. */}
      <details className="glass-card rounded-none border-b border-white/10 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 [&::-webkit-details-marker]:hidden">
          {/* A real link nested inside <summary> still navigates on its own
              click area — only clicks outside it fall through to the
              default open/close toggle. */}
          <Link href="/" className="flex items-center">
            <Logo className="h-7 w-auto" />
          </Link>
          <span className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white transition-transform duration-200 hover:scale-110">
            <IconGrid />
          </span>
        </summary>
        <div className="border-t border-white/10">
          <SidebarNav />
        </div>
      </details>
    </>
  );
}
