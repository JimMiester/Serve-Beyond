import PageTransition from "@/components/ui/PageTransition";
import { GlassCard } from "@/components/dashboard/glass";
import { IconCalendar } from "@/components/dashboard/icons";
import { createClient } from "@/lib/supabase/server";
import type { Booking } from "@/lib/supabase/types";

type BookingRow = Booking & {
  courts: { name: string } | null;
  programs: { title: string } | null;
  coaches: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
}

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, courts(name), programs(title), coaches(name), profiles(full_name)")
    .order("starts_at", { ascending: false });
  if (error) throw error;
  const bookings = (data ?? []) as unknown as BookingRow[];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Bookings</h1>
        <p className="mt-1 text-[15px] text-white/60">{bookings.length} bookings across every player.</p>

        <GlassCard className="mt-8" delay={0}>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-white/55">No bookings yet.</p>
          ) : (
            <ul className="divide-y divide-white/8">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    <IconCalendar width={18} height={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white">
                      {b.profiles?.full_name ?? "Player"} — {b.programs?.title ?? "Session"}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-white/50">
                      {formatDateTime(b.starts_at)} at {b.courts?.name ?? "the court"}
                      {b.coaches ? ` with ${b.coaches.name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${
                      b.status === "confirmed" ? "text-emerald" : "text-red-400"
                    }`}
                    style={{ backgroundColor: b.status === "confirmed" ? "var(--accent-soft)" : "rgba(220,38,38,0.1)" }}
                  >
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </main>
    </PageTransition>
  );
}
