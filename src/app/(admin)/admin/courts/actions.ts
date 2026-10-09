"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PATH = "/admin/courts";

async function uploadPhoto(supabase: Awaited<ReturnType<typeof createClient>>, formData: FormData): Promise<string | null> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `courts/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("public-media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

function fieldsFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "") || null,
    active: formData.get("active") === "on",
  };
}

function revalidatePublicPages() {
  revalidatePath(PATH);
  revalidatePath("/courts");
  revalidatePath("/book");
  revalidatePath("/");
}

export async function createCourt(formData: FormData) {
  const supabase = await createClient();

  let photoPath: string | null = null;
  try {
    photoPath = await uploadPhoto(supabase, formData);
  } catch {
    redirect(`${PATH}?error=${encodeURIComponent("Could not upload that photo — try again.")}`);
  }

  // The UI never asks for a venue — this project is one location today
  // (see venues table comment in 0001_init.sql) — so a new court is
  // attached to whichever venue already exists.
  const { data: venue, error: venueError } = await supabase.from("venues").select("id").limit(1).maybeSingle();
  if (venueError || !venue) {
    redirect(`${PATH}?error=${encodeURIComponent("Could not add that court — no venue found.")}`);
  }

  const { error } = await supabase
    .from("courts")
    .insert({ ...fieldsFromForm(formData), photo_path: photoPath, venue_id: venue.id });
  if (error) {
    redirect(`${PATH}?error=${encodeURIComponent("Could not add that court — try again.")}`);
  }

  revalidatePublicPages();
}

export async function deleteCourt(formData: FormData) {
  const courtId = String(formData.get("court_id") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.from("courts").delete().eq("id", courtId);
  if (error) {
    // 23503 = foreign_key_violation: bookings.court_id references this row
    // with no cascade, so a court with any booking history can't be
    // deleted outright — deactivating is the path for removing it from
    // the public site instead.
    const message =
      error.code === "23503"
        ? "Can't delete — this court has existing bookings. Deactivate it instead."
        : "Could not delete that court — try again.";
    redirect(`${PATH}?error=${encodeURIComponent(message)}`);
  }

  revalidatePublicPages();
}

export async function updateCourt(formData: FormData) {
  const courtId = String(formData.get("court_id") ?? "");
  const supabase = await createClient();

  const update: Record<string, unknown> = fieldsFromForm(formData);
  try {
    const photoPath = await uploadPhoto(supabase, formData);
    if (photoPath) update.photo_path = photoPath;
  } catch {
    redirect(`${PATH}?error=${encodeURIComponent("Could not upload that photo — try again.")}`);
  }

  const { error } = await supabase.from("courts").update(update).eq("id", courtId);
  if (error) {
    redirect(`${PATH}?error=${encodeURIComponent("Could not update that court — try again.")}`);
  }

  revalidatePublicPages();
}
