set check_function_bodies = off;
set search_path = public;

create table if not exists public.fiscal_sponsorship_applications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  status text not null default 'draft'
    check (
      status in (
        'draft',
        'submitted',
        'in_review',
        'needs_info',
        'approved',
        'declined',
        'agreement_ready',
        'signed',
        'countersigned'
      )
    ),
  applicant_full_name text,
  applicant_first_name text,
  applicant_last_name text,
  mailing_street_address text,
  mailing_street_address_2 text,
  mailing_city text,
  mailing_state text,
  mailing_postal_code text,
  phone_number text,
  primary_email text,
  legal_entity_type text
    check (
      legal_entity_type is null
      or legal_entity_type in (
        'corporation',
        'individual',
        'informal_group_with_ein',
        'llc',
        'partnership',
        'other'
      )
    ),
  legal_entity_has_501c3 boolean,
  formation_status text,
  project_name text,
  project_duration_type text
    check (
      project_duration_type is null
      or project_duration_type in ('temporary', 'ongoing_multi_year')
    ),
  temporary_start_date date,
  temporary_end_date date,
  focus_area text,
  project_description text,
  project_location text,
  estimated_budget_cents bigint check (
    estimated_budget_cents is null
    or estimated_budget_cents >= 0
  ),
  expense_summary text,
  prospective_funding_sources text,
  public_benefit text,
  leadership_background text,
  initiative_history text,
  short_public_description text,
  operates_outside_united_states boolean,
  receives_investor_return_funds boolean,
  engages_in_lobbying boolean,
  has_legal_compliance_financial_concerns boolean,
  concerns_explanation text,
  source_snapshot jsonb not null default '{}'::jsonb,
  document_template_payload jsonb not null default '{}'::jsonb,
  review_notes text,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fiscal_sponsorship_applications_project_key unique (org_id, project_id),
  constraint fiscal_sponsorship_applications_temporary_dates_check
    check (
      temporary_start_date is null
      or temporary_end_date is null
      or temporary_end_date >= temporary_start_date
    )
);

create index if not exists fiscal_sponsorship_applications_project_id_idx
  on public.fiscal_sponsorship_applications (project_id);

create index if not exists fiscal_sponsorship_applications_org_status_idx
  on public.fiscal_sponsorship_applications (org_id, status, updated_at desc);

create index if not exists fiscal_sponsorship_applications_updated_at_idx
  on public.fiscal_sponsorship_applications (updated_at desc);

drop trigger if exists set_updated_at_fiscal_sponsorship_applications
  on public.fiscal_sponsorship_applications;

create trigger set_updated_at_fiscal_sponsorship_applications
before update on public.fiscal_sponsorship_applications
for each row execute procedure public.handle_updated_at();

alter table public.fiscal_sponsorship_applications enable row level security;
alter table public.fiscal_sponsorship_applications force row level security;

drop policy if exists "fiscal_sponsorship_applications_select"
  on public.fiscal_sponsorship_applications;
drop policy if exists "fiscal_sponsorship_applications_insert"
  on public.fiscal_sponsorship_applications;
drop policy if exists "fiscal_sponsorship_applications_update"
  on public.fiscal_sponsorship_applications;

create policy "fiscal_sponsorship_applications_select"
on public.fiscal_sponsorship_applications
for select
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships om
    where om.org_id = fiscal_sponsorship_applications.org_id
      and om.member_id = (select auth.uid())
  )
);

create policy "fiscal_sponsorship_applications_insert"
on public.fiscal_sponsorship_applications
for insert
to authenticated
with check (
  (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = fiscal_sponsorship_applications.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  )
  and exists (
    select 1
    from public.organization_projects op
    where op.id = fiscal_sponsorship_applications.project_id
      and op.org_id = fiscal_sponsorship_applications.org_id
  )
);

create policy "fiscal_sponsorship_applications_update"
on public.fiscal_sponsorship_applications
for update
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships om
    where om.org_id = fiscal_sponsorship_applications.org_id
      and om.member_id = (select auth.uid())
      and om.role in ('admin', 'staff')
  )
)
with check (
  (
    public.is_admin()
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = fiscal_sponsorship_applications.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('admin', 'staff')
    )
  )
  and exists (
    select 1
    from public.organization_projects op
    where op.id = fiscal_sponsorship_applications.project_id
      and op.org_id = fiscal_sponsorship_applications.org_id
  )
);
