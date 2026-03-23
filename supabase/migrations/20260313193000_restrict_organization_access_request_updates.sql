set check_function_bodies = off;
set search_path = public;

drop policy if exists "organization_access_requests_update" on public.organization_access_requests;

create policy "organization_access_requests_update" on public.organization_access_requests
  for update
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings oas
        on oas.org_id = om.org_id
      where om.org_id = organization_access_requests.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and coalesce(oas.admins_can_invite, false)
    )
  )
  with check (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      join public.organization_access_settings oas
        on oas.org_id = om.org_id
      where om.org_id = organization_access_requests.org_id
        and om.member_id = (select auth.uid())
        and om.role = 'admin'
        and coalesce(oas.admins_can_invite, false)
    )
  );
