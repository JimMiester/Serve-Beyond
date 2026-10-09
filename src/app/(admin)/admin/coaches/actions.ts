"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/coaches";

async function uploadPhoto(supabase: Awaited<ReturnType<typeof createClient>>, formData: FormData): Promise<string | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `coaches/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("public-media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

function fieldsFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    role: String(formData.get("role") ?? ""),
    cert: String(formData.get("cert") ?? "") || null,
    years: formData.get("years") ? Number(formData.get("years")) : null,
    focus: String(formData.get("focus") ?? "") || null,
    active: formData.get("active") === "on",
  };
}

function revalidatePublicPages() {
  revalidatePath(PATH);
  revalidatePath("/coaching");
  revalidatePath("/");
  revalidatePath("/admin/coach-applications");
}

export async function createCoach(formData: FormData) {
  const supabase = await createClient();

  let photoPath: string | null = null;
  try {
    photoPath = await uploadPhoto(supabase, formData);
  } catch {
    redirect(`${PATH}?error=${encodeURIComponent("Could not upload that photo — try again.")}`);
  }

  const profileId = String(formData.get("profile_id") ?? "") || null;

  const { error } = await supabase
    .from("coaches")
    .insert({ ...fieldsFromForm(formData), photo_path: photoPath, profile_id: profileId });
  if (error) {
    redirect(`${PATH}?error=${encodeURIComponent("Could not add that coach — try again.")}`);
  }

  revalidatePublicPages();
}

export async function deleteCoach(formData: FormData) {
  const coachId = String(formData.get("coach_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("coaches").delete().eq("id", coachId);
  if (error) {
    // 23503 = foreign_key_violation: bookings.coach_id references this row
    // with no cascade, so a coach with any booking history can't be
    // deleted outright — deactivating (the existing toggle) is the path
    // for removing them from the public site instead.
    const message =
      error.code === "23503"
        ? "Can't delete — this coach has existing bookings. Deactivate them instead."
        : "Could not delete that coach — try again.";
    redirect(`${PATH}?error=${encodeURIComponent(message)}`);
  }

  revalidatePublicPages();
}

export async function updateCoach(formData: FormData) {
  const coachId = String(formData.get("coach_id") ?? "");
  const supabase = await createClient();

  const update: Record<string, unknown> = fieldsFromForm(formData);
  try {
    const photoPath = await uploadPhoto(supabase, formData);
    if (photoPath) update.photo_path = photoPath;
  } catch {
    redirect(`${PATH}?error=${encodeURIComponent("Could not upload that photo — try again.")}`);
  }

  const { error } = await supabase.from("coaches").update(update).eq("id", coachId);
  if (error) {
    redirect(`${PATH}?error=${encodeURIComponent("Could not update that coach — try again.")}`);
  }

  revalidatePublicPages();
}
