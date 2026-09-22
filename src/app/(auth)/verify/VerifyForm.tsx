"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/auth/OtpInput";
import { verifyOtp, resendOtp } from "@/lib/supabase/auth-actions";

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending}>
      {pending ? "Verifying…" : "Verify"}
    </Button>
  );
}

export default function VerifyForm({
  email,
  error,
  sent,
}: {
  email: string;
  error?: string;
  sent: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(sent ? 60 : 0);
  const blocked = attempts >= 5;

  // Bumping `attempts` off a prop change (a new ?error= after each failed
  // redirect) is state derived from render, not a side effect — done here
  // during render (React's documented pattern for this) rather than in a
  // useEffect, which would cost an extra render pass for the same update.
  const [prevError, setPrevError] = useState(error);
  if (error !== prevError) {
    setPrevError(error);
    if (error) setAttempts((n) => n + 1);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  return (
    <>
      <form ref={formRef} action={verifyOtp} className="mt-8 space-y-4">
        <input type="hidden" name="email" value={email} />
        <OtpInput formRef={formRef} disabled={blocked} />

        {error && (
          <p role="alert" aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </p>
        )}
        {blocked && (
          <p role="alert" aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
            Too many attempts. Request a new code to continue.
          </p>
        )}

        <VerifyButton />
      </form>

      <form action={resendOtp} className="mt-4">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={cooldown > 0}
          onClick={() => setAttempts(0)}
          className="w-full text-center text-[14px] font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:text-navy/40"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </form>
    </>
  );
}
