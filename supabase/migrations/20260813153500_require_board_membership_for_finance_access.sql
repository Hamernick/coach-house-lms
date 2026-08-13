set search_path = public;

create or replace function public.is_current_organization_board_member(
  target_org_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = target_org_id
      and membership.member_id = (select auth.uid())
      and membership.role = 'board'
  );
$$;

revoke all on function public.is_current_organization_board_member(uuid)
  from public;
grant execute on function public.is_current_organization_board_member(uuid)
  to authenticated, service_role;

create or replace function public.can_view_organization_finance(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      target_org_id = (select auth.uid())
      or exists (
        select 1
        from public.organization_finance_access access
        where access.org_id = target_org_id
          and access.member_id = (select auth.uid())
          and public.is_current_organization_board_member(target_org_id)
      )
    );
$$;

drop policy if exists "organization_finance_access_select"
  on public.organization_finance_access;

create policy "organization_finance_access_select"
  on public.organization_finance_access
  for select
  to authenticated
  using (
    org_id = (select auth.uid())
    or (
      member_id = (select auth.uid())
      and (select public.is_current_organization_board_member(org_id))
    )
  );

create or replace function public.revoke_finance_access_after_membership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_org_id uuid;
  target_member_id uuid;
begin
  if tg_op = 'DELETE' then
    target_org_id := old.org_id;
    target_member_id := old.member_id;
  else
    target_org_id := new.org_id;
    target_member_id := new.member_id;
  end if;

  if tg_op = 'DELETE'
    or tg_op = 'INSERT'
    or old.role is distinct from new.role then
    delete from public.organization_finance_access
    where org_id = target_org_id
      and member_id = target_member_id;
  end if;

  return null;
end;
$$;

revoke all on function public.revoke_finance_access_after_membership_change()
  from public;

drop trigger if exists revoke_finance_access_after_membership_change
  on public.organization_memberships;

create trigger revoke_finance_access_after_membership_change
after insert or delete or update of role
on public.organization_memberships
for each row
execute function public.revoke_finance_access_after_membership_change();
