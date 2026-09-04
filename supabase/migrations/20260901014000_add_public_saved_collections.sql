set check_function_bodies = off;
set search_path = public;

create table if not exists public.public_person_saved_collections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null
    references public.public_person_profiles(profile_id) on delete cascade,
  name text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint public_person_saved_collections_name_check
    check (char_length(btrim(name)) between 1 and 60),
  constraint public_person_saved_collections_owner_name_key
    unique (profile_id, name)
);

create table if not exists public.public_person_saved_collection_items (
  collection_id uuid not null
    references public.public_person_saved_collections(id) on delete cascade,
  item_kind text not null,
  item_id text not null,
  position smallint not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (collection_id, item_kind, item_id),
  constraint public_person_saved_collection_items_kind_check
    check (item_kind in ('organization', 'resource')),
  constraint public_person_saved_collection_items_id_check
    check (char_length(btrim(item_id)) between 1 and 256),
  constraint public_person_saved_collection_items_position_check
    check (position between 0 and 23)
);

create index if not exists public_person_saved_collections_profile_idx
  on public.public_person_saved_collections(profile_id, updated_at desc);

create index if not exists public_person_saved_collection_items_order_idx
  on public.public_person_saved_collection_items(collection_id, position);

drop trigger if exists public_person_saved_collections_set_updated_at
  on public.public_person_saved_collections;
create trigger public_person_saved_collections_set_updated_at
before update on public.public_person_saved_collections
for each row execute function public.handle_updated_at();

alter table public.public_person_saved_collections enable row level security;
alter table public.public_person_saved_collections force row level security;
alter table public.public_person_saved_collection_items enable row level security;
alter table public.public_person_saved_collection_items force row level security;

create policy public_person_saved_collections_public_select
on public.public_person_saved_collections
for select
to anon, authenticated
using (
  is_public
  and exists (
    select 1
    from public.public_person_profiles person
    where person.profile_id = public_person_saved_collections.profile_id
      and person.is_public
      and person.show_saved_locations
  )
);

create policy public_person_saved_collections_owner_select
on public.public_person_saved_collections
for select
to authenticated
using (
  profile_id = (select auth.uid())
  or (select public.is_admin())
);

create policy public_person_saved_collection_items_public_select
on public.public_person_saved_collection_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.public_person_saved_collections collection
    join public.public_person_profiles person
      on person.profile_id = collection.profile_id
    where collection.id = public_person_saved_collection_items.collection_id
      and collection.is_public
      and person.is_public
      and person.show_saved_locations
  )
);

create policy public_person_saved_collection_items_owner_select
on public.public_person_saved_collection_items
for select
to authenticated
using (
  exists (
    select 1
    from public.public_person_saved_collections collection
    where collection.id = public_person_saved_collection_items.collection_id
      and (
        collection.profile_id = (select auth.uid())
        or (select public.is_admin())
      )
  )
);

revoke all on table public.public_person_saved_collections
  from public, anon, authenticated;
revoke all on table public.public_person_saved_collection_items
  from public, anon, authenticated;
grant select on table public.public_person_saved_collections
  to anon, authenticated;
grant select on table public.public_person_saved_collection_items
  to anon, authenticated;

create or replace function public.save_person_public_saved_collection(
  p_collection_id uuid,
  p_name text,
  p_is_public boolean,
  p_item_kinds text[],
  p_item_ids text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_actor_id uuid := auth.uid();
  v_collection_id uuid;
  v_item_count integer := coalesce(cardinality(p_item_ids), 0);
  v_index integer;
  v_kind text;
  v_item_id text;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_actor_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if char_length(v_name) not between 1 and 60 then
    return jsonb_build_object('ok', false, 'code', 'invalid_name');
  end if;

  if cardinality(coalesce(p_item_kinds, array[]::text[])) <> v_item_count
    or v_item_count < 1
    or v_item_count > 24 then
    return jsonb_build_object('ok', false, 'code', 'invalid_items');
  end if;

  if not exists (
    select 1
    from public.public_person_profiles person
    where person.profile_id = v_actor_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'profile_required');
  end if;

  if (
    select count(*)
    from (
      select distinct item_kind, item_id
      from unnest(p_item_kinds, p_item_ids) as item(item_kind, item_id)
    ) distinct_items
  ) <> v_item_count then
    return jsonb_build_object('ok', false, 'code', 'duplicate_items');
  end if;

  for v_index in 1..v_item_count loop
    v_kind := p_item_kinds[v_index];
    v_item_id := btrim(coalesce(p_item_ids[v_index], ''));

    if v_kind = 'organization' then
      if not exists (
        select 1
        from public.organizations organization
        where organization.user_id::text = v_item_id
          and organization.is_public
      ) then
        return jsonb_build_object('ok', false, 'code', 'invalid_item');
      end if;
    elsif v_kind = 'resource' then
      if v_item_id !~ '^resource_map:[0-9a-fA-F-]{36}$'
        or not exists (
          select 1
          from public.resource_map_public_items resource
          where 'resource_map:' || resource.item_id::text = v_item_id
        ) then
        return jsonb_build_object('ok', false, 'code', 'invalid_item');
      end if;
    else
      return jsonb_build_object('ok', false, 'code', 'invalid_item');
    end if;
  end loop;

  if p_collection_id is null then
    if (
      select count(*)
      from public.public_person_saved_collections collection
      where collection.profile_id = v_actor_id
    ) >= 12 then
      return jsonb_build_object('ok', false, 'code', 'collection_limit');
    end if;

    insert into public.public_person_saved_collections (
      profile_id,
      name,
      is_public
    ) values (
      v_actor_id,
      v_name,
      coalesce(p_is_public, false)
    )
    returning id into v_collection_id;
  else
    update public.public_person_saved_collections collection
    set
      name = v_name,
      is_public = coalesce(p_is_public, false)
    where collection.id = p_collection_id
      and collection.profile_id = v_actor_id
    returning collection.id into v_collection_id;

    if v_collection_id is null then
      return jsonb_build_object('ok', false, 'code', 'not_found');
    end if;
  end if;

  delete from public.public_person_saved_collection_items item
  where item.collection_id = v_collection_id;

  insert into public.public_person_saved_collection_items (
    collection_id,
    item_kind,
    item_id,
    position
  )
  select
    v_collection_id,
    item.item_kind,
    btrim(item.item_id),
    item.ordinality - 1
  from unnest(p_item_kinds, p_item_ids) with ordinality
    as item(item_kind, item_id, ordinality);

  if coalesce(p_is_public, false) then
    update public.public_person_profiles person
    set show_saved_locations = true
    where person.profile_id = v_actor_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'saved',
    'collection_id', v_collection_id
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'code', 'duplicate_name');
end;
$$;

create or replace function public.delete_person_public_saved_collection(
  p_collection_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_actor_id uuid := auth.uid();
  v_deleted_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  delete from public.public_person_saved_collections collection
  where collection.id = p_collection_id
    and collection.profile_id = v_actor_id
  returning collection.id into v_deleted_id;

  if v_deleted_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  return jsonb_build_object('ok', true, 'code', 'deleted');
end;
$$;

revoke all on function public.save_person_public_saved_collection(
  uuid, text, boolean, text[], text[]
) from public, anon, authenticated;
revoke all on function public.delete_person_public_saved_collection(uuid)
  from public, anon, authenticated;
grant execute on function public.save_person_public_saved_collection(
  uuid, text, boolean, text[], text[]
) to authenticated;
grant execute on function public.delete_person_public_saved_collection(uuid)
  to authenticated;
