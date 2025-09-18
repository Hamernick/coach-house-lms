-- Add PDF deck path for modules.
alter table modules
  add column if not exists deck_path text;

-- Down migration (manual). To revert: alter table modules drop column deck_path;
