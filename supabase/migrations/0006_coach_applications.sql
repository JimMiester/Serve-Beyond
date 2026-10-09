-- Coach accounts can no longer be created on demand. Applying and creating
-- a login are now two separate steps: an application row here, reviewed by
-- an admin, has to exist and be approved BEFORE the matching auth account
-- is allowed to become a coach. This tightens 0002/0005: coach_approved
-- used to only gate the already-created account; now it's set correctly
-- at account-creation time itself, by the database, not by trusting
-- whatever the signup request claims about itself.

create table coach_applications (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       text not null,
  phone       text not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table coach_applications enable row level security;

-- Anyone can submit an application (no account exists yet to scope this
-- to), but the check forces every self-submitted row to start pending —
-- nobody can insert their way into 'approved'.
create policy coach_applications_public_insert on coach_applications
  for insert to anon, authenticated
  with check (status = 'pending');

create policy coach_applications_admin_read on coach_applications
  for select using (is_admin());

create policy coach_applications_admin_update on coach_applications
  for update using (is_admin()) with check (is_admin());

-- The one place "does this email have an approved application" is
-- checked — mirrors is_admin()'s pattern. security definer so it can see
-- into a table the calling (often anonymous, pre-account) request has no
-- direct read access to; it only ever returns a boolean, never rows.
create function is_coach_application_approved(check_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from coach_applications
    where lower(email) = lower(check_email) and status = 'approved'
  );
$$;

-- handle_new_user() previously trusted raw_user_meta_data.intended_role at
-- face value for `intended_role` (a cosmetic column, so that was fine) but
-- never granted coach_approved from it. Now it actively re-derives whether
-- this signup is allowed to start approved, from the real table, so a
-- crafted signup request claiming intended_role=coach cannot grant itself
-- coach access — only a prior admin-approved application can.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := nullif(new.raw_user_meta_data ->> 'intended_role', '');
begin
  insert into public.profiles (id, intended_role, full_name, phone, coach_approved)
  values (
    new.id,
    requested_role,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    requested_role = 'coach' and is_coach_application_approved(new.email)
  );
  return new;
end;
$$;
