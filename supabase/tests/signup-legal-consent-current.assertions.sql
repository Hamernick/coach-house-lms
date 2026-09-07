-- Exercise the current migration with the live runner's consent payload and
-- no service exemption, including when Auth omits app metadata on insertion.
do $$
declare
  fixture_id uuid;
  fixture_index integer;
  acceptance public.platform_legal_acceptances%rowtype;
  consent jsonb := jsonb_build_object(
    'version', '2026-08-27.1',
    'termsSha256', '51bde17c17824786259ae9fe35f5b0740c7638c4705795d3de2805d1d0d80220',
    'privacySha256', '4110a62f34947f3950dc75b7e6ffab87f60d9abfe48b44625c8150da5e845e62',
    'acceptedAt', '1999-01-01T00:00:00.000Z'
  );
begin
  for fixture_index in 1..8 loop
    fixture_id := ('00000000-0000-0000-0000-' || lpad((100 + fixture_index)::text, 12, '0'))::uuid;
    insert into auth.users (id, raw_user_meta_data, raw_app_meta_data, created_at)
    values (
      fixture_id,
      jsonb_build_object('legal_consent', consent),
      case when fixture_index % 2 = 0 then '{}'::jsonb else null end,
      '2026-09-04T12:00:00.000Z'
    );

    select * into strict acceptance
    from public.platform_legal_acceptances
    where user_id = fixture_id;

    if acceptance.document_version <> consent ->> 'version'
      or acceptance.terms_sha256 <> consent ->> 'termsSha256'
      or acceptance.privacy_sha256 <> consent ->> 'privacySha256'
      or acceptance.accepted_at <> '2026-09-04T12:00:00.000Z'::timestamptz
      or acceptance.source <> 'signup'
    then
      raise exception 'RLS fixture % did not record current server-timed consent', fixture_index;
    end if;
  end loop;
end;
$$;
