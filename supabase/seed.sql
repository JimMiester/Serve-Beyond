-- Sample data matching src/content/site.ts, so the real schema can be
-- exercised with realistic-looking content. Safe to re-run: every insert
-- is guarded so a second run doesn't duplicate rows.

insert into venues (id, name)
  values ('00000000-0000-0000-0000-000000000001', 'Ortigas Indoor Tennis Centre')
  on conflict (id) do nothing;

insert into courts (venue_id, name)
select '00000000-0000-0000-0000-000000000001', name
from (values ('Court 1'), ('Court 2'), ('Court 3')) as t(name)
where not exists (select 1 from courts where courts.name = t.name);

insert into coaches (name, role, cert, years, focus)
select * from (values
  ('Marcus Vaughn', 'Head Coach', 'PTR Professional', 12, 'Serve mechanics · Singles strategy'),
  ('Priya Raman', 'Performance Coach', 'LTA Level 4', 9, 'Junior pathway · Footwork'),
  ('Danny Oyelaran', 'Club Coach', 'LTA Level 3', 6, 'Doubles · Adult beginners')
) as t(name, role, cert, years, focus)
where not exists (select 1 from coaches where coaches.name = t.name);

-- capacity: how many players can share one court+time slot in this
-- programme (see 0011_group_booking_capacity.sql) — 1 for Private
-- Coaching (always one-to-one), 4 for every group-format programme.
insert into programs (slug, title, blurb, price_from, price_unit, capacity)
values
  ('private', 'Private Coaching', 'One-to-one with a certified coach. Video review every third session.', 1500, 'hour', 1),
  ('group', 'Group Clinics', 'Four players, one coach, ninety minutes of drills and live ball.', 550, 'person', 4),
  ('junior', 'Junior Academy', 'Ages 6–16, streamed by level across red, orange and green pathways.', 400, 'session', 4),
  ('match', 'Match Play', 'Supervised competitive sets with a coach courtside calling patterns.', 700, 'person', 4),
  ('entry-level', 'Entry Level', 'New to tennis or coming back after years off. Grip, footwork, and your first real rally.', 450, 'session', 4),
  ('intermediate', 'Intermediate', 'Consistent strokes already there — this sharpens placement, spin, and point construction.', 600, 'session', 4),
  ('advanced', 'Advanced', 'Competitive players sharpening tactics, serve variation, and match-speed decision-making.', 750, 'session', 4)
on conflict (slug) do update set capacity = excluded.capacity;
