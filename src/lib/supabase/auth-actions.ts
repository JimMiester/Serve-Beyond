"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slotPath } from "@/lib/dev-slot";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const rawRole = String(formData.get("intended_role") ?? "");
  const intendedRole = rawRole === "coach" ? "coach" : "player";

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone, intended_role: intendedRole } },
  });

  if (error) {
    redirect(await slotPath(`/sign-up?error=${encodeURIComponent(error.message)}`));
  }

  // The account exists immediately either way. A coach signup just starts
  // with coach_approved = false (set by handle_new_user()) until an admin
  // flips it — no separate application/account-creation step. A player
  // lands on the homepage rather than straight in the dashboard; a pending
  // coach still needs /coach-pending, that's not a dashboard to skip.
  redirect(await slotPath(intendedRole === "coach" ? `/coach-pending?email=${encodeURIComponent(email)}` : "/"));
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  // No explicit "next" (e.g. just clicking Nav's Sign In, not being sent
  // here to finish something like a booking) lands on the homepage rather
  // than jumping straight into the dashboard.
  const raw = String(formData.get("next") ?? "/");
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(await slotPath(`/sign-in?error=${encodeURIComponent(error.message)}`));
  }

  const { data: profile } = await supabase.from("profiles").select("role, intended_role").eq("id", data.user.id).maybeSingle();

  if (profile?.role === "admin") {
    await supabase.auth.signOut();
    redirect(await slotPath(`/sign-in?error=${encodeURIComponent("This is an admin account — sign in at /admin instead.")}`));
  }

  if (profile?.intended_role === "coach") {
    await supabase.auth.signOut();
    redirect(await slotPath(`/sign-in?error=${encodeURIComponent("This is a coach account — sign in using the Coach tab instead.")}`));
  }

  redirect(await slotPath(next));
}

export async function adminSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(await slotPath(`/admin-login?error=${encodeURIComponent(error.message)}`));
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    redirect(await slotPath(`/admin-login?error=${encodeURIComponent("This account does not have admin access.")}`));
  }

  redirect(await slotPath("/admin"));
}

export async function coachSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(await slotPath(`/sign-in?mode=coach&error=${encodeURIComponent(error.message)}`));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, intended_role, coach_approved")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role === "admin") {
    await supabase.auth.signOut();
    redirect(await slotPath(`/sign-in?mode=coach&error=${encodeURIComponent("This is an admin account — sign in at /admin instead.")}`));
  }

  if (profile?.intended_role !== "coach") {
    await supabase.auth.signOut();
    redirect(await slotPath(`/sign-in?mode=coach&error=${encodeURIComponent("This is a player account — sign in using the Player tab instead.")}`));
  }

  if (!profile?.coach_approved) {
    await supabase.auth.signOut();
    redirect(await slotPath(`/sign-in?mode=coach&error=${encodeURIComponent("This account is not an approved coach yet.")}`));
  }

  redirect(await slotPath("/"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(await slotPath("/"));
}
