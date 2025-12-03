set check_function_bodies = off;
set search_path = public;

alter table public.organizations
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision;

comment on column public.organizations.location_lat is 'Geocoded latitude for primary organization address';
comment on column public.organizations.location_lng is 'Geocoded longitude for primary organization address';
