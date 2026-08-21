do $$
declare
  v_claim_id uuid;
  v_owner_id uuid := '10000000-0000-4000-8000-000000000001';
  v_result jsonb;
begin
  if not exists (
    select 1
    from pg_class
    where oid = 'public.public_map_claim_requests'::regclass
      and relrowsecurity
      and relforcerowsecurity
  ) then
    raise exception 'claim table must enable and force RLS';
  end if;

  if has_table_privilege('anon', 'public.public_map_claim_requests', 'select')
    or has_table_privilege('authenticated', 'public.public_map_claim_requests', 'insert') then
    raise exception 'public roles must not access claim rows';
  end if;

  if has_function_privilege(
    'anon',
    'public.submit_public_map_claim_request(text,uuid,text,text,text,text,uuid,text,text)',
    'execute'
  ) then
    raise exception 'anon must not execute claim submission RPC';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.submit_public_map_claim_request(text,uuid,text,text,text,text,uuid,text,text)',
    'execute'
  ) then
    raise exception 'service role must execute claim submission RPC';
  end if;

  insert into auth.users (id) values (v_owner_id);
  insert into public.profiles (id) values (v_owner_id);
  insert into public.organizations (user_id) values (v_owner_id);
  insert into public.platform_staff_members (user_id, access_level)
  values (v_owner_id, 'developer');

  v_result := public.submit_public_map_claim_request(
    'new',
    null,
    'Neighborhood Pantry',
    'Private Person',
    'private@example.org',
    'private details',
    '00000000-0000-4000-8000-000000000001',
    repeat('a', 64),
    repeat('b', 64)
  );
  v_claim_id := (v_result ->> 'claimId')::uuid;

  if v_result ->> 'status' <> 'recorded' then
    raise exception 'valid claim was not recorded';
  end if;

  v_result := public.submit_public_map_claim_request(
    'new', null, 'Neighborhood Pantry', 'Private Person',
    'private@example.org', 'private details',
    '00000000-0000-4000-8000-000000000001', repeat('a', 64), repeat('b', 64)
  );
  if coalesce((v_result ->> 'duplicate')::boolean, false) is not true then
    raise exception 'idempotent retry was not recognized';
  end if;

  for counter in 2..5 loop
    perform public.submit_public_map_claim_request(
      'new', null, 'Neighborhood Pantry ' || counter, 'Private Person',
      'private+' || counter || '@example.org', null,
      ('00000000-0000-4000-8000-' || lpad(counter::text, 12, '0'))::uuid,
      repeat('a', 64), repeat(md5(counter::text), 2)
    );
  end loop;

  v_result := public.submit_public_map_claim_request(
    'new', null, 'Rate Limited Pantry', 'Private Person',
    'private+limit@example.org', null,
    '00000000-0000-4000-8000-000000000006', repeat('a', 64), repeat('c', 64)
  );
  if v_result ->> 'status' <> 'rate_limited' then
    raise exception 'sixth hourly request must be rate limited';
  end if;

  v_result := public.deliver_public_map_claim_request(v_claim_id, v_owner_id, null);
  if coalesce((v_result ->> 'ok')::boolean, false) is not true then
    raise exception 'claim delivery failed';
  end if;

  v_result := public.deliver_public_map_claim_request(v_claim_id, v_owner_id, null);
  if coalesce((v_result ->> 'ok')::boolean, false) is not true then
    raise exception 'idempotent claim delivery failed';
  end if;

  if (select count(*) from public.organization_projects) <> 1
    or (select count(*) from public.organization_tasks) <> 1
    or (select count(*) from public.notifications) <> 1 then
    raise exception 'delivery must create exactly one project, task, and notification';
  end if;

  if exists (
    select 1
    from public.organization_tasks task
    where task.title || coalesce(task.description, '') ilike '%private%'
  ) or exists (
    select 1
    from public.notifications notification
    where notification.title || notification.description || coalesce(notification.href, '')
      ilike '%private%'
  ) then
    raise exception 'task or notification leaked claim PII';
  end if;
end;
$$;
