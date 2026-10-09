import { notFound } from "next/navigation";

/**
 * Local-testing launcher for signing into all three roles at once. Each
 * link below opens the app under a /_dev/<slot>/... prefix; proxy.ts
 * rewrites that to the real path and gives it its own Supabase cookie
 * (see src/lib/dev-slot.ts), so the three tabs stay logged in
 * independently instead of overwriting each other's session on refresh.
 *
 * Dev-only: returns a 404 in production, and production never rewrites a
 * /_dev/ URL in the first place (see proxy.ts), so this has no effect on
 * anything a real visitor can reach.
 */
const SLOTS: { slot: string; label: string; href: string }[] = [
  { slot: "player", label: "Player", href: "/_dev/player/sign-in" },
  { slot: "coach", label: "Coach", href: "/_dev/coach/sign-in?mode=coach" },
  { slot: "admin", label: "Admin", href: "/_dev/admin/admin-login" },
];

export default function DevTabsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "1.375rem", fontWeight: 600, margin: 0 }}>Open 3 isolated test sessions</h1>
      <p style={{ maxWidth: 420, color: "#555", margin: 0, lineHeight: 1.5 }}>
        Each link opens in a new tab with its own login, independent of the others — refreshing one tab won&rsquo;t
        change what the others show. Open all three, then sign in separately in each.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: 260 }}>
        {SLOTS.map((s) => (
          <a
            key={s.slot}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: "1px solid #ccc",
              textAlign: "center",
              textDecoration: "none",
              color: "#111",
              fontWeight: 500,
            }}
          >
            Open as {s.label}
          </a>
        ))}
      </div>
    </main>
  );
}
