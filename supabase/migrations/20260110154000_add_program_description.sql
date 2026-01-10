set check_function_bodies = off;
set search_path = public;

-- Add description field for programs
alter table programs add column if not exists description text;
