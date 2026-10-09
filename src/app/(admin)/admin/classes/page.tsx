import PageTransition from "@/components/ui/PageTransition";
import Dropdown from "@/components/ui/Dropdown";
import { GlassCard } from "@/components/dashboard/glass";
import { createClient } from "@/lib/supabase/server";
import type { Coach, Program } from "@/lib/supabase/types";
import { assignClassCoach } from "./actions";

export default async function AdminClassesPage() {
  const supabase = await createClient();
  const [{ data: programsData, error: programsError }, { data: coachesData, error: coachesError }] = await Promise.all([
    supabase.from("programs").select("*").order("price_from"),
    supabase.from("coaches").select("*").eq("active", true).order("name"),
  ]);
  if (programsError) throw programsError;
  if (coachesError) throw coachesError;
  const programs = (programsData ?? []) as Program[];
  const coaches = (coachesData ?? []) as Coach[];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Classes</h1>
        <p className="mt-1 text-[15px] text-white/60">Assign which coach handles each class. New bookings for a class pick up its coach automatically.</p>

        <GlassCard className="mt-8" delay={0}>
          <ul className="divide-y divide-white/8">
            {programs.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-white">{p.title}</p>
                  <p className="mt-0.5 text-[13px] text-white/50">
                    ₱{p.price_from.toLocaleString()} / {p.price_unit} · up to {p.capacity} {p.capacity === 1 ? "player" : "players"}
                  </p>
                </div>
                <form action={assignClassCoach} className="flex items-center gap-3">
                  <input type="hidden" name="program_id" value={p.id} />
                  <Dropdown
                    name="coach_id"
                    defaultValue={p.coach_id ?? ""}
                    className="w-56"
                    options={[{ value: "", label: "Unassigned" }, ...coaches.map((c) => ({ value: c.id, label: c.name }))]}
                  />
                  <button
                    type="submit"
                    className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/5"
                  >
                    Save
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </GlassCard>
      </main>
    </PageTransition>
  );
}
