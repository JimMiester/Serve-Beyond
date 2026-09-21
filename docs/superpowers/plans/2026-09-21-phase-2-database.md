# Phase 2 — Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Phase 1 homepage a real Supabase backend — schema, auth, storage — so the booking bar submits a real booking instead of 404ing, coach/programme content comes from a database instead of a hardcoded file, and a signed-in player has an account page showing their bookings.

**Architecture:** Postgres schema with RLS as the only access-control layer (no service_role key anywhere in app code). `@supabase/ssr` gives Next.js two client factories — a cookie-based server client for Server Components/Actions, a browser client for the rare case a client component needs one. Availability is enforced by a Postgres `EXCLUDE` constraint, not an application-level check, so concurrent booking requests can't double-book a court no matter how the app code behaves.

**Tech Stack:** Next.js 16 App Router (existing), Supabase Postgres + Auth + Storage, `@supabase/ssr` + `@supabase/supabase-js` (new dependencies), plain SQL migrations (no ORM).

**Spec:** `docs/superpowers/specs/2026-09-21-phase-2-database-design.md`

## Global Constraints

- **RLS is the only access-control layer.** No task ever uses the `service_role` key. Every Supabase call from app code uses the anon/publishable key already in `.env.local`, subject to RLS.
- **No JS test framework.** The spec explicitly declined to introduce one mid-database-phase. Verification for app-layer tasks is `npm run build` + `npx eslint src --max-warnings=0` + a described manual walkthrough. Verification for SQL is runnable assertion queries in `supabase/smoke.sql`.
- **Server-rendered by default.** A component only becomes `"use client"` if it genuinely needs browser-only APIs. None of the new components in this plan need to be client components.
- **Auth is email + password only.** No magic link, no OAuth (spec decision 5).
- **Money is peso, no decimals assumed away** — `programs.price_from` is `numeric`, rendered with `.toLocaleString()` for thousands separators, matching the ₱1,500-style formatting already on the site.
- **Coach assignment happens after booking, by admin** (spec decision 4) — no task lets a player pick a coach.
- **No custom `/admin` route** (spec decision 6) — admin work happens in Supabase Studio.

## Deviations from the written spec, found while planning

Two corrections, both disclosed rather than silently applied:

1. **Added a `venues` table.** The approved spec's schema had `courts` with no venue reference at all, which quietly drops `PRODUCT.md`'s own principle #5 ("model the second venue while shipping the first"). Fixed by adding a `venues` table (one seeded row today) and `courts.venue_id`. Cost: one small table, one FK, one seed row. The UI still shows no venue picker while there is only one — nothing here changes what a player sees.
2. **`smoke.sql`'s RLS check is scoped down to a structural check**, not the behavioral one the spec described. Supabase's SQL editor runs as an elevated Postgres role that bypasses RLS by default — a query run there proves nothing about whether RLS actually blocks another player, it would just silently succeed regardless of the policies' correctness. The real behavioral proof happens in Task 3 (two signed-up test accounts) and Task 7 (a real booking through the anon-key-constrained app), which is where RLS is actually exercised the way a real request would exercise it.

## File Structure

```
supabase/
  migrations/0001_init.sql   schema, RLS, triggers, storage bucket — Task 1
  seed.sql                   sample courts/coaches/programs         Task 1
  smoke.sql                  assertion queries                      Task 1

src/lib/supabase/
  types.ts      hand-written row types for every table   Task 2
  client.ts     browser client factory                    Task 2
  server.ts     server client factory (async cookies)     Task 2
  storage.ts    getPublicImageUrl(path)                    Task 2
  auth-actions.ts   signUp / signIn / signOut              Task 3

middleware.ts   session-refresh middleware (project root)  Task 2

src/app/
  sign-up/page.tsx     Task 3
  sign-in/page.tsx     Task 3
  book/
    availability.ts    computeAvailableSlots()   Task 7
    actions.ts          createBooking             Task 7
    page.tsx            the real booking page     Task 7
  account/
    actions.ts          cancelBooking             Task 8
    page.tsx             Task 8
  page.tsx    (MODIFY)  fetches session, passes to Nav    Task 4

src/components/
  Nav.tsx               (MODIFY) session-aware              Task 4
  Hero.tsx              (MODIFY) BookingBar reads real data Task 6
  sections/Programs.tsx (MODIFY) reads from DB               Task 5
  sections/Coaches.tsx  (MODIFY) reads from DB                Task 5

src/content/site.ts     (MODIFY) programs/coaches/locations removed  Tasks 5, 6

package.json     (MODIFY) + @supabase/ssr, @supabase/supabase-js   Task 2
next.config.ts   (MODIFY) + remotePatterns for Supabase Storage    Task 2
```

---

### Task 1: Database schema, seed data, and smoke tests

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `supabase/seed.sql`
- Create: `supabase/smoke.sql`

**Interfaces:**
- Produces: the tables `venues`, `courts`, `coaches`, `programs`, `profiles`, `bookings`, `memberships`; the function `is_admin()`; the Storage bucket `public-media`. Every later task's Supabase queries assume these exact table and column names.

This task has no earlier tasks to consume from — it's the foundation.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0001_init.sql`:

```sql
-- Phase 2 schema. Run once in the Supabase SQL Editor.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- venues exists from day one so a second site costs no migration, even
-- though the UI hides venue choice while there is only one (PRODUCT.md
-- principle 5). One row today.
create table venues (
  id     uuid primary key default gen_random_uuid(),
  name   text not null,
  active boolean not null default true
);

create table courts (
  id       uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id),
  name     text not null,
  active   boolean not null default true
);

create table coaches (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null,
  cert       text,
  years      int,
  focus      text,
  photo_path text,
  active     boolean not null default true
);

create table programs (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  title      text not null,
  blurb      text,
  price_from numeric not null,
  price_unit text not null,
  photo_path text
);

-- One row per auth.users row. Created automatically by the trigger below —
-- never inserted by app code.
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'player' check (role in ('player','admin')),
  full_name  text,
  phone      text,
  created_at timestamptz not null default now()
);

create table bookings (
  id           uuid primary key default gen_random_uuid(),
  court_id     uuid not null references courts(id),
  player_id    uuid not null references profiles(id),
  coach_id     uuid references coaches(id),
  program_id   uuid not null references programs(id),
  starts_at    timestamptz not null,
  ends_at      timestamptz not null check (ends_at > starts_at),
  status       text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  cancelled_at timestamptz,
  created_at   timestamptz not null default now(),

  -- The load-bearing correctness guarantee of this whole schema: two
  -- confirmed bookings for the same court can never have overlapping time
  -- ranges, enforced by Postgres itself regardless of how many requests
  -- arrive at the same instant. See spec for why this beats an
  -- application-level "check then insert".
  constraint no_double_booking exclude using gist (
    court_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);

create table memberships (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null unique references profiles(id),
  status          text not null default 'active' check (status in ('active','paused','cancelled')),
  hours_remaining numeric not null default 0,
  renews_on       date,
  updated_by      uuid references profiles(id),
  updated_at      timestamptz not null default now()
);

-- is_admin(): the one place "am I admin" is checked, referenced by every
-- policy below instead of repeating the subquery on every table.
create function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Creates the matching profiles row the instant someone signs up, so
-- profile creation is atomic with account creation — no separate
-- client-side request that could succeed on the auth side and fail here.
create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS governs which ROWS a player can touch; a row-level policy has no
-- clean way to say "this column may not change", so protecting `role`
-- needs a trigger instead.
create function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not is_admin() then
    raise exception 'role cannot be changed by its own owner';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_escalation
  before update on profiles
  for each row execute function prevent_role_self_escalation();

-- Row-Level Security
alter table venues enable row level security;
alter table courts enable row level security;
alter table coaches enable row level security;
alter table programs enable row level security;
alter table profiles enable row level security;
alter table bookings enable row level security;
alter table memberships enable row level security;

create policy venues_public_read on venues for select using (true);
create policy venues_admin_write on venues for all using (is_admin()) with check (is_admin());

create policy courts_public_read on courts for select using (true);
create policy courts_admin_write on courts for all using (is_admin()) with check (is_admin());

create policy coaches_public_read on coaches for select using (true);
create policy coaches_admin_write on coaches for all using (is_admin()) with check (is_admin());

create policy programs_public_read on programs for select using (true);
create policy programs_admin_write on programs for all using (is_admin()) with check (is_admin());

create policy profiles_own_read on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_own_update on profiles for update using (id = auth.uid() or is_admin());

create policy bookings_own_read on bookings for select using (player_id = auth.uid() or is_admin());
create policy bookings_own_insert on bookings for insert with check (player_id = auth.uid());
create policy bookings_own_update on bookings for update using (player_id = auth.uid() or is_admin());

create policy memberships_own_read on memberships for select using (player_id = auth.uid() or is_admin());
create policy memberships_admin_write on memberships for all using (is_admin()) with check (is_admin());

-- Storage: one public-read bucket, admin-only write.
insert into storage.buckets (id, name, public)
  values ('public-media', 'public-media', true)
  on conflict (id) do nothing;

create policy public_media_public_read on storage.objects
  for select using (bucket_id = 'public-media');

create policy public_media_admin_write on storage.objects
  for insert with check (bucket_id = 'public-media' and is_admin());

create policy public_media_admin_update on storage.objects
  for update using (bucket_id = 'public-media' and is_admin());

create policy public_media_admin_delete on storage.objects
  for delete using (bucket_id = 'public-media' and is_admin());
```

- [ ] **Step 2: Run the migration**

Open the Supabase dashboard → SQL Editor → paste the full contents of `0001_init.sql` → Run. Expect "Success. No rows returned."

- [ ] **Step 3: Write the seed data**

Create `supabase/seed.sql`:

```sql
-- Sample data matching src/content/site.ts, so the real schema can be
-- exercised with realistic-looking content. Safe to re-run: every insert
-- is guarded so a second run doesn't duplicate rows.

insert into venues (id, name)
  values ('00000000-0000-0000-0000-000000000001', 'Ortigas Indoor Tennis Centre')
  on conflict (id) do nothing;

insert into courts (venue_id, name)
select '00000000-0000-0000-0000-000000000001', name
from (values ('Court 1'), ('Court 2'), ('Court 3')) as t(name)
where not exists (select 1 from courts where courts.name = t.name);

insert into coaches (name, role, cert, years, focus)
select * from (values
  ('Marcus Vaughn', 'Head Coach', 'PTR Professional', 12, 'Serve mechanics · Singles strategy'),
  ('Priya Raman', 'Performance Coach', 'LTA Level 4', 9, 'Junior pathway · Footwork'),
  ('Danny Oyelaran', 'Club Coach', 'LTA Level 3', 6, 'Doubles · Adult beginners')
) as t(name, role, cert, years, focus)
where not exists (select 1 from coaches where coaches.name = t.name);

insert into programs (slug, title, blurb, price_from, price_unit)
values
  ('private', 'Private Coaching', 'One-to-one with a certified coach. Video review every third session.', 1500, 'hour'),
  ('group', 'Group Clinics', 'Four players, one coach, ninety minutes of drills and live ball.', 550, 'person'),
  ('junior', 'Junior Academy', 'Ages 6–16, streamed by level across red, orange and green pathways.', 400, 'session'),
  ('match', 'Match Play', 'Supervised competitive sets with a coach courtside calling patterns.', 700, 'person')
on conflict (slug) do nothing;
```

- [ ] **Step 4: Run the seed**

Paste `seed.sql` into the SQL Editor → Run. Then verify: `select count(*) from courts;` should return `3`; `select count(*) from programs;` should return `4`.

- [ ] **Step 5: Write the smoke tests**

Create `supabase/smoke.sql`:

```sql
-- Run after migration + seed, and after at least one account has signed up
-- (Task 3). A clean run with only NOTICEs, no ERRORs, means pass.
--
-- The RLS policies are NOT re-verified here: this SQL Editor connection runs
-- as an elevated Postgres role that bypasses RLS by default, so a query run
-- here proves nothing about whether a real request would be blocked. RLS is
-- actually exercised — and actually proven — through the app in Task 3
-- (two separate signed-in accounts) and Task 7 (a real booking against the
-- anon-key-constrained client).

-- 1. Structural check: every table that should have RLS policies has them.
do $$
declare
  missing text;
begin
  select string_agg(t, ', ') into missing
  from (values ('venues'),('courts'),('coaches'),('programs'),('profiles'),('bookings'),('memberships')) as expected(t)
  where not exists (
    select 1 from pg_policies where pg_policies.tablename = expected.t
  );

  if missing is not null then
    raise exception 'FAIL: no RLS policy found for: %', missing;
  end if;

  raise notice 'PASS: every expected table has at least one RLS policy';
end $$;

-- 2. Behavioral check: the EXCLUDE constraint actually rejects an overlap.
-- This one runs as the elevated role but the constraint applies regardless
-- of role, so it's a real, reliable check here.
do $$
declare
  v_court   uuid;
  v_program uuid;
  v_player  uuid;
begin
  select id into v_court from courts limit 1;
  select id into v_program from programs limit 1;
  select id into v_player from profiles limit 1;

  if v_player is null then
    raise notice 'SKIP: no profiles row yet — sign up one test account (Task 3), then re-run.';
    return;
  end if;

  insert into bookings (court_id, player_id, program_id, starts_at, ends_at)
  values (v_court, v_player, v_program, '2030-01-01 10:00+08', '2030-01-01 11:00+08');

  begin
    insert into bookings (court_id, player_id, program_id, starts_at, ends_at)
    values (v_court, v_player, v_program, '2030-01-01 10:30+08', '2030-01-01 11:30+08');
    raise exception 'FAIL: an overlapping booking was accepted';
  exception when exclusion_violation then
    raise notice 'PASS: overlapping booking correctly rejected';
  end;

  delete from bookings where court_id = v_court and starts_at = '2030-01-01 10:00+08';
end $$;
```

- [ ] **Step 6: Run the smoke tests**

Paste `smoke.sql` into the SQL Editor → Run. Expect a `SKIP` notice on the second block until Task 3 exists (no `profiles` row yet — nobody has signed up). Re-run after Task 3's manual test signs someone up; expect both blocks to print `PASS` and zero `ERROR` lines.

- [ ] **Step 7: Enable the extension check**

If Step 2 failed specifically on `create extension if not exists btree_gist;` with a permissions error, that extension needs enabling once from the dashboard's Database → Extensions page instead (search "btree_gist", toggle on), then re-run the rest of the migration from the `create table venues` line down.

- [ ] **Step 8: Commit**

```bash
git add supabase/
git commit -m "feat(db): Phase 2 schema, seed data, and smoke tests"
```

---

### Task 2: Supabase client plumbing

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`
- Create: `src/lib/supabase/types.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/storage.ts`
- Create: `middleware.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks (Task 1 is a database-only artifact; this task's SQL knowledge comes from the spec, not from importing anything).
- Produces: `createClient()` (browser, from `client.ts`), `async createClient()` (server, from `server.ts` — same name, different module, matching Supabase's own convention of importing whichever one the call site needs), `getPublicImageUrl(path: string | null): string | null`, and the row types `Venue`, `Court`, `Coach`, `Program`, `Profile`, `Booking`, `Membership`. Every later task imports these exact names.

- [ ] **Step 1: Install the dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

- [ ] **Step 2: Allow Supabase Storage images through next/image**

Modify `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://vsiymjhnsfhruzapzyxy.supabase.co/storage/v1/object/public/**")],
  },
};

export default nextConfig;
```

- [ ] **Step 3: Write the row types**

Create `src/lib/supabase/types.ts`:

```ts
/**
 * Hand-written row types matching supabase/migrations/0001_init.sql exactly.
 * No generated-types step in this project (see spec: no local Supabase CLI
 * dependency) — if a column is added to the schema, add it here by hand.
 */

export type Venue = {
  id: string;
  name: string;
  active: boolean;
};

export type Court = {
  id: string;
  venue_id: string;
  name: string;
  active: boolean;
};

export type Coach = {
  id: string;
  name: string;
  role: string;
  cert: string | null;
  years: number | null;
  focus: string | null;
  photo_path: string | null;
  active: boolean;
};

export type Program = {
  id: string;
  slug: string;
  title: string;
  blurb: string | null;
  price_from: number;
  price_unit: string;
  photo_path: string | null;
};

export type Profile = {
  id: string;
  role: "player" | "admin";
  full_name: string | null;
  phone: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  court_id: string;
  player_id: string;
  coach_id: string | null;
  program_id: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled";
  cancelled_at: string | null;
  created_at: string;
};

export type Membership = {
  id: string;
  player_id: string;
  status: "active" | "paused" | "cancelled";
  hours_remaining: number;
  renews_on: string | null;
  updated_by: string | null;
  updated_at: string;
};
```

- [ ] **Step 4: Write the browser client**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

/** Browser-side client. Only used where a client component genuinely needs
 * one — everything else in this project reads via server.ts. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 5: Write the server client**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server Component / Server Action client. Reads and writes cookies through
 * Next's async cookies() API, so the session survives across requests. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render, which can't set
            // cookies (there's no response to attach them to yet).
            // middleware.ts refreshes the session on every request instead,
            // so a session write failing here is safe to ignore.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 6: Write the storage helper**

Create `src/lib/supabase/storage.ts`:

```ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Builds a public Storage URL from a stored `photo_path`, or null if there
 * is none yet — callers render a <Skeleton> in that case, same as today. */
export function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;
}
```

- [ ] **Step 7: Write the session-refresh middleware**

Create `middleware.ts` at the project root (same level as `package.json`):

```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on every request. Without this,
 * Server Components can read a stale or expired token — middleware is the
 * only place that runs early enough to refresh it before a page renders.
 */
export async function middleware(request: NextRequest) {
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

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 8: Verify the build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`. These new files aren't imported anywhere yet, so this step only proves they're syntactically and type-correct in isolation, not that the app uses them — later tasks prove that.

- [ ] **Step 9: Lint**

```bash
npx eslint src middleware.ts --max-warnings=0
```

Expected: no output, exit code 0.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json next.config.ts src/lib/supabase middleware.ts
git commit -m "feat(db): Supabase client plumbing (browser, server, storage, session middleware)"
```

---

### Task 3: Sign-up and sign-in

**Files:**
- Create: `src/lib/supabase/auth-actions.ts`
- Create: `src/app/sign-up/page.tsx`
- Create: `src/app/sign-in/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `src/lib/supabase/server.ts` (Task 2); `Logo` from `src/components/Logo.tsx` (existing, `variant="dark"` prop); `Button` from `src/components/ui/Button.tsx` (existing, submit-button mode when no `href`).
- Produces: server actions `signUp(formData)`, `signIn(formData)`, `signOut()` from `auth-actions.ts`. Task 4 imports `signOut`; Task 7/8 link to `/sign-in?next=...`, which this task's `signIn` action must honor.

These pages intentionally don't render the site `<Nav>` — a full nav with a "Book a Court" CTA on the sign-in screen itself is the wrong invitation, and it removes an ordering dependency on Task 4's Nav changes.

- [ ] **Step 1: Write the auth actions**

Create `src/lib/supabase/auth-actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
  }

  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

- [ ] **Step 2: Write the sign-up page**

Create `src/app/sign-up/page.tsx`:

```tsx
import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import { signUp } from "@/lib/supabase/auth-actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main id="main" className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5">
      <Link href="/" className="mx-auto mb-10">
        <Logo variant="dark" className="h-10 w-auto" />
      </Link>

      <h1 className="font-display text-[32px] text-navy">Create your account</h1>
      <p className="mt-2 text-[15px] text-navy/65">Booking takes a minute once you&rsquo;re signed in.</p>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}

      <form action={signUp} className="mt-8 space-y-4">
        <label className="block">
          <span className="block text-[13px] font-medium text-navy/70">Email</span>
          <input
            type="email"
            name="email"
            required
            className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
          />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-navy/70">Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
          />
        </label>
        <Button className="w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-navy/60">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-emerald-700">
          Sign in
        </Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Write the sign-in page**

Create `src/app/sign-in/page.tsx`:

```tsx
import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import { signIn } from "@/lib/supabase/auth-actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <main id="main" className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5">
      <Link href="/" className="mx-auto mb-10">
        <Logo variant="dark" className="h-10 w-auto" />
      </Link>

      <h1 className="font-display text-[32px] text-navy">Sign in</h1>
      <p className="mt-2 text-[15px] text-navy/65">Pick up where you left off.</p>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}

      <form action={signIn} className="mt-8 space-y-4">
        {next && <input type="hidden" name="next" value={next} />}
        <label className="block">
          <span className="block text-[13px] font-medium text-navy/70">Email</span>
          <input
            type="email"
            name="email"
            required
            className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
          />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-navy/70">Password</span>
          <input
            type="password"
            name="password"
            required
            className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
          />
        </label>
        <Button className="w-full">Sign in</Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-navy/60">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-emerald-700">
          Create an account
        </Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Expected: both clean.

- [ ] **Step 5: Manual test — this also unblocks Task 1's skipped smoke check**

```bash
npm run dev
```

Visit `http://localhost:3000/sign-up`, create an account with any email/password (8+ characters). Expect a redirect to `/account` (which 404s until Task 8 — that 404 is expected and correct at this point in the plan). Then in the Supabase SQL Editor, run `select id, role from profiles;` — expect exactly one row with `role = 'player'`. Re-run `supabase/smoke.sql`'s second block now; expect it to print `PASS` instead of `SKIP`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/auth-actions.ts src/app/sign-up src/app/sign-in
git commit -m "feat(auth): sign-up and sign-in"
```

---

### Task 4: Session-aware navigation

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/Nav.tsx`

**Interfaces:**
- Consumes: `createClient()` from `server.ts` (Task 2); `signOut` from `auth-actions.ts` (Task 3).
- Produces: `Nav` now requires a `session: { email: string } | null` prop. Every future page that renders `<Nav>` (Task 7, Task 8) must pass it.

- [ ] **Step 1: Make the homepage fetch the session and pass it to Nav**

Replace `src/app/page.tsx` in full:

```tsx
import Nav from "@/components/Nav";
import Hero, { BookingBar } from "@/components/Hero";
import Programs from "@/components/sections/Programs";
import HowItWorks from "@/components/sections/HowItWorks";
import Coaches from "@/components/sections/Coaches";
import Pricing from "@/components/sections/Pricing";
import Proof from "@/components/sections/Proof";
import Faq from "@/components/sections/Faq";
import Footer from "@/components/sections/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Nav session={user ? { email: user.email ?? "" } : null} />
      <main id="main">
        <Hero />
        <BookingBar />
        {/* Bands alternate cream / navy so the scroll has rhythm. */}
        <Programs />
        <HowItWorks />
        <Coaches />
        <Pricing />
        <Proof />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Make Nav accept and use the session prop**

Replace `src/components/Nav.tsx` in full:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";
import Button from "@/components/ui/Button";
import { signOut } from "@/lib/supabase/auth-actions";

const LINKS = [
  { label: "Courts", href: "/courts" },
  { label: "Coaching", href: "/coaching" },
  { label: "Membership", href: "/membership" },
  { label: "Results", href: "/results" },
  { label: "FAQs", href: "/faqs" },
];

export default function Nav({ session }: { session: { email: string } | null }) {
  // Over the hero the bar can stay barely-there glass; past it the bar sits on
  // cream, where white links on a 25% scrim were unreadable. A passive scroll
  // listener reading scrollY is cheaper here than an observer + sentinel.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); // deep links can load mid-page
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[height,background-color,border-color] duration-300 ${
        scrolled ? "h-[60px] border-white/10 bg-navy/95" : "h-[72px] border-white/10 bg-navy/25"
      }`}
    >
      <nav className="mx-auto flex h-full max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky">
          <Logo
            priority
            className={`w-auto transition-[height] duration-300 ${scrolled ? "h-8 sm:h-9" : "h-9 sm:h-12"}`}
          />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map(({ label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="text-[15px] font-light text-white/85 transition-colors hover:text-sky focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={session ? "/account" : "/sign-in"}
              className="text-[15px] font-light text-white/85 transition-colors hover:text-sky focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
            >
              {session ? "Account" : "Sign In"}
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <Button href="/book" variant="white" size="sm">
            Book a Court
          </Button>

          {/* Native disclosure — no client bundle for a five-link menu. */}
          <details className="relative lg:hidden">
            <summary
              aria-label="Menu"
              className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/20 text-white [&::-webkit-details-marker]:hidden"
            >
              <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M0 1h16M0 6h16M0 11h16" />
              </svg>
            </summary>
            {/* top-full keeps the panel glued to the bar as it shrinks. */}
            <ul className="menu-panel absolute right-0 top-[calc(100%+14px)] w-52 rounded-2xl border border-white/10 bg-navy/95 p-2 backdrop-blur-xl">
              {LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="block rounded-xl px-4 py-3 text-[15px] text-white/85 hover:bg-white/10">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                {session ? (
                  <>
                    <Link href="/account" className="block rounded-xl px-4 py-3 text-[15px] text-white/85 hover:bg-white/10">
                      Account
                    </Link>
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="block w-full rounded-xl px-4 py-3 text-left text-[15px] text-white/85 hover:bg-white/10"
                      >
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <Link href="/sign-in" className="block rounded-xl px-4 py-3 text-[15px] text-white/85 hover:bg-white/10">
                    Sign In
                  </Link>
                )}
              </li>
            </ul>
          </details>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both must be clean. `npm run build` failing with "Nav requires prop session" anywhere means another page renders `<Nav>` without it — expected only in Tasks 7 and 8, which supply it as part of their own steps.

- [ ] **Step 4: Manual test**

`npm run dev`, visit `/`. Signed out: header shows "Sign In". Sign in from Task 3's page, return to `/`: header shows "Account" (the link 404s until Task 8 — expected). Open the mobile menu (narrow the window) and confirm "Sign out" appears and, when clicked, returns you to `/` signed out.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/Nav.tsx
git commit -m "feat(auth): session-aware navigation"
```

---

### Task 5: Programmes and coaches read from the database

**Files:**
- Modify: `src/components/sections/Programs.tsx`
- Modify: `src/components/sections/Coaches.tsx`
- Modify: `src/content/site.ts` (remove the now-superseded `programs` and `coaches` exports)

**Interfaces:**
- Consumes: `createClient()` from `server.ts`, `getPublicImageUrl()` from `storage.ts`, `Program`/`Coach` types (all Task 2).
- Produces: nothing new — these are leaf sections nothing else imports.

- [ ] **Step 1: Rewrite Programs.tsx to fetch from the database**

Replace `src/components/sections/Programs.tsx` in full:

```tsx
import Skeleton from "@/components/ui/Skeleton";
import Reveal from "@/components/ui/Reveal";
import Image from "next/image";
import Link from "next/link";
import SectionHead from "@/components/ui/SectionHead";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Program } from "@/lib/supabase/types";

export default async function Programs() {
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select("*").order("price_from", { ascending: true });
  const programs = (data ?? []) as Program[];

  return (
    <section id="programs" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <SectionHead
            eyebrow="Programmes"
            title="Four ways onto a court."
            lede="Whether you are chasing a county ranking or just want a rally that lasts more than four shots, one of these fits."
          />
        </Reveal>

        <Reveal as="ul" stagger className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((p) => {
            const image = getPublicImageUrl(p.photo_path);
            return (
              <li key={p.slug}>
                <Link
                  href={`/coaching/${p.slug}`}
                  className="group block rounded-2xl transition-transform duration-200 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-navy/10">
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(min-width:1024px) 23vw, (min-width:640px) 46vw, 92vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <Skeleton className="absolute inset-0" />
                    )}
                    <div className="absolute inset-0 transition-colors duration-300 group-hover:bg-navy/[0.06]" />
                  </div>

                  <h3 className="mt-5 font-display text-[22px] leading-tight text-navy">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-navy/65">{p.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                    From ₱{p.price_from.toLocaleString()} / {p.price_unit}
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M2.5 10.5 10.5 2.5M4 2.5h6.5V9" />
                    </svg>
                  </span>
                </Link>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Rewrite Coaches.tsx to fetch from the database**

Replace `src/components/sections/Coaches.tsx` in full:

```tsx
import Skeleton from "@/components/ui/Skeleton";
import Reveal from "@/components/ui/Reveal";
import Image from "next/image";
import SectionHead from "@/components/ui/SectionHead";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Coach } from "@/lib/supabase/types";

export default async function Coaches() {
  const supabase = await createClient();
  const { data } = await supabase.from("coaches").select("*").eq("active", true).order("years", { ascending: false });
  const coaches = (data ?? []) as Coach[];

  return (
    <section id="coaches" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <SectionHead
            eyebrow="The coaches"
            title="Certified, and still competing."
            lede="Every coach on this floor holds a current governing-body certification and plays league tennis themselves."
          />
          <Button href="/coaching" variant="outline" className="shrink-0">
            All coaches
          </Button>
        </Reveal>

        <Reveal as="ul" stagger className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => {
            const image = getPublicImageUrl(c.photo_path);
            return (
              <li key={c.id} className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-navy/10">
                  {image ? (
                    <Image
                      src={image}
                      alt={`${c.name}, ${c.role}`}
                      fill
                      sizes="(min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <Skeleton className="absolute inset-0" />
                  )}
                </div>

                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[23px] leading-tight text-navy">{c.name}</h3>
                  <span className="shrink-0 text-[13px] font-medium text-navy/50">{c.years} yrs</span>
                </div>

                {/* The one gold detail in this section. */}
                <p className="mt-2 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
                  {c.role} · {c.cert}
                </p>
                <p className="mt-2 text-[15px] leading-[1.6] text-navy/65">{c.focus}</p>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Remove the now-dead `programs` and `coaches` exports from site.ts**

Open `src/content/site.ts`. Delete the entire `export const programs = [...]` block and the entire `export const coaches = [...]` block (their content now lives in `supabase/seed.sql` instead). Leave `site`, `locations`, `steps`, `pricing`, `stats`, `testimonials`, and `faqs` untouched — those are still Phase 3+ territory or genuinely static copy.

- [ ] **Step 4: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean. If the build fails with "programs is not exported", another file still imports the deleted export — grep for it: `grep -rn "from \"@/content/site\"" src/` and confirm nothing left imports `programs` or `coaches`.

- [ ] **Step 5: Manual test**

`npm run dev`, visit `/`. The Programmes section shows the four seeded programmes (Private Coaching, Group Clinics, Junior Academy, Match Play) with real peso prices. The Coaches section shows Marcus Vaughn, Priya Raman, Danny Oyelaran, all with skeleton image placeholders (no photos uploaded yet — expected).

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Programs.tsx src/components/sections/Coaches.tsx src/content/site.ts
git commit -m "feat(db): programmes and coaches read from Supabase"
```

---

### Task 6: Hero booking bar reads real courts and programmes

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/content/site.ts` (remove the now-superseded `locations` export)

**Interfaces:**
- Consumes: `createClient()` from `server.ts`, `Court`/`Program` types (Task 2).
- Produces: the `BookingBar` GET form now submits `court`, `date`, `program` query parameters to `/book` — Task 7's page must read exactly these three parameter names.

Only `BookingBar` changes; the `Hero` function (the headline) is untouched — it has no data dependency.

- [ ] **Step 1: Rewrite Hero.tsx's imports and BookingBar**

In `src/components/Hero.tsx`, replace the first line:

```ts
import { locations } from "@/content/site";
```

with:

```ts
import { createClient } from "@/lib/supabase/server";
import type { Court, Program } from "@/lib/supabase/types";
```

Then replace the entire `BookingBar` function (from `/** Sits below the hero...` to the closing `}` of the file) with:

```tsx
/** Sits below the hero on the cream band — deliberately clear of the edge. */
export async function BookingBar() {
  const supabase = await createClient();
  const [{ data: courtsData }, { data: programsData }] = await Promise.all([
    supabase.from("courts").select("*").eq("active", true).order("name"),
    supabase.from("programs").select("*").order("price_from"),
  ]);
  const courts = (courtsData ?? []) as Court[];
  const programs = (programsData ?? []) as Program[];

  return (
    <div
      className="enter-up relative z-20 mx-auto mt-8 w-full max-w-[1400px] px-5 sm:mt-10 sm:px-8"
      style={{ animationDelay: "600ms" }}
    >
      {/* Opaque white, not translucent cream: it now sits ON cream, so the card
          needs its own value to separate from the band behind it. */}
      <form
        action="/book"
        className="rounded-2xl border border-navy/10 bg-white shadow-[0_18px_44px_-24px_rgba(11,27,43,0.30)]"
      >
        {/* Three fields, not four: exact time-slot picking depends on real
            availability, which can't live in a plain <select> — that choice
            happens on /book itself. This bar's job is just to route there. */}
        <div className="grid grid-cols-1 divide-y divide-navy/10 sm:grid-cols-3 lg:grid-cols-[repeat(3,1fr)_auto] lg:divide-x lg:divide-y-0">
          <label className="block px-6 py-4">
            <span className={LABEL}>Court</span>
            <select name="court" className={`${FIELD} mt-1.5`} defaultValue={courts[0]?.id ?? ""}>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block px-6 py-4">
            <span className={LABEL}>Date</span>
            <input type="date" name="date" className={`${FIELD} mt-1.5`} />
          </label>

          <label className="block px-6 py-4">
            <span className={LABEL}>Session Type</span>
            <select name="program" className={`${FIELD} mt-1.5`} defaultValue={programs[0]?.id ?? ""}>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center justify-end p-3">
            <button
              type="submit"
              aria-label="Search availability"
              className="flex h-14 w-full items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald lg:w-14"
            >
              <svg width="19" height="19" viewBox="0 0 19 19" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="8" cy="8" r="6" />
                <path d="m12.5 12.5 4 4" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
```

`FIELD` and `LABEL` (defined earlier in the same file, above `Hero`) are untouched — keep them exactly as they are.

- [ ] **Step 2: Remove the now-dead `locations` export from site.ts**

In `src/content/site.ts`, delete the `/** Booking-bar venues... */ export const locations = [...]` block. This also resolves a standing inconsistency: `locations` offered three fake venues while the product was always meant to have one.

- [ ] **Step 3: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 4: Manual test**

`npm run dev`, visit `/`. The hero's booking bar now shows Court (Court 1/2/3), Date, Session Type (the four real programmes) — three fields, not four. Pick values and submit: the browser navigates to `/book?court=<uuid>&date=<date>&program=<uuid>` (a 404 until Task 7 — expected).

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.tsx src/content/site.ts
git commit -m "feat(db): booking bar reads real courts and programmes"
```

---

### Task 7: The real booking flow

**Files:**
- Create: `src/app/book/availability.ts`
- Create: `src/app/book/actions.ts`
- Create: `src/app/book/page.tsx`

**Interfaces:**
- Consumes: `createClient()` (server.ts), `Court`/`Program`/`Booking` types (Task 2), `Nav` requiring `session` prop (Task 4), the query parameter names `court`/`date`/`program` that Task 6's `BookingBar` produces.
- Produces: `computeAvailableSlots(date, existingBookings): Slot[]` — a pure function with no Supabase dependency, callable in isolation.

- [ ] **Step 1: Write the availability calculator**

Create `src/app/book/availability.ts`:

```ts
import type { Booking } from "@/lib/supabase/types";

/**
 * Academy hours, matching src/content/site.ts's stated 06:00–22:00 window.
 * A single fixed window every day, not a per-weekday schedule table — there
 * is no admin UI to edit such a table anyway (spec decision 6), so encoding
 * one would be unused flexibility.
 */
const OPEN_HOUR = 6;
const CLOSE_HOUR = 22;
const SLOT_MINUTES = 60;

/** The academy's one venue is in Metro Manila; a fixed UTC+8 offset is
 * baked in rather than threading timezone plumbing through for a single
 * market — see PRODUCT.md's Philippines-only operating context. */
const TZ_OFFSET = "+08:00";

export type Slot = {
  startsAt: string; // ISO instant
  endsAt: string; // ISO instant
  label: string; // "6:00 AM"
};

/**
 * Every hourly slot for the given local date ("YYYY-MM-DD") that does not
 * overlap any of `existingBookings`. Pure function, no I/O — the caller
 * fetches existingBookings from Supabase and passes them in.
 */
export function computeAvailableSlots(
  date: string,
  existingBookings: Pick<Booking, "starts_at" | "ends_at">[],
): Slot[] {
  const slots: Slot[] = [];

  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    const startsAt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00${TZ_OFFSET}`);
    const endsAt = new Date(startsAt.getTime() + SLOT_MINUTES * 60_000);

    const overlaps = existingBookings.some((b) => {
      const bStart = new Date(b.starts_at).getTime();
      const bEnd = new Date(b.ends_at).getTime();
      return startsAt.getTime() < bEnd && endsAt.getTime() > bStart;
    });

    if (!overlaps) {
      slots.push({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        label: startsAt.toLocaleTimeString("en-PH", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Manila",
        }),
      });
    }
  }

  return slots;
}
```

- [ ] **Step 2: Verify the pure function by hand**

There is no test runner in this project (Global Constraints), so this step is a worked example instead of an automated test — read it and confirm the logic matches:

Input: `computeAvailableSlots("2030-01-01", [{ starts_at: "2030-01-01T02:00:00.000Z", ends_at: "2030-01-01T03:00:00.000Z" }])`.

That existing booking is `10:00–11:00` in UTC+8 (02:00 UTC + 8 hours). Walking the loop: hours 6–9 produce slots normally (no overlap). Hour 10 (`10:00–11:00+08:00`) overlaps exactly with the existing booking — excluded. Hour 11 onward resumes. Expected output: 15 slots (hours 6,7,8,9,11,12,...,21 — that's 16 hours in the 6–22 range minus 1 excluded = 15), none of them starting at 10:00 Manila time.

- [ ] **Step 3: Write the booking action**

Create `src/app/book/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createBooking(formData: FormData) {
  const courtId = String(formData.get("court_id") ?? "");
  const programId = String(formData.get("program_id") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const date = String(formData.get("date") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = new URLSearchParams({ court: courtId, date, program: programId });

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/book?${params.toString()}`)}`);
  }

  const { error } = await supabase.from("bookings").insert({
    court_id: courtId,
    program_id: programId,
    player_id: user.id,
    starts_at: startsAt,
    ends_at: endsAt,
  });

  if (error) {
    // 23P01 = exclusion_violation: the no_double_booking constraint fired,
    // meaning the slot was taken between this page loading and submitting.
    const message = error.code === "23P01" ? "That slot was just taken — pick another." : "Something went wrong — try again.";
    redirect(`/book?${params.toString()}&error=${encodeURIComponent(message)}`);
  }

  redirect(`/book?${params.toString()}&booked=1`);
}
```

- [ ] **Step 4: Write the booking page**

Create `src/app/book/page.tsx`:

```tsx
import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots } from "./availability";
import { createBooking } from "./actions";
import type { Booking, Court, Program } from "@/lib/supabase/types";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string; date?: string; program?: string; error?: string; booked?: string }>;
}) {
  const { court, date, program, error, booked } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: courtsData }, { data: programsData }] = await Promise.all([
    supabase.from("courts").select("*").eq("active", true).order("name"),
    supabase.from("programs").select("*").order("price_from"),
  ]);
  const courts = (courtsData ?? []) as Court[];
  const programs = (programsData ?? []) as Program[];

  const selectedCourt = court ?? courts[0]?.id ?? "";
  const selectedDate = date ?? new Date().toISOString().slice(0, 10);
  const selectedProgram = program ?? programs[0]?.id ?? "";

  let slots: ReturnType<typeof computeAvailableSlots> = [];
  if (selectedCourt) {
    const dayStart = `${selectedDate}T00:00:00+08:00`;
    const dayEnd = `${selectedDate}T23:59:59+08:00`;
    const { data: existing } = await supabase
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("court_id", selectedCourt)
      .eq("status", "confirmed")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd);

    slots = computeAvailableSlots(selectedDate, (existing ?? []) as Pick<Booking, "starts_at" | "ends_at">[]);
  }

  return (
    <>
      <Nav session={user ? { email: user.email ?? "" } : null} />
      <main id="main" className="mx-auto max-w-[1000px] px-5 pb-20 pt-[110px] sm:px-8">
        <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] text-navy">Book a court</h1>

        {booked && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-[15px] text-emerald-800">
            Booked. See it on your{" "}
            <a href="/account" className="font-semibold underline">
              account page
            </a>
            .
          </p>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-700">{error}</p>}

        <form method="get" className="mt-8 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="block text-[13px] font-medium text-navy/70">Court</span>
            <select
              name="court"
              defaultValue={selectedCourt}
              className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
            >
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-[13px] font-medium text-navy/70">Date</span>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
            />
          </label>
          <label className="block">
            <span className="block text-[13px] font-medium text-navy/70">Programme</span>
            <select
              name="program"
              defaultValue={selectedProgram}
              className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <Button size="sm" variant="outline" className="sm:col-span-3">
            Check availability
          </Button>
        </form>

        <h2 className="mt-10 text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">
          Available times, {selectedDate}
        </h2>

        {slots.length === 0 ? (
          <p className="mt-4 text-[15px] text-navy/60">No open slots this day. Try another date.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {slots.map((slot) => (
              <li key={slot.startsAt}>
                <form action={createBooking}>
                  <input type="hidden" name="court_id" value={selectedCourt} />
                  <input type="hidden" name="program_id" value={selectedProgram} />
                  <input type="hidden" name="date" value={selectedDate} />
                  <input type="hidden" name="starts_at" value={slot.startsAt} />
                  <input type="hidden" name="ends_at" value={slot.endsAt} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-navy/15 py-3 text-[14px] font-medium text-navy transition-colors hover:border-emerald-600 hover:bg-emerald-50"
                  >
                    {slot.label}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {!user && (
          <p className="mt-6 text-[14px] text-navy/60">
            Picking a time will ask you to{" "}
            <a href="/sign-in?next=/book" className="font-semibold text-emerald-700">
              sign in
            </a>
            .
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 6: Manual test — signed out**

`npm run dev`, sign out if signed in, visit `/book`. Confirm courts/programmes/slots render, and clicking a time slot redirects to `/sign-in?next=%2Fbook%3F...` rather than creating a booking.

- [ ] **Step 7: Manual test — signed in, happy path**

Sign in. Visit `/book`, pick a court/date/programme, click an available time. Expect a redirect back to `/book?...&booked=1` showing the green confirmation. In the Supabase SQL Editor: `select * from bookings order by created_at desc limit 1;` — confirm the row exists with the right `court_id`, `program_id`, `player_id` (your account), `starts_at`/`ends_at`.

- [ ] **Step 8: Manual test — the constraint actually holds**

With the booking from Step 7 still `confirmed`, reload the same `/book?court=...&date=...` URL. Confirm the time slot you just booked no longer appears in the available list. This is the applicationlevel proof that Task 1's `no_double_booking` constraint and this task's availability query agree with each other.

- [ ] **Step 9: Commit**

```bash
git add src/app/book
git commit -m "feat(booking): real booking flow against live availability"
```

---

### Task 8: Account page

**Files:**
- Create: `src/app/account/actions.ts`
- Create: `src/app/account/page.tsx`

**Interfaces:**
- Consumes: `createClient()` (server.ts), `Court`/`Program`/`Booking`/`Membership` types (Task 2), `Nav` requiring `session` (Task 4).
- Produces: nothing later tasks depend on — this is the last task in the plan.

- [ ] **Step 1: Write the cancel action**

Create `src/app/account/actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function cancelBooking(formData: FormData) {
  const bookingId = String(formData.get("booking_id") ?? "");

  const supabase = await createClient();
  // No ownership check here beyond what RLS already guarantees: the
  // bookings_own_update policy means this update can only ever touch a row
  // where player_id = auth.uid(), regardless of which booking_id is submitted.
  await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId);

  revalidatePath("/account");
}
```

- [ ] **Step 2: Write the account page**

Create `src/app/account/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "./actions";
import type { Booking, Court, Program, Membership } from "@/lib/supabase/types";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/account");
  }

  const [{ data: bookingsData }, { data: courtsData }, { data: programsData }, { data: membershipData }] = await Promise.all([
    supabase.from("bookings").select("*").eq("status", "confirmed").order("starts_at"),
    supabase.from("courts").select("*"),
    supabase.from("programs").select("*"),
    supabase.from("memberships").select("*").maybeSingle(),
  ]);

  const bookings = (bookingsData ?? []) as Booking[];
  const courts = (courtsData ?? []) as Court[];
  const programs = (programsData ?? []) as Program[];
  const membership = membershipData as Membership | null;

  const courtName = (id: string) => courts.find((c) => c.id === id)?.name ?? "Court";
  const programTitle = (id: string) => programs.find((p) => p.id === id)?.title ?? "Session";

  return (
    <>
      <Nav session={{ email: user.email ?? "" }} />
      <main id="main" className="mx-auto max-w-[800px] px-5 pb-20 pt-[110px] sm:px-8">
        <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] text-navy">Your account</h1>
        <p className="mt-2 text-[15px] text-navy/65">{user.email}</p>

        <section className="mt-10">
          <h2 className="text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">Membership</h2>
          {membership ? (
            <p className="mt-3 text-[15px] text-navy/80">
              {membership.status} · {membership.hours_remaining} hours remaining
            </p>
          ) : (
            <p className="mt-3 text-[15px] text-navy/60">No active membership.</p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">Upcoming bookings</h2>
          {bookings.length === 0 ? (
            <p className="mt-3 text-[15px] text-navy/60">
              Nothing booked yet.{" "}
              <a href="/book" className="font-semibold text-emerald-700">
                Book a court
              </a>
              .
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 rounded-xl border border-navy/10 px-5 py-4">
                  <div>
                    <p className="text-[15px] font-semibold text-navy">
                      {courtName(b.court_id)} · {programTitle(b.program_id)}
                    </p>
                    <p className="text-[14px] text-navy/60">
                      {new Date(b.starts_at).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Manila",
                      })}
                    </p>
                  </div>
                  <form action={cancelBooking}>
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button type="submit" className="text-[14px] font-semibold text-red-700 hover:underline">
                      Cancel
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 3: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 4: Manual test**

Signed out, visit `/account` — confirm a redirect to `/sign-in?next=%2Faccount`. Sign in, land on `/account`, confirm the booking created in Task 7 appears with the right court/programme/time. Click Cancel; confirm the booking disappears from the list and, in the SQL Editor, `select status, cancelled_at from bookings where id = '<that id>';` shows `cancelled` with a timestamp.

- [ ] **Step 5: Commit**

```bash
git add src/app/account
git commit -m "feat(account): player account page with booking cancellation"
```

---

## Self-Review

**Spec coverage:**
- Schema, RLS, storage bucket, `is_admin()`, `handle_new_user`, `prevent_role_self_escalation` → Task 1. ✓
- `@supabase/ssr` client factories, `.env.local` already wired, no ORM → Task 2. ✓
- Email+password sign-up/sign-in → Task 3. ✓
- Booking bar becomes real, live availability, DB constraint as final word → Tasks 6–7. ✓
- Minimal `/account` page with cancellation → Task 8. ✓
- Coach/programme photo slots read from Storage → Task 5. ✓
- `supabase/seed.sql`, `supabase/smoke.sql` → Task 1. ✓
- Explicitly-excluded items (custom `/admin`, coach dashboard, Stripe, magic-link/OAuth) → none built, confirmed by absence from the File Structure section. ✓
- `PRODUCT.md` principle 5 (model the second venue) → added as a disclosed deviation (`venues` table), Task 1. ✓

**Placeholder scan:** no TBD/TODO; every step has real, runnable code or a fully worked manual-test example (Task 7 Step 2 spells out the exact expected slot count rather than saying "verify it works").

**Type consistency:** `Court`, `Program`, `Coach`, `Booking`, `Membership`, `Profile` are defined once in Task 2 and every later task imports that exact name — checked Tasks 5, 6, 7, 8 against Task 2's definitions field-by-field. `Nav`'s `session` prop shape (`{ email: string } | null`) is identical everywhere it's constructed (Tasks 4, 7, 8). `computeAvailableSlots(date, existingBookings)` signature matches between its Task 7 Step 1 definition and its Step 4 call site.

**Scope check:** eight tasks, one subsystem (the database and its minimal consuming UI), no independent second subsystem hiding inside it. Phase 3 (Stripe) is untouched.
