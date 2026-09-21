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
