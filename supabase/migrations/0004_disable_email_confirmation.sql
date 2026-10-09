-- This is a portfolio project, not a production app taking real signups
-- from strangers — email verification was unnecessary friction. Revert to
-- creating the profiles row immediately on signup.
--
-- Requires "Confirm email" turned OFF in the Supabase dashboard
-- (Authentication -> Providers -> Email). With it off, auth.users rows
-- are inserted with email_confirmed_at already set, so 0003's trigger
-- (which only fires on an UPDATE transition from null -> not null) would
-- never run and no profiles row would ever be created. This restores the
-- original on_auth_user_created INSERT trigger from 0001_init.sql; the
-- handle_new_user() function body itself is unchanged.
drop trigger on_auth_user_confirmed on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();
