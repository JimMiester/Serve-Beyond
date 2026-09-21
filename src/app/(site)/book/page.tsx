import Button from "@/components/ui/Button";
import PageTransition from "@/components/ui/PageTransition";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots } from "./availability";
import { createBooking } from "./actions";
import type { Booking, Court, Program } from "@/lib/supabase/types";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string; date?: string; program?: string; error?: string; booked?: string }>;
}) {
  const { court, date, program, error, booked } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: courtsData, error: courtsError },
    { data: programsData, error: programsError },
  ] = await Promise.all([
    supabase.from("courts").select("*").eq("active", true).order("name"),
    supabase.from("programs").select("*").order("price_from"),
  ]);
  if (courtsError) throw courtsError;
  if (programsError) throw programsError;
  const courts = (courtsData ?? []) as Court[];
  const programs = (programsData ?? []) as Program[];

  const selectedCourt = court ?? courts[0]?.id ?? "";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date! : today;
  const selectedProgram = program ?? programs[0]?.id ?? "";

  let slots: ReturnType<typeof computeAvailableSlots> = [];
  if (selectedCourt) {
    const dayStart = `${selectedDate}T00:00:00+08:00`;
    const dayEnd = `${selectedDate}T23:59:59+08:00`;
    const { data: existing, error: existingError } = await supabase
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("court_id", selectedCourt)
      .eq("status", "confirmed")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd);
    if (existingError) throw existingError;

    slots = computeAvailableSlots(selectedDate, (existing ?? []) as Pick<Booking, "starts_at" | "ends_at">[]);
  }

  return (
    <PageTransition>
      <main id="main" className="mx-auto max-w-[1000px] px-5 pb-20 pt-[110px] sm:px-8">
        <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] text-navy">Book a court</h1>

        {booked && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-[15px] text-emerald-800">
            Booked. See it on your{" "}
            <a href="/account" className="font-semibold underline">
              account page
            </a>
            .
          </p>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-700">{error}</p>}

        <form method="get" className="mt-8 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="block text-[13px] font-medium text-navy/70">Court</span>
            <select
              name="court"
              defaultValue={selectedCourt}
              className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
            >
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[13px] font-medium text-navy/70">Date</span>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
            />
          </label>
          <label className="block">
            <span className="block text-[13px] font-medium text-navy/70">Programme</span>
            <select
              name="program"
              defaultValue={selectedProgram}
              className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <Button size="sm" variant="outline" className="sm:col-span-3">
            Check availability
          </Button>
        </form>

        <h2 className="mt-10 text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">
          Available times, {selectedDate}
        </h2>

        {slots.length === 0 ? (
          <p className="mt-4 text-[15px] text-navy/60">No open slots this day. Try another date.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {slots.map((slot) => (
              <li key={slot.startsAt}>
                <form action={createBooking}>
                  <input type="hidden" name="court_id" value={selectedCourt} />
                  <input type="hidden" name="program_id" value={selectedProgram} />
                  <input type="hidden" name="date" value={selectedDate} />
                  <input type="hidden" name="starts_at" value={slot.startsAt} />
                  <input type="hidden" name="ends_at" value={slot.endsAt} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-navy/15 py-3 text-[14px] font-medium text-navy transition-colors hover:border-emerald-600 hover:bg-emerald-50"
                  >
                    {slot.label}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {!user && (
          <p className="mt-6 text-[14px] text-navy/60">
            Picking a time will ask you to{" "}
            <a href="/sign-in?next=/book" className="font-semibold text-emerald-700">
              sign in
            </a>
            .
          </p>
        )}
      </main>
    </PageTransition>
  );
}
