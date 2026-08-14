-- Bound page-health telemetry writes and retain only recent operational data.
-- The global transaction lock makes count-and-insert limits atomic.

create or replace function public.record_page_health_event(
  p_event jsonb,
  p_user_id uuid default null,
  p_org_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_anonymous_day_count bigint;
  v_anonymous_minute_count bigint;
  v_day_count bigint;
  v_event_id uuid;
  v_minute_count bigint;
  v_user_day_count bigint;
  v_user_minute_count bigint;
begin
  if jsonb_typeof(p_event) <> 'object'
    or coalesce(p_event ->> 'eventType', '') not in (
      'route_error',
      'global_error',
      'unhandled_rejection',
      'slow_page_load',
      'stuck_page_load'
    )
    or coalesce(p_event ->> 'severity', '') not in (
      'info',
      'warning',
      'critical'
    )
    or coalesce(p_event ->> 'source', '') not in (
      'client',
      'error_boundary'
    )
    or char_length(coalesce(p_event ->> 'routePath', '')) > 300
    or char_length(coalesce(p_event ->> 'targetHref', '')) > 300
    or char_length(coalesce(p_event ->> 'errorName', '')) > 120
    or char_length(coalesce(p_event ->> 'errorMessage', '')) > 500
    or char_length(coalesce(p_event ->> 'errorDigest', '')) > 160
    or char_length(coalesce(p_event ->> 'stackHash', '')) > 80
    or (
      p_event ? 'durationMs'
      and jsonb_typeof(p_event -> 'durationMs') not in ('number', 'null')
    )
    or (
      p_event ? 'thresholdMs'
      and jsonb_typeof(p_event -> 'thresholdMs') not in ('number', 'null')
    )
    or coalesce((p_event ->> 'durationMs')::numeric, 0) < 0
    or coalesce((p_event ->> 'durationMs')::numeric, 0) > 2147483647
    or coalesce((p_event ->> 'thresholdMs')::numeric, 0) < 0
    or coalesce((p_event ->> 'thresholdMs')::numeric, 0) > 2147483647
    or (
      p_event ? 'metadata'
      and jsonb_typeof(p_event -> 'metadata') not in ('object', 'null')
    )
    or pg_column_size(coalesce(p_event -> 'metadata', '{}'::jsonb)) > 12000 then
    raise exception 'Invalid page-health event' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('page-health-event:global', 0)
  );

  delete from public.app_page_health_events event
  where event.id in (
    select stale.id
    from public.app_page_health_events stale
    where stale.occurred_at < now() - interval '30 days'
    order by stale.occurred_at asc
    limit 500
  );

  select count(*)
  into v_minute_count
  from public.app_page_health_events event
  where event.occurred_at >= now() - interval '1 minute';

  if v_minute_count >= 300 then
    return jsonb_build_object(
      'retryAfterSeconds', 60,
      'status', 'rate_limited'
    );
  end if;

  select count(*)
  into v_day_count
  from public.app_page_health_events event
  where event.occurred_at >= now() - interval '1 day';

  if v_day_count >= 5000 then
    return jsonb_build_object(
      'retryAfterSeconds', 3600,
      'status', 'rate_limited'
    );
  end if;

  if p_user_id is null then
    select count(*)
    into v_anonymous_minute_count
    from public.app_page_health_events event
    where event.user_id is null
      and event.occurred_at >= now() - interval '1 minute';

    if v_anonymous_minute_count >= 120 then
      return jsonb_build_object(
        'retryAfterSeconds', 60,
        'status', 'rate_limited'
      );
    end if;

    select count(*)
    into v_anonymous_day_count
    from public.app_page_health_events event
    where event.user_id is null
      and event.occurred_at >= now() - interval '1 day';

    if v_anonymous_day_count >= 2000 then
      return jsonb_build_object(
        'retryAfterSeconds', 3600,
        'status', 'rate_limited'
      );
    end if;
  else
    select count(*)
    into v_user_minute_count
    from public.app_page_health_events event
    where event.user_id = p_user_id
      and event.occurred_at >= now() - interval '1 minute';

    if v_user_minute_count >= 30 then
      return jsonb_build_object(
        'retryAfterSeconds', 60,
        'status', 'rate_limited'
      );
    end if;

    select count(*)
    into v_user_day_count
    from public.app_page_health_events event
    where event.user_id = p_user_id
      and event.occurred_at >= now() - interval '1 day';

    if v_user_day_count >= 250 then
      return jsonb_build_object(
        'retryAfterSeconds', 3600,
        'status', 'rate_limited'
      );
    end if;
  end if;

  insert into public.app_page_health_events (
    user_id,
    org_id,
    event_type,
    severity,
    source,
    route_path,
    target_href,
    duration_ms,
    threshold_ms,
    error_name,
    error_message,
    error_digest,
    stack_hash,
    metadata
  ) values (
    p_user_id,
    p_org_id,
    p_event ->> 'eventType',
    p_event ->> 'severity',
    p_event ->> 'source',
    nullif(p_event ->> 'routePath', ''),
    nullif(p_event ->> 'targetHref', ''),
    (p_event ->> 'durationMs')::integer,
    (p_event ->> 'thresholdMs')::integer,
    nullif(p_event ->> 'errorName', ''),
    nullif(p_event ->> 'errorMessage', ''),
    nullif(p_event ->> 'errorDigest', ''),
    nullif(p_event ->> 'stackHash', ''),
    coalesce(p_event -> 'metadata', '{}'::jsonb)
  )
  returning id into v_event_id;

  return jsonb_build_object(
    'id', v_event_id,
    'status', 'recorded'
  );
end;
$$;

revoke all on function public.record_page_health_event(
  jsonb,
  uuid,
  uuid
) from public, anon, authenticated;

grant execute on function public.record_page_health_event(
  jsonb,
  uuid,
  uuid
) to service_role;

revoke insert, update on table public.app_page_health_events from service_role;

notify pgrst, 'reload schema';
