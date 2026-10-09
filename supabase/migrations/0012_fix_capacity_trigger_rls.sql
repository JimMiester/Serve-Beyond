-- Run once in the Supabase SQL Editor.

-- check_booking_capacity() (0011) runs as SECURITY INVOKER by default —
-- the calling player's own role — so its internal `select count(*) from
-- bookings` was silently filtered by the bookings_own_read RLS policy
-- (player_id = auth.uid() or is_admin()) down to just that player's own
-- rows. Every conflict check against *other* players' bookings on the
-- same slot returned 0, so capacity and cross-programme enforcement
-- never actually fired for anyone but admins. SECURITY DEFINER makes it
-- run as the function's owner instead, bypassing RLS for these internal
-- checks the way the exclusion constraint it replaced always did
-- (constraint checks are index-level and were never subject to RLS).
-- search_path is pinned to prevent a SECURITY DEFINER search-path attack.
alter function check_booking_capacity() security definer set search_path = public;
