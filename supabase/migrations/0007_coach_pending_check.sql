-- coachSignIn needs to tell "no account yet — application still pending"
-- apart from "wrong password", so it can send a pending applicant back to
-- the waiting room instead of a confusing auth error. Same pattern as
-- is_coach_application_approved(): security definer, boolean only, no row
-- data ever leaves the function.
create function has_pending_coach_application(check_email text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from coach_applications
    where lower(email) = lower(check_email) and status = 'pending'
  );
$$;
