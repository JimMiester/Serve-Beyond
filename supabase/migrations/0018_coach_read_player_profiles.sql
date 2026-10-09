-- Run once in the Supabase SQL Editor.

-- /coach/schedule already joins profiles(full_name) to show who each
-- booking is with, but profiles_own_read only lets a coach see their OWN
-- profile — so that join always came back null and every row showed
-- "Player" instead of a name. Same pattern as bookings_coach_read
-- (0005): visibility only into players the coach actually has a
-- confirmed booking with, never the whole player list.
create policy profiles_coach_read on profiles for select using (
  id in (
    select player_id from bookings
    where status = 'confirmed'
      and coach_id in (select id from coaches where profile_id = auth.uid())
  )
);
