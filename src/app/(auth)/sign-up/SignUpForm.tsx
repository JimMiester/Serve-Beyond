"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { signUp } from "@/lib/supabase/auth-actions";

type Errors = Partial<Record<"full_name" | "email" | "phone" | "password" | "confirm_password", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function SignUpForm({ initialEmail, error }: { initialEmail: string; error?: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"player" | "coach">("player");
  const [errors, setErrors] = useState<Errors>({});

  function validate(): Errors {
    const next: Errors = {};
    if (!fullName.trim()) next.full_name = "Enter your full name.";
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (!phone.trim()) next.phone = "Enter a phone number.";
    if (!PASSWORD_RE.test(password)) {
      next.password = "At least 8 characters, with one letter and one number.";
    }
    if (confirmPassword !== password) next.confirm_password = "Passwords don't match.";
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      e.preventDefault();
    }
  }

  return (
    <form action={signUp} onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
      <fieldset>
        <legend className="block text-[13px] font-medium text-navy/70">I&rsquo;m signing up as</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <label className="has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-700 flex cursor-pointer items-center justify-center rounded-xl border border-navy/15 px-4 py-3 text-[15px] font-medium text-navy/70 transition-colors">
            <input
              type="radio"
              name="intended_role"
              value="player"
              checked={role === "player"}
              onChange={() => setRole("player")}
              className="sr-only"
            />
            Player
          </label>
          <label className="has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-700 flex cursor-pointer items-center justify-center rounded-xl border border-navy/15 px-4 py-3 text-[15px] font-medium text-navy/70 transition-colors">
            <input
              type="radio"
              name="intended_role"
              value="coach"
              checked={role === "coach"}
              onChange={() => setRole("coach")}
              className="sr-only"
            />
            Coach
          </label>
        </div>
        <p className="mt-1.5 text-[13px] text-navy/50">
          Signing up as a coach only flags interest. Listing is at the academy&rsquo;s discretion after review — it
          does not happen automatically.
        </p>
      </fieldset>

      <label className="block">
        <span className="block text-[13px] font-medium text-navy/70">Full name</span>
        <input
          type="text"
          name="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
        />
        {errors.full_name && (
          <p role="alert" aria-live="polite" className="mt-1 text-[13px] text-red-700">
            {errors.full_name}
          </p>
        )}
      </label>

      <label className="block">
        <span className="block text-[13px] font-medium text-navy/70">Email</span>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
        />
        {errors.email && (
          <p role="alert" aria-live="polite" className="mt-1 text-[13px] text-red-700">
            {errors.email}
          </p>
        )}
      </label>

      <label className="block">
        <span className="block text-[13px] font-medium text-navy/70">Phone number</span>
        <input
          type="tel"
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
        />
        {errors.phone && (
          <p role="alert" aria-live="polite" className="mt-1 text-[13px] text-red-700">
            {errors.phone}
          </p>
        )}
      </label>

      <label className="block">
        <span className="block text-[13px] font-medium text-navy/70">Password</span>
        <input
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
        />
        {errors.password && (
          <p role="alert" aria-live="polite" className="mt-1 text-[13px] text-red-700">
            {errors.password}
          </p>
        )}
      </label>

      <label className="block">
        <span className="block text-[13px] font-medium text-navy/70">Confirm password</span>
        <input
          type="password"
          name="confirm_password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
        />
        {errors.confirm_password && (
          <p role="alert" aria-live="polite" className="mt-1 text-[13px] text-red-700">
            {errors.confirm_password}
          </p>
        )}
      </label>

      {error && (
        <p role="alert" aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {error}
        </p>
      )}

      <Button className="w-full">Create account</Button>
    </form>
  );
}
