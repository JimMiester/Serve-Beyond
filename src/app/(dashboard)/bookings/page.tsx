import { redirect } from "next/navigation";
import PageTransition from "@/components/ui/PageTransition";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { cancelBooking } from "../dashboard/actions";
import { GlassCard, AccentButton } from "@/components/dashboard/glass";
import { IconCalendar, IconMapPin } from "@/components/dashboard/icons";
import type { Booking } from "@/lib/supabase/types";

type BookingRow = Booking & {
  courts: { name: string } | null;
  programs: { title: string } | null;
  coaches: { name: string } | null;
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
}

const STATUS_STYLE: Record<string, string> = {
  upcoming: "bg-white/15 text-white/70",
  "in progress": "bg-emerald-500/15 text-emerald",
  completed: "bg-white/10 text-white/50",
  cancelled: "bg-red-500/10 text-red-300",
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;

  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/sign-in?next=/bookings");

  // No .eq("player_id", ...) filter needed — bookings_own_select RLS (same
  // policy the /dashboard summary already relies on) already scopes every
  // row here to the caller.
  const { data, error } = await supabase
    .from("bookings")
    .select("*, courts(name), programs(title), coaches(name)")
    .order("starts_at", { ascending: false });
  if (error) throw error;

  const bookings = (data ?? []) as unknown as BookingRow[];
  const now = new Date();

  function statusOf(b: BookingRow) {
    if (b.status === "cancelled") return "cancelled";
    if (new Date(b.ends_at) < now) return "completed";
    if (new Date(b.starts_at) <= now) return "in progress";
    return "upcoming";
  }

  const upcoming = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.ends_at) >= now)
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const past = bookings.filter((b) => b.status === "cancelled" || new Date(b.ends_at) < now);

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1000px] px-5 pb-20 pt-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">My Bookings</h1>
            <p className="mt-1 text-[15px] text-white/60">Your full booking history.</p>
          </div>
          <AccentButton href="/court-booking">+ Book Session</AccentButton>
        </div>

        {errorMessage && (
          <>
            <ClearFlashParams params={["error"]} />
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[15px] text-red-300">{errorMessage}</p>
          </>
        )}

        <section className="mt-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Upcoming ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <GlassCard className="mt-3 flex items-center gap-3" delay={0}>
              <span className="flex size-9 items-center justify-center rounded-full bg-white/5 text-white/40">
                <IconCalendar width={16} height={16} />
              </span>
              <p className="text-[14px] text-white/55">Nothing on the calendar yet.</p>
            </GlassCard>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {upcoming.map((b, i) => {
                const status = statusOf(b);
                return (
                  <GlassCard key={b.id} className="flex flex-wrap items-center justify-between gap-4" delay={i * 40}>
                    <div className="flex items-center gap-3">
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                      >
                        <IconMapPin width={16} height={16} />
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold text-white">{b.programs?.title ?? "Session"}</p>
                        <p className="mt-0.5 text-[13px] text-white/55">
                          {formatDateTime(b.starts_at)} &middot; {b.courts?.name ?? "Court"}
                          {b.coaches ? ` · with ${b.coaches.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${STATUS_STYLE[status]}`}>
                        {status}
                      </span>
                      {status === "upcoming" && (
                        <form action={cancelBooking}>
                          <input type="hidden" name="booking_id" value={b.id} />
                          <button
                            type="submit"
                            className="text-[13px] font-semibold text-red-400 transition-colors hover:underline"
                          >
                            Cancel
                          </button>
                        </form>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/50">
            Past ({past.length})
          </h2>
          {past.length === 0 ? (
            <p className="mt-3 text-[14px] text-white/55">No past sessions yet.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {past.map((b, i) => {
                const status = statusOf(b);
                return (
                  <GlassCard key={b.id} className="flex flex-wrap items-center justify-between gap-4 opacity-75" delay={i * 40}>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/40">
                        <IconMapPin width={16} height={16} />
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold text-white/80">{b.programs?.title ?? "Session"}</p>
                        <p className="mt-0.5 text-[13px] text-white/50">
                          {formatDateTime(b.starts_at)} &middot; {b.courts?.name ?? "Court"}
                          {b.coaches ? ` · with ${b.coaches.name}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold capitalize ${STATUS_STYLE[status]}`}>
                      {status}
                    </span>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </PageTransition>
  );
}
