# OTP Email Verification — Design

## Purpose

Replace the current password-only sign-up (immediate account creation, no
email verification — deliberately disabled in Phase 2 to work around a
rate limit during testing) with a full sign-up → email-OTP-verify flow,
using Supabase's built-in email OTP. No separate OTP service. This is a
reversal of that earlier decision, made deliberately now.

## Scope

This spec covers: the sign-up form (full name, email, phone, password,
confirm password, plus the existing Player/Coach toggle), a new `/verify`
page with a 6-digit code input, the database trigger change that moves
profile creation from signup-time to confirmation-time, and a route guard
in `proxy.ts` that redirects unverified users away from `/account` and
`/book`.

Out of scope: a separate OTP microservice, custom SMTP wiring (dashboard
config only, documented as steps — not app code), any change to `/book`'s
own booking logic, any admin UI for coach approval (unrelated, already
decided against in an earlier pass today).

## Existing state this design must reconcile with

- `supabase/migrations/0001_init.sql` defines `profiles` (`role`,
  `full_name`, `phone`, `created_at`), `handle_new_user()` (SECURITY
  DEFINER, fires `after insert on auth.users`), `prevent_role_self_escalation`
  (blocks self-changes to `role`), and RLS policies `profiles_own_read` /
  `profiles_own_update`.
- `supabase/migrations/0002_intended_role.sql` (written earlier today, not
  yet applied to the live project) adds `intended_role` (`player`/`coach`,
  self-settable) and `coach_approved` (admin-only, protected by extending
  `prevent_role_self_escalation`), and updates `handle_new_user()` to read
  `intended_role` from `raw_user_meta_data`.
- `proxy.ts` (project root) already refreshes the Supabase session cookie
  on every request via `@supabase/ssr`'s `createServerClient` + `getUser()`.
  This is where the new route guard is added — not a new file, and not
  `middleware.ts` (this Next.js version deprecated that filename; the
  project already renamed it once, in Phase 2's final review).
- `src/app/(auth)/sign-in/page.tsx` and `sign-up/page.tsx` already use the
  `elevated` Card variant, ambient blur decoration, and a fixed back-button
  — established today, in this same session. This design reuses that
  visual language, not a new one.
- `src/lib/supabase/auth-actions.ts` has `signUp`, `signIn`, `signOut`
  server actions today. `signUp` currently redirects straight to
  `/account`. This design changes that redirect and adds two new actions.

## Data model & trigger (migration 0003)

`profiles`' columns do not change again in this migration — `0002`
already added what's needed (`intended_role`, `coach_approved`), and
`0001` already has `full_name`/`phone`. This migration only replaces
*when* the profile-creation trigger fires:

- Drop trigger `on_auth_user_created` (fires on `auth.users` INSERT).
- Add trigger `on_auth_user_confirmed`, firing `after update on auth.users`,
  guarded by `old.email_confirmed_at is null and new.email_confirmed_at is
  not null` — i.e., exactly the moment a user's email transitions from
  unconfirmed to confirmed, whether via a link or (in this design) an OTP
  code. `verifyOtp` sets `email_confirmed_at` on success, same as the
  legacy confirmation-link flow would have — no new column needed to
  detect this.
- `handle_new_user()`'s body is otherwise unchanged: still SECURITY
  DEFINER, still inserts one row into `profiles`, still reads
  `intended_role` from `raw_user_meta_data`. It additionally reads
  `full_name` and `phone` from the same metadata object (populated by
  `signUp`'s `options.data`).

RLS policies, `is_admin()`, and `prevent_role_self_escalation` are
untouched — they already govern `profiles` rows regardless of when a row
first appears.

**Consequence:** an unverified user has no `profiles` row at all. Anything
that needs to distinguish "signed up but unverified" from "verified" must
check the `auth` session's `email_confirmed_at`, not query `profiles`.

## Sign-up flow

`src/app/(auth)/sign-up/page.tsx` becomes a client component (needed for
live inline validation before submit — the existing pattern of a plain
server-rendered `<form action={signUp}>` can't validate before a network
round trip). Fields: full name, email, phone, password, confirm password,
and the existing Player/Coach radio toggle (unchanged from earlier today).

Client-side validation, inline, on blur and on submit:
- Email: basic format check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/` — good enough
  for inline UX; Supabase itself is the real authority on deliverability).
- Password: at least 8 characters, at least one letter, at least one
  number.
- Confirm password: matches password exactly.
- Full name, phone: required, non-empty.

On valid submit, call the existing `signUp` server action (extended, see
below) which calls `supabase.auth.signUp({ email, password, options: {
data: { full_name, phone, intended_role } } })`, then redirects to
`/verify?email=<email>`.

If `signUp` itself fails (e.g., email already registered), the error
comes back the same way it does today — `redirect(/sign-up?error=...)` —
rendered in the existing error banner.

## `/verify` page

New file: `src/app/(auth)/verify/page.tsx`. Server component reading
`email` from `searchParams`, masking it for display (`ja***@gmail.com` —
first 2 characters of the local part, then `***`, then `@domain`), and
rendering a client component that holds the actual OTP form and its
interactive state.

New file: `src/components/auth/OtpInput.tsx` (client component). Six
`<input type="text" inputMode="numeric" autoComplete="one-time-code"
maxLength={1}>` boxes:
- Typing a digit auto-advances focus to the next box.
- Backspace on an empty box moves focus to the previous box and clears it.
- Pasting a full 6-digit string fills all six boxes and calls the parent
  `<form>`'s `requestSubmit()` automatically.
- A client-side attempt counter (local `useState`, not persisted) blocks
  a 6th consecutive failed attempt and forces the user to hit "Resend"
  before trying again — a UX guard in front of Supabase's own server-side
  rate limit, not a replacement for it.

Submitting calls a new `verifyOtp` server action:
```ts
supabase.auth.verifyOtp({ email, token, type: "signup" })
```
On success: redirect to `/account`. On failure: map Supabase's error into
one of three specific messages —
- expired code → "That code has expired. Request a new one below."
- wrong code → "That code isn't right. Check it and try again."
- rate-limited / too many attempts → "Too many attempts. Wait a moment or
  request a new code."

Caveat: Supabase's JS client does not always expose a distinct machine
error *code* for expired vs. simply-wrong OTP tokens — both can surface
as `otp_expired` or a generic invalid-token message depending on SDK
version, so this mapping is done by matching on `error.code` where
present and falling back to a substring match on `error.message`
otherwise. If neither Supabase error path clearly distinguishes the two
cases at implementation time, "wrong code" is the fallback message,
since it's the less alarming of the two to show on an ambiguous failure.

"Resend code" button: calls a new `resendOtp` server action
(`supabase.auth.resend({ type: "signup", email })`), disabled for 60
seconds after each send with a visible countdown (client-side `setInterval`,
no persistence needed — a lost countdown on reload just means the button
re-enables early, not a security issue since Supabase's own server-side
rate limit is the real backstop).

"Change email" link: goes to `/sign-up?email=<current email>`, and the
sign-up page pre-fills the email field from that query param if present
(all other fields start empty — this is a convenience for a typo, not a
resumed session).

## `signIn` change

If `supabase.auth.signInWithPassword` returns an error whose message
indicates an unconfirmed email (Supabase's `email_not_confirmed` error
code), redirect to `/verify?email=<email>` instead of the generic
`/sign-in?error=...` path. Every other error keeps today's behavior.

## `proxy.ts` route guard

After the existing `await supabase.auth.getUser()` call: if the request
path starts with `/account` or `/book`, and `data.user` exists but
`data.user.email_confirmed_at` is falsy, redirect to
`/verify?email=<data.user.email>`. Signed-out users hitting those paths
are unaffected by this change — each page's own existing
`redirect("/sign-in?next=...")` guard still handles that case, since
`proxy.ts` only intervenes for a user who exists but isn't verified.

## Design

Reuses exactly what today's sign-in/sign-up work already established:
`Card variant="elevated"`, the three ambient blurred color blobs, the
fixed circular back-to-home button, `font-display` headings, the same
input/label markup and spacing (`space-y-4`, `rounded-xl border
border-navy/15 px-4 py-3`).

OTP boxes get the same input treatment sized down to single characters,
centered text, with `focus-visible:border-sky` (this project's existing
sky-blue focus-ring convention, e.g. the email/password inputs already
use `focus-visible:border-emerald-600` — OTP boxes get sky instead per
the requested brand mapping: sky for links/focus, gold reserved for a
small accent). The currently-focused, filled box gets a 2px gold
underline (`border-b-2 border-b-gold`) — a small accent, consistent with
how gold is used sparingly elsewhere (the "Most booked" pricing badge,
the testimonial rule) rather than as a dominant color.

All error text uses `aria-live="polite"` on its container (existing
pattern: error banners on sign-in/sign-up/account already use a plain
`<p>`; this adds the live-region attribute since OTP errors appear
without a full page navigation, unlike those).

## Testing locally

Supabase's built-in email sender delivers real emails in local dev as
long as the project isn't paused — this isn't a stub to fake out. Manual
test plan: sign up with a real inbox, confirm the code arrives, confirm
the masked email display matches, enter the code and confirm redirect to
`/account`, confirm a `profiles` row now exists with the right
`full_name`/`phone`/`intended_role`, then in a fresh incognito window sign
up with a second address and — before verifying — try visiting `/book`
directly and confirm it redirects to `/verify` rather than rendering.

## Supabase dashboard steps (to hand to the user, not app code)

1. Authentication → Providers → Email: turn "Confirm email" back ON
   (currently OFF from the earlier rate-limit workaround).
2. Authentication → Email Templates → "Confirm signup": edit the template
   body to include `{{ .Token }}` (the 6-digit code) instead of the
   default `{{ .ConfirmationURL }}` link.
3. Authentication → Providers → Email → OTP Expiry: set to 600 seconds
   (10 minutes).
4. Note for the user: the built-in email sender has a low default rate
   limit meant for testing, not production volume — connecting a custom
   SMTP provider (Authentication → Settings → SMTP Settings) removes that
   ceiling before this goes live for real users.

## Migration ordering

Both `0002_intended_role.sql` (already written, not yet applied) and the
new `0003_otp_signup.sql` must be run against the live Supabase project,
in order, before this flow works end to end.
