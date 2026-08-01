set check_function_bodies = off;
set search_path = public;

create table if not exists organization_people_tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  label text not null,
  color text not null default 'blue',
  sort_order integer not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_people_tags_label_check
    check (char_length(trim(label)) between 1 and 32),
  constraint organization_people_tags_color_check
    check (color in ('gray', 'red', 'orange', 'amber', 'green', 'teal', 'blue', 'violet', 'pink')),
  constraint organization_people_tags_sort_order_check
    check (sort_order >= 0)
);

create unique index if not exists organization_people_tags_org_label_idx
  on organization_people_tags (org_id, lower(btrim(label)));

create index if not exists organization_people_tags_org_order_idx
  on organization_people_tags (org_id, sort_order, created_at, id);

create table if not exists organization_people_tag_members (
  tag_id uuid not null references organization_people_tags(id) on delete cascade,
  person_id text not null,
  added_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (tag_id, person_id),
  constraint organization_people_tag_members_person_id_check
    check (char_length(trim(person_id)) between 1 and 128)
);

create index if not exists organization_people_tag_members_person_idx
  on organization_people_tag_members (person_id, tag_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_organization_people_tags'
  ) then
    create trigger set_updated_at_organization_people_tags
      before update on organization_people_tags
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

-- Promote legacy person-level string tags into reusable organization tags.
with legacy_tags as (
  select
    organization.user_id as org_id,
    left(regexp_replace(trim(tag.value), '\s+', ' ', 'g'), 32) as label,
    organization.user_id as created_by
  from organizations organization
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(organization.profile::jsonb -> 'org_people') = 'array'
        then organization.profile::jsonb -> 'org_people'
      else '[]'::jsonb
    end
  ) as person(value)
  cross join lateral jsonb_array_elements_text(
    case
      when jsonb_typeof(person.value -> 'tags') = 'array'
        then person.value -> 'tags'
      else '[]'::jsonb
    end
  ) as tag(value)
  where char_length(trim(tag.value)) > 0
), unique_legacy_tags as (
  select distinct on (org_id, lower(label))
    org_id,
    label,
    created_by
  from legacy_tags
  where char_length(label) between 1 and 32
  order by org_id, lower(label), label
)
insert into organization_people_tags (org_id, label, color, created_by)
select org_id, label, 'blue', created_by
from unique_legacy_tags
on conflict do nothing;

insert into organization_people_tag_members (tag_id, person_id, added_by)
select distinct
  reusable_tag.id,
  left(trim(person.value ->> 'id'), 128),
  organization.user_id
from organizations organization
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(organization.profile::jsonb -> 'org_people') = 'array'
      then organization.profile::jsonb -> 'org_people'
    else '[]'::jsonb
  end
) as person(value)
cross join lateral jsonb_array_elements_text(
  case
    when jsonb_typeof(person.value -> 'tags') = 'array'
      then person.value -> 'tags'
    else '[]'::jsonb
  end
) as legacy_tag(value)
join organization_people_tags reusable_tag
  on reusable_tag.org_id = organization.user_id
  and lower(btrim(reusable_tag.label)) = lower(
    left(regexp_replace(trim(legacy_tag.value), '\s+', ' ', 'g'), 32)
  )
where char_length(trim(coalesce(person.value ->> 'id', ''))) between 1 and 128
on conflict (tag_id, person_id) do nothing;

alter table organization_people_tags enable row level security;
alter table organization_people_tags force row level security;
alter table organization_people_tag_members enable row level security;
alter table organization_people_tag_members force row level security;

create policy "organization_people_tags_select"
  on organization_people_tags
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_tags.org_id
        and membership.member_id = (select auth.uid())
    )
  );

create policy "organization_people_tags_insert"
  on organization_people_tags
  for insert
  to authenticated
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_tags.org_id
        and membership.member_id = (select auth.uid())
        and membership.role in ('owner', 'admin', 'staff')
    )
  );

create policy "organization_people_tags_update"
  on organization_people_tags
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_tags.org_id
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
      where membership.org_id = organization_people_tags.org_id
        and membership.member_id = (select auth.uid())
        and membership.role in ('owner', 'admin', 'staff')
    )
  );

create policy "organization_people_tags_delete"
  on organization_people_tags
  for delete
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from organization_memberships membership
      where membership.org_id = organization_people_tags.org_id
        and membership.member_id = (select auth.uid())
        and membership.role in ('owner', 'admin', 'staff')
    )
  );

create policy "organization_people_tag_members_select"
  on organization_people_tag_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from organization_people_tags tag
      where tag.id = organization_people_tag_members.tag_id
    )
  );

create policy "organization_people_tag_members_insert"
  on organization_people_tag_members
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from organization_people_tags tag
      where tag.id = organization_people_tag_members.tag_id
        and (
          public.is_admin()
          or tag.org_id = (select auth.uid())
          or exists (
            select 1
            from organization_memberships membership
            where membership.org_id = tag.org_id
              and membership.member_id = (select auth.uid())
              and membership.role in ('owner', 'admin', 'staff')
          )
        )
    )
  );

create policy "organization_people_tag_members_delete"
  on organization_people_tag_members
  for delete
  to authenticated
  using (
    exists (
      select 1
      from organization_people_tags tag
      where tag.id = organization_people_tag_members.tag_id
        and (
          public.is_admin()
          or tag.org_id = (select auth.uid())
          or exists (
            select 1
            from organization_memberships membership
            where membership.org_id = tag.org_id
              and membership.member_id = (select auth.uid())
              and membership.role in ('owner', 'admin', 'staff')
          )
        )
    )
  );
