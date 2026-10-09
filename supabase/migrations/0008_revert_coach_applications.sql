-- Reverts 0006/0007. Requiring an approved application to exist BEFORE an
-- account could be created was real friction in practice: an applicant had
-- no account to point to, "approved" didn't mean "usable," and they had to
-- know to sign up a second time afterward. Back to the simpler model —
-- signing up as a coach creates a real, working Supabase Auth account
-- immediately, exactly like a player account. coach_approved (from 0002)
-- still gates the coach dashboard itself, and an admin still has to flip
-- it by hand; only the "the account doesn't exist until then" part is gone.

drop function if exists is_coach_application_approved(text);
drop function if exists has_pending_coach_application(text);
drop table if exists coach_applications;

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
