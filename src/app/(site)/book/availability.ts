import { site } from "@/content/site";
import type { Booking } from "@/lib/supabase/types";

const SLOT_MINUTES = 60;

/** The academy's one venue is in Metro Manila; a fixed UTC+8 offset is
 * baked in rather than threading timezone plumbing through for a single
 * market — see PRODUCT.md's Philippines-only operating context. */
const TZ_OFFSET = "+08:00";

/** Every weekday maps to one of site.hours' rows — the same data /courts
 * displays, so the booking engine can never again offer hours the facility
 * doesn't actually keep (it used to: every day ran 06:00–22:00 here while
 * /courts advertised shorter weekend hours). `date` is a local calendar
 * date ("YYYY-MM-DD"); Date.UTC + getUTCDay() reads its weekday without
 * depending on the server's own timezone. */
function hoursForDate(date: string): { openHour: number; closeHour: number } {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const row = site.hours.find((h) => h.dow.includes(dow));
  return row ?? { openHour: 6, closeHour: 22 };
}

export type Slot = {
  startsAt: string; // ISO instant
  endsAt: string; // ISO instant
  label: string; // "6:00 AM"
};

/**
 * Every hourly slot for the given local date ("YYYY-MM-DD") that the
 * selected programme can still be booked into. Pure function, no I/O — the
 * caller fetches courtBookings/ownBookingsElsewhere from Supabase and
 * passes them in.
 *
 * `courtBookings` are this court's existing confirmed bookings, carrying
 * their own program_id — multiple players can share a slot up to
 * `capacity`, but only if they're all in the *same* programme (Group
 * Clinics and Private Coaching, say, can't occupy the same court at once).
 * `ownBookingsElsewhere` are the current player's own confirmed bookings
 * (any court) — those block a slot outright regardless of capacity, since
 * a player can't be in two sessions at once no matter how much room is
 * left in either one.
 */
export function computeAvailableSlots(
  date: string,
  courtBookings: Pick<Booking, "starts_at" | "ends_at" | "program_id">[],
  ownBookingsElsewhere: Pick<Booking, "starts_at" | "ends_at">[],
  selectedProgramId: string,
  capacity: number,
): Slot[] {
  const slots: Slot[] = [];
  const { openHour, closeHour } = hoursForDate(date);

  for (let hour = openHour; hour < closeHour; hour++) {
    const startsAt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00${TZ_OFFSET}`);
    const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60_000);

    // Already started (today's earlier hours) — naturally a no-op for any
    // future date, since every slot on it is already after now.
    if (startsAt.getTime() <= Date.now()) continue;

    const overlapsRange = (b: { starts_at: string; ends_at: string }) => {
      const bStart = new Date(b.starts_at).getTime();
      const bEnd = new Date(b.ends_at).getTime();
      return startsAt.getTime() < bEnd && endsAt.getTime() > bStart;
    };

    if (ownBookingsElsewhere.some(overlapsRange)) continue;

    const overlappingHere = courtBookings.filter(overlapsRange);
    const blockedByOtherProgramme = overlappingHere.some((b) => b.program_id !== selectedProgramId);
    const sameProgrammeCount = overlappingHere.filter((b) => b.program_id === selectedProgramId).length;

    if (!blockedByOtherProgramme && sameProgrammeCount < capacity) {
      slots.push({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        label: startsAt.toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Manila",
        }),
      });
    }
  }

  return slots;
}
