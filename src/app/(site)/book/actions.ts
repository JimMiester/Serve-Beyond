"use server";

import { redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { computeAvailableSlots } from "./availability";
import { sendBookingConfirmationEmail } from "@/lib/email";

/** Shared by the public /book flow and the dashboard's /court-booking (via
 * .bind(null, "/court-booking") — Next's documented way to parametrize a
 * Server Action bound to a <form>) so a booking made from either surface
 * redirects back to *that* surface instead of always landing on /book. */
export async function createBookingAt(basePath: string, formData: FormData) {
  const courtId = String(formData.get("court_id") ?? "");
  const programId = String(formData.get("program_id") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const date = String(formData.get("date") ?? "");

  const supabase = await createClient();
  const user = await getAuthUser();

  const params = new URLSearchParams({ court: courtId, date, program: programId });

  if (!user) {
    // Carries the slot too, unlike every other redirect below — this is
    // the one case where it was genuinely valid and just needs the player
    // signed in before resubmitting, not a failure that invalidated it.
    const withSlot = new URLSearchParams(params);
    withSlot.set("slot", startsAt);
    redirect(`/sign-in?next=${encodeURIComponent(`${basePath}?${withSlot.toString()}`)}`);
  }

  const { data: profile } = await supabase.from("profiles").select("role, intended_role").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin") {
    redirect(`${basePath}?${params.toString()}&error=${encodeURIComponent("Admin accounts can't book sessions — sign in with a player account instead.")}`);
  }
  if (profile?.intended_role === "coach") {
    redirect(`${basePath}?${params.toString()}&error=${encodeURIComponent("Coach accounts can't book sessions — sign in with a player account instead.")}`);
  }

  const dayStart = `${date}T00:00:00+08:00`;
  const dayEnd = `${date}T23:59:59+08:00`;
  const [{ data: existing }, { data: ownElsewhere }, { data: programRow }] = await Promise.all([
    // booking_slots, not bookings — see the matching comment in book/data.ts.
    supabase
      .from("booking_slots")
      .select("starts_at, ends_at, program_id")
      .eq("court_id", courtId)
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd),
    supabase
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("player_id", user.id)
      .eq("status", "confirmed")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd),
    supabase.from("programs").select("capacity, coach_id").eq("id", programId).maybeSingle(),
  ]);

  const validSlots = computeAvailableSlots(date, existing ?? [], ownElsewhere ?? [], programId, programRow?.capacity ?? 1);
  const isValidSlot = validSlots.some((s) => s.startsAt === startsAt && s.endsAt === endsAt);

  if (!isValidSlot) {
    redirect(`${basePath}?${params.toString()}&error=${encodeURIComponent("That slot is no longer valid — pick another.")}`);
  }

  const { data: inserted, error } = await supabase
    .from("bookings")
    .insert({
      court_id: courtId,
      program_id: programId,
      player_id: user.id,
      // Whichever coach the admin assigned to this class, if any — see
      // /admin/classes. Lets the coach's own /coach/schedule find this
      // booking without the player ever picking a coach themselves.
      coach_id: programRow?.coach_id ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
    })
    .select("*, courts(name), programs(title)")
    .single();

  if (error) {
    // 23P01 = exclusion_violation: the no_double_booking constraint fired,
    // meaning the slot was taken between this page loading and submitting.
    const message = error.code === "23P01" ? "That slot was just taken — pick another." : "Something went wrong — try again.";
    redirect(`${basePath}?${params.toString()}&error=${encodeURIComponent(message)}`);
  }

  if (user.email) {
    await sendBookingConfirmationEmail({
      to: user.email,
      courtName: inserted.courts?.name ?? "Court",
      programTitle: inserted.programs?.title ?? "Session",
      date,
      timeLabel: new Date(startsAt).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" }),
    });
  }

  redirect(`${basePath}?${params.toString()}&booked=1`);
}

export async function createBooking(formData: FormData) {
  return createBookingAt("/book", formData);
}
