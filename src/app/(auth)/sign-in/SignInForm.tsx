"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/components/ui/Button";
import { signIn, coachSignIn } from "@/lib/supabase/auth-actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending}>
      {pending ? "Signing in…" : label}
    </Button>
  );
}

export default function SignInForm({ next, initialMode }: { next?: string; initialMode: "player" | "coach" }) {
  const [mode, setMode] = useState<"player" | "coach">(initialMode);

  return (
    <form action={mode === "coach" ? coachSignIn : signIn} className="mt-8 space-y-4">
      <fieldset>
        <legend className="block text-[13px] font-medium text-white/70">Sign in as</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <label className="has-checked:border-emerald-600 has-checked:bg-emerald-600 has-checked:text-white flex cursor-pointer items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-[15px] font-medium text-white/70 transition-colors">
            <input
              type="radio"
              name="mode"
              value="player"
              checked={mode === "player"}
              onChange={() => setMode("player")}
              className="sr-only"
            />
            Player
          </label>
          <label className="has-checked:border-emerald-600 has-checked:bg-emerald-600 has-checked:text-white flex cursor-pointer items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-[15px] font-medium text-white/70 transition-colors">
            <input
              type="radio"
              name="mode"
              value="coach"
              checked={mode === "coach"}
              onChange={() => setMode("coach")}
              className="sr-only"
            />
            Coach
          </label>
        </div>
      </fieldset>

      {mode === "player" && next && <input type="hidden" name="next" value={next} />}

      <label className="block">
        <span className="block text-[13px] font-medium text-white/70">Email</span>
        <input
          type="email"
          name="email"
          required
          className="mt-1.5 w-full rounded-xl border border-white/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald"
        />
      </label>
      <label className="block">
        <span className="block text-[13px] font-medium text-white/70">Password</span>
        <input
          type="password"
          name="password"
          required
          className="mt-1.5 w-full rounded-xl border border-white/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald"
        />
      </label>
      <SubmitButton label={mode === "coach" ? "Sign in as coach" : "Sign in as Player"} />
    </form>
  );
}
