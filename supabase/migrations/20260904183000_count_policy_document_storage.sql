-- Policy attachments share the private Documents bucket and organization quota.
-- Keep tracking atomic with the profile write, including replacement/removal.
alter table public.organization_document_files
  drop constraint organization_document_files_document_kind_check;
alter table public.organization_document_files
  add constraint organization_document_files_document_kind_check check (
    document_kind is null or document_kind like 'policy:%' or document_kind in (
      'verificationLetter', 'articlesOfIncorporation', 'bylaws', 'stateRegistration',
      'goodStandingCertificate', 'w9', 'taxExemptCertificate', 'ueiConfirmation',
      'samActiveStatus', 'grantsGovRegistration', 'gataPreQualification',
      'einConfirmationLetter', 'irs990s', 'auditedFinancials'
    )
  );

-- An upsert checks INSERT before resolving its unique kind conflict. Exclude
-- that kind's existing row so replacements at the cap do not count twice.
create or replace function public.enforce_organization_document_storage_quota()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  current_bytes bigint;
begin
  if tg_op = 'UPDATE' and new.org_id = old.org_id
    and new.size_bytes = old.size_bytes then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.org_id::text, 0));
  select coalesce(sum(file.size_bytes), 0) into current_bytes
  from public.organization_document_files file
  where file.org_id = new.org_id
    and (tg_op = 'INSERT' or file.id <> old.id)
    and (tg_op <> 'INSERT' or new.document_kind is null
      or file.document_kind is distinct from new.document_kind);
  if current_bytes + new.size_bytes > 5368709120 then
    raise exception 'Organization document storage quota exceeded.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create function public.sync_organization_policy_document_files(
  target_org uuid, policy_entries jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  entries jsonb := case when jsonb_typeof(policy_entries) = 'array'
    then policy_entries else '[]'::jsonb end;
begin
  perform pg_advisory_xact_lock(hashtextextended(target_org::text, 0));

  delete from public.organization_document_files file
  where file.org_id = target_org and file.document_kind like 'policy:%'
    and not exists (
      select 1 from jsonb_array_elements(entries) policy
      where file.document_kind = 'policy:' || (policy->>'id')
        and nullif(policy->'document'->>'path', '') is not null
    );

  insert into public.organization_document_files (
    org_id, document_kind, storage_path, name, mime_type, size_bytes, created_by
  )
  select target_org, 'policy:' || (policy->>'id'), policy->'document'->>'path',
    coalesce(nullif(policy->'document'->>'name', ''), 'Policy document'),
    coalesce(nullif(policy->'document'->>'mime', ''), 'application/pdf'),
    case when coalesce(policy->'document'->>'size', '') ~ '^[0-9]+$'
      then (policy->'document'->>'size')::bigint else 0 end,
    target_org
  from jsonb_array_elements(entries) policy
  where nullif(policy->>'id', '') is not null
    and starts_with(policy->'document'->>'path',
      target_org::text || '/policies/' || (policy->>'id') || '/')
  on conflict (org_id, document_kind) do update set
    storage_path = excluded.storage_path, name = excluded.name,
    mime_type = excluded.mime_type, size_bytes = excluded.size_bytes,
    deleted_at = null;
end;
$$;
revoke all on function public.sync_organization_policy_document_files(uuid, jsonb)
  from public, anon, authenticated;

create function public.track_organization_policy_document_files()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and old.profile->'policies' is not distinct from new.profile->'policies' then
    return new;
  end if;
  perform public.sync_organization_policy_document_files(
    new.user_id, new.profile->'policies'
  );
  return new;
end;
$$;
revoke all on function public.track_organization_policy_document_files()
  from public, anon, authenticated;

create trigger track_organization_policy_document_files
after insert or update of profile on public.organizations
for each row execute function public.track_organization_policy_document_files();

-- Backfill metadata only: no storage objects or profile content are changed.
select public.sync_organization_policy_document_files(user_id, profile->'policies')
from public.organizations
where jsonb_typeof(profile->'policies') = 'array';

-- Rollback: drop the trigger, then its two functions. Policy tracking rows may
-- be retained safely; do not remove any storage objects or profile documents.
