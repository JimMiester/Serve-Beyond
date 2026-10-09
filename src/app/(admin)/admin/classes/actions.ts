"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function assignClassCoach(formData: FormData) {
  const programId = String(formData.get("program_id") ?? "");
  const coachId = String(formData.get("coach_id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase
    .from("programs")
    .update({ coach_id: coachId || null })
    .eq("id", programId);
  if (error) throw error;

  // Classes list itself, plus everywhere a coach's name might now show:
  // the coach's own schedule won't change page content here, but new
  // bookings from this point on will carry this assignment.
  revalidatePath("/admin/classes");
}
