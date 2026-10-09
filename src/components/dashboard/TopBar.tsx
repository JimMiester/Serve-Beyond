import { IconSearch, IconBell } from "./icons";

export default function TopBar({
  email,
  fullName,
  devSlot,
}: {
  email: string;
  fullName: string | null;
  /** Dev-only: set when this page was reached through /_dev/<slot>/..., so
   * the sidebar makes it obvious which isolated test session this tab is
   * looking at. See src/lib/dev-slot.ts. Omit or pass null outside of
   * that workflow — nothing renders. */
  devSlot?: string | null;
}) {
  const initial = (fullName ?? email).trim().charAt(0).toUpperCase();

  return (
    <header className="glass-card mx-4 flex h-16 items-center gap-4 rounded-[var(--radius-card)] border border-white/10 px-5 sm:px-6">
      {devSlot && (
        <span className="hidden shrink-0 items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300 sm:inline-flex">
          Dev tab: {devSlot}
        </span>
      )}

      <label className="hidden max-w-xs flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-white/40 transition-colors duration-200 focus-within:border-[var(--accent)] focus-within:text-white/60 sm:flex">
        <IconSearch className="shrink-0" />
        <input
          type="search"
          placeholder="Search"
          className="w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/40"
        />
        <kbd className="hidden rounded-md border border-white/15 bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white/50 md:inline">
          ⌘K
        </kbd>
      </label>

      <div className="flex flex-1 items-center justify-end gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-transform duration-200 hover:scale-110 hover:rotate-12"
        >
          <IconBell />
          <span className="dash-pulse-dot absolute right-2 top-2 size-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </button>

        <div className="flex items-center gap-3">
          <span
            className="flex size-9 items-center justify-center rounded-full text-[14px] font-bold text-white transition-transform duration-200 hover:scale-110"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-deep))" }}
          >
            {initial}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-[14px] font-semibold text-white">{fullName || "Player"}</p>
            <p className="text-[12px] text-white/50">{email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
