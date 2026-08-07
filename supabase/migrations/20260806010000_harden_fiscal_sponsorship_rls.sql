set check_function_bodies = off;
set search_path = public;

create or replace function public.can_manage_fiscal_sponsorship_organization(
  p_organization_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(
    public.is_admin()
    or exists (
      select 1
      from public.organization_coach_assignments assignment
      where assignment.organization_id = p_organization_id
        and assignment.coach_user_id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function public.can_manage_fiscal_sponsorship_organization(uuid)
  from public, anon;
grant execute on function public.can_manage_fiscal_sponsorship_organization(uuid)
  to authenticated, service_role;

drop policy if exists "fiscal_sponsorship_applications_select"
  on public.fiscal_sponsorship_applications;
create policy "fiscal_sponsorship_applications_select"
on public.fiscal_sponsorship_applications
for select
to authenticated
using (
  public.can_manage_fiscal_sponsorship_organization(org_id)
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = fiscal_sponsorship_applications.org_id
      and membership.member_id = (select auth.uid())
  )
);

drop policy if exists "fiscal_sponsorship_reviews_select"
  on public.fiscal_sponsorship_reviews;
create policy "fiscal_sponsorship_reviews_select"
on public.fiscal_sponsorship_reviews
for select
to authenticated
using (
  public.can_manage_fiscal_sponsorship_organization(org_id)
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = fiscal_sponsorship_reviews.org_id
      and membership.member_id = (select auth.uid())
  )
);

drop policy if exists "fiscal_sponsorship_documents_select"
  on public.fiscal_sponsorship_documents;
create policy "fiscal_sponsorship_documents_select"
on public.fiscal_sponsorship_documents
for select
to authenticated
using (
  public.can_manage_fiscal_sponsorship_organization(org_id)
  or org_id = (select auth.uid())
  or generated_by = (select auth.uid())
  or (
    coalesce(document_key, '') <> 'tax_id_confirmation'
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.org_id = fiscal_sponsorship_documents.org_id
        and membership.member_id = (select auth.uid())
    )
  )
  or (
    document_key = 'tax_id_confirmation'
    and exists (
      select 1
      from public.organization_memberships membership
      where membership.org_id = fiscal_sponsorship_documents.org_id
        and membership.member_id = (select auth.uid())
        and membership.role in ('owner', 'admin', 'staff')
    )
  )
);

drop policy if exists "fiscal_sponsorship_signature_packets_select"
  on public.fiscal_sponsorship_signature_packets;
create policy "fiscal_sponsorship_signature_packets_select"
on public.fiscal_sponsorship_signature_packets
for select
to authenticated
using (
  public.can_manage_fiscal_sponsorship_organization(org_id)
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = fiscal_sponsorship_signature_packets.org_id
      and membership.member_id = (select auth.uid())
  )
);

drop policy if exists "fiscal_sponsorship_events_select"
  on public.fiscal_sponsorship_events;
create policy "fiscal_sponsorship_events_select"
on public.fiscal_sponsorship_events
for select
to authenticated
using (
  public.can_manage_fiscal_sponsorship_organization(org_id)
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = fiscal_sponsorship_events.org_id
      and membership.member_id = (select auth.uid())
  )
);

drop policy if exists "fiscal_sponsorship_applications_insert"
  on public.fiscal_sponsorship_applications;
drop policy if exists "fiscal_sponsorship_applications_update"
  on public.fiscal_sponsorship_applications;
drop policy if exists "fiscal_sponsorship_reviews_insert"
  on public.fiscal_sponsorship_reviews;
drop policy if exists "fiscal_sponsorship_documents_insert"
  on public.fiscal_sponsorship_documents;
drop policy if exists "fiscal_sponsorship_documents_update"
  on public.fiscal_sponsorship_documents;
drop policy if exists "fiscal_sponsorship_signature_packets_insert"
  on public.fiscal_sponsorship_signature_packets;
drop policy if exists "fiscal_sponsorship_signature_packets_update"
  on public.fiscal_sponsorship_signature_packets;
drop policy if exists "fiscal_sponsorship_events_insert"
  on public.fiscal_sponsorship_events;

revoke all
  on table
    public.fiscal_sponsorship_applications,
    public.fiscal_sponsorship_reviews,
    public.fiscal_sponsorship_documents,
    public.fiscal_sponsorship_signature_packets,
    public.fiscal_sponsorship_events,
    public.fiscal_sponsorship_signatures
  from public, anon;

revoke insert, update, delete
  on table
    public.fiscal_sponsorship_applications,
    public.fiscal_sponsorship_reviews,
    public.fiscal_sponsorship_documents,
    public.fiscal_sponsorship_signature_packets,
    public.fiscal_sponsorship_events,
    public.fiscal_sponsorship_signatures
  from authenticated;

grant select
  on table
    public.fiscal_sponsorship_applications,
    public.fiscal_sponsorship_reviews,
    public.fiscal_sponsorship_documents,
    public.fiscal_sponsorship_signature_packets,
    public.fiscal_sponsorship_events,
    public.fiscal_sponsorship_signatures
  to authenticated;

grant select, insert, update, delete
  on table public.fiscal_sponsorship_signing_drafts
  to authenticated;

revoke all
  on table public.fiscal_sponsorship_signing_drafts
  from public, anon;
