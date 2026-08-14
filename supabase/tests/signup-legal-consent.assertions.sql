do $$
declare
  rejected boolean := false;
  rejection_state text;
  rejection_message text;
begin
  begin
    insert into auth.users (id, raw_user_meta_data, raw_app_meta_data)
    values (
      '00000000-0000-0000-0000-000000000001',
      '{}'::jsonb,
      '{}'::jsonb
    );
  exception when others then
    get stacked diagnostics
      rejection_state = returned_sqlstate,
      rejection_message = message_text;
    rejected := true;
  end;

  if not rejected then
    raise exception 'signup without current legal consent was accepted';
  end if;

  if rejection_state <> '22023'
    or rejection_message <> 'Current Terms and Privacy Policy acceptance is required.'
  then
    raise exception 'signup rejection used unexpected error %: %',
      rejection_state,
      rejection_message;
  end if;

  if exists (
    select 1 from auth.users
    where id = '00000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'rejected signup user was not rolled back';
  end if;
end;
$$;

do $$
declare
  rejected boolean := false;
  rejection_state text;
begin
  begin
    insert into auth.users (id, raw_user_meta_data, raw_app_meta_data)
    values (
      '00000000-0000-0000-0000-000000000005',
      '{"legal_consent":{}}'::jsonb,
      '{}'::jsonb
    );
  exception when others then
    get stacked diagnostics rejection_state = returned_sqlstate;
    rejected := true;
  end;

  if not rejected then
    raise exception 'empty legal consent object was accepted';
  end if;

  if rejection_state <> '22023' then
    raise exception 'empty legal consent used unexpected error %', rejection_state;
  end if;
end;
$$;

do $$
declare
  rejected boolean := false;
  rejection_state text;
begin
  begin
    insert into auth.users (id, raw_user_meta_data, raw_app_meta_data)
    values (
      '00000000-0000-0000-0000-000000000006',
      jsonb_build_object(
        'legal_consent',
        jsonb_build_object(
          'version', '2026-08-12.1',
          'termsSha256', '405e53cfa64e4dba9ecb4e04289d82ed0b8f20b70a233a4b310996d63493e5a2',
          'privacySha256', 'c4ff2282fa5033042d4bcee3ed26ac4b1a5863b4cabd1346084c3d6097853d92',
          'acceptedAt', false
        )
      ),
      '{}'::jsonb
    );
  exception when others then
    get stacked diagnostics rejection_state = returned_sqlstate;
    rejected := true;
  end;

  if not rejected then
    raise exception 'non-string legal acceptance signal was accepted';
  end if;

  if rejection_state <> '22023' then
    raise exception 'invalid legal acceptance signal used unexpected error %',
      rejection_state;
  end if;
end;
$$;

insert into auth.users (
  id,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at
) values (
  '00000000-0000-0000-0000-000000000002',
  jsonb_build_object(
    'legal_consent',
    jsonb_build_object(
      'version', '2026-08-12.1',
      'termsSha256', '405e53cfa64e4dba9ecb4e04289d82ed0b8f20b70a233a4b310996d63493e5a2',
      'privacySha256', 'c4ff2282fa5033042d4bcee3ed26ac4b1a5863b4cabd1346084c3d6097853d92',
      'acceptedAt', '1999-01-01T00:00:00.000Z'
    )
  ),
  '{}'::jsonb,
  '2026-08-14T08:00:00.000Z'
);

do $$
declare
  acceptance public.platform_legal_acceptances%rowtype;
begin
  select *
  into strict acceptance
  from public.platform_legal_acceptances
  where user_id = '00000000-0000-0000-0000-000000000002';

  if acceptance.accepted_at <> '2026-08-14T08:00:00.000Z'::timestamptz
    or acceptance.source <> 'signup' then
    raise exception 'valid signup did not use trusted server evidence';
  end if;
end;
$$;

insert into auth.users (id, raw_user_meta_data, raw_app_meta_data)
values (
  '00000000-0000-0000-0000-000000000003',
  '{}'::jsonb,
  '{"legal_consent_exempt":"service_provisioned"}'::jsonb
);

do $$
declare
  rejected boolean := false;
  rejection_state text;
begin
  if exists (
    select 1
    from public.platform_legal_acceptances
    where user_id = '00000000-0000-0000-0000-000000000003'
  ) then
    raise exception 'trusted service provisioning created false consent evidence';
  end if;

  begin
    insert into auth.users (id, raw_user_meta_data, raw_app_meta_data)
    values (
      '00000000-0000-0000-0000-000000000004',
      '{"legal_consent_exempt":"service_provisioned"}'::jsonb,
      '{}'::jsonb
    );
  exception when others then
    get stacked diagnostics rejection_state = returned_sqlstate;
    rejected := true;
  end;

  if not rejected then
    raise exception 'user metadata forged the service provisioning exemption';
  end if;

  if rejection_state <> '22023' then
    raise exception 'forged service exemption used unexpected error %',
      rejection_state;
  end if;
end;
$$;
