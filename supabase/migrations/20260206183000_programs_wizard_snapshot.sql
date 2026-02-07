set check_function_bodies = off;
set search_path = public;

alter table programs
add column if not exists wizard_snapshot jsonb not null default '{}'::jsonb;
