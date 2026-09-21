-- Run after migration + seed, and after at least one account has signed up
-- (Task 3). A clean run with only NOTICEs, no ERRORs, means pass.
--
-- The RLS policies are NOT re-verified here: this SQL Editor connection runs
-- as an elevated Postgres role that bypasses RLS by default, so a query run
-- here proves nothing about whether a real request would be blocked. RLS is
-- actually exercised — and actually proven — through the app in Task 3
-- (two separate signed-in accounts) and Task 7 (a real booking against the
-- anon-key-constrained client).

-- 1. Structural check: every table that should have RLS policies has them.
do $$
declare
  missing text;
begin
  select string_agg(t, ', ') into missing
  from (values ('venues'),('courts'),('coaches'),('programs'),('profiles'),('bookings'),('memberships')) as expected(t)
  where not exists (
    select 1 from pg_policies where pg_policies.tablename = expected.t
  );

  if missing is not null then
    raise exception 'FAIL: no RLS policy found for: %', missing;
  end if;

  raise notice 'PASS: every expected table has at least one RLS policy';
end $$;

-- 2. Behavioral check: the EXCLUDE constraint actually rejects an overlap.
-- This one runs as the elevated role but the constraint applies regardless
-- of role, so it's a real, reliable check here.
do $$
declare
  v_court   uuid;
  v_program uuid;
  v_player  uuid;
begin
  select id into v_court from courts limit 1;
  select id into v_program from programs limit 1;
  select id into v_player from profiles limit 1;

  if v_player is null then
    raise notice 'SKIP: no profiles row yet — sign up one test account (Task 3), then re-run.';
    return;
  end if;

  insert into bookings (court_id, player_id, program_id, starts_at, ends_at)
  values (v_court, v_player, v_program, '2030-01-01 10:00+08', '2030-01-01 11:00+08');

  begin
    insert into bookings (court_id, player_id, program_id, starts_at, ends_at)
    values (v_court, v_player, v_program, '2030-01-01 10:30+08', '2030-01-01 11:30+08');
    raise exception 'FAIL: an overlapping booking was accepted';
  exception when exclusion_violation then
    raise notice 'PASS: overlapping booking correctly rejected';
  end;

  delete from bookings where court_id = v_court and starts_at = '2030-01-01 10:00+08';
end $$;
