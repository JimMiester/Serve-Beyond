import { createClient, getAuthUser } from "@/lib/supabase/server";
import { computeAvailableSlots } from "./availability";
import type { Booking, Court, Program } from "@/lib/supabase/types";

export type BookSearchParams = { court?: string; date?: string; program?: string; slot?: string };

/** Players can book up to 3 months out — wide enough that a flat list of
 * every valid day doesn't scale (see DatePicker, which takes this min/max
 * pair and renders an actual calendar grid instead).
 * Date.UTC normalizes month overflow itself (e.g. month 11 (Dec) + 3
 * correctly rolls into next year), so plain arithmetic on the month
 * component is enough — no date library needed. */
function addMonthsISO(todayISO: string, months: number) {
  const [y, m, d] = todayISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10);
}

/** Split out from page.tsx so the page's own shell can render immediately
 * behind a Suspense boundary while these Supabase round trips and slot
 * math run — see the comment on BookingContent's <Suspense> in page.tsx. */
export async function getBookingData(searchParams: Promise<BookSearchParams>) {
  const { court, date, program, slot } = await searchParams;

  const supabase = await createClient();
  const user = await getAuthUser();

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
  const maxDate = addMonthsISO(today, 3);
  // Format-valid but out-of-range dates (a tampered or stale ?date=) clamp
  // into the real booking window rather than being passed straight to the
  // slot math, which would just quietly return an empty day.
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "")
    ? date! < today
      ? today
      : date! > maxDate
        ? maxDate
        : date!
    : today;
  const selectedProgram = program ?? programs[0]?.id ?? "";

  const capacity = programs.find((p) => p.id === selectedProgram)?.capacity ?? 1;

  let slots: ReturnType<typeof computeAvailableSlots> = [];
  if (selectedCourt) {
    const dayStart = `${selectedDate}T00:00:00+08:00`;
    const dayEnd = `${selectedDate}T23:59:59+08:00`;
    // booking_slots (not the bookings table directly): bookings_own_read's
    // RLS only lets this query see the signed-in player's own rows, which
    // is useless here — this needs every player's bookings on this court
    // to compute real availability. The view exposes just the columns
    // availability math needs, never player_id, so it's safe to read
    // regardless of whose session this is. See 0014's migration comment.
    const { data: existing, error: existingError } = await supabase
      .from("booking_slots")
      .select("starts_at, ends_at, program_id")
      .eq("court_id", selectedCourt)
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd);
    if (existingError) throw existingError;

    // A player can't be on two courts at once, so times they've already
    // booked for themselves elsewhere that day are blocked out too, not
    // just this court's own bookings.
    let ownElsewhere: Pick<Booking, "starts_at" | "ends_at">[] = [];
    if (user) {
      const { data: own, error: ownError } = await supabase
        .from("bookings")
        .select("starts_at, ends_at")
        .eq("player_id", user.id)
        .eq("status", "confirmed")
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd);
      if (ownError) throw ownError;
      ownElsewhere = (own ?? []) as Pick<Booking, "starts_at" | "ends_at">[];
    }

    slots = computeAvailableSlots(
      selectedDate,
      (existing ?? []) as Pick<Booking, "starts_at" | "ends_at" | "program_id">[],
      ownElsewhere,
      selectedProgram,
      capacity,
    );
  }

  // A slot the player picked but hasn't confirmed yet — re-derived from the
  // still-current `slots` list rather than trusted as-is, so a stale or
  // tampered ?slot= from an old page load can't select something that's no
  // longer actually open.
  const selectedSlot = slots.find((s) => s.startsAt === slot) ?? null;

  return {
    user,
    courts,
    programs,
    selectedCourt,
    selectedDate,
    selectedProgram,
    slots,
    selectedSlot,
    minDate: today,
    maxDate,
  };
}
