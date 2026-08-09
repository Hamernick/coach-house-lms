create table if not exists public.app_page_health_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  org_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  severity text not null default 'warning',
  source text not null default 'client',
  route_path text,
  target_href text,
  duration_ms integer,
  threshold_ms integer,
  error_name text,
  error_message text,
  error_digest text,
  stack_hash text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  constraint app_page_health_events_event_type_check check (
    event_type in (
      'route_error',
      'global_error',
      'unhandled_rejection',
      'slow_page_load',
      'stuck_page_load'
    )
  ),
  constraint app_page_health_events_severity_check check (
    severity in ('info', 'warning', 'critical')
  ),
  constraint app_page_health_events_source_check check (
    source in ('client', 'error_boundary')
  ),
  constraint app_page_health_events_duration_ms_check check (
    duration_ms is null or duration_ms >= 0
  ),
  constraint app_page_health_events_threshold_ms_check check (
    threshold_ms is null or threshold_ms >= 0
  )
);

create index if not exists app_page_health_events_occurred_at_idx
  on public.app_page_health_events (occurred_at desc);

create index if not exists app_page_health_events_user_id_occurred_at_idx
  on public.app_page_health_events (user_id, occurred_at desc);

create index if not exists app_page_health_events_org_id_occurred_at_idx
  on public.app_page_health_events (org_id, occurred_at desc);

create index if not exists app_page_health_events_event_type_idx
  on public.app_page_health_events (event_type);

create index if not exists app_page_health_events_severity_idx
  on public.app_page_health_events (severity);

create index if not exists app_page_health_events_route_path_idx
  on public.app_page_health_events (route_path);

alter table public.app_page_health_events enable row level security;
alter table public.app_page_health_events force row level security;

revoke all on table public.app_page_health_events from anon, authenticated;
grant select on table public.app_page_health_events to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_page_health_events'
      and policyname = 'app_page_health_events_admin_read'
  ) then
    create policy "app_page_health_events_admin_read"
      on public.app_page_health_events
      for select
      using (public.is_admin());
  end if;
end $$;

notify pgrst, 'reload schema';
