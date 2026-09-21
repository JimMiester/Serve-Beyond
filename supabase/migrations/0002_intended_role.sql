-- "Coach" is not a real account role today — coaches are a separate,
-- admin-curated table of static bios with no login (see 0001_init.sql).
-- intended_role is a cosmetic signal only: what a new player says they
-- are at sign-up, so an admin can find candidates. It is NOT the `role`
-- column and grants nothing by itself — a user can freely change it about
-- themselves, same as full_name or phone.
--
-- coach_approved is the actual decision, and it must be admin-only: this
-- is the literal database expression of "approval is by the admin's
-- discretion." Nothing in the app ever sets it to true today (no admin
-- panel exists yet) — it exists so an admin can flip it by hand, and so
-- that if a self-service path is ever added later, the door is already
-- shut rather than left open by omission.
alter table profiles
  add column intended_role text check (intended_role in ('player', 'coach')),
  add column coach_approved boolean not null default false;

-- handle_new_user() previously inserted only `id`, leaving every new
-- profile role-blank of intent. supabase.auth.signUp's `options.data`
-- lands in auth.users.raw_user_meta_data, which is the only channel this
-- trigger has to see anything the client sent at signup time.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, intended_role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'intended_role', '')
  );
  return new;
end;
$$;

-- Extend the existing role-protection trigger to also cover coach_approved:
-- same reasoning as `role` (RLS controls rows, not columns), same owner
-- ('players can update their own profiles' policy would otherwise let
-- someone flip this on themselves the moment anything reads it).
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not is_admin() then
    raise exception 'role cannot be changed by its own owner';
  end if;
  if new.coach_approved <> old.coach_approved and not is_admin() then
    raise exception 'coach_approved cannot be changed by its own owner';
  end if;
  return new;
end;
$$;
