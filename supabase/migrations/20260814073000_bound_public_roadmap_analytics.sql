-- Bound public roadmap analytics writes without storing visitor identifiers.
-- The per-organization lock makes the count-and-insert limit atomic.

create index if not exists roadmap_events_org_created_idx
  on public.roadmap_events (org_id, created_at desc);

create or replace function public.record_public_roadmap_event(
  p_org_id uuid,
  p_section_id text,
  p_event_type public.roadmap_event_type,
  p_duration_ms integer,
  p_source text,
  p_referrer text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_day_count bigint;
  v_minute_count bigint;
begin
  if char_length(coalesce(p_section_id, '')) > 80
    or char_length(coalesce(p_source, '')) > 200
    or char_length(coalesce(p_referrer, '')) > 1000
    or coalesce(p_duration_ms, 0) < 0
    or coalesce(p_duration_ms, 0) > 86400000 then
    raise exception 'Invalid public roadmap event';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('public-roadmap-event:' || p_org_id::text, 0)
  );

  perform 1
  from public.organizations organization
  where organization.user_id = p_org_id
    and organization.is_public_roadmap is true
  for share;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select count(*)
  into v_minute_count
  from public.roadmap_events event
  where event.org_id = p_org_id
    and event.created_at >= now() - interval '1 minute';

  if v_minute_count >= 120 then
    return jsonb_build_object(
      'retryAfterSeconds', 60,
      'status', 'rate_limited'
    );
  end if;

  select count(*)
  into v_day_count
  from public.roadmap_events event
  where event.org_id = p_org_id
    and event.created_at >= now() - interval '1 day';

  if v_day_count >= 5000 then
    return jsonb_build_object(
      'retryAfterSeconds', 3600,
      'status', 'rate_limited'
    );
  end if;

  insert into public.roadmap_events (
    org_id,
    section_id,
    event_type,
    duration_ms,
    source,
    referrer
  ) values (
    p_org_id,
    nullif(p_section_id, ''),
    p_event_type,
    p_duration_ms,
    nullif(p_source, ''),
    nullif(p_referrer, '')
  );

  return jsonb_build_object('status', 'recorded');
end;
$$;

revoke all on function public.record_public_roadmap_event(
  uuid,
  text,
  public.roadmap_event_type,
  integer,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.record_public_roadmap_event(
  uuid,
  text,
  public.roadmap_event_type,
  integer,
  text,
  text
) to service_role;
