set check_function_bodies = off;
set search_path = public;

alter table public.organization_projects
  add column if not exists project_kind text not null default 'standard',
  add column if not exists canonical_org_id uuid references public.organizations(user_id) on delete cascade;

update public.organization_projects
set
  project_kind = 'organization_admin',
  canonical_org_id = org_id,
  created_source = 'system',
  starter_seed_key = null,
  starter_seed_version = null
where created_source = 'system'
  and canonical_org_id is null;

alter table public.organization_projects
  drop constraint if exists organization_projects_project_kind_check;

alter table public.organization_projects
  add constraint organization_projects_project_kind_check
  check (project_kind in ('standard', 'organization_admin'));

alter table public.organization_projects
  drop constraint if exists organization_projects_canonical_fields_check;

alter table public.organization_projects
  add constraint organization_projects_canonical_fields_check
  check (
    (
      project_kind = 'organization_admin'
      and canonical_org_id is not null
      and created_source = 'system'
      and starter_seed_key is null
      and starter_seed_version is null
    )
    or (
      project_kind = 'standard'
      and canonical_org_id is null
    )
  );

create index if not exists organization_projects_org_id_project_kind_idx
  on public.organization_projects (org_id, project_kind);

create unique index if not exists organization_projects_canonical_org_id_idx
  on public.organization_projects (canonical_org_id);
