create table if not exists public.public_tracked_resource_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  owner_profile_id uuid not null
    references public.public_person_profiles(profile_id) on delete cascade,
  resource_id text not null,
  resource_title text not null,
  target_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint public_tracked_resource_links_owner_resource_key
    unique (owner_profile_id, resource_id, target_url),
  constraint public_tracked_resource_links_code_check
    check (code ~ '^[A-Za-z0-9_-]{8,24}$'),
  constraint public_tracked_resource_links_resource_id_check
    check (char_length(btrim(resource_id)) between 1 and 256),
  constraint public_tracked_resource_links_resource_title_check
    check (char_length(btrim(resource_title)) between 1 and 160),
  constraint public_tracked_resource_links_target_url_check
    check (
      char_length(target_url) <= 2048
      and target_url ~* '^https://[^[:space:]]+$'
    )
);

create table if not exists public.public_tracked_resource_link_daily_opens (
  link_id uuid not null
    references public.public_tracked_resource_links(id) on delete cascade,
  opened_on date not null default (timezone('utc', now()))::date,
  visitor_hash text not null,
  opened_at timestamptz not null default timezone('utc', now()),
  primary key (link_id, opened_on, visitor_hash),
  constraint public_tracked_resource_link_daily_opens_hash_check
    check (visitor_hash ~ '^[a-f0-9]{64}$')
);

create index if not exists public_tracked_resource_links_owner_created_idx
  on public.public_tracked_resource_links (owner_profile_id, created_at desc);

create index if not exists public_tracked_resource_link_daily_opens_link_idx
  on public.public_tracked_resource_link_daily_opens (link_id, opened_on desc);

drop trigger if exists public_tracked_resource_links_set_updated_at
  on public.public_tracked_resource_links;
create trigger public_tracked_resource_links_set_updated_at
before update on public.public_tracked_resource_links
for each row execute function public.handle_updated_at();

create or replace function public.bound_public_tracked_resource_link_daily_opens()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  perform 1
  from public.public_tracked_resource_links link
  where link.id = new.link_id
  for update;

  if (
    select count(*)
    from public.public_tracked_resource_link_daily_opens daily_open
    where daily_open.link_id = new.link_id
      and daily_open.opened_on = new.opened_on
  ) >= 10000 then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists bound_public_tracked_resource_link_daily_opens
  on public.public_tracked_resource_link_daily_opens;
create trigger bound_public_tracked_resource_link_daily_opens
before insert on public.public_tracked_resource_link_daily_opens
for each row execute function public.bound_public_tracked_resource_link_daily_opens();

alter table public.public_tracked_resource_links enable row level security;
alter table public.public_tracked_resource_links force row level security;
alter table public.public_tracked_resource_link_daily_opens enable row level security;
alter table public.public_tracked_resource_link_daily_opens force row level security;

drop policy if exists "public tracked links are visible with published profiles"
  on public.public_tracked_resource_links;
create policy "public tracked links are visible with published profiles"
on public.public_tracked_resource_links
for select
to anon
using (
  is_active
  and exists (
    select 1
    from public.public_person_profiles person
    where person.profile_id = owner_profile_id
      and person.is_public
      and person.show_program_activity
  )
);

drop policy if exists "tracked link owners can read their links"
  on public.public_tracked_resource_links;
create policy "tracked link owners can read their links"
on public.public_tracked_resource_links
for select
to authenticated
using (
  owner_profile_id = (select auth.uid())
  or (select public.is_admin())
);

revoke all on table public.public_tracked_resource_links
  from public, anon, authenticated;
revoke all on table public.public_tracked_resource_link_daily_opens
  from public, anon, authenticated;
revoke all on function public.bound_public_tracked_resource_link_daily_opens()
  from public, anon, authenticated;

grant select on table public.public_tracked_resource_links
  to anon, authenticated;
