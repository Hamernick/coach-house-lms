do $$
begin
  if not exists (
    select 1
    from public.public_handles
    where handle = 'open-house'
      and owner_type = 'organization'
      and organization_id = '00000000-0000-0000-0000-000000000003'
  ) then
    raise exception 'existing public organization slug was not backfilled';
  end if;
end;
$$;

set role anon;

do $$
begin
  if (select count(*) from public.public_handles) <> 1 then
    raise exception 'anonymous handle visibility exposed a private owner';
  end if;

  if not exists (
    select 1 from public.public_handles where handle = 'open-house'
  ) then
    raise exception 'anonymous user cannot resolve a public organization';
  end if;
end;
$$;

reset role;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set role authenticated;

do $$
declare
  result jsonb;
  direct_write_rejected boolean := false;
begin
  select public.claim_person_public_handle('@Caleb') into result;
  if result <> '{"ok":true,"code":"claimed","handle":"caleb"}'::jsonb then
    raise exception 'person handle claim returned unexpected result: %', result;
  end if;

  if exists (
    select 1 from public.public_person_profiles where is_public
  ) then
    raise exception 'claiming a handle published the profile';
  end if;

  if not exists (
    select 1 from public.public_handles where handle = 'caleb'
  ) then
    raise exception 'owner cannot read an unpublished handle';
  end if;

  begin
    insert into public.public_handles (handle, owner_type, profile_id)
    values ('bypass', 'person', '00000000-0000-0000-0000-000000000001');
  exception when insufficient_privilege then
    direct_write_rejected := true;
  end;

  if not direct_write_rejected then
    raise exception 'authenticated direct handle write was allowed';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;
set role anon;

do $$
begin
  if exists (
    select 1 from public.public_handles where handle = 'caleb'
  ) then
    raise exception 'unpublished person handle is anonymously visible';
  end if;

  if exists (
    select 1
    from public.public_person_profiles
    where profile_id = '00000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'unpublished person profile is anonymously visible';
  end if;
end;
$$;

reset role;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set role authenticated;

do $$
declare
  result jsonb;
  direct_affiliation_write_rejected boolean := false;
begin

  select public.save_public_person_profile(
    'Caleb Example',
    'Community builder',
    'Working on public-interest tools.',
    'New York, NY',
    'https://example.com',
    null,
    true,
    true,
    true,
    false
  ) into result;

  if result <> '{"ok":true,"code":"saved"}'::jsonb then
    raise exception 'public person profile save failed: %', result;
  end if;

  select public.set_person_public_affiliation(
    '00000000-0000-0000-0000-000000000003',
    true
  ) into result;

  if result->>'code' <> 'published' or result->>'role' <> 'staff' then
    raise exception 'verified affiliation publication failed: %', result;
  end if;

  begin
    insert into public.public_person_organization_affiliations (
      profile_id,
      organization_id,
      role
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000004',
      'staff'
    );
  exception when insufficient_privilege then
    direct_affiliation_write_rejected := true;
  end;

  if not direct_affiliation_write_rejected then
    raise exception 'authenticated direct affiliation write was allowed';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;
set role anon;

do $$
begin
  if not exists (
    select 1 from public.public_handles where handle = 'caleb'
  ) then
    raise exception 'published person handle is not anonymously visible';
  end if;

  if not exists (
    select 1
    from public.public_person_profiles
    where profile_id = '00000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'published person profile is not anonymously visible';
  end if;

  if not exists (
    select 1
    from public.public_person_organization_affiliations
    where profile_id = '00000000-0000-0000-0000-000000000001'
      and organization_id = '00000000-0000-0000-0000-000000000003'
      and role = 'staff'
  ) then
    raise exception 'verified public affiliation is not anonymously visible';
  end if;

  if not exists (
    select 1
    from public.public_profile_activity_events
    where profile_id = '00000000-0000-0000-0000-000000000001'
      and event_kind = 'affiliation_published'
  ) then
    raise exception 'allowlisted affiliation activity is not anonymously visible';
  end if;
end;
$$;

reset role;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
set role authenticated;

do $$
declare
  result jsonb;
begin
  select public.public_handle_availability('find') into result;
  if result->>'code' <> 'reserved' then
    raise exception 'reserved route reported unexpected availability: %', result;
  end if;

  select public.public_handle_availability('caleb') into result;
  if result->>'code' <> 'taken' then
    raise exception 'claimed handle reported unexpected availability: %', result;
  end if;

  select public.claim_person_public_handle('caleb') into result;
  if result->>'code' <> 'taken' then
    raise exception 'cross-person collision was allowed: %', result;
  end if;

  select public.claim_person_public_handle('open-house') into result;
  if result->>'code' <> 'taken' then
    raise exception 'person claimed an organization handle: %', result;
  end if;

  select public.save_public_person_profile(
    'Second Person', null, null, null, null, null, true, true, true, false
  ) into result;
  if result->>'code' <> 'handle_required' then
    raise exception 'profile published without a handle: %', result;
  end if;

  select public.set_person_public_affiliation(
    '00000000-0000-0000-0000-000000000003',
    true
  ) into result;
  if result->>'code' <> 'not_member' then
    raise exception 'unverified affiliation was published: %', result;
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

insert into public.public_tracked_resource_links (
  id,
  code,
  owner_profile_id,
  resource_id,
  resource_title,
  target_url
) values (
  '10000000-0000-0000-0000-000000000001',
  'Track123',
  '00000000-0000-0000-0000-000000000001',
  'resource_map:10000000-0000-0000-0000-000000000002',
  'Community Food Guide',
  'https://example.com/food-guide'
);

insert into public.public_tracked_resource_link_daily_opens (
  link_id,
  opened_on,
  visitor_hash
) values (
  '10000000-0000-0000-0000-000000000001',
  '2026-09-01',
  repeat('a', 64)
);

insert into public.public_tracked_resource_link_daily_opens (
  link_id,
  opened_on,
  visitor_hash
) values (
  '10000000-0000-0000-0000-000000000001',
  '2026-09-01',
  repeat('a', 64)
)
on conflict do nothing;

do $$
begin
  if (
    select count(*)
    from public.public_tracked_resource_link_daily_opens
    where link_id = '10000000-0000-0000-0000-000000000001'
  ) <> 1 then
    raise exception 'daily tracked opens were not deduplicated';
  end if;
end;
$$;

set role anon;

do $$
begin
  if not exists (
    select 1
    from public.public_tracked_resource_links
    where code = 'Track123'
  ) then
    raise exception 'published tracked resource link is not anonymously visible';
  end if;

  begin
    if exists (
      select 1 from public.public_tracked_resource_link_daily_opens
    ) then
      raise exception 'anonymous user can read tracked visitor hashes';
    end if;
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set role authenticated;

do $$
declare
  direct_link_write_rejected boolean := false;
  direct_collection_write_rejected boolean := false;
  source_rows_hidden boolean := false;
  result jsonb;
begin
  begin
    perform 1 from public.public_tracked_resource_link_daily_opens limit 1;
  exception when insufficient_privilege then
    source_rows_hidden := true;
  end;

  if not source_rows_hidden then
    raise exception 'tracked-link owner can read visitor hashes';
  end if;

  begin
    insert into public.public_tracked_resource_links (
      code,
      owner_profile_id,
      resource_id,
      resource_title,
      target_url
    ) values (
      'Bypass12',
      '00000000-0000-0000-0000-000000000001',
      'resource_map:bypass',
      'Bypass',
      'https://example.com/bypass'
    );
  exception when insufficient_privilege then
    direct_link_write_rejected := true;
  end;

  if not direct_link_write_rejected then
    raise exception 'authenticated direct tracked-link write was allowed';
  end if;

  select public.save_person_public_saved_collection(
    null,
    'Neighborhood essentials',
    true,
    array['organization', 'resource'],
    array[
      '00000000-0000-0000-0000-000000000003',
      'resource_map:20000000-0000-0000-0000-000000000001'
    ]
  ) into result;

  if result->>'code' <> 'saved' then
    raise exception 'public saved collection failed: %', result;
  end if;

  begin
    insert into public.public_person_saved_collections (
      profile_id,
      name,
      is_public
    ) values (
      '00000000-0000-0000-0000-000000000001',
      'Bypass',
      true
    );
  exception when insufficient_privilege then
    direct_collection_write_rejected := true;
  end;

  if not direct_collection_write_rejected then
    raise exception 'authenticated direct saved collection write was allowed';
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

set role anon;

do $$
begin
  if not exists (
    select 1
    from public.public_person_saved_collections
    where name = 'Neighborhood essentials'
  ) then
    raise exception 'published saved collection is not anonymously visible';
  end if;

  if (
    select count(*)
    from public.public_person_saved_collection_items
  ) <> 2 then
    raise exception 'published saved collection items are not visible';
  end if;
end;
$$;

reset role;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
set role authenticated;

do $$
declare
  collection_id uuid;
  result jsonb;
begin
  select id
  into collection_id
  from public.public_person_saved_collections
  where name = 'Neighborhood essentials';

  select public.delete_person_public_saved_collection(collection_id)
  into result;
  if result->>'code' <> 'not_found' then
    raise exception 'nonowner deleted a public saved collection: %', result;
  end if;
end;
$$;

reset role;
reset request.jwt.claim.sub;

do $$
declare
  reserved_slug_rejected boolean := false;
  person_slug_rejected boolean := false;
begin
  begin
    update public.organizations
    set public_slug = 'find'
    where user_id = '00000000-0000-0000-0000-000000000004';
  exception when unique_violation then
    reserved_slug_rejected := true;
  end;

  if not reserved_slug_rejected then
    raise exception 'organization accepted a reserved handle';
  end if;

  begin
    update public.organizations
    set public_slug = 'caleb'
    where user_id = '00000000-0000-0000-0000-000000000004';
  exception when unique_violation then
    person_slug_rejected := true;
  end;

  if not person_slug_rejected then
    raise exception 'organization claimed a person handle';
  end if;
end;
$$;

delete from public.organization_memberships
where org_id = '00000000-0000-0000-0000-000000000003'
  and member_id = '00000000-0000-0000-0000-000000000001';

set role anon;

do $$
begin
  if exists (
    select 1
    from public.public_person_organization_affiliations
    where profile_id = '00000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'revoked membership left a public affiliation';
  end if;

  if exists (
    select 1
    from public.public_profile_activity_events
    where profile_id = '00000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'revoked membership left public activity';
  end if;
end;
$$;

reset role;
