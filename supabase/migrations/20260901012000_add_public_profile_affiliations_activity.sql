set check_function_bodies = off;
set search_path = public;

create table if not exists public.public_person_organization_affiliations (
  profile_id uuid not null
    references public.public_person_profiles(profile_id) on delete cascade,
  organization_id uuid not null
    references public.organizations(user_id) on delete cascade,
  role public.organization_member_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, organization_id)
);

create table if not exists public.public_profile_activity_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  organization_id uuid not null,
  event_kind text not null,
  source_key text not null,
  title text not null,
  summary text,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint public_profile_activity_events_affiliation_fkey
    foreign key (profile_id, organization_id)
    references public.public_person_organization_affiliations(
      profile_id,
      organization_id
    ) on delete cascade,
  constraint public_profile_activity_events_source_unique
    unique (profile_id, source_key),
  constraint public_profile_activity_events_kind_check
    check (event_kind in ('affiliation_published')),
  constraint public_profile_activity_events_source_check
    check (char_length(btrim(source_key)) between 1 and 160),
  constraint public_profile_activity_events_title_check
    check (char_length(btrim(title)) between 1 and 160),
  constraint public_profile_activity_events_summary_check
    check (summary is null or char_length(summary) <= 500)
);

create index if not exists public_profile_activity_events_profile_date_idx
  on public.public_profile_activity_events(profile_id, occurred_at desc);

drop trigger if exists set_updated_at_public_person_affiliations
  on public.public_person_organization_affiliations;
create trigger set_updated_at_public_person_affiliations
before update on public.public_person_organization_affiliations
for each row execute procedure public.handle_updated_at();

alter table public.public_person_organization_affiliations
  enable row level security;
alter table public.public_person_organization_affiliations
  force row level security;
alter table public.public_profile_activity_events enable row level security;
alter table public.public_profile_activity_events force row level security;

revoke all on table public.public_person_organization_affiliations
  from public, anon, authenticated;
revoke all on table public.public_profile_activity_events
  from public, anon, authenticated;
grant select on table public.public_person_organization_affiliations
  to anon, authenticated;
grant select on table public.public_profile_activity_events
  to anon, authenticated;

create policy public_person_affiliations_public_select
on public.public_person_organization_affiliations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.public_person_profiles person
    where person.profile_id = public_person_organization_affiliations.profile_id
      and person.is_public
      and person.show_organizations
  )
  and exists (
    select 1
    from public.organizations organization
    where organization.user_id = public_person_organization_affiliations.organization_id
      and organization.is_public
  )
);

create policy public_person_affiliations_owner_select
on public.public_person_organization_affiliations
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select public.is_admin())
);

create policy public_profile_activity_public_select
on public.public_profile_activity_events
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.public_person_profiles person
    where person.profile_id = public_profile_activity_events.profile_id
      and person.is_public
      and person.show_program_activity
  )
  and exists (
    select 1
    from public.organizations organization
    where organization.user_id = public_profile_activity_events.organization_id
      and organization.is_public
  )
);

create policy public_profile_activity_owner_select
on public.public_profile_activity_events
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select public.is_admin())
);

create or replace function public.set_person_public_affiliation(
  p_organization_id uuid,
  p_visible boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_actor_id uuid := auth.uid();
  v_role public.organization_member_role;
  v_organization_name text;
begin
  if v_actor_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not coalesce(p_visible, false) then
    delete from public.public_person_organization_affiliations affiliation
    where affiliation.profile_id = v_actor_id
      and affiliation.organization_id = p_organization_id;
    return jsonb_build_object('ok', true, 'code', 'hidden');
  end if;

  select membership.role
  into v_role
  from public.organization_memberships membership
  where membership.member_id = v_actor_id
    and membership.org_id = p_organization_id;

  if v_role is null and exists (
    select 1
    from public.organizations organization
    where organization.user_id = p_organization_id
      and organization.user_id = v_actor_id
  ) then
    v_role := 'owner';
  end if;

  if v_role is null then
    return jsonb_build_object('ok', false, 'code', 'not_member');
  end if;

  if not exists (
    select 1
    from public.public_person_profiles person
    where person.profile_id = v_actor_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'profile_required');
  end if;

  insert into public.public_person_organization_affiliations (
    profile_id,
    organization_id,
    role
  ) values (
    v_actor_id,
    p_organization_id,
    v_role
  )
  on conflict (profile_id, organization_id) do update
  set role = excluded.role;

  select coalesce(
    nullif(btrim(organization.profile->>'name'), ''),
    'Organization'
  )
  into v_organization_name
  from public.organizations organization
  where organization.user_id = p_organization_id;

  insert into public.public_profile_activity_events (
    profile_id,
    organization_id,
    event_kind,
    source_key,
    title,
    summary
  ) values (
    v_actor_id,
    p_organization_id,
    'affiliation_published',
    'affiliation:' || p_organization_id::text,
    'Added ' || coalesce(v_organization_name, 'an organization') ||
      ' as a public affiliation',
    'Published a verified Coach House organization membership.'
  )
  on conflict (profile_id, source_key) do update
  set
    title = excluded.title,
    summary = excluded.summary;

  return jsonb_build_object(
    'ok', true,
    'code', 'published',
    'organization_id', p_organization_id,
    'role', v_role
  );
end;
$$;

create or replace function public.sync_public_person_affiliation_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.public_person_organization_affiliations affiliation
    where affiliation.profile_id = old.member_id
      and affiliation.organization_id = old.org_id;
    return old;
  end if;

  if tg_op = 'UPDATE' and (
    old.member_id is distinct from new.member_id
    or old.org_id is distinct from new.org_id
  ) then
    delete from public.public_person_organization_affiliations affiliation
    where affiliation.profile_id = old.member_id
      and affiliation.organization_id = old.org_id;
  end if;

  update public.public_person_organization_affiliations affiliation
  set role = new.role
  where affiliation.profile_id = new.member_id
    and affiliation.organization_id = new.org_id;

  return new;
end;
$$;

drop trigger if exists sync_public_person_affiliation_membership
  on public.organization_memberships;
create trigger sync_public_person_affiliation_membership
after update or delete on public.organization_memberships
for each row execute function public.sync_public_person_affiliation_membership();

revoke all on function public.set_person_public_affiliation(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.sync_public_person_affiliation_membership()
  from public, anon, authenticated;
grant execute on function public.set_person_public_affiliation(uuid, boolean)
  to authenticated;
