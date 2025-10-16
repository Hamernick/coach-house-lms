-- Ensure modules have a publication flag used by the app/admin.
alter table modules
  add column if not exists is_published boolean not null default true;

-- No down migration included (drop column) to keep history.
