# Phase 2 — Database Design

Status: approved by user, pending implementation plan.

## Context

Phase 1 (UI) shipped a static homepage with entirely invented content
(`src/content/site.ts`) and a booking bar that submits to a 404. Phase 2 gives
the site a real backend: Supabase Postgres, Auth, and Storage. Phase 3
(Stripe, test mode only) comes after and is out of scope here.

This is a portfolio/demonstration build (see `PRODUCT.md`) — it will never
take a real payment or a real player's data. Scope decisions below favor the
smallest correct thing over speculative flexibility, per `PRODUCT.md`'s own
principles (courtside-phone design case, client JS earns its place, model the
second venue while shipping the first).

## Decisions this design is built on

Six decisions were made with the user before this was written; each one
forecloses an alternative schema shape, so they're recorded here rather than
left implicit:

1. **Admin model: single front desk.** Two roles total — `player`, `admin`.
   Coaches are read-only data (name, bio, photo); they do not log in and have
   no dashboard. A coach-facing surface was explicitly rejected as scope
   beyond a database phase.
2. **Membership: manually managed.** `hours_remaining` and `status` are
   columns an admin edits directly. No Stripe Subscriptions object, no
   webhook-driven status — that model is deferred until Phase 3 makes it a
   real decision instead of a guess.
3. **Booking grain: specific time slots**, not broad buckets. `react-big-calendar`
   is in the stack for a reason; a booking has a real `starts_at`/`ends_at`,
   and double-booking a court is prevented at the database level, not
   resolved by an admin after the fact.
4. **Coach assignment: after booking, by admin.** A private lesson booking
   does not require picking a coach up front. `bookings.coach_id` is
   nullable and set later. This keeps availability modeling to courts only —
   no per-coach calendar in this phase.
5. **Auth: email + password.** No magic link, no OAuth. Standard, predictable,
   fewest edge cases (no link-expiry handling, no email-deliverability
   dependency at the moment of booking).
6. **Admin surface: Supabase Studio directly.** No custom `/admin` route is
   built in this phase. The `admin` role exists in the database and gates
   what RLS allows, but the interface for using that role is Supabase's own
   dashboard. A custom admin panel is real product scope and belongs to its
   own phase if ever built.

## Architecture

- **Supabase project**: Postgres + Auth + Storage, one project, no local
  Supabase CLI / Docker requirement — the user has already created the cloud
  project this design targets.
- **Next.js integration**: `@supabase/ssr`, Supabase's current official
  package for the App Router. Two client factories:
  - a **server** client (cookie-based, used in Server Components and Server
    Actions) — most reads stay server-rendered, consistent with
    `PRODUCT.md`'s "server-rendered by default" constraint
  - a **browser** client (used only where a client component genuinely needs
    one, e.g. a sign-in form)
- **Credentials**: `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (already gitignored via the
  existing `.env*` pattern). The `service_role` key is never used by this
  project — RLS is the only access-control mechanism, by design, so there is
  no server code that needs to bypass it.
- **Migrations**: plain `.sql` files under `supabase/migrations/`, applied
  via the Supabase SQL editor (no local CLI dependency required for this
  demo's scale; a future phase can adopt `supabase db push` if the project
  ever needs a second environment). No ORM — Postgres is expressive enough
  for this schema, and it keeps the dependency list from growing for a schema
  this size.

## Schema

```sql
-- profiles: one row per auth.users row, created automatically on signup
profiles
  id            uuid PK, references auth.users(id) on delete cascade
  role          text not null default 'player'  check (role in ('player','admin'))
  full_name     text
  phone         text
  created_at    timestamptz not null default now()

courts
  id       uuid PK default gen_random_uuid()
  name     text not null
  active   boolean not null default true

coaches
  id          uuid PK default gen_random_uuid()
  name        text not null
  role        text not null        -- display label, e.g. "Head Coach"
  cert        text
  years       int
  focus       text
  photo_path  text                 -- Storage object path, nullable
  active      boolean not null default true

programs
  id           uuid PK default gen_random_uuid()
  slug         text not null unique   -- 'private' | 'group' | 'junior' | 'match'
  title        text not null
  blurb        text
  price_from   numeric not null
  price_unit   text not null
  photo_path   text

bookings
  id            uuid PK default gen_random_uuid()
  court_id      uuid not null references courts(id)
  player_id     uuid not null references profiles(id)
  coach_id      uuid references coaches(id)          -- nullable: admin assigns later
  program_id    uuid not null references programs(id)
  starts_at     timestamptz not null
  ends_at       timestamptz not null check (ends_at > starts_at)
  status        text not null default 'confirmed' check (status in ('confirmed','cancelled'))
  cancelled_at  timestamptz
  created_at    timestamptz not null default now()

  constraint no_double_booking exclude using gist (
    court_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')

memberships
  id                uuid PK default gen_random_uuid()
  player_id         uuid not null unique references profiles(id)
  status            text not null default 'active' check (status in ('active','paused','cancelled'))
  hours_remaining   numeric not null default 0
  renews_on         date
  updated_by        uuid references profiles(id)   -- audit: which admin last touched this
  updated_at        timestamptz not null default now()
```

`no_double_booking` requires the `btree_gist` extension:

```sql
create extension if not exists btree_gist;
```

**Why an EXCLUDE constraint instead of an app-level "check then insert":** an
application-level overlap check has a race condition — two requests for the
same slot can both pass the check before either INSERT commits, producing a
double-booking under concurrent load. The database constraint makes the
overlapping state impossible to represent at all, regardless of how many
requests arrive simultaneously. This is the standard Postgres pattern for
exactly this problem, not a bespoke solution.

**Payment fields are deliberately absent from `bookings`.** Phase 3 adds
`stripe_payment_intent_id` / `paid_at` when Stripe exists as a real
dependency; today a booking is confirmed the moment it is inserted, matching
the current front-end, which has no payment step.

## Row-Level Security

RLS is enabled on every table below; there is no other access-control layer.

| Table | Read | Write |
|---|---|---|
| `courts`, `coaches`, `programs` | public (no auth required) | admin only |
| `bookings` | own rows; admin sees all | insert/update own rows (`player_id = auth.uid()`); admin any row |
| `memberships` | own row; admin sees all | admin only |
| `profiles` | own row; admin sees all | own row (self-service profile edits) |

Admin is determined by `profiles.role = 'admin'` for the calling
`auth.uid()`, checked via a `is_admin()` SQL function so the same check isn't
duplicated across every policy.

**`role` is not player-editable, and RLS alone can't express that** — a
row-level `USING`/`WITH CHECK` policy has no clean way to say "this column
may not change." A `BEFORE UPDATE` trigger
(`prevent_role_self_escalation()`) does the actual enforcement: it rejects
any update where `NEW.role <> OLD.role` unless the calling user is already
`admin`. The RLS policy above governs *which rows* a player can touch; this
trigger governs *which columns*.

`courts`/`coaches`/`programs` need public read because the homepage already
renders coach bios and programme details without requiring login.

## Storage

- One bucket: `public-media`. Public read, admin-only write (a storage
  policy mirroring the `is_admin()` check).
- Two folders by convention: `coaches/`, `programs/`.
- `coaches.photo_path` / `programs.photo_path` store the relative object
  path; the app builds the public URL from it.
- This is the direct replacement for the `<Skeleton>` placeholders already
  built into `Coaches.tsx` and `Programs.tsx` — same conditional
  (`image ? <Image> : <Skeleton>`), real path instead of an empty string.

## Auth flow

- Sign up: `supabase.auth.signUp({ email, password })`.
- A Postgres trigger (`on_auth_user_created`, firing `handle_new_user()`)
  inserts the matching `profiles` row the instant `auth.users` gets a new
  row — profile creation is atomic with account creation; there is no
  separate client-side request that could succeed on the auth side and fail
  on the profile side.
- Sign in: `supabase.auth.signInWithPassword`.
- No public sign-up path grants `admin`. The one admin account for this demo
  is created the same way as any player, then its `profiles.role` is
  hand-set to `'admin'` via Supabase Studio — consistent with decision 6.

## What this phase builds in the Next.js app

A schema nobody can read or write from the app is inert, so this phase
necessarily includes minimal UI, even though its name is "database":

- `src/lib/supabase/client.ts` and `server.ts` — the two client factories.
- Sign-up and sign-in forms (email + password).
- The booking bar's `<form action="/book">` becomes real: court + date +
  time + programme → live availability read from `courts`/`bookings` →
  confirm → a `bookings` row inserted server-side, with the database
  constraint as the final word on conflicts.
- A minimal `/account` page: a signed-in player's upcoming bookings and
  membership status. Read-only beyond cancelling a booking.
- `Coaches.tsx` / `Programs.tsx` start reading `photo_path` from the
  database/Storage instead of always rendering `<Skeleton>`.

**Explicitly not built here:** a custom `/admin` route, a coach dashboard or
coach login, Stripe or any payment step, magic-link/OAuth sign-in.

## Error handling

- **Slot taken between "select" and "confirm":** the INSERT fails on the
  `no_double_booking` constraint. The booking action catches this specific
  constraint-violation error and returns "That slot was just taken — pick
  another" rather than a generic failure.
- **RLS rejection:** any query that RLS blocks returns an empty result set
  or a permission error from PostgREST; the app treats an unexpected empty
  result on an authenticated request as a bug to surface in development, not
  a silent success.
- **Cancellation window:** the invented cancellation policy already stated
  on the site (free ≥12h, charged inside 12h) is recorded on cancellation
  (`cancelled_at` vs `starts_at` shows whether it was late) but no refund
  logic exists yet — there is nothing to refund until Phase 3 introduces
  payment.

## Testing

No test framework exists in this repo, and choosing one is a decision this
database-phase spec should not make silently. Instead:

- `supabase/seed.sql` — sample courts, coaches, and programs matching the
  content already in `src/content/site.ts`, so the real schema can be
  exercised with realistic-looking data.
- `supabase/smoke.sql` — a handful of assertion-style queries proving the
  properties this design depends on: the `no_double_booking` constraint
  actually rejects an overlapping insert, and RLS actually prevents one
  player's session from reading another player's `bookings` row. Runnable
  directly in the SQL editor; not decorative.

## Open items carried forward, not decided here

- Whether a future phase ever needs per-coach availability (would require
  revisiting decision 4).
- Whether membership ever moves to Stripe Subscriptions (decision 2 defers
  this to Phase 3 on purpose).
