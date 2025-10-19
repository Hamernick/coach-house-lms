-- Adds a subtitle column to classes for short taglines
alter table public.classes add column if not exists subtitle text null;

