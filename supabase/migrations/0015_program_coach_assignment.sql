-- Run once in the Supabase SQL Editor.

-- Admin can now assign one coach per class (programme). bookings.coach_id
-- already existed (0001_init.sql) and the coach's own /coach/schedule
-- page already reads by it, but nothing ever set it, so that page has
-- always shown "No sessions assigned yet" — this is the missing half.
alter table programs add column coach_id uuid references coaches(id);
