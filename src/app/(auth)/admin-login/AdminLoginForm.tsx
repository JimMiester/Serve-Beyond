"use client";

import { useFormStatus } from "react-dom";
import { adminSignIn } from "@/lib/supabase/auth-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-navy transition-[background-color,transform] duration-200 hover:bg-cream active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function AdminLoginForm() {
  return (
    <form action={adminSignIn} className="mt-8 space-y-4">
      <label className="block">
        <span className="block text-[13px] font-medium text-white/70">Email</span>
        <input
          type="email"
          name="email"
          required
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white outline-none focus-visible:border-sky"
        />
      </label>
      <label className="block">
        <span className="block text-[13px] font-medium text-white/70">Password</span>
        <input
          type="password"
          name="password"
          required
          className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white outline-none focus-visible:border-sky"
        />
      </label>
      <SubmitButton />
    </form>
  );
}
