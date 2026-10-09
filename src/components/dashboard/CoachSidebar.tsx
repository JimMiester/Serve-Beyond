"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import Logo from "@/components/Logo";
import { signOut } from "@/lib/supabase/auth-actions";
import { IconGrid, IconCalendar, IconLogOut } from "./icons";

const MENU = [
  { label: "Dashboard", href: "/coach", icon: IconGrid },
  { label: "My Schedule", href: "/coach/schedule", icon: IconCalendar },
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
    <div className="px-5 py-8">
      <div className="flex justify-center">
        <Logo className="h-14 w-auto" />
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Coach</p>
    </div>
  );
}

export default function CoachSidebar() {
  return (
    <>
      <aside className="glass-card fixed inset-y-0 left-0 z-40 hidden w-[252px] flex-col rounded-none border-r border-white/10 lg:flex">
        <Link href="/">
          <BrandMark />
        </Link>
        <SidebarNav />
      </aside>

      <details className="glass-card rounded-none border-b border-white/10 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 [&::-webkit-details-marker]:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-7 w-auto" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Coach</span>
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
