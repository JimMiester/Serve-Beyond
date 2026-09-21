"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const raw = String(formData.get("next") ?? "/account");
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const isUnconfirmed =
      error.code === "email_not_confirmed" || error.message.toLowerCase().includes("email not confirmed");
    if (isUnconfirmed) {
      redirect(`/verify?email=${encodeURIComponent(email)}`);
    }
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function verifyOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("token") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });

  if (error) {
    const message = mapOtpError(error);
    redirect(`/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent(message)}`);
  }

  redirect("/account");
}

export async function resendOtp(formData: FormData) {
  const email = String(formData.get("email") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });

  if (error) {
    redirect(`/verify?email=${encodeURIComponent(email)}&error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/verify?email=${encodeURIComponent(email)}&sent=1`);
}

function mapOtpError(error: { code?: string; message: string }): string {
  const code = error.code ?? "";
  const message = error.message.toLowerCase();

  if (code === "otp_expired" || message.includes("expired")) {
    return "That code has expired. Request a new one below.";
  }
  if (code === "over_request_rate_limit" || message.includes("rate limit") || message.includes("too many")) {
    return "Too many attempts. Wait a moment or request a new code.";
  }
  return "That code isn't right. Check it and try again.";
}
