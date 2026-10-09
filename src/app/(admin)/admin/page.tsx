import PageTransition from "@/components/ui/PageTransition";
import { createClient } from "@/lib/supabase/server";
import { StatNumber, SessionRing } from "@/components/dashboard/widgets";
import { GlassCard } from "@/components/dashboard/glass";
import { IconTrendUp, IconCalendar, IconUsers } from "@/components/dashboard/icons";
import type { Booking } from "@/lib/supabase/types";

type BookingRow = Booking & {
  courts: { name: string } | null;
  programs: { title: string; price_from: number } | null;
  coaches: { name: string } | null;
  profiles: { full_name: string | null } | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [{ data: coachesData, error: coachesError }, { data: profilesData, error: profilesError }, { data: bookingsData, error: bookingsError }] =
    await Promise.all([
      supabase.from("coaches").select("id, active"),
      supabase.from("profiles").select("id, role"),
      supabase.from("bookings").select("*, courts(name), programs(title, price_from), coaches(name), profiles(full_name)").order("starts_at", { ascending: false }),
    ]);
  if (coachesError) throw coachesError;
  if (profilesError) throw profilesError;
  if (bookingsError) throw bookingsError;

  const coaches = coachesData ?? [];
  const players = (profilesData ?? []).filter((p) => p.role === "player");
  const bookings = (bookingsData ?? []) as unknown as BookingRow[];

  const now = new Date();
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const completed = confirmed.filter((b) => new Date(b.ends_at) < now);
  const inProgress = confirmed.filter((b) => new Date(b.starts_at) <= now && new Date(b.ends_at) >= now);
  const pending = confirmed.filter((b) => new Date(b.starts_at) > now);

  const estimatedRevenue = confirmed.reduce((sum, b) => sum + (b.programs?.price_from ?? 0), 0);
  const recentBookings = [...bookings].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6);

  const stats = [
    { label: "Active Coaches", value: coaches.filter((c) => c.active).length, context: `${coaches.length} total` },
    { label: "Registered Players", value: players.length, context: "with a player account" },
    { label: "Confirmed Bookings", value: confirmed.length, context: `${pending.length} upcoming` },
    { label: "Estimated Revenue", value: estimatedRevenue, context: "confirmed bookings, list price", isCurrency: true },
  ];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Admin Overview</h1>
        <p className="mt-1 text-[15px] text-white/60">Coaches, players, and bookings across the whole academy.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <GlassCard key={s.label} className="group" delay={i * 60}>
              <div className="flex items-start justify-between">
                <p className="text-[13px] font-medium text-white/55">{s.label}</p>
                <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50">
                  <IconTrendUp width={14} height={14} />
                </span>
              </div>
              <p className="mt-3 font-display text-[34px] font-extrabold text-white">
                {s.isCurrency && "₱"}
                <StatNumber value={s.value} />
              </p>
              <p className="mt-1 text-[13px] text-white/50">{s.context}</p>
            </GlassCard>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2" delay={240}>
            <h2 className="font-display text-[18px] font-bold text-white">Recent Bookings</h2>
            {recentBookings.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/15 px-4 py-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/50 text-white/40">
                  <IconCalendar width={16} height={16} />
                </span>
                <p className="text-[14px] text-white/55">No bookings yet.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {recentBookings.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:translate-x-1 hover:bg-white/10">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      <IconUsers width={16} height={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-white">
                        {b.profiles?.full_name ?? "Player"} — {b.programs?.title ?? "Session"}
                      </p>
                      <p className="truncate text-[13px] text-white/50">
                        {formatDateTime(b.starts_at)} at {b.courts?.name ?? "the court"}
                        {b.coaches ? ` with ${b.coaches.name}` : ""}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
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

          <GlassCard className="flex flex-col items-center" delay={300}>
            <h2 className="self-start font-display text-[18px] font-bold text-white">Booking Status</h2>
            <div className="mt-4">
              <SessionRing completed={completed.length} inProgress={inProgress.length} pending={pending.length} />
            </div>
            <div className="mt-4 flex w-full flex-col gap-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/60">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} /> Completed
                </span>
                <span className="font-semibold text-white">{completed.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/60">
                  <span className="size-2.5 rounded-full bg-sky" /> In Progress
                </span>
                <span className="font-semibold text-white">{inProgress.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/60">
                  <span className="size-2.5 rounded-full bg-white/15" /> Pending
                </span>
                <span className="font-semibold text-white">{pending.length}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </main>
    </PageTransition>
  );
}
