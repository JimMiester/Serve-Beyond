import { redirect } from "next/navigation";
import Image from "next/image";
import PageTransition from "@/components/ui/PageTransition";
import Skeleton from "@/components/ui/Skeleton";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { GlassCard, AccentButton } from "@/components/dashboard/glass";
import { IconUsers } from "@/components/dashboard/icons";
import type { Booking, Coach } from "@/lib/supabase/types";

export default async function CoachesPage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) redirect("/sign-in?next=/coaches");

  // Same RLS scoping as /bookings and the /dashboard summary: this only
  // ever returns the caller's own rows.
  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select("coach_id, starts_at, status")
    .not("coach_id", "is", null);
  if (bookingsError) throw bookingsError;
  const bookings = (bookingsData ?? []) as Pick<Booking, "coach_id" | "starts_at" | "status">[];

  const coachIds = [...new Set(bookings.map((b) => b.coach_id).filter((id): id is string => id !== null))];

  let coaches: Coach[] = [];
  if (coachIds.length > 0) {
    const { data: coachesData, error: coachesError } = await supabase.from("coaches").select("*").in("id", coachIds);
    if (coachesError) throw coachesError;
    coaches = (coachesData ?? []) as Coach[];
  }

  const sessionsByCoach = new Map<string, { count: number; lastSession: string }>();
  for (const b of bookings) {
    if (!b.coach_id) continue;
    const existing = sessionsByCoach.get(b.coach_id);
    const count = (existing?.count ?? 0) + 1;
    const lastSession = existing && existing.lastSession > b.starts_at ? existing.lastSession : b.starts_at;
    sessionsByCoach.set(b.coach_id, { count, lastSession });
  }

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1000px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Coaches</h1>
        <p className="mt-1 text-[15px] text-white/60">The team you&rsquo;ve booked a session with.</p>

        {coaches.length === 0 ? (
          <GlassCard className="mt-8 flex flex-col items-center gap-4 py-14 text-center" delay={0}>
            <span
              className="flex size-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <IconUsers width={24} height={24} />
            </span>
            <h2 className="font-display text-[20px] font-bold text-white">No coaches yet</h2>
            <p className="max-w-sm text-[15px] text-white/60">
              Book a coached session and the coach you trained with will show up here.
            </p>
            <AccentButton href="/court-booking">Book a Session</AccentButton>
          </GlassCard>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((c, i) => {
              const image = getPublicImageUrl(c.photo_path);
              const stats = sessionsByCoach.get(c.id);
              return (
                <GlassCard key={c.id} className="p-0 overflow-hidden" delay={i * 60}>
                  <div className="relative aspect-[4/3] bg-white/5">
                    {image ? (
                      <Image src={image} alt={c.name} fill sizes="(min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw" className="object-cover" />
                    ) : (
                      <Skeleton className="absolute inset-0" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-[18px] font-bold text-white">{c.name}</h3>
                      {c.years != null && <span className="shrink-0 text-[12px] text-white/50">{c.years} yrs</span>}
                    </div>
                    <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--accent)" }}>
                      {c.cert ? `${c.role}, ${c.cert}` : c.role}
                    </p>
                    {c.focus && <p className="mt-2 text-[14px] text-white/60">{c.focus}</p>}
                    {stats && (
                      <p className="mt-3 border-t border-white/10 pt-3 text-[13px] text-white/50">
                        {stats.count} {stats.count === 1 ? "session" : "sessions"} together
                      </p>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </main>
    </PageTransition>
  );
}
