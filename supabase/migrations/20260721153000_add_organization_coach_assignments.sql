create table if not exists public.organization_coach_assignments (
  organization_id uuid primary key references public.organizations(user_id) on delete cascade,
  coach_user_id uuid not null references public.platform_staff_members(user_id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists organization_coach_assignments_coach_user_id_idx
  on public.organization_coach_assignments(coach_user_id);

create index if not exists organization_coach_assignments_assigned_by_idx
  on public.organization_coach_assignments(assigned_by);

create or replace function public.require_coach_assignment_access_level()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.platform_staff_members
    where user_id = new.coach_user_id
      and access_level = 'coach'
  ) then
    raise exception 'Organization assignments require coach-level staff.';
  end if;

  return new;
end;
$$;

drop trigger if exists require_coach_assignment_access_level
  on public.organization_coach_assignments;
create trigger require_coach_assignment_access_level
before insert or update of coach_user_id
on public.organization_coach_assignments
for each row execute procedure public.require_coach_assignment_access_level();

revoke execute on function public.require_coach_assignment_access_level()
  from public, anon, authenticated;

create or replace function public.prevent_assigned_coach_access_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.access_level = 'coach'
    and new.access_level <> 'coach'
    and exists (
      select 1
      from public.organization_coach_assignments
      where coach_user_id = old.user_id
    ) then
    raise exception 'Unassign this coach from organizations before changing access level.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_assigned_coach_access_change
  on public.platform_staff_members;
create trigger prevent_assigned_coach_access_change
before update of access_level
on public.platform_staff_members
for each row execute procedure public.prevent_assigned_coach_access_change();

revoke execute on function public.prevent_assigned_coach_access_change()
  from public, anon, authenticated;

drop trigger if exists set_updated_at_organization_coach_assignments
  on public.organization_coach_assignments;
create trigger set_updated_at_organization_coach_assignments
before update on public.organization_coach_assignments
for each row execute procedure public.handle_updated_at();

alter table public.organization_coach_assignments enable row level security;
alter table public.organization_coach_assignments force row level security;

revoke all on public.organization_coach_assignments from anon;
grant select, insert, update, delete on public.organization_coach_assignments to authenticated;

drop policy if exists organization_coach_assignments_platform_staff_select
  on public.organization_coach_assignments;
create policy organization_coach_assignments_platform_staff_select
on public.organization_coach_assignments
for select
to authenticated
using ((select public.is_platform_staff()));

drop policy if exists organization_coach_assignments_developer_insert
  on public.organization_coach_assignments;
create policy organization_coach_assignments_developer_insert
on public.organization_coach_assignments
for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists organization_coach_assignments_developer_update
  on public.organization_coach_assignments;
create policy organization_coach_assignments_developer_update
on public.organization_coach_assignments
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists organization_coach_assignments_developer_delete
  on public.organization_coach_assignments;
create policy organization_coach_assignments_developer_delete
on public.organization_coach_assignments
for delete
to authenticated
using ((select public.is_admin()));
