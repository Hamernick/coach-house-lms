create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create extension if not exists pgcrypto;
create schema auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth, public to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

create table public.platform_staff_members (
  user_id uuid primary key,
  access_level text not null check (access_level in ('developer', 'coach'))
);

create table public.organization_coach_assignments (
  organization_id uuid primary key,
  coach_user_id uuid not null
);

create table public.organization_memberships (
  org_id uuid not null,
  member_id uuid not null,
  role text not null,
  primary key (org_id, member_id)
);

create index organization_coach_assignments_coach_user_id_idx
  on public.organization_coach_assignments (coach_user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(
    (
      select staff.access_level = 'developer'
      from public.platform_staff_members staff
      where staff.user_id = (select auth.uid())
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, service_role;
grant select on public.organization_memberships to authenticated;

create table public.fiscal_sponsorship_applications (
  id uuid primary key,
  org_id uuid not null,
  project_id uuid not null,
  status text not null
);

create table public.fiscal_sponsorship_reviews (
  id uuid primary key,
  application_id uuid not null,
  org_id uuid not null,
  project_id uuid not null
);

create table public.fiscal_sponsorship_documents (
  id uuid primary key,
  application_id uuid not null,
  org_id uuid not null,
  project_id uuid not null,
  document_key text,
  generated_by uuid
);

create table public.fiscal_sponsorship_signature_packets (
  id uuid primary key,
  application_id uuid not null,
  document_id uuid not null,
  org_id uuid not null,
  project_id uuid not null,
  applicant_signer_id uuid,
  status text not null
);

create table public.fiscal_sponsorship_events (
  id uuid primary key,
  application_id uuid,
  org_id uuid not null,
  project_id uuid not null
);

create table public.fiscal_sponsorship_signing_drafts (
  id uuid primary key,
  packet_id uuid not null,
  application_id uuid not null,
  org_id uuid not null,
  project_id uuid not null,
  signer_id uuid not null,
  signer_role text not null,
  revision bigint not null default 0
);

create table public.fiscal_sponsorship_signatures (
  id uuid primary key,
  signer_id uuid not null
);

alter table public.fiscal_sponsorship_applications enable row level security;
alter table public.fiscal_sponsorship_applications force row level security;
alter table public.fiscal_sponsorship_reviews enable row level security;
alter table public.fiscal_sponsorship_reviews force row level security;
alter table public.fiscal_sponsorship_documents enable row level security;
alter table public.fiscal_sponsorship_documents force row level security;
alter table public.fiscal_sponsorship_signature_packets enable row level security;
alter table public.fiscal_sponsorship_signature_packets force row level security;
alter table public.fiscal_sponsorship_events enable row level security;
alter table public.fiscal_sponsorship_events force row level security;
alter table public.fiscal_sponsorship_signing_drafts enable row level security;
alter table public.fiscal_sponsorship_signing_drafts force row level security;
alter table public.fiscal_sponsorship_signatures enable row level security;
alter table public.fiscal_sponsorship_signatures force row level security;

grant select, insert, update, delete
  on table
    public.fiscal_sponsorship_applications,
    public.fiscal_sponsorship_reviews,
    public.fiscal_sponsorship_documents,
    public.fiscal_sponsorship_signature_packets,
    public.fiscal_sponsorship_events,
    public.fiscal_sponsorship_signing_drafts,
    public.fiscal_sponsorship_signatures
  to authenticated;

create policy "fiscal_sponsorship_signing_drafts_select"
on public.fiscal_sponsorship_signing_drafts
for select
to authenticated
using (signer_id = (select auth.uid()) or public.is_admin());

create policy "fiscal_sponsorship_signing_drafts_insert"
on public.fiscal_sponsorship_signing_drafts
for insert
to authenticated
with check (
  public.is_admin()
  or (
    signer_id = (select auth.uid())
    and signer_role = 'applicant'
    and exists (
      select 1
      from public.fiscal_sponsorship_signature_packets packet
      where packet.id = fiscal_sponsorship_signing_drafts.packet_id
        and packet.applicant_signer_id = (select auth.uid())
        and packet.status = 'sent'
        and packet.application_id = fiscal_sponsorship_signing_drafts.application_id
        and packet.org_id = fiscal_sponsorship_signing_drafts.org_id
        and packet.project_id = fiscal_sponsorship_signing_drafts.project_id
    )
  )
);

create policy "fiscal_sponsorship_signing_drafts_update"
on public.fiscal_sponsorship_signing_drafts
for update
to authenticated
using (signer_id = (select auth.uid()) or public.is_admin())
with check (
  public.is_admin()
  or (
    signer_id = (select auth.uid())
    and signer_role = 'applicant'
    and exists (
      select 1
      from public.fiscal_sponsorship_signature_packets packet
      where packet.id = fiscal_sponsorship_signing_drafts.packet_id
        and packet.applicant_signer_id = (select auth.uid())
        and packet.status = 'sent'
    )
  )
);

create policy "fiscal_sponsorship_signing_drafts_delete"
on public.fiscal_sponsorship_signing_drafts
for delete
to authenticated
using (signer_id = (select auth.uid()) or public.is_admin());

create policy "fiscal_sponsorship_signatures_select"
on public.fiscal_sponsorship_signatures
for select
to authenticated
using (public.is_admin() or signer_id = (select auth.uid()));

insert into public.platform_staff_members (user_id, access_level) values
  ('00000000-0000-0000-0000-000000000004', 'developer'),
  ('00000000-0000-0000-0000-000000000005', 'coach'),
  ('00000000-0000-0000-0000-000000000006', 'coach');

insert into public.organization_coach_assignments (
  organization_id,
  coach_user_id
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000005'
);

insert into public.organization_memberships (org_id, member_id, role) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'staff'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'board');

insert into public.fiscal_sponsorship_applications (
  id,
  org_id,
  project_id,
  status
) values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'submitted'
);

insert into public.fiscal_sponsorship_reviews (
  id,
  application_id,
  org_id,
  project_id
) values (
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001'
);

insert into public.fiscal_sponsorship_documents (
  id,
  application_id,
  org_id,
  project_id,
  document_key,
  generated_by
) values
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'governing_documents',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'tax_id_confirmation',
    '00000000-0000-0000-0000-000000000001'
  );

insert into public.fiscal_sponsorship_signature_packets (
  id,
  application_id,
  document_id,
  org_id,
  project_id,
  applicant_signer_id,
  status
) values (
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'sent'
);

insert into public.fiscal_sponsorship_events (
  id,
  application_id,
  org_id,
  project_id
) values (
  '60000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001'
);

insert into public.fiscal_sponsorship_signatures (id, signer_id) values (
  '70000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
);
