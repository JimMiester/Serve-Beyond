"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots } from "./availability";

export async function createBooking(formData: FormData) {
  const courtId = String(formData.get("court_id") ?? "");
  const programId = String(formData.get("program_id") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const date = String(formData.get("date") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = new URLSearchParams({ court: courtId, date, program: programId });

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/book?${params.toString()}`)}`);
  }

  const dayStart = `${date}T00:00:00+08:00`;
  const dayEnd = `${date}T23:59:59+08:00`;
  const { data: existing } = await supabase
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("court_id", courtId)
    .eq("status", "confirmed")
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd);

  const validSlots = computeAvailableSlots(date, existing ?? []);
  const isValidSlot = validSlots.some((s) => s.startsAt === startsAt && s.endsAt === endsAt);

  if (!isValidSlot) {
    redirect(`/book?${params.toString()}&error=${encodeURIComponent("That slot is no longer valid — pick another.")}`);
  }

  const { error } = await supabase.from("bookings").insert({
    court_id: courtId,
    program_id: programId,
    player_id: user.id,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  if (error) {
    // 23P01 = exclusion_violation: the no_double_booking constraint fired,
    // meaning the slot was taken between this page loading and submitting.
    const message = error.code === "23P01" ? "That slot was just taken — pick another." : "Something went wrong — try again.";
    redirect(`/book?${params.toString()}&error=${encodeURIComponent(message)}`);
  }

  redirect(`/book?${params.toString()}&booked=1`);
}
