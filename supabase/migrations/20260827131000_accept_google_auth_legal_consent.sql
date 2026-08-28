-- Keep the prior legal version valid during rollout so cached clients do not
-- lose email signup while the new Google Sign-In disclosure reaches browsers.

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
  valid_consent boolean :=
    jsonb_typeof(consent) = 'object'
    and jsonb_typeof(consent -> 'acceptedAt') = 'string'
    and nullif(consent ->> 'acceptedAt', '') is not null
    and (
      (
        consent ->> 'version' = '2026-08-12.1'
        and consent ->> 'termsSha256' = '405e53cfa64e4dba9ecb4e04289d82ed0b8f20b70a233a4b310996d63493e5a2'
        and consent ->> 'privacySha256' = 'c4ff2282fa5033042d4bcee3ed26ac4b1a5863b4cabd1346084c3d6097853d92'
      )
      or (
        consent ->> 'version' = '2026-08-27.1'
        and consent ->> 'termsSha256' = '51bde17c17824786259ae9fe35f5b0740c7638c4705795d3de2805d1d0d80220'
        and consent ->> 'privacySha256' = '4110a62f34947f3950dc75b7e6ffab87f60d9abfe48b44625c8150da5e845e62'
      )
    );
begin
  if service_provisioned then
    return new;
  end if;

  if not valid_consent then
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
