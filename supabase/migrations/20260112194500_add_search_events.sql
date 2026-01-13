set check_function_bodies = off;
set search_path = public;

create table if not exists search_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  org_id uuid references organizations(user_id) on delete set null,
  event_type text not null,
  query text,
  query_length integer,
  context text,
  result_count integer,
  result_id text,
  result_group text,
  result_href text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint search_events_event_type_check check (event_type in ('open', 'query', 'select'))
);

create index if not exists search_events_user_id_idx on search_events (user_id);
create index if not exists search_events_created_at_idx on search_events (created_at);
create index if not exists search_events_event_type_idx on search_events (event_type);

alter table search_events enable row level security;
alter table search_events force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'search_events'
      and policyname = 'search_events_self_insert'
  ) then
    execute 'create policy "search_events_self_insert" on search_events for insert with check (user_id = auth.uid())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'search_events'
      and policyname = 'search_events_admin_read'
  ) then
    execute 'create policy "search_events_admin_read" on search_events for select using (public.is_admin())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'search_events'
      and policyname = 'search_events_admin_manage'
  ) then
    execute 'create policy "search_events_admin_manage" on search_events for all using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;
