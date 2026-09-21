"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function cancelBooking(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");

  const supabase = await createClient();
  // No ownership check here beyond what RLS already guarantees: the
  // bookings_own_update policy means this update can only ever touch a row
  // where player_id = auth.uid(), regardless of which booking_id is submitted.
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) {
    redirect(`/account?error=${encodeURIComponent("Could not cancel that booking — try again.")}`);
  }

  revalidatePath("/account");
}
