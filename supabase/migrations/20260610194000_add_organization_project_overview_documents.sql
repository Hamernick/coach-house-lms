set check_function_bodies = off;
set search_path = public;

create table if not exists public.organization_project_overview_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  project_id uuid not null references public.organization_projects(id) on delete cascade,
  document_html text not null default '',
  document_text text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_project_overview_documents_project_key unique (org_id, project_id)
);

create index if not exists organization_project_overview_documents_project_id_idx
  on public.organization_project_overview_documents (project_id);

create index if not exists organization_project_overview_documents_org_updated_idx
  on public.organization_project_overview_documents (org_id, updated_at desc);

drop trigger if exists set_updated_at_organization_project_overview_documents
  on public.organization_project_overview_documents;

create trigger set_updated_at_organization_project_overview_documents
before update on public.organization_project_overview_documents
for each row execute procedure public.handle_updated_at();

insert into public.organization_project_overview_documents (
  org_id,
  project_id,
  document_html,
  document_text,
  created_by,
  updated_by,
  created_at,
  updated_at
)
select
  op.org_id,
  op.id,
  op.description,
  trim(regexp_replace(op.description, '<[^>]+>', ' ', 'g')),
  op.created_by,
  op.updated_by,
  op.created_at,
  op.updated_at
from public.organization_projects op
where op.description is not null
  and btrim(op.description) <> ''
on conflict (org_id, project_id) do nothing;

alter table public.organization_project_overview_documents enable row level security;
alter table public.organization_project_overview_documents force row level security;

drop policy if exists "organization_project_overview_documents_select"
  on public.organization_project_overview_documents;
drop policy if exists "organization_project_overview_documents_insert"
  on public.organization_project_overview_documents;
drop policy if exists "organization_project_overview_documents_update"
  on public.organization_project_overview_documents;
drop policy if exists "organization_project_overview_documents_delete"
  on public.organization_project_overview_documents;

create policy "organization_project_overview_documents_select"
on public.organization_project_overview_documents
for select
to authenticated
using (
  public.can_read_member_workspace_org(org_id)
);

create policy "organization_project_overview_documents_insert"
on public.organization_project_overview_documents
for insert
to authenticated
with check (
  public.can_write_member_workspace_org(org_id)
  and exists (
    select 1
    from public.organization_projects op
    where op.id = organization_project_overview_documents.project_id
      and op.org_id = organization_project_overview_documents.org_id
  )
);

create policy "organization_project_overview_documents_update"
on public.organization_project_overview_documents
for update
to authenticated
using (
  public.can_write_member_workspace_org(org_id)
)
with check (
  public.can_write_member_workspace_org(org_id)
  and exists (
    select 1
    from public.organization_projects op
    where op.id = organization_project_overview_documents.project_id
      and op.org_id = organization_project_overview_documents.org_id
  )
);

create policy "organization_project_overview_documents_delete"
on public.organization_project_overview_documents
for delete
to authenticated
using (
  public.can_write_member_workspace_org(org_id)
);
