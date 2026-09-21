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
