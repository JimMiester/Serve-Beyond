-- Run once in the Supabase SQL Editor.

-- A player can't be on two courts at once. Same guarantee as
-- no_double_booking (0001_init.sql), just scoped to player_id instead of
-- court_id, so it's enforced by Postgres itself even if the app-level
-- check in book/actions.ts and book/data.ts is ever bypassed or racing.
alter table bookings add constraint no_player_double_booking exclude using gist (
  player_id with =,
  tstzrange(starts_at, ends_at) with &&
) where (status = 'confirmed');
