-- Coaches can now log in. 0002_intended_role.sql added coach_approved for
-- exactly this moment: "if a self-service path is ever added later, the
-- door is already shut rather than left open by omission." This migration
-- opens that door deliberately, by hand — an admin still links each
-- account to a coaches row themselves (see supabase/smoke.sql-style notes
-- in the app), there is no self-service signup as a coach.

-- Links an approved profile to its bio row in the existing coaches
-- directory table. Nullable: most coaches rows may never get a login.
alter table coaches
  add column if not exists profile_id uuid references profiles(id);

-- A coach may read bookings assigned to them (their own coaches row),
-- alongside the existing player/admin read policies (RLS policies for the
-- same command are OR'd together, so this only adds visibility, never
-- removes it).
drop policy if exists bookings_coach_read on bookings;
create policy bookings_coach_read on bookings for select using (
  coach_id in (select id from coaches where profile_id = auth.uid())
);
