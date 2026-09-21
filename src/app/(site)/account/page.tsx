import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "./actions";
import type { Booking, Court, Program, Membership } from "@/lib/supabase/types";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/account");
  }

  const [
    { data: bookingsData, error: bookingsError },
    { data: courtsData, error: courtsError },
    { data: programsData, error: programsError },
    { data: membershipData, error: membershipError },
  ] = await Promise.all([
    supabase.from("bookings").select("*").eq("status", "confirmed").order("starts_at"),
    supabase.from("courts").select("*"),
    supabase.from("programs").select("*"),
    supabase.from("memberships").select("*").eq("player_id", user.id).maybeSingle(),
  ]);
  if (bookingsError) throw bookingsError;
  if (courtsError) throw courtsError;
  if (programsError) throw programsError;
  if (membershipError) throw membershipError;

  const bookings = (bookingsData ?? []) as Booking[];
  const courts = (courtsData ?? []) as Court[];
  const programs = (programsData ?? []) as Program[];
  const membership = membershipData as Membership | null;

  const courtName = (id: string) => courts.find((c) => c.id === id)?.name ?? "Court";
  const programTitle = (id: string) => programs.find((p) => p.id === id)?.title ?? "Session";

  return (
    <main id="main" className="mx-auto max-w-[800px] px-5 pb-20 pt-[110px] sm:px-8">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] text-navy">Your account</h1>
      <p className="mt-2 text-[15px] text-navy/65">{user.email}</p>

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-700">{errorMessage}</p>
      )}

      <section className="mt-10">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">Membership</h2>
        {membership ? (
          <p className="mt-3 text-[15px] text-navy/80">
            {membership.status} · {membership.hours_remaining} hours remaining
          </p>
        ) : (
          <p className="mt-3 text-[15px] text-navy/60">No active membership.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">Upcoming bookings</h2>
        {bookings.length === 0 ? (
          <p className="mt-3 text-[15px] text-navy/60">
            Nothing booked yet.{" "}
            <a href="/book" className="font-semibold text-emerald-700">
              Book a court
            </a>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-4 rounded-xl border border-navy/10 px-5 py-4">
                <div>
                  <p className="text-[15px] font-semibold text-navy">
                    {courtName(b.court_id)} · {programTitle(b.program_id)}
                  </p>
                  <p className="text-[14px] text-navy/60">
                    {new Date(b.starts_at).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Manila",
                    })}
                  </p>
                </div>
                <form action={cancelBooking}>
                  <input type="hidden" name="booking_id" value={b.id} />
                  <button type="submit" className="text-[14px] font-semibold text-red-700 hover:underline">
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
