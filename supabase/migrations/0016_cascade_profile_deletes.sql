-- Run once in the Supabase SQL Editor.

-- bookings.player_id, memberships.player_id/updated_by and
-- coaches.profile_id all referenced profiles(id) with no delete rule, so
-- an account with any booking or membership couldn't be deleted at all —
-- not even by the project owner through the Supabase dashboard (this
-- session's test-admin cleanup hit exactly that wall). A booking or
-- membership belongs to its player, so it goes with the account; a
-- coach's staff record doesn't, so deleting the login just unlinks it.

alter table bookings drop constraint bookings_player_id_fkey;
alter table bookings add constraint bookings_player_id_fkey
  foreign key (player_id) references profiles(id) on delete cascade;

alter table memberships drop constraint memberships_player_id_fkey;
alter table memberships add constraint memberships_player_id_fkey
  foreign key (player_id) references profiles(id) on delete cascade;

alter table memberships drop constraint memberships_updated_by_fkey;
alter table memberships add constraint memberships_updated_by_fkey
  foreign key (updated_by) references profiles(id) on delete set null;

alter table coaches drop constraint coaches_profile_id_fkey;
alter table coaches add constraint coaches_profile_id_fkey
  foreign key (profile_id) references profiles(id) on delete set null;
