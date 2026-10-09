-- Run once in the Supabase SQL Editor.

-- 0012's `alter function ... security definer` didn't actually stop the
-- trigger's internal counts from being RLS-filtered (verified directly:
-- a Private Coaching booking still slipped into a slot already full of
-- Group Clinics bookings). Rather than trust SECURITY DEFINER's ownership
-- semantics a second time, this recreates the function from scratch and
-- adds `set local row_security = off` — Postgres's explicit, unambiguous
-- way to bypass RLS for the rest of the current transaction, available to
-- the function owner. Belt and suspenders: both SECURITY DEFINER and this
-- are kept together.

drop trigger if exists booking_capacity_check on bookings;
drop function if exists check_booking_capacity();

create function check_booking_capacity() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_other_programme_count integer;
  v_same_programme_count integer;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  -- Explicit RLS bypass for this transaction, on top of SECURITY DEFINER —
  -- see the migration comment above for why both are here.
  set local row_security = off;

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
$$;

create trigger booking_capacity_check
  before insert or update on bookings
  for each row execute function check_booking_capacity();
