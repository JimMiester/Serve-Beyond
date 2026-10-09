"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/coach-applications";

export async function setCoachApproval(formData: FormData) {
  const profileId = String(formData.get("profile_id") ?? "");
  const approved = String(formData.get("approved") ?? "") === "true";

  const supabase = await createClient();
  // No admin check here beyond what RLS/the profiles_prevent_role_self_escalation
  // trigger already enforce: a non-admin session can never flip coach_approved,
  // regardless of which profile_id is submitted.
  const { error } = await supabase.from("profiles").update({ coach_approved: approved }).eq("id", profileId);

  if (error) {
    redirect(`${PATH}?error=${encodeURIComponent("Could not update that account — try again.")}`);
  }

  revalidatePath(PATH);
  // Approving/revoking changes who shows up in /admin/coaches' "fill from
  // an approved account" dropdown.
  revalidatePath("/admin/coaches");
}
