set check_function_bodies = off;
set search_path = public;

alter table programs add column if not exists team_ids text[] not null default '{}'::text[];

