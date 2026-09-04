set check_function_bodies = off;
set search_path = public;

-- Keep the existing bucket-level file-size limit, but allow general files.
update storage.buckets
set allowed_mime_types = null
where id = 'org-documents';

create table if not exists public.organization_document_files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  document_kind text,
  storage_path text not null unique,
  name text not null check (char_length(name) between 1 and 1024),
  mime_type text not null check (char_length(mime_type) between 1 and 255),
  size_bytes bigint not null check (size_bytes between 0 and 52428800),
  created_by uuid not null references public.profiles(id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_document_files_org_kind_key
    unique (org_id, document_kind),
  constraint organization_document_files_document_kind_check check (
    document_kind is null
    or document_kind in (
      'verificationLetter',
      'articlesOfIncorporation',
      'bylaws',
      'stateRegistration',
      'goodStandingCertificate',
      'w9',
      'taxExemptCertificate',
      'ueiConfirmation',
      'samActiveStatus',
      'grantsGovRegistration',
      'gataPreQualification',
      'einConfirmationLetter',
      'irs990s',
      'auditedFinancials'
    )
  )
);

create index if not exists organization_document_files_org_created_idx
  on public.organization_document_files(org_id, created_at desc);
create index if not exists organization_document_files_created_by_idx
  on public.organization_document_files(created_by);
create or replace function public.enforce_organization_document_storage_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_bytes bigint;
  quota_bytes constant bigint := 5368709120;
begin
  if tg_op = 'UPDATE'
    and new.org_id = old.org_id
    and new.size_bytes = old.size_bytes then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.org_id::text, 0));

  select coalesce(sum(file.size_bytes), 0)
  into current_bytes
  from public.organization_document_files file
  where file.org_id = new.org_id
    and (tg_op = 'INSERT' or file.id <> old.id);

  if current_bytes + new.size_bytes > quota_bytes then
    raise exception 'Organization document storage quota exceeded.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_organization_document_storage_quota()
  from public;

drop trigger if exists enforce_organization_document_storage_quota
  on public.organization_document_files;
create trigger enforce_organization_document_storage_quota
before insert or update of org_id, size_bytes
on public.organization_document_files
for each row execute function public.enforce_organization_document_storage_quota();

drop trigger if exists set_updated_at_organization_document_files
  on public.organization_document_files;
create trigger set_updated_at_organization_document_files
before update on public.organization_document_files
for each row execute procedure public.handle_updated_at();

alter table public.organization_document_files enable row level security;
alter table public.organization_document_files force row level security;

revoke all on public.organization_document_files from anon, authenticated;
grant select, insert, update, delete on public.organization_document_files
  to authenticated;
grant all on public.organization_document_files to service_role;

create policy organization_document_files_select
on public.organization_document_files
for select
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = organization_document_files.org_id
      and membership.member_id = (select auth.uid())
  )
);

create policy organization_document_files_insert
on public.organization_document_files
for insert
to authenticated
with check (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = organization_document_files.org_id
      and membership.member_id = (select auth.uid())
      and membership.role in ('admin', 'staff')
  )
);

create policy organization_document_files_update
on public.organization_document_files
for update
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = organization_document_files.org_id
      and membership.member_id = (select auth.uid())
      and membership.role in ('admin', 'staff')
  )
)
with check (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = organization_document_files.org_id
      and membership.member_id = (select auth.uid())
      and membership.role in ('admin', 'staff')
  )
);

create policy organization_document_files_delete
on public.organization_document_files
for delete
to authenticated
using (
  public.is_admin()
  or org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = organization_document_files.org_id
      and membership.member_id = (select auth.uid())
      and membership.role in ('admin', 'staff')
  )
);

insert into public.organization_document_files (
  org_id,
  document_kind,
  storage_path,
  name,
  mime_type,
  size_bytes,
  created_by,
  created_at,
  updated_at
)
select
  organization.user_id,
  document.key,
  document.value->>'path',
  coalesce(nullif(document.value->>'name', ''), 'Document'),
  coalesce(nullif(document.value->>'mime', ''), 'application/pdf'),
  case
    when coalesce(document.value->>'size', '') ~ '^[0-9]+$'
      then (document.value->>'size')::bigint
    else 0
  end,
  organization.user_id,
  coalesce(
    case
      when coalesce(document.value->>'updatedAt', '') ~
        '^\d{4}-\d{2}-\d{2}T'
        then (document.value->>'updatedAt')::timestamptz
      else null
    end,
    now()
  ),
  coalesce(
    case
      when coalesce(document.value->>'updatedAt', '') ~
        '^\d{4}-\d{2}-\d{2}T'
        then (document.value->>'updatedAt')::timestamptz
      else null
    end,
    now()
  )
from public.organizations organization
cross join lateral jsonb_each(
  coalesce(organization.profile->'documents', '{}'::jsonb)
) as document(key, value)
where document.value ? 'path'
  and nullif(document.value->>'path', '') is not null
on conflict (storage_path) do nothing;
