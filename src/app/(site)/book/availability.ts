import type { Booking } from "@/lib/supabase/types";

/**
 * Academy hours, matching src/content/site.ts's stated 06:00–22:00 window.
 * A single fixed window every day, not a per-weekday schedule table — there
 * is no admin UI to edit such a table anyway (spec decision 6), so encoding
 * one would be unused flexibility.
 */
const OPEN_HOUR = 6;
const CLOSE_HOUR = 22;
const SLOT_MINUTES = 60;

/** The academy's one venue is in Metro Manila; a fixed UTC+8 offset is
 * baked in rather than threading timezone plumbing through for a single
 * market — see PRODUCT.md's Philippines-only operating context. */
const TZ_OFFSET = "+08:00";

export type Slot = {
  startsAt: string; // ISO instant
  endsAt: string; // ISO instant
  label: string; // "6:00 AM"
};

/**
 * Every hourly slot for the given local date ("YYYY-MM-DD") that does not
 * overlap any of `existingBookings`. Pure function, no I/O — the caller
 * fetches existingBookings from Supabase and passes them in.
 */
export function computeAvailableSlots(
  date: string,
  existingBookings: Pick<Booking, "starts_at" | "ends_at">[],
): Slot[] {
  const slots: Slot[] = [];

  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const startsAt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00${TZ_OFFSET}`);
    const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60_000);

    const overlaps = existingBookings.some((b) => {
      const bStart = new Date(b.starts_at).getTime();
      const bEnd = new Date(b.ends_at).getTime();
      return startsAt.getTime() < bEnd && endsAt.getTime() > bStart;
    });

    if (!overlaps) {
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
