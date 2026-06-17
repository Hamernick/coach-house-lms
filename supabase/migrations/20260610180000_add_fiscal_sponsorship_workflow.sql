set check_function_bodies = off;
set search_path = public;

create table if not exists public.fiscal_sponsorship_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.fiscal_sponsorship_applications(id) on delete cascade,
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  decision text not null
    check (decision in ('approved', 'needs_info', 'declined')),
  notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint fiscal_sponsorship_reviews_application_scope_check
    unique (application_id, decision, reviewed_at)
);

create index if not exists fiscal_sponsorship_reviews_application_idx
  on public.fiscal_sponsorship_reviews (application_id, reviewed_at desc);

create index if not exists fiscal_sponsorship_reviews_org_project_idx
  on public.fiscal_sponsorship_reviews (org_id, project_id, reviewed_at desc);

create table if not exists public.fiscal_sponsorship_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.fiscal_sponsorship_applications(id) on delete cascade,
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  asset_id uuid references public.organization_project_assets(id) on delete set null,
  kind text not null
    check (
      kind in (
        'application',
        'agreement',
        'executed_agreement',
        'audit_certificate',
        'regrant'
      )
    ),
  status text not null default 'generated'
    check (
      status in (
        'draft',
        'generated',
        'sent_for_signature',
        'partially_signed',
        'executed',
        'voided',
        'error'
      )
    ),
  title text not null,
  version integer not null default 1 check (version > 0),
  storage_path text,
  mime text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  source_snapshot jsonb not null default '{}'::jsonb,
  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fiscal_sponsorship_documents_version_key
    unique (application_id, kind, version)
);

create index if not exists fiscal_sponsorship_documents_application_kind_idx
  on public.fiscal_sponsorship_documents (application_id, kind, version desc);

create index if not exists fiscal_sponsorship_documents_org_project_idx
  on public.fiscal_sponsorship_documents (org_id, project_id, created_at desc);

drop trigger if exists set_updated_at_fiscal_sponsorship_documents
  on public.fiscal_sponsorship_documents;

create trigger set_updated_at_fiscal_sponsorship_documents
before update on public.fiscal_sponsorship_documents
for each row execute procedure public.handle_updated_at();

create table if not exists public.fiscal_sponsorship_signature_packets (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.fiscal_sponsorship_applications(id) on delete cascade,
  document_id uuid not null references public.fiscal_sponsorship_documents(id) on delete cascade,
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  provider text not null default 'docuseal',
  provider_template_id text,
  provider_submission_id text,
  status text not null default 'draft'
    check (
      status in (
        'draft',
        'sent',
        'coach_signed',
        'applicant_signed',
        'completed',
        'declined',
        'voided',
        'error'
      )
    ),
  coach_signer_name text,
  coach_signer_email text,
  applicant_signer_name text,
  applicant_signer_email text,
  sent_by uuid references public.profiles(id) on delete set null,
  sent_at timestamptz,
  completed_at timestamptz,
  executed_document_id uuid references public.fiscal_sponsorship_documents(id) on delete set null,
  audit_document_id uuid references public.fiscal_sponsorship_documents(id) on delete set null,
  provider_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint fiscal_sponsorship_signature_packets_provider_submission_key
    unique (provider, provider_submission_id)
);

create index if not exists fiscal_sponsorship_signature_packets_application_idx
  on public.fiscal_sponsorship_signature_packets (application_id, created_at desc);

create index if not exists fiscal_sponsorship_signature_packets_provider_idx
  on public.fiscal_sponsorship_signature_packets (provider, provider_submission_id);

drop trigger if exists set_updated_at_fiscal_sponsorship_signature_packets
  on public.fiscal_sponsorship_signature_packets;

create trigger set_updated_at_fiscal_sponsorship_signature_packets
before update on public.fiscal_sponsorship_signature_packets
for each row execute procedure public.handle_updated_at();

create table if not exists public.fiscal_sponsorship_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.fiscal_sponsorship_applications(id) on delete cascade,
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  event_type text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists fiscal_sponsorship_events_application_idx
  on public.fiscal_sponsorship_events (application_id, created_at desc);

create index if not exists fiscal_sponsorship_events_org_project_idx
  on public.fiscal_sponsorship_events (org_id, project_id, created_at desc);

alter table public.fiscal_sponsorship_reviews enable row level security;
alter table public.fiscal_sponsorship_reviews force row level security;
alter table public.fiscal_sponsorship_documents enable row level security;
alter table public.fiscal_sponsorship_documents force row level security;
alter table public.fiscal_sponsorship_signature_packets enable row level security;
alter table public.fiscal_sponsorship_signature_packets force row level security;
alter table public.fiscal_sponsorship_events enable row level security;
alter table public.fiscal_sponsorship_events force row level security;

drop policy if exists "fiscal_sponsorship_reviews_select" on public.fiscal_sponsorship_reviews;
drop policy if exists "fiscal_sponsorship_reviews_insert" on public.fiscal_sponsorship_reviews;
drop policy if exists "fiscal_sponsorship_documents_select" on public.fiscal_sponsorship_documents;
drop policy if exists "fiscal_sponsorship_documents_insert" on public.fiscal_sponsorship_documents;
drop policy if exists "fiscal_sponsorship_documents_update" on public.fiscal_sponsorship_documents;
drop policy if exists "fiscal_sponsorship_signature_packets_select" on public.fiscal_sponsorship_signature_packets;
drop policy if exists "fiscal_sponsorship_signature_packets_insert" on public.fiscal_sponsorship_signature_packets;
drop policy if exists "fiscal_sponsorship_signature_packets_update" on public.fiscal_sponsorship_signature_packets;
drop policy if exists "fiscal_sponsorship_events_select" on public.fiscal_sponsorship_events;
drop policy if exists "fiscal_sponsorship_events_insert" on public.fiscal_sponsorship_events;

create policy "fiscal_sponsorship_reviews_select"
on public.fiscal_sponsorship_reviews
for select
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships om
    where om.org_id = fiscal_sponsorship_reviews.org_id
      and om.member_id = (select auth.uid())
  )
);

create policy "fiscal_sponsorship_reviews_insert"
on public.fiscal_sponsorship_reviews
for insert
to authenticated
with check (public.is_admin());

create policy "fiscal_sponsorship_documents_select"
on public.fiscal_sponsorship_documents
for select
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships om
    where om.org_id = fiscal_sponsorship_documents.org_id
      and om.member_id = (select auth.uid())
  )
);

create policy "fiscal_sponsorship_documents_insert"
on public.fiscal_sponsorship_documents
for insert
to authenticated
with check (public.is_admin());

create policy "fiscal_sponsorship_documents_update"
on public.fiscal_sponsorship_documents
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "fiscal_sponsorship_signature_packets_select"
on public.fiscal_sponsorship_signature_packets
for select
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships om
    where om.org_id = fiscal_sponsorship_signature_packets.org_id
      and om.member_id = (select auth.uid())
  )
);

create policy "fiscal_sponsorship_signature_packets_insert"
on public.fiscal_sponsorship_signature_packets
for insert
to authenticated
with check (public.is_admin());

create policy "fiscal_sponsorship_signature_packets_update"
on public.fiscal_sponsorship_signature_packets
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "fiscal_sponsorship_events_select"
on public.fiscal_sponsorship_events
for select
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships om
    where om.org_id = fiscal_sponsorship_events.org_id
      and om.member_id = (select auth.uid())
  )
);

create policy "fiscal_sponsorship_events_insert"
on public.fiscal_sponsorship_events
for insert
to authenticated
with check (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships om
    where om.org_id = fiscal_sponsorship_events.org_id
      and om.member_id = (select auth.uid())
      and om.role in ('admin', 'staff')
  )
);
