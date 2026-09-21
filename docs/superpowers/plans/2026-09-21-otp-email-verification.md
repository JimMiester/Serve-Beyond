# OTP Email Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace password-only sign-up with a sign-up → email-OTP-verify flow using Supabase's built-in email OTP, gating `/account` and `/book` behind verification.

**Architecture:** Sign-up collects full name, email, phone, password, confirm password, and the existing Player/Coach toggle, then redirects to `/verify` instead of `/account`. `/verify` takes a 6-digit code and calls `supabase.auth.verifyOtp`. Profile creation moves from a trigger on `auth.users` INSERT to one on `auth.users` UPDATE, firing only when `email_confirmed_at` transitions from null to set — so an unverified user has no `profiles` row at all. `proxy.ts` gains a guard: a signed-in-but-unverified user hitting `/account` or `/book` is redirected to `/verify`.

**Tech Stack:** Next.js (App Router), Supabase Auth (`@supabase/ssr`), Tailwind CSS. No new dependencies.

**Spec:** docs/superpowers/specs/2026-09-21-otp-email-verification-design.md

## Global Constraints

- No separate OTP service — uses `supabase.auth.verifyOtp` / `.resend` exclusively.
- No custom SMTP code — that's a Supabase dashboard setting, documented as steps for the user, not app code.
- `/book`'s own booking logic (`computeAvailableSlots`, slot forms, hidden inputs) is not touched.
- Reuse the exact visual system already established today on `/sign-in`/`/sign-up`: `Card variant="elevated"`, the three ambient blurred blobs (emerald/sky/gold), the fixed circular back-to-home button, `font-display` headings — copy these blocks verbatim, don't redesign them.
- Route guards live in `proxy.ts` at the project root (this Next.js version deprecated `middleware.ts`; the project already renamed it once).
- Migration `0002_intended_role.sql` (written earlier, not yet applied to the live project) must run before `0003` — this plan's Task 1 depends on `0002`'s columns existing.
- OTP focus ring uses `focus-visible:border-sky` (not the emerald used on other inputs) per the brand mapping: sky for links/focus, gold as a small accent only.
- Neither the OTP code nor any part of it is ever logged, put in a URL, or exposed beyond the input fields' own DOM values.
- `full_name`/`phone`/`intended_role` all flow through `raw_user_meta_data` under exactly those three keys — Task 1's trigger and Task 2's `signUp` action must agree on these key names.

---

### Task 1: Migration — move profile creation to email confirmation

**Files:**
- Create: `supabase/migrations/0003_otp_signup.sql`

**Interfaces:**
- Consumes: `profiles` table and `intended_role`/`coach_approved` columns from `0002_intended_role.sql` (not yet applied to the live project, but already committed to this repo).
- Produces: nothing consumed by later tasks in-repo — this is a live-database change the user applies manually, same as `0002`. Task 2's `signUp` action must send metadata under the exact keys this migration reads: `full_name`, `phone`, `intended_role`.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0003_otp_signup.sql`:

```sql
-- Sign-up now requires email verification (a 6-digit OTP code, not a
-- link) before a profiles row is created. handle_new_user() previously
-- fired the instant an auth.users row was inserted; now it fires only
-- once that user's email is actually confirmed, so an unverified signup
-- has no profiles row at all. proxy.ts's route guard checks the auth
-- session's own email_confirmed_at for exactly this reason, never a
-- profiles lookup — the row may not exist yet.
drop trigger on_auth_user_created on auth.users;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, intended_role, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'intended_role', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_confirmed
  after update on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function handle_new_user();
```

- [ ] **Step 2: Verify the SQL reads correctly**

There is no live database connection in this environment (no service-role
key, no DB password) — this cannot be executed here. Read the file back
and confirm: the trigger being dropped (`on_auth_user_created`) matches
the name created in `0001_init.sql`; the `when` clause references
`old`/`new` correctly (valid only on `for each row` triggers, which this
is); the three `raw_user_meta_data ->> '...'` keys are `intended_role`,
`full_name`, `phone` — these exact strings, matching what Task 2's
`signUp` action will send.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0003_otp_signup.sql
git commit -m "feat(auth): migrate profile creation to email-confirmation trigger"
```

---

### Task 2: Server actions — signUp, signIn, verifyOtp, resendOtp

**Files:**
- Modify: `src/lib/supabase/auth-actions.ts`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (existing).
- Produces: `signUp(formData)` now reads `full_name`/`phone` in addition to `email`/`password`/`intended_role`, and redirects to `/verify?email=...` instead of `/account`. `signIn(formData)` unchanged in signature, gains an unconfirmed-email branch. New: `verifyOtp(formData)` (reads `email`, `token`; redirects to `/account` on success, `/verify?email=...&error=...` on failure). New: `resendOtp(formData)` (reads `email`; redirects to `/verify?email=...&sent=1` on success, `/verify?email=...&error=...` on failure). Task 4 (`VerifyForm.tsx`) imports `verifyOtp` and `resendOtp` by these exact names. Task 5 (`SignUpForm.tsx`) imports `signUp` unchanged in name.

- [ ] **Step 1: Replace the file's contents**

Replace the full contents of `src/lib/supabase/auth-actions.ts`:

```ts
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
```

Note the `redirect(next)` at the end of `signIn` and the trailing lines
after each `if (error) { redirect(...) }` block: `redirect()` throws
internally and exits the function immediately, so those lines only run
when there was no error — this is the same pattern the original file
already used before this change, not new behavior.

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean. This project has no unit test suite (`npm test` does not
exist) — build + lint is the verification gate throughout this codebase.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/auth-actions.ts
git commit -m "feat(auth): verifyOtp/resendOtp actions, signUp redirects to /verify"
```

---

### Task 3: OtpInput component

**Files:**
- Create: `src/components/auth/OtpInput.tsx`

**Interfaces:**
- Produces: `OtpInput` component — props `{ formRef: RefObject<HTMLFormElement | null>; disabled?: boolean }`. Renders a hidden `<input type="hidden" name="token">` holding the concatenated digits, so the parent `<form>` submits `token` automatically. Task 4 (`VerifyForm.tsx`) renders this inside a `<form>` and passes its own form ref.

- [ ] **Step 1: Write the component**

Create `src/components/auth/OtpInput.tsx`:

```tsx
"use client";

import { useRef, useState, type RefObject } from "react";

export default function OtpInput({
  formRef,
  disabled = false,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  disabled?: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, value: string) {
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    return next;
  }

  function handleChange(index: number, raw: string) {
    const value = raw.replace(/\D/g, "").slice(-1);
    const next = setDigit(index, value);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      formRef.current?.requestSubmit();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigit(index - 1, "");
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 6) - 1]?.focus();
    if (pasted.length === 6) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="6-digit verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1}`}
          className={`size-12 rounded-xl border border-navy/15 text-center text-[20px] font-semibold text-navy outline-none transition-colors focus-visible:border-sky disabled:cursor-not-allowed disabled:bg-navy/5 ${
            digit ? "border-b-2 border-b-gold" : ""
          }`}
        />
      ))}
      <input type="hidden" name="token" value={digits.join("")} />
    </div>
  );
}
```

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean. `OtpInput` isn't imported anywhere yet — this only proves it's
syntactically and type-correct in isolation. Task 4 proves it's used
correctly.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/OtpInput.tsx
git commit -m "feat(auth): OtpInput component"
```

---

### Task 4: `/verify` page

**Files:**
- Create: `src/app/(auth)/verify/page.tsx`
- Create: `src/app/(auth)/verify/VerifyForm.tsx`

**Interfaces:**
- Consumes: `verifyOtp`/`resendOtp` from `@/lib/supabase/auth-actions` (Task 2), `OtpInput` from `@/components/auth/OtpInput` (Task 3), `Card`/`Logo`/`Button` (existing).
- Produces: the `/verify` route. Task 6 (`proxy.ts`) redirects here with a `?email=` query param; Task 5's sign-up success also redirects here.

- [ ] **Step 1: Write the page shell**

Create `src/app/(auth)/verify/page.tsx`:

```tsx
import Link from "next/link";
import Logo from "@/components/Logo";
import Card from "@/components/ui/Card";
import VerifyForm from "./VerifyForm";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const { email, error, sent } = await searchParams;
  const safeEmail = email ?? "";

  return (
    <main id="main" className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-5">
      <Link
        href="/"
        aria-label="Back to homepage"
        className="group fixed left-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-navy/8 bg-white text-navy shadow-[0_12px_30px_-14px_rgba(15,36,48,0.35)] transition-colors hover:text-emerald-700 sm:left-8 sm:top-8"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          <path d="M15 9H3" />
          <path d="m7.5 4.5-4.5 4.5 4.5 4.5" />
        </svg>
      </Link>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-[8%] size-72 rounded-full bg-emerald/25 blur-3xl sm:size-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-[10%] size-80 rounded-full bg-sky/20 blur-3xl sm:size-[28rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10%] size-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl sm:size-96"
      />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mx-auto mb-10 block w-fit">
          <Logo variant="dark" className="h-10 w-auto" />
        </Link>

        <Card variant="elevated" className="enter-up p-8 sm:p-10">
          <h1 className="font-display text-[32px] text-navy">Check your email</h1>
          <p className="mt-2 text-[15px] text-navy/65">
            We sent a 6-digit code to <span className="font-semibold text-navy">{maskEmail(safeEmail)}</span>.
          </p>

          <VerifyForm email={safeEmail} error={error} sent={sent === "1"} />

          <p className="mt-6 text-center text-[14px] text-navy/60">
            Wrong email?{" "}
            <Link
              href={`/sign-up?email=${encodeURIComponent(safeEmail)}`}
              className="font-semibold text-emerald-700"
            >
              Change email
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Write the interactive form**

Create `src/app/(auth)/verify/VerifyForm.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/auth/OtpInput";
import { verifyOtp, resendOtp } from "@/lib/supabase/auth-actions";

function VerifyButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
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

  useEffect(() => {
    if (error) setAttempts((n) => n + 1);
  }, [error]);

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
```

`sent ? 60 : 0` as the initial cooldown means: landing on `/verify` fresh
from sign-up starts at 0 (resend immediately available), while landing
here via a `?sent=1` redirect (i.e., right after clicking Resend) starts
the 60-second countdown. Each resend redirect remounts this client
component with fresh props, so the countdown always restarts correctly.

- [ ] **Step 3: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 4: Manual test**

```bash
curl -s "http://localhost:3000/verify?email=test%40example.com" | grep -o "Check your email\|te\*\*\*@example.com"
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(auth)/verify"
git commit -m "feat(auth): /verify page with OTP input, resend, and attempt limit"
```

---

### Task 5: Rewrite `/sign-up` with full form and client-side validation

**Files:**
- Modify: `src/app/(auth)/sign-up/page.tsx`
- Create: `src/app/(auth)/sign-up/SignUpForm.tsx`

**Interfaces:**
- Consumes: `signUp` from `@/lib/supabase/auth-actions` (Task 2, same name and `FormData` signature as before — this task adds fields to the form, not to the action's call contract).
- Produces: nothing consumed by later tasks — this is the last page-level task.

- [ ] **Step 1: Write the validated form as a client component**

Create `src/app/(auth)/sign-up/SignUpForm.tsx`:

```tsx
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
```

`confirm_password` is intentionally not sent to `signUp` as a field it
reads — it's client-side-only, checked against `password` before the
form is allowed to submit. `onSubmit` calls `e.preventDefault()` only
when validation fails; a valid submit falls through to the form's own
`action={signUp}`, so the browser still performs a normal (progressively
enhanced) submission — no `fetch` call is written here.

- [ ] **Step 2: Rewrite the page as a thin server shell around the form**

Replace the full contents of `src/app/(auth)/sign-up/page.tsx`:

```tsx
import Link from "next/link";
import Logo from "@/components/Logo";
import Card from "@/components/ui/Card";
import SignUpForm from "./SignUpForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const { error, email } = await searchParams;

  return (
    <main id="main" className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-5">
      <Link
        href="/"
        aria-label="Back to homepage"
        className="group fixed left-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-navy/8 bg-white text-navy shadow-[0_12px_30px_-14px_rgba(15,36,48,0.35)] transition-colors hover:text-emerald-700 sm:left-8 sm:top-8"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          <path d="M15 9H3" />
          <path d="m7.5 4.5-4.5 4.5 4.5 4.5" />
        </svg>
      </Link>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-[8%] size-72 rounded-full bg-emerald/25 blur-3xl sm:size-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-[10%] size-80 rounded-full bg-sky/20 blur-3xl sm:size-[28rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10%] size-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl sm:size-96"
      />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mx-auto mb-10 block w-fit">
          <Logo variant="dark" className="h-10 w-auto" />
        </Link>

        <Card variant="elevated" className="enter-up p-8 sm:p-10">
          <h1 className="font-display text-[32px] text-navy">Create your account</h1>
          <p className="mt-2 text-[15px] text-navy/65">Booking takes a minute once you&rsquo;re signed in.</p>

          <SignUpForm initialEmail={email ?? ""} error={error} />

          <p className="mt-6 text-center text-[14px] text-navy/60">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-emerald-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
```

This is byte-for-byte the same page chrome (blobs, back button, logo,
Card, heading, footer link) as before this task — only the form itself
moved into `SignUpForm.tsx` and gained fields.

- [ ] **Step 3: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 4: Manual test**

```bash
curl -s http://localhost:3000/sign-up | grep -o "Full name\|Phone number\|Confirm password"
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/(auth)/sign-up"
git commit -m "feat(auth): full sign-up form with client-side validation"
```

---

### Task 6: Route guard in `proxy.ts`

**Files:**
- Modify: `proxy.ts` (project root)

**Interfaces:**
- Consumes: nothing from earlier tasks in-repo (reads `data.user.email_confirmed_at` directly off the Supabase auth session). Depends on Task 1's migration being applied to the live project for the overall flow to be meaningful, but the code itself has no build-time dependency on it.

- [ ] **Step 1: Add the guard**

Replace the full contents of `proxy.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on every request. Without this,
 * Server Components can read a stale or expired token — middleware is the
 * only place that runs early enough to refresh it before a page renders.
 *
 * Also redirects a signed-in-but-unverified user away from /account and
 * /book to /verify. This checks the auth session's own
 * email_confirmed_at, never a profiles-table lookup — an unverified user
 * has no profiles row yet (see 0003_otp_signup.sql).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/account") || path.startsWith("/book");
  if (data.user && !data.user.email_confirmed_at && isProtected) {
    const redirectResponse = NextResponse.redirect(
      new URL(`/verify?email=${encodeURIComponent(data.user.email ?? "")}`, request.url),
    );
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

The cookie-copy loop before returning `redirectResponse` matters: the
session-refresh cookies were set on the `response` variable inside the
`setAll` callback, not on the new `NextResponse.redirect(...)` object —
without copying them over, a session refresh that happened during this
same request would be silently dropped on the redirect.

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 3: Manual test**

This needs a real verified vs. unverified session to test meaningfully,
which needs migrations `0002` and `0003` applied to the live project
first (out of this environment's reach — no service-role key, no DB
password). Confirm instead that the build/lint pass and that a
signed-out visit to `/account` still gets today's existing
`redirect("/sign-in?next=/account")` behavior unchanged:

```bash
curl -s -i http://localhost:3000/account | grep -i "location:"
```

Expected: `location: /sign-in?next=%2Faccount` (unchanged from before this
task — this proxy change only adds a NEW branch for signed-in-unverified
users; it does not touch the existing signed-out path).

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git commit -m "feat(auth): redirect unverified users to /verify from /account and /book"
```

---

## Post-implementation (not app code, hand to the user)

After Task 6 is reviewed clean, the user still needs to, in order:

1. Apply `supabase/migrations/0002_intended_role.sql` (written earlier, still pending) and `0003_otp_signup.sql` (this plan's Task 1) to the live Supabase project's SQL editor, in that order.
2. In the Supabase dashboard: Authentication → Providers → Email → turn "Confirm email" back ON.
3. Authentication → Email Templates → "Confirm signup" → edit the body to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.
4. Authentication → Providers → Email → OTP Expiry → set to 600 seconds.
5. Be aware the built-in email sender's default rate limit is meant for testing, not production volume — connecting a custom SMTP provider (Authentication → Settings → SMTP Settings) removes that ceiling before this goes live for real users.
