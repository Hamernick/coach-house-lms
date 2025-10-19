-- Adds landing video URL and up to 3 additional resource link/title pairs for classes
alter table public.classes add column if not exists video_url text null;
alter table public.classes add column if not exists link1_title text null;
alter table public.classes add column if not exists link1_url text null;
alter table public.classes add column if not exists link2_title text null;
alter table public.classes add column if not exists link2_url text null;
alter table public.classes add column if not exists link3_title text null;
alter table public.classes add column if not exists link3_url text null;

