set check_function_bodies = off;
set search_path = public;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'public_handle_owner_type'
  ) then
    create type public.public_handle_owner_type as enum ('person', 'organization');
  end if;
end;
$$;

create table if not exists public.public_handle_reservations (
  handle text primary key,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint public_handle_reservations_handle_format_check check (
    handle = lower(handle)
    and char_length(handle) between 1 and 64
    and handle ~ '^[a-z0-9_.-]+$'
  ),
  constraint public_handle_reservations_reason_check
    check (char_length(btrim(reason)) between 1 and 120)
);

create table if not exists public.public_person_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  headline text,
  bio text,
  location_label text,
  website_url text,
  avatar_url text,
  is_public boolean not null default false,
  show_organizations boolean not null default true,
  show_program_activity boolean not null default true,
  show_saved_locations boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint public_person_profiles_display_name_check
    check (char_length(btrim(display_name)) between 1 and 80),
  constraint public_person_profiles_headline_check
    check (headline is null or char_length(headline) <= 120),
  constraint public_person_profiles_bio_check
    check (bio is null or char_length(bio) <= 500),
  constraint public_person_profiles_location_check
    check (location_label is null or char_length(location_label) <= 120),
  constraint public_person_profiles_website_check check (
    website_url is null
    or (
      char_length(website_url) <= 500
      and website_url ~ '^https?://'
    )
  ),
  constraint public_person_profiles_avatar_check check (
    avatar_url is null
    or (
      char_length(avatar_url) <= 2000
      and avatar_url ~ '^https?://'
    )
  )
);

create table if not exists public.public_handles (
  handle text primary key,
  owner_type public.public_handle_owner_type not null,
  profile_id uuid unique references public.profiles(id) on delete cascade,
  organization_id uuid unique references public.organizations(user_id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint public_handles_handle_format_check check (
    handle = lower(handle)
    and char_length(handle) between 2 and 48
    and handle ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint public_handles_owner_check check (
    (owner_type = 'person' and profile_id is not null and organization_id is null)
    or
    (owner_type = 'organization' and organization_id is not null and profile_id is null)
  )
);

insert into public.public_handle_reservations (handle, reason)
values
  ('_next', 'Framework route'),
  ('academy', 'Application route'),
  ('accelerator', 'Application route'),
  ('access-requests', 'Application route'),
  ('admin', 'Application route'),
  ('api', 'Application route'),
  ('assets', 'Application route'),
  ('auth', 'Application route'),
  ('billing', 'Application route'),
  ('callback', 'Authentication route'),
  ('class', 'Application route'),
  ('classes', 'Application route'),
  ('coaching', 'Application route'),
  ('community', 'Application route'),
  ('dashboard', 'Application route'),
  ('db-viewer', 'Application route'),
  ('documents', 'Application route'),
  ('email', 'Application route'),
  ('favicon', 'Application route'),
  ('find', 'Public directory route'),
  ('fiscal-sponsorship', 'Application route'),
  ('forgot-password', 'Authentication route'),
  ('go', 'Tracked short-link route'),
  ('home', 'Application route'),
  ('home-canvas', 'Application route'),
  ('internal', 'Application route'),
  ('join-organization', 'Application route'),
  ('legacy-home', 'Application route'),
  ('login', 'Authentication route'),
  ('marketplace', 'Application route'),
  ('my-organization', 'Application route'),
  ('my-tasks', 'Application route'),
  ('news', 'Application route'),
  ('notifications', 'Application route'),
  ('onboarding', 'Application route'),
  ('organization', 'Application route'),
  ('organizations', 'Application route'),
  ('people', 'Application route'),
  ('pricing', 'Application route'),
  ('privacy', 'Application route'),
  ('projects', 'Application route'),
  ('public', 'Application route'),
  ('roadmap', 'Application route'),
  ('robots', 'Metadata route'),
  ('sign-up', 'Authentication route'),
  ('signup', 'Authentication route'),
  ('sitemap', 'Metadata route'),
  ('status', 'Application route'),
  ('strategic-roadmap', 'Application route'),
  ('tasks', 'Application route'),
  ('team', 'Application route'),
  ('terms', 'Application route'),
  ('tester', 'Application route'),
  ('training', 'Application route'),
  ('unsubscribe', 'Application route'),
  ('update-password', 'Authentication route'),
  ('visual-regression', 'Application route'),
  ('workspace', 'Application route')
on conflict (handle) do update
set reason = excluded.reason;

insert into public.public_handles (handle, owner_type, organization_id)
select lower(btrim(organization.public_slug)), 'organization', organization.user_id
from public.organizations organization
where organization.public_slug is not null
  and char_length(btrim(organization.public_slug)) between 2 and 48
  and lower(btrim(organization.public_slug)) ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  and not exists (
    select 1
    from public.public_handle_reservations reservation
    where reservation.handle = lower(btrim(organization.public_slug))
  )
on conflict do nothing;

drop trigger if exists set_updated_at_public_person_profiles
  on public.public_person_profiles;
create trigger set_updated_at_public_person_profiles
before update on public.public_person_profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_updated_at_public_handles on public.public_handles;
create trigger set_updated_at_public_handles
before update on public.public_handles
for each row execute procedure public.handle_updated_at();

alter table public.public_handle_reservations enable row level security;
alter table public.public_handle_reservations force row level security;
alter table public.public_person_profiles enable row level security;
alter table public.public_person_profiles force row level security;
alter table public.public_handles enable row level security;
alter table public.public_handles force row level security;

revoke all on table public.public_handle_reservations from public, anon, authenticated;
revoke all on table public.public_person_profiles from public, anon, authenticated;
revoke all on table public.public_handles from public, anon, authenticated;

grant select on table public.public_person_profiles to anon, authenticated;
grant select on table public.public_handles to anon, authenticated;

drop policy if exists public_person_profiles_public_select on public.public_person_profiles;
drop policy if exists public_person_profiles_owner_select on public.public_person_profiles;
create policy public_person_profiles_public_select
on public.public_person_profiles
for select
to anon, authenticated
using (is_public);

create policy public_person_profiles_owner_select
on public.public_person_profiles
for select
to authenticated
using (profile_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists public_handles_public_select on public.public_handles;
drop policy if exists public_handles_owner_select on public.public_handles;
create policy public_handles_public_select
on public.public_handles
for select
to anon, authenticated
using (
  (
    owner_type = 'person'
    and exists (
      select 1
      from public.public_person_profiles person
      where person.profile_id = public_handles.profile_id
        and person.is_public
    )
  )
  or (
    owner_type = 'organization'
    and exists (
      select 1
      from public.organizations organization
      where organization.user_id = public_handles.organization_id
        and organization.is_public
    )
  )
);

create policy public_handles_owner_select
on public.public_handles
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or organization_id = (select auth.uid())
  or (select public.is_admin())
);

create or replace function public.normalize_public_handle(p_handle text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(btrim(p_handle), '^@+', ''));
$$;

create or replace function public.public_handle_availability(p_handle text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_handle text := public.normalize_public_handle(p_handle);
begin
  if v_handle is null
    or char_length(v_handle) not between 2 and 48
    or v_handle !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    return jsonb_build_object('available', false, 'code', 'invalid');
  end if;

  if exists (
    select 1
    from public.public_handle_reservations reservation
    where reservation.handle = v_handle
  ) then
    return jsonb_build_object('available', false, 'code', 'reserved', 'handle', v_handle);
  end if;

  if exists (
    select 1
    from public.public_handles handle_row
    where handle_row.handle = v_handle
  ) then
    return jsonb_build_object('available', false, 'code', 'taken', 'handle', v_handle);
  end if;

  return jsonb_build_object('available', true, 'code', 'available', 'handle', v_handle);
end;
$$;

create or replace function public.claim_person_public_handle(p_handle text)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_actor_id uuid := auth.uid();
  v_handle text := public.normalize_public_handle(p_handle);
begin
  if v_actor_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if v_handle is null
    or char_length(v_handle) not between 2 and 48
    or v_handle !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    return jsonb_build_object('ok', false, 'code', 'invalid');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('public-handle:person:' || v_actor_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('public-handle:value:' || v_handle, 0)
  );

  if exists (
    select 1
    from public.public_handle_reservations reservation
    where reservation.handle = v_handle
  ) then
    return jsonb_build_object('ok', false, 'code', 'reserved');
  end if;

  if exists (
    select 1
    from public.public_handles handle_row
    where handle_row.handle = v_handle
      and not (
        handle_row.owner_type = 'person'
        and handle_row.profile_id = v_actor_id
      )
  ) then
    return jsonb_build_object('ok', false, 'code', 'taken');
  end if;

  if not exists (
    select 1
    from public.profiles profile
    where profile.id = v_actor_id
  ) then
    raise exception 'Profile required before claiming a handle.' using errcode = '23503';
  end if;

  delete from public.public_handles handle_row
  where handle_row.profile_id = v_actor_id
    and handle_row.handle <> v_handle;

  insert into public.public_handles (handle, owner_type, profile_id)
  values (v_handle, 'person', v_actor_id)
  on conflict (handle) do update
  set updated_at = timezone('utc', now())
  where public_handles.owner_type = 'person'
    and public_handles.profile_id = v_actor_id;

  insert into public.public_person_profiles (profile_id, display_name)
  select profile.id, coalesce(nullif(btrim(profile.full_name), ''), v_handle)
  from public.profiles profile
  where profile.id = v_actor_id
  on conflict (profile_id) do nothing;

  return jsonb_build_object('ok', true, 'code', 'claimed', 'handle', v_handle);
end;
$$;

create or replace function public.save_public_person_profile(
  p_display_name text,
  p_headline text,
  p_bio text,
  p_location_label text,
  p_website_url text,
  p_avatar_url text,
  p_is_public boolean,
  p_show_organizations boolean,
  p_show_program_activity boolean,
  p_show_saved_locations boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_is_public and not exists (
    select 1
    from public.public_handles handle_row
    where handle_row.owner_type = 'person'
      and handle_row.profile_id = v_actor_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'handle_required');
  end if;

  insert into public.public_person_profiles (
    profile_id,
    display_name,
    headline,
    bio,
    location_label,
    website_url,
    avatar_url,
    is_public,
    show_organizations,
    show_program_activity,
    show_saved_locations
  ) values (
    v_actor_id,
    btrim(p_display_name),
    nullif(btrim(coalesce(p_headline, '')), ''),
    nullif(btrim(coalesce(p_bio, '')), ''),
    nullif(btrim(coalesce(p_location_label, '')), ''),
    nullif(btrim(coalesce(p_website_url, '')), ''),
    nullif(btrim(coalesce(p_avatar_url, '')), ''),
    coalesce(p_is_public, false),
    coalesce(p_show_organizations, true),
    coalesce(p_show_program_activity, true),
    coalesce(p_show_saved_locations, false)
  )
  on conflict (profile_id) do update
  set
    display_name = excluded.display_name,
    headline = excluded.headline,
    bio = excluded.bio,
    location_label = excluded.location_label,
    website_url = excluded.website_url,
    avatar_url = excluded.avatar_url,
    is_public = excluded.is_public,
    show_organizations = excluded.show_organizations,
    show_program_activity = excluded.show_program_activity,
    show_saved_locations = excluded.show_saved_locations,
    updated_at = timezone('utc', now());

  return jsonb_build_object('ok', true, 'code', 'saved');
end;
$$;

create or replace function public.sync_organization_public_handle()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_handle text;
begin
  if tg_op = 'UPDATE' and old.public_slug is not distinct from new.public_slug then
    return new;
  end if;

  if new.public_slug is null or btrim(new.public_slug) = '' then
    delete from public.public_handles handle_row
    where handle_row.organization_id = new.user_id;
    return new;
  end if;

  v_handle := public.normalize_public_handle(new.public_slug);

  if char_length(v_handle) not between 2 and 48
    or v_handle !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid public handle.' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('public-handle:organization:' || new.user_id::text, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('public-handle:value:' || v_handle, 0)
  );

  if exists (
    select 1
    from public.public_handle_reservations reservation
    where reservation.handle = v_handle
  ) then
    raise exception 'Public handle is reserved.' using errcode = '23505';
  end if;

  if exists (
    select 1
    from public.public_handles handle_row
    where handle_row.handle = v_handle
      and not (
        handle_row.owner_type = 'organization'
        and handle_row.organization_id = new.user_id
      )
  ) then
    raise exception 'Public handle is already taken.' using errcode = '23505';
  end if;

  delete from public.public_handles handle_row
  where handle_row.organization_id = new.user_id
    and handle_row.handle <> v_handle;

  insert into public.public_handles (handle, owner_type, organization_id)
  values (v_handle, 'organization', new.user_id)
  on conflict (handle) do update
  set updated_at = timezone('utc', now())
  where public_handles.owner_type = 'organization'
    and public_handles.organization_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists sync_organization_public_handle
  on public.organizations;
create trigger sync_organization_public_handle
after insert or update of public_slug on public.organizations
for each row execute function public.sync_organization_public_handle();

revoke all on function public.normalize_public_handle(text)
  from public, anon, authenticated;
revoke all on function public.public_handle_availability(text)
  from public, anon, authenticated;
revoke all on function public.claim_person_public_handle(text)
  from public, anon, authenticated;
revoke all on function public.save_public_person_profile(
  text, text, text, text, text, text, boolean, boolean, boolean, boolean
) from public, anon, authenticated;
revoke all on function public.sync_organization_public_handle()
  from public, anon, authenticated;

grant execute on function public.public_handle_availability(text)
  to anon, authenticated;
grant execute on function public.claim_person_public_handle(text)
  to authenticated;
grant execute on function public.save_public_person_profile(
  text, text, text, text, text, text, boolean, boolean, boolean, boolean
) to authenticated;
