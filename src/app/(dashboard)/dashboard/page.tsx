import { redirect } from "next/navigation";
import Link from "next/link";
import PageTransition from "@/components/ui/PageTransition";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { cancelBooking } from "./actions";
import { StatNumber, WeeklyChart, SessionRing } from "@/components/dashboard/widgets";
import { GlassCard, AccentButton, GlassButton } from "@/components/dashboard/glass";
import { IconTrendUp, IconCalendar } from "@/components/dashboard/icons";
import type { Booking } from "@/lib/supabase/types";

type BookingRow = Booking & {
  courts: { name: string } | null;
  programs: { title: string } | null;
  coaches: { id: string; name: string } | null;
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function manilaDateKey(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

function hoursBetween(startIso: string, endIso: string) {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3600000;
}

function greeting(now: Date) {
  const hour = Number(now.toLocaleString("en-US", { hour: "2-digit", hour12: false, timeZone: "Asia/Manila" }));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;

  const supabase = await createClient();
  const user = await getAuthUser();

  // Layout above already redirects when signed out; this satisfies
  // TypeScript's narrowing without a second real redirect ever firing.
  // getAuthUser() is react-cache()'d, so this costs no extra round-trip —
  // the layout's own call already fetched it for this request.
  if (!user) redirect("/sign-in?next=/dashboard");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const firstName = profile?.full_name?.trim().split(" ")[0] || "there";

  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select("*, courts(name), programs(title), coaches(id, name)")
    .order("starts_at", { ascending: true });
  if (bookingsError) throw bookingsError;

  const bookings = (bookingsData ?? []) as unknown as BookingRow[];
  const now = new Date();

  const active = bookings.filter((b) => b.status === "confirmed");
  const completed = active.filter((b) => new Date(b.ends_at) < now);
  const inProgress = active.filter((b) => new Date(b.starts_at) <= now && new Date(b.ends_at) >= now);
  const pending = active.filter((b) => new Date(b.starts_at) > now);
  const upcoming = [...inProgress, ...pending].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

  const nextSession = pending[0] ?? null;
  const laterUpcoming = upcoming.filter((b) => b.id !== nextSession?.id).slice(0, 5);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const bookedThisMonth = bookings.filter((b) => new Date(b.created_at) >= startOfMonth).length;

  const hoursOnCourt = Math.round(completed.reduce((sum, b) => sum + hoursBetween(b.starts_at, b.ends_at), 0) * 10) / 10;
  const distinctCoachIds = new Set(bookings.filter((b) => b.coach_id).map((b) => b.coach_id));

  // Week grid: Asia/Manila never observes DST, so a fixed +08:00 offset
  // makes plain 24h-increment arithmetic safe for finding this week's days.
  const todayKey = manilaDateKey(now);
  const todayMidnight = new Date(`${todayKey}T00:00:00+08:00`);
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Asia/Manila" }).format(todayMidnight);
  const todayIdx = DAY_NAMES.indexOf(todayLabel);
  const monday = new Date(todayMidnight.getTime() - todayIdx * 86400000);
  const weekDays = DAY_NAMES.map((label, i) => {
    const dayInstant = new Date(monday.getTime() + i * 86400000);
    const key = manilaDateKey(dayInstant);
    const dayHours = active
      .filter((b) => manilaDateKey(new Date(b.starts_at)) === key)
      .reduce((sum, b) => sum + hoursBetween(b.starts_at, b.ends_at), 0);
    return { label, hours: Math.round(dayHours * 10) / 10, isToday: key === todayKey };
  });

  const stats = [
    { label: "Total Sessions", value: active.length, decimals: 0, context: `${bookedThisMonth} booked this month` },
    { label: "Hours on Court", value: hoursOnCourt, decimals: 1, context: `${completed.length} completed` },
    {
      label: "Upcoming Sessions",
      value: upcoming.length,
      decimals: 0,
      context: nextSession ? `Next: ${formatDateShort(nextSession.starts_at)}` : "None booked yet",
      pulse: true,
    },
    { label: "Coaches Trained With", value: distinctCoachIds.size, decimals: 0, context: `${completed.length + upcoming.length} sessions total` },
  ];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">
              {greeting(now)}, {firstName}
            </h1>
            <p className="mt-1 text-[15px] text-white/60">Your court time, coaches, and upcoming sessions in one place.</p>
          </div>
          <div className="flex gap-3">
            <GlassButton href="/bookings">View History</GlassButton>
            <AccentButton href="/book">+ Book Session</AccentButton>
          </div>
        </div>

        {errorMessage && (
          <>
            <ClearFlashParams params={["error"]} />
            <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[15px] text-red-300">{errorMessage}</p>
          </>
        )}

        {/* Stat cards — identical glass treatment on all four, per spec. */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s, i) => (
            <GlassCard key={s.label} className="group" delay={i * 60}>
              <div className="flex items-start justify-between">
                <p className="flex items-center gap-1.5 text-[13px] font-medium text-white/55">
                  {s.label}
                  {s.pulse && (
                    <span className="dash-pulse-dot size-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                  )}
                </p>
                <button
                  type="button"
                  aria-label={`Refresh ${s.label}`}
                  className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 transition-transform duration-200 group-hover:rotate-45 group-hover:scale-110"
                >
                  <IconTrendUp width={14} height={14} />
                </button>
              </div>
              <p className="mt-3 font-display text-[34px] font-extrabold text-white">
                <StatNumber value={s.value} decimals={s.decimals} />
              </p>
              <p className="mt-1 text-[13px] text-white/50">{s.context}</p>
            </GlassCard>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Weekly chart */}
          <GlassCard className="lg:col-span-2" delay={240}>
            <div>
              <h2 className="font-display text-[18px] font-bold text-white">Court Time This Week</h2>
              <p className="text-[13px] text-white/50">Hours booked, Monday through Sunday</p>
            </div>
            <div className="mt-6">
              <WeeklyChart days={weekDays} />
            </div>
          </GlassCard>

          {/* Next session */}
          <GlassCard className="flex flex-col" delay={300}>
            <h2 className="font-display text-[18px] font-bold text-white">Next Session</h2>
            {nextSession ? (
              <div className="mt-4 flex flex-1 flex-col justify-between gap-4">
                <div>
                  <p className="text-[15px] font-semibold text-white">{nextSession.programs?.title ?? "Session"}</p>
                  <p className="mt-1 text-[14px] text-white/60">
                    {nextSession.coaches
                      ? `On ${nextSession.courts?.name ?? "the court"} with ${nextSession.coaches.name}`
                      : `On ${nextSession.courts?.name ?? "the court"}`}
                  </p>
                  <p className="mt-2 text-[14px] font-medium" style={{ color: "var(--accent)" }}>
                    {formatDateTime(nextSession.starts_at)}
                  </p>
                </div>
                <form action={cancelBooking}>
                  <input type="hidden" name="booking_id" value={nextSession.id} />
                  <button
                    type="submit"
                    className="w-full text-center text-[14px] font-semibold text-red-400 transition-colors hover:underline"
                  >
                    Cancel session
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-4 flex flex-1 flex-col items-start justify-between gap-4">
                <p className="text-[14px] text-white/55">Nothing on the calendar yet.</p>
                <AccentButton href="/book" className="w-full">
                  Book a Session
                </AccentButton>
              </div>
            )}
          </GlassCard>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upcoming list */}
          <GlassCard className="lg:col-span-2" delay={360}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[18px] font-bold text-white">Upcoming Sessions</h2>
              <Link href="/book" className="text-[13px] font-semibold" style={{ color: "var(--accent)" }}>
                + New
              </Link>
            </div>
            {laterUpcoming.length === 0 ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-white/15 px-4 py-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-white/50 text-white/40">
                  <IconCalendar width={16} height={16} />
                </span>
                <p className="text-[14px] text-white/55">
                  {nextSession ? "That's everything on your calendar." : "No sessions booked yet."}
                </p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {laterUpcoming.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 hover:translate-x-1 hover:bg-white/10"
                  >
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      <IconCalendar width={16} height={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-white">{b.programs?.title ?? "Session"}</p>
                      <p className="truncate text-[13px] text-white/50">
                        {formatDateTime(b.starts_at)} at {b.courts?.name ?? "the court"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>

          {/* Session ring */}
          <GlassCard className="flex flex-col items-center" delay={420}>
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
