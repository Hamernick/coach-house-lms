-- Enforce page-health retention even when no new telemetry arrives.

create or replace function public.purge_expired_page_health_events(
  p_batch_size integer default 500
)
returns integer
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_deleted_count integer;
begin
  if p_batch_size < 1 or p_batch_size > 500 then
    raise exception 'Invalid page-health retention batch size'
      using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('page-health-event:global', 0)
  );

  with expired as (
    select event.id
    from public.app_page_health_events event
    where event.occurred_at < now() - interval '30 days'
    order by event.occurred_at asc
    limit p_batch_size
    for update skip locked
  )
  delete from public.app_page_health_events event
  using expired
  where event.id = expired.id;

  get diagnostics v_deleted_count = row_count;
  return v_deleted_count;
end;
$$;

revoke all on function public.purge_expired_page_health_events(integer)
  from public, anon, authenticated, service_role;

do $schedule$
begin
  if not exists (
    select 1
    from pg_catalog.pg_available_extensions
    where name = 'pg_cron'
  ) then
    raise warning 'pg_cron is unavailable; page-health retention job was not scheduled';
    return;
  end if;

  create extension if not exists pg_cron;

  perform cron.schedule(
    'purge-expired-page-health-events',
    '*/15 * * * *',
    'select public.purge_expired_page_health_events(500);'
  );
end;
$schedule$;
