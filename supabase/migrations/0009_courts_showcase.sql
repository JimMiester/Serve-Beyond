-- /courts goes from a bare list of names to a real showcase, same
-- treatment coaches already got: a photo and a short description per
-- court, editable by an admin. courts_admin_write (from 0001_init.sql)
-- already covers writes to these new columns — no RLS change needed.
alter table courts
  add column if not exists photo_path text,
  add column if not exists description text;
