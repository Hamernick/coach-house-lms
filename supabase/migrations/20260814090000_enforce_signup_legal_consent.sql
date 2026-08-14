-- Public signup metadata is attacker-controlled. Reject user creation unless it
-- carries the current legal document evidence or a service-role-only exemption.

create or replace function public.record_signup_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  consent jsonb := new.raw_user_meta_data -> 'legal_consent';
  service_provisioned boolean :=
    new.raw_app_meta_data ->> 'legal_consent_exempt' = 'service_provisioned';
begin
  if service_provisioned then
    return new;
  end if;

  if jsonb_typeof(consent) is distinct from 'object'
    or consent ->> 'version' is distinct from '2026-08-12.1'
    or consent ->> 'termsSha256' is distinct from '405e53cfa64e4dba9ecb4e04289d82ed0b8f20b70a233a4b310996d63493e5a2'
    or consent ->> 'privacySha256' is distinct from 'c4ff2282fa5033042d4bcee3ed26ac4b1a5863b4cabd1346084c3d6097853d92'
    or jsonb_typeof(consent -> 'acceptedAt') is distinct from 'string'
    or nullif(consent ->> 'acceptedAt', '') is null
  then
    raise exception 'Current Terms and Privacy Policy acceptance is required.'
      using errcode = '22023';
  end if;

  insert into public.platform_legal_acceptances (
    user_id,
    document_version,
    terms_sha256,
    privacy_sha256,
    accepted_at,
    source
  ) values (
    new.id,
    consent ->> 'version',
    consent ->> 'termsSha256',
    consent ->> 'privacySha256',
    coalesce(new.created_at, now()),
    'signup'
  )
  on conflict (user_id, document_version) do nothing;

  return new;
end;
$$;

revoke all on function public.record_signup_legal_acceptance() from public;
