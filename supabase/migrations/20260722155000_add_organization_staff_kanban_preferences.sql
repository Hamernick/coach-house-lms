create table if not exists public.organization_staff_kanban_preferences (
  staff_user_id uuid not null references public.platform_staff_members(user_id) on delete cascade,
  organization_id uuid not null references public.organizations(user_id) on delete cascade,
  hidden_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (staff_user_id, organization_id)
);

create index if not exists organization_staff_kanban_preferences_organization_id_idx
  on public.organization_staff_kanban_preferences(organization_id);

drop trigger if exists set_updated_at_organization_staff_kanban_preferences
  on public.organization_staff_kanban_preferences;
create trigger set_updated_at_organization_staff_kanban_preferences
before update on public.organization_staff_kanban_preferences
for each row execute procedure public.handle_updated_at();

alter table public.organization_staff_kanban_preferences enable row level security;
alter table public.organization_staff_kanban_preferences force row level security;

revoke all on public.organization_staff_kanban_preferences from public, anon;
grant select, insert, update, delete
  on public.organization_staff_kanban_preferences
  to authenticated;

create policy organization_staff_kanban_preferences_select_own
on public.organization_staff_kanban_preferences
for select
to authenticated
using (
  staff_user_id = (select auth.uid())
  and (select public.is_platform_staff())
);

create policy organization_staff_kanban_preferences_insert_own
on public.organization_staff_kanban_preferences
for insert
to authenticated
with check (
  staff_user_id = (select auth.uid())
  and (select public.is_platform_staff())
);

create policy organization_staff_kanban_preferences_update_own
on public.organization_staff_kanban_preferences
for update
to authenticated
using (
  staff_user_id = (select auth.uid())
  and (select public.is_platform_staff())
)
with check (
  staff_user_id = (select auth.uid())
  and (select public.is_platform_staff())
);

create policy organization_staff_kanban_preferences_delete_own
on public.organization_staff_kanban_preferences
for delete
to authenticated
using (
  staff_user_id = (select auth.uid())
  and (select public.is_platform_staff())
);
