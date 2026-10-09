-- Run once in the Supabase SQL Editor.

-- Players can now share one court+time slot on group-format programmes
-- (Group Clinics, Junior Academy, Match Play, Entry Level, Intermediate,
-- Advanced) up to a per-programme capacity. Private Coaching stays
-- exclusive at capacity 1. The old no_double_booking EXCLUDE constraint
-- only ever allowed exactly one confirmed booking per court+time — it
-- can't express "up to N", so it's replaced below by a trigger that can.

alter table programs add column capacity integer not null default 1;
update programs set capacity = 4 where slug <> 'private';

alter table bookings drop constraint no_double_booking;

create or replace function check_booking_capacity() returns trigger as $$
declare
  v_capacity integer;
  v_other_programme_count integer;
  v_same_programme_count integer;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  -- Every slot in this app is a fixed hourly block (see availability.ts),
  -- so two bookings for the same court can only ever overlap by sharing
  -- the exact same starts_at — locking on that pair is enough to
  -- serialize every concurrent insert/update targeting this slot against
  -- every other, including the very first one into an empty slot, where
  -- there's no existing row yet for a plain row lock to catch.
  perform pg_advisory_xact_lock(hashtext(new.court_id::text || new.starts_at::text));

  select count(*) into v_other_programme_count
  from bookings
  where court_id = new.court_id
    and status = 'confirmed'
    and id <> new.id
    and program_id <> new.program_id
    and tstzrange(starts_at, ends_at) && tstzrange(new.starts_at, new.ends_at);

  if v_other_programme_count > 0 then
    raise exception 'This time slot is already booked for a different programme.' using errcode = '23P01';
  end if;

  select capacity into v_capacity from programs where id = new.program_id;

  select count(*) into v_same_programme_count
  from bookings
  where court_id = new.court_id
    and status = 'confirmed'
    and id <> new.id
    and program_id = new.program_id
    and tstzrange(starts_at, ends_at) && tstzrange(new.starts_at, new.ends_at);

  if v_same_programme_count >= v_capacity then
    raise exception 'This session is full.' using errcode = '23P01';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists booking_capacity_check on bookings;
create trigger booking_capacity_check
  before insert or update on bookings
  for each row execute function check_booking_capacity();
