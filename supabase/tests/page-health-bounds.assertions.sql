do $$
begin
  if has_function_privilege(
    'anon',
    'public.record_page_health_event(jsonb,uuid,uuid)',
    'execute'
  ) then
    raise exception 'anon can execute page-health recorder';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.record_page_health_event(jsonb,uuid,uuid)',
    'execute'
  ) then
    raise exception 'authenticated can execute page-health recorder';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.record_page_health_event(jsonb,uuid,uuid)',
    'execute'
  ) then
    raise exception 'service role cannot execute page-health recorder';
  end if;
end;
$$;

set role service_role;

do $$
begin
  begin
    insert into public.app_page_health_events (
      event_type,
      severity,
      source
    ) values (
      'route_error',
      'warning',
      'client'
    );
    raise exception 'service role bypassed bounded recorder';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

do $$
declare
  v_result jsonb;
begin
  set local role service_role;
  v_result := public.record_page_health_event(
    jsonb_build_object(
      'eventType', 'route_error',
      'severity', 'critical',
      'source', 'client',
      'routePath', '/bounded-recorder',
      'metadata', jsonb_build_object('test', true)
    ),
    '00000000-0000-0000-0000-000000000001',
    null
  );

  if v_result ->> 'status' <> 'recorded'
    or nullif(v_result ->> 'id', '') is null then
    raise exception 'service role could not record a valid page-health event';
  end if;
end;
$$;

insert into public.app_page_health_events (
  event_type,
  severity,
  source,
  route_path,
  occurred_at
) values (
  'route_error',
  'warning',
  'client',
  '/expired-event',
  now() - interval '31 days'
);

do $$
declare
  v_result jsonb;
begin
  set local role service_role;
  v_result := public.record_page_health_event(
    jsonb_build_object(
      'eventType', 'slow_page_load',
      'severity', 'warning',
      'source', 'client',
      'routePath', '/retention-check',
      'durationMs', 8000,
      'thresholdMs', 5000,
      'metadata', '{}'::jsonb
    ),
    '00000000-0000-0000-0000-000000000001',
    null
  );

  if v_result ->> 'status' <> 'recorded' then
    raise exception 'retention-trigger event was not recorded';
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from public.app_page_health_events
    where route_path = '/expired-event'
  ) then
    raise exception 'expired page-health event was retained';
  end if;
end;
$$;

do $$
declare
  v_result jsonb;
begin
  set local role service_role;

  for v_index in 1..121 loop
    v_result := public.record_page_health_event(
      jsonb_build_object(
        'eventType', 'global_error',
        'severity', 'warning',
        'source', 'client',
        'routePath', '/anonymous-burst',
        'metadata', '{}'::jsonb
      ),
      null,
      null
    );

    if v_index <= 120 and v_result ->> 'status' <> 'recorded' then
      raise exception 'anonymous event % was limited too early', v_index;
    end if;

    if v_index = 121 and v_result ->> 'status' <> 'rate_limited' then
      raise exception 'anonymous event 121 was not rate limited';
    end if;
  end loop;
end;
$$;

do $$
declare
  v_result jsonb;
begin
  set local role service_role;

  for v_index in 1..31 loop
    v_result := public.record_page_health_event(
      jsonb_build_object(
        'eventType', 'unhandled_rejection',
        'severity', 'warning',
        'source', 'client',
        'routePath', '/authenticated-burst',
        'metadata', '{}'::jsonb
      ),
      '00000000-0000-0000-0000-000000000002',
      null
    );

    if v_index <= 30 and v_result ->> 'status' <> 'recorded' then
      raise exception 'authenticated event % was limited too early', v_index;
    end if;

    if v_index = 31 and v_result ->> 'status' <> 'rate_limited' then
      raise exception 'authenticated event 31 was not rate limited';
    end if;
  end loop;
end;
$$;

reset role;

do $$
begin
  if (
    select count(*)
    from public.app_page_health_events
    where route_path = '/anonymous-burst'
  ) <> 120 then
    raise exception 'anonymous minute cap did not store exactly 120 events';
  end if;

  if (
    select count(*)
    from public.app_page_health_events
    where route_path = '/authenticated-burst'
  ) <> 30 then
    raise exception 'authenticated minute cap did not store exactly 30 events';
  end if;
end;
$$;
