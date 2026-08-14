grant insert, select, delete on public.app_page_health_events to service_role;

set role service_role;

insert into public.app_page_health_events (
  event_type,
  severity,
  source,
  route_path
)
select
  'route_error',
  'warning',
  'client',
  '/pre-fix-burst'
from generate_series(1, 121);

reset role;

do $$
begin
  if (
    select count(*)
    from public.app_page_health_events
    where route_path = '/pre-fix-burst'
  ) <> 121 then
    raise exception 'pre-fix page-health burst was unexpectedly bounded';
  end if;
end;
$$;

delete from public.app_page_health_events
where route_path = '/pre-fix-burst';
