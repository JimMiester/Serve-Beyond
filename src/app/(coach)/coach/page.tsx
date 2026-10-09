import { redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import PageTransition from "@/components/ui/PageTransition";
import { StatNumber, SessionRing } from "@/components/dashboard/widgets";
import { GlassCard } from "@/components/dashboard/glass";
import { IconTrendUp, IconCalendar } from "@/components/dashboard/icons";
import type { Booking, Coach } from "@/lib/supabase/types";

type BookingRow = Booking & {
  courts: { name: string } | null;
  programs: { title: string } | null;
  profiles: { full_name: string | null } | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

function hoursBetween(startIso: string, endIso: string) {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3600000;
}

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/sign-in?mode=coach&next=/coach");

  const { data: coachData, error: coachError } = await supabase.from("coaches").select("*").eq("profile_id", user.id).maybeSingle();
  if (coachError) throw coachError;
  const coach = coachData as Coach | null;

  // Before a bio is linked, coach.name doesn't exist yet — fall back to
  // the account's own name (same source TopBar already greets with),
  // never the raw email.
  const { data: profileData } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const firstName = (coach?.name ?? profileData?.full_name)?.trim().split(" ")[0] || "there";

  // Approval grants access to the dashboard itself; linking to a bio in
  // the coaches directory is a separate, later step that only controls
  // the public-facing showcase (and, as a side effect, which bookings can
  // be attributed to this account — bookings.coach_id points at that
  // bio row, not the login). Without a link there's simply no session
  // data yet, not a reason to block the page.
  const bookings: BookingRow[] = [];
  if (coach) {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*, courts(name), programs(title), profiles(full_name)")
      .eq("coach_id", coach.id)
      .order("starts_at", { ascending: true });
    if (bookingsError) throw bookingsError;
    bookings.push(...((bookingsData ?? []) as unknown as BookingRow[]));
  }

  const now = new Date();

  const active = bookings.filter((b) => b.status === "confirmed");
  const completed = active.filter((b) => new Date(b.ends_at) < now);
  const inProgress = active.filter((b) => new Date(b.starts_at) <= now && new Date(b.ends_at) >= now);
  const pending = active.filter((b) => new Date(b.starts_at) > now);
  const upcoming = [...inProgress, ...pending].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

  const nextSession = pending[0] ?? null;
  const laterUpcoming = upcoming.filter((b) => b.id !== nextSession?.id).slice(0, 5);

  const hoursCoached = Math.round(completed.reduce((sum, b) => sum + hoursBetween(b.starts_at, b.ends_at), 0) * 10) / 10;
  const distinctPlayers = new Set(active.map((b) => b.player_id)).size;

  const stats = [
    { label: "Total Sessions", value: active.length, decimals: 0, context: `${completed.length} completed` },
    { label: "Hours Coached", value: hoursCoached, decimals: 1, context: `${completed.length} sessions logged` },
    {
      label: "Upcoming Sessions",
      value: upcoming.length,
      decimals: 0,
      context: nextSession ? `Next: ${formatDateShort(nextSession.starts_at)}` : "None scheduled",
    },
    { label: "Players Coached", value: distinctPlayers, decimals: 0, context: "distinct players" },
  ];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Hi, {firstName}</h1>
        <p className="mt-1 text-[15px] text-white/60">Your assigned sessions, at a glance.</p>

        {!coach && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/15 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/50 text-white/40">
              <IconCalendar width={16} height={16} />
            </span>
            <p className="text-[13px] text-white/55">
              Not linked to a bio in the coaches directory yet — an admin needs to do that before sessions show up
              here.
            </p>
          </div>
        )}

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
                <StatNumber value={s.value} decimals={s.decimals} />
              </p>
              <p className="mt-1 text-[13px] text-white/50">{s.context}</p>
            </GlassCard>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2" delay={240}>
            <h2 className="font-display text-[18px] font-bold text-white">Upcoming Sessions</h2>
            {laterUpcoming.length === 0 && !nextSession ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/15 px-4 py-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/50 text-white/40">
                  <IconCalendar width={16} height={16} />
                </span>
                <p className="text-[14px] text-white/55">Nothing scheduled yet.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {[...(nextSession ? [nextSession] : []), ...laterUpcoming].map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:translate-x-1 hover:bg-white/10">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      <IconCalendar width={16} height={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-white">
                        {b.profiles?.full_name ?? "Player"} — {b.programs?.title ?? "Session"}
                      </p>
                      <p className="truncate text-[13px] text-white/50">
                        {formatDateTime(b.starts_at)} at {b.courts?.name ?? "the court"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          <GlassCard className="flex flex-col items-center" delay={300}>
            <h2 className="self-start font-display text-[18px] font-bold text-white">Your Sessions</h2>
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
