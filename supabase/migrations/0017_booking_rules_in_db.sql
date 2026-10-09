-- Run once in the Supabase SQL Editor.

-- Every booking rule up to now has lived only in the app (book/data.ts,
-- book/actions.ts): slot shape, opening hours, the 3-month window. Any
-- signed-in user can already call the Supabase REST API directly and skip
-- all of it — insert a 5-hour "session" at 3am on a day the club is
-- closed, a year from now. These checks move into check_booking_capacity()
-- (0011/0013), the one trigger every confirmed insert or update already
-- goes through, so the database is the actual authority regardless of
-- what calls it.
--
-- Hours mirror src/content/site.ts's `hours` table by hand, since SQL
-- can't import a TypeScript module — if that file's hours ever change,
-- this block needs the matching edit.

create or replace function check_booking_capacity() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_other_programme_count integer;
  v_same_programme_count integer;
  v_active_count integer;
  v_local_ts timestamp;
  v_dow integer;
  v_open_hour integer;
  v_close_hour integer;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  set local row_security = off;

  -- Slot shape: exactly one hour, starting on the hour.
  if new.ends_at <> new.starts_at + interval '1 hour' then
    raise exception 'A session must be exactly one hour long.' using errcode = '23514';
  end if;
  if date_trunc('hour', new.starts_at at time zone 'Asia/Manila') <> (new.starts_at at time zone 'Asia/Manila') then
    raise exception 'Sessions start on the hour.' using errcode = '23514';
  end if;

  -- No bookings in the past, none more than 3 months ahead.
  if new.starts_at <= now() then
    raise exception 'That time has already passed.' using errcode = '23514';
  end if;
  if new.starts_at > now() + interval '3 months' then
    raise exception 'Bookings can only be made up to 3 months ahead.' using errcode = '23514';
  end if;

  -- Opening hours, by weekday, in Asia/Manila wall-clock time.
  v_local_ts := new.starts_at at time zone 'Asia/Manila';
  v_dow := extract(dow from v_local_ts); -- 0 = Sunday .. 6 = Saturday
  if v_dow = 0 then
    v_open_hour := 8; v_close_hour := 18; -- Sunday
  elsif v_dow = 6 then
    v_open_hour := 7; v_close_hour := 20; -- Saturday
  else
    v_open_hour := 6; v_close_hour := 22; -- Mon-Fri
  end if;
  if extract(hour from v_local_ts) < v_open_hour or extract(hour from v_local_ts) >= v_close_hour then
    raise exception 'That time is outside opening hours.' using errcode = '23514';
  end if;

  -- Per-player cap on upcoming confirmed bookings, so one account (or
  -- script) can't hold open every slot on the calendar.
  select count(*) into v_active_count
  from bookings
  where player_id = new.player_id
    and status = 'confirmed'
    and starts_at > now()
    and id <> new.id;
  if v_active_count >= 10 then
    raise exception 'You can have at most 10 upcoming bookings at a time.' using errcode = '23514';
  end if;

  -- Serializes every concurrent insert/update targeting this exact
  -- court+start-time against each other (even the very first one into an
  -- empty slot, where there's no existing row yet to lock with FOR
  -- UPDATE) so the capacity count below can never be read by two
  -- transactions at once.
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

-- Speeds up both this trigger's own lookups and booking_slots (0014),
-- which previously had no index to use at all since no_double_booking's
-- EXCLUDE index was dropped in 0011.
create index if not exists bookings_court_starts_at_confirmed_idx
  on bookings (court_id, starts_at)
  where status = 'confirmed';
