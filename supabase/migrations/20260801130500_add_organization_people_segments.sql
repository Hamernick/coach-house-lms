set check_function_bodies = off;
set search_path = public;

create table if not exists organization_people_segments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_people_segments_label_check
    check (char_length(trim(label)) between 1 and 48),
  constraint organization_people_segments_sort_order_check
    check (sort_order >= 0)
);

create index if not exists organization_people_segments_org_order_idx
  on organization_people_segments (org_id, sort_order, created_at, id);

create table if not exists organization_people_segment_members (
  segment_id uuid not null references organization_people_segments(id) on delete cascade,
  person_id text not null,
  added_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (segment_id, person_id),
  constraint organization_people_segment_members_person_id_check
    check (char_length(trim(person_id)) between 1 and 128)
);

create index if not exists organization_people_segment_members_person_idx
  on organization_people_segment_members (person_id, segment_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_people_segments'
  ) then
    create trigger set_updated_at_organization_people_segments
      before update on organization_people_segments
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

-- Preserve any segments written to the compatibility profile key before this
-- migration reached an environment.
insert into organization_people_segments (
  id,
  org_id,
  label,
  sort_order,
  created_by
)
select
  (segment_entry ->> 'id')::uuid,
  organization.user_id,
  left(trim(segment_entry ->> 'label'), 48),
  (segment_ordinality - 1)::integer,
  organization.user_id
from organizations organization
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(
      organization.profile::jsonb -> 'workspace_people_segments_v1'
    ) = 'array'
      then organization.profile::jsonb -> 'workspace_people_segments_v1'
    else '[]'::jsonb
  end
) with ordinality as legacy_segment(segment_entry, segment_ordinality)
where coalesce(segment_entry ->> 'id', '')
  ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and char_length(trim(coalesce(segment_entry ->> 'label', ''))) between 1 and 48
on conflict (id) do nothing;

insert into organization_people_segment_members (
  segment_id,
  person_id,
  added_by
)
select
  segment.id,
  left(trim(member.value), 128),
  organization.user_id
from organizations organization
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(
      organization.profile::jsonb -> 'workspace_people_segments_v1'
    ) = 'array'
      then organization.profile::jsonb -> 'workspace_people_segments_v1'
    else '[]'::jsonb
  end
) as legacy_segment(segment_entry)
join organization_people_segments segment
  on segment.id = case
    when coalesce(legacy_segment.segment_entry ->> 'id', '')
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then (legacy_segment.segment_entry ->> 'id')::uuid
    else null
  end
  and segment.org_id = organization.user_id
cross join lateral jsonb_array_elements_text(
  case
    when jsonb_typeof(legacy_segment.segment_entry -> 'memberIds') = 'array'
      then legacy_segment.segment_entry -> 'memberIds'
    else '[]'::jsonb
  end
) as member(value)
where coalesce(legacy_segment.segment_entry ->> 'id', '')
  ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and char_length(trim(member.value)) between 1 and 128
on conflict (segment_id, person_id) do nothing;

alter table organization_people_segments enable row level security;
alter table organization_people_segments force row level security;
alter table organization_people_segment_members enable row level security;
alter table organization_people_segment_members force row level security;

create policy "organization_people_segments_select"
  on organization_people_segments
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_segments.org_id
        and membership.member_id = (select auth.uid())
    )
  );

create policy "organization_people_segments_insert"
  on organization_people_segments
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_segments.org_id
        and membership.member_id = (select auth.uid())
        and membership.role in ('owner', 'admin', 'staff')
    )
  );

create policy "organization_people_segments_update"
  on organization_people_segments
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_segments.org_id
        and membership.member_id = (select auth.uid())
        and membership.role in ('owner', 'admin', 'staff')
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_segments.org_id
        and membership.member_id = (select auth.uid())
        and membership.role in ('owner', 'admin', 'staff')
    )
  );

create policy "organization_people_segments_delete"
  on organization_people_segments
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_segments.org_id
        and membership.member_id = (select auth.uid())
        and membership.role in ('owner', 'admin', 'staff')
    )
  );

create policy "organization_people_segment_members_select"
  on organization_people_segment_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from organization_people_segments segment
      where segment.id = organization_people_segment_members.segment_id
    )
  );

create policy "organization_people_segment_members_insert"
  on organization_people_segment_members
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from organization_people_segments segment
      where segment.id = organization_people_segment_members.segment_id
        and (
          public.is_admin()
          or segment.org_id = (select auth.uid())
          or exists (
            select 1
            from organization_memberships membership
            where membership.org_id = segment.org_id
              and membership.member_id = (select auth.uid())
              and membership.role in ('owner', 'admin', 'staff')
          )
        )
    )
  );

create policy "organization_people_segment_members_delete"
  on organization_people_segment_members
  for delete
  to authenticated
  using (
    exists (
      select 1
      from organization_people_segments segment
      where segment.id = organization_people_segment_members.segment_id
        and (
          public.is_admin()
          or segment.org_id = (select auth.uid())
          or exists (
            select 1
            from organization_memberships membership
            where membership.org_id = segment.org_id
              and membership.member_id = (select auth.uid())
              and membership.role in ('owner', 'admin', 'staff')
          )
        )
    )
  );
