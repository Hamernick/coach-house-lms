set check_function_bodies = off;
set search_path = public;

alter table public.profiles
  add column if not exists company text,
  add column if not exists contact text,
  add column if not exists about text;
