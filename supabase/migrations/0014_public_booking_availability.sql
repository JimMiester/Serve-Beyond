-- Run once in the Supabase SQL Editor.

-- /book's own slot-availability query (court-level "existing" bookings in
-- book/data.ts and book/actions.ts) has always gone through each caller's
-- own RLS-scoped session, and bookings_own_read only ever lets a player
-- see their *own* rows. So this query could never actually see another
-- player's booking on the same court — a different player (or a signed-
-- out visitor) always saw every slot as open, no matter who else had
-- booked it. The old no_double_booking EXCLUDE constraint silently
-- covered for this (the real INSERT was still correctly rejected), so it
-- surfaced only as a late, confusing error instead of the slot just not
-- being offered — same shape of bug as 0012/0013, just at the
-- application layer instead of the trigger.
--
-- Fix: a view exposing only the columns availability math needs (never
-- player_id, so this doesn't leak who booked what), owned by this
-- migration's role same as every other table here — a Postgres view
-- runs with its owner's RLS standing by default, not the querying
-- user's, so this bypasses bookings_own_read for anyone selecting from
-- it, the same way check_booking_capacity() bypasses it from inside a
-- trigger.
create view booking_slots as
  select court_id, program_id, starts_at, ends_at
  from bookings
  where status = 'confirmed';

grant select on booking_slots to anon, authenticated;
