insert into public.organization_finance_access (
  org_id,
  member_id,
  access_level,
  granted_by
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'viewer',
  '00000000-0000-0000-0000-000000000001'
);

insert into public.programs (id, user_id, title) values
  (
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Owner program'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Other owner program'
  );

insert into public.organization_finance_records (
  id,
  org_id,
  program_id,
  effective_at,
  record_type,
  direction,
  source_kind,
  source_label,
  amount_cents,
  external_provider,
  external_record_id,
  created_source
) values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '2026-08-07 17:00:00+00',
    'donation',
    'in',
    'donations',
    'Fixture provider',
    5000,
    'fixture',
    'record-one',
    'import'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    '2026-08-07 17:01:00+00',
    'grant',
    'in',
    'grants',
    'Other fixture provider',
    7500,
    'fixture',
    'record-two',
    'import'
  );

insert into public.organization_finance_opportunities (
  id,
  org_id,
  title,
  source_label,
  opportunity_type,
  status,
  external_provider,
  external_opportunity_id
) values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Fixture contract',
    'Fixture portal',
    'contract',
    'new',
    'fixture',
    'opportunity-one'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Other fixture award',
    'Other fixture portal',
    'award',
    'applied',
    'fixture',
    'opportunity-two'
  );

insert into public.organization_finance_engagement_events (
  id,
  org_id,
  occurred_at,
  event_type,
  source_label,
  surface,
  external_provider,
  external_event_id
) values
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '2026-08-07 17:02:00+00',
    'click',
    'Organization map profile',
    'public_map',
    'fixture',
    'event-one'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '2026-08-07 17:03:00+00',
    'view',
    'Other organization map profile',
    'public_map',
    'fixture',
    'event-two'
  );

set role service_role;
select public.reconcile_organization_finance_record(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'fixture-deposit-reference',
  '00000000-0000-0000-0000-000000000001/record/evidence.pdf',
  'evidence.pdf',
  'application/pdf',
  128,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
);
select public.correct_organization_finance_record(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  '40000000-0000-4000-8000-000000000001',
  '2026-08-07 18:00:00+00',
  'donation',
  'in',
  'donations',
  'Corrected fixture provider',
  6500,
  'USD',
  'The verified amount was entered incorrectly.',
  'fixture-corrected-deposit-reference',
  '00000000-0000-0000-0000-000000000001/correction/evidence.pdf',
  'correction-evidence.pdf',
  'application/pdf',
  128,
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
);

insert into public.organization_finance_stripe_install_intents (
  org_id,
  user_id,
  state_sha256,
  default_record_type,
  expires_at
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  'donation',
  timezone('utc', now()) + interval '10 minutes'
);

select public.complete_organization_finance_stripe_install(
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
  '00000000-0000-0000-0000-000000000001',
  'acct_fixture',
  'usr_fixture',
  false
);

select public.import_organization_finance_stripe_records(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'acct_fixture',
  '[{
    "effectiveAt": "2026-08-08T18:30:00.000Z",
    "recordType": "donation",
    "direction": "in",
    "sourceKind": "donations",
    "sourceLabel": "Stripe",
    "amountCents": 2500,
    "currencyCode": "USD",
    "externalRecordId": "txn_fixture",
    "payloadSha256": "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
  }]'::jsonb
);
reset role;

set row_security = on;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  false
);
do $$
begin
  if (select count(*) from public.organization_finance_records) <> 3
    or (select count(*) from public.organization_finance_opportunities) <> 1
    or (select count(*) from public.organization_finance_engagement_events) <> 1
    or (select count(*) from public.organization_finance_record_evidence) <> 2
    or (select count(*) from public.organization_finance_record_events) <> 4
    or (select count(*) from public.organization_finance_record_corrections) <> 1
    or (select count(*) from public.organization_finance_record_provider_evidence) <> 1
    or (select count(*) from public.organization_finance_stripe_connections) <> 1
    or (select count(*) from public.organization_finance_access) <> 1 then
    raise exception 'Finance owner visibility failed';
  end if;

  begin
    insert into public.organization_finance_records (
      org_id,
      effective_at,
      record_type,
      direction,
      source_kind,
      source_label,
      amount_cents
    ) values (
      '00000000-0000-0000-0000-000000000001',
      now(),
      'donation',
      'in',
      'donations',
      'Forbidden direct write',
      1
    );
    raise exception 'Authenticated owner inserted a Finance record directly';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

do $$
begin
  begin
    insert into public.organization_finance_records (
      org_id,
      program_id,
      effective_at,
      record_type,
      direction,
      source_kind,
      source_label,
      amount_cents
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '40000000-0000-4000-8000-000000000002',
      now(),
      'donation',
      'in',
      'donations',
      'Cross-organization program',
      1
    );
    raise exception 'Cross-organization Finance program link succeeded';
  exception when foreign_key_violation then
    null;
  end;
end;
$$;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000003',
  false
);
do $$
begin
  if (select count(*) from public.organization_finance_records) <> 3
    or (select count(*) from public.organization_finance_opportunities) <> 1
    or (select count(*) from public.organization_finance_engagement_events) <> 1
    or (select count(*) from public.organization_finance_record_evidence) <> 2
    or (select count(*) from public.organization_finance_record_events) <> 4
    or (select count(*) from public.organization_finance_record_corrections) <> 1
    or (select count(*) from public.organization_finance_record_provider_evidence) <> 1
    or (select count(*) from public.organization_finance_stripe_connections) <> 1
    or (select count(*) from public.organization_finance_access) <> 1 then
    raise exception 'Explicit Finance viewer visibility failed';
  end if;
end;
$$;
reset role;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  false
);
do $$
begin
  if (select count(*) from public.organization_finance_records) <> 1
    or (select count(*) from public.organization_finance_opportunities) <> 1
    or (select count(*) from public.organization_finance_engagement_events) <> 1
    or (select count(*) from public.organization_finance_record_evidence) <> 0
    or (select count(*) from public.organization_finance_record_events) <> 0
    or (select count(*) from public.organization_finance_record_corrections) <> 0
    or (select count(*) from public.organization_finance_record_provider_evidence) <> 0
    or (select count(*) from public.organization_finance_stripe_connections) <> 0 then
    raise exception 'Second Finance owner visibility failed';
  end if;
end;
$$;
reset role;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000004',
  false
);
do $$
begin
  if not public.is_admin() then
    raise exception 'Platform-admin fixture is invalid';
  end if;

  if (select count(*) from public.organization_finance_records) <> 0
    or (select count(*) from public.organization_finance_opportunities) <> 0
    or (select count(*) from public.organization_finance_engagement_events) <> 0
    or (select count(*) from public.organization_finance_record_evidence) <> 0
    or (select count(*) from public.organization_finance_record_events) <> 0
    or (select count(*) from public.organization_finance_record_corrections) <> 0
    or (select count(*) from public.organization_finance_record_provider_evidence) <> 0
    or (select count(*) from public.organization_finance_stripe_connections) <> 0 then
    raise exception 'Platform admin received implicit Finance access';
  end if;
end;
$$;
reset role;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'finance_opportunity_sources',
    'finance_opportunity_scan_runs',
    'organization_finance_access',
    'organization_finance_records',
    'organization_finance_record_corrections',
    'organization_finance_record_evidence',
    'organization_finance_record_events',
    'organization_finance_record_provider_evidence',
    'organization_finance_stripe_connections',
    'organization_finance_stripe_install_intents',
    'organization_finance_opportunities',
    'organization_finance_engagement_events'
  ] loop
    if has_table_privilege('anon', 'public.' || v_table, 'SELECT')
      or has_table_privilege('anon', 'public.' || v_table, 'INSERT')
      or has_table_privilege('anon', 'public.' || v_table, 'UPDATE')
      or has_table_privilege('anon', 'public.' || v_table, 'DELETE') then
      raise exception 'Anonymous role retains Finance access on %', v_table;
    end if;

    if not exists (
      select 1
      from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = 'public'
        and relation.relname = v_table
        and relation.relrowsecurity
        and relation.relforcerowsecurity
    ) then
      raise exception 'RLS is not forced on %', v_table;
    end if;
  end loop;

  foreach v_table in array array[
    'organization_finance_records',
    'organization_finance_record_corrections',
    'organization_finance_record_evidence',
    'organization_finance_record_events',
    'organization_finance_record_provider_evidence',
    'organization_finance_stripe_connections',
    'organization_finance_opportunities',
    'organization_finance_engagement_events'
  ] loop
    if not has_table_privilege(
      'authenticated',
      'public.' || v_table,
      'SELECT'
    ) then
      raise exception 'Authenticated role cannot read %', v_table;
    end if;

    if has_table_privilege('authenticated', 'public.' || v_table, 'INSERT')
      or has_table_privilege('authenticated', 'public.' || v_table, 'UPDATE')
      or has_table_privilege('authenticated', 'public.' || v_table, 'DELETE') then
      raise exception 'Authenticated role retains direct DML on %', v_table;
    end if;
  end loop;

  foreach v_table in array array[
    'finance_opportunity_sources',
    'finance_opportunity_scan_runs'
  ] loop
    if has_table_privilege('authenticated', 'public.' || v_table, 'SELECT')
      or has_table_privilege('authenticated', 'public.' || v_table, 'INSERT')
      or has_table_privilege('authenticated', 'public.' || v_table, 'UPDATE')
      or has_table_privilege('authenticated', 'public.' || v_table, 'DELETE') then
      raise exception 'Authenticated role retains source-pipeline access on %', v_table;
    end if;
  end loop;
end;
$$;

do $$
begin
  if (
    select status <> 'reconciled' or reconciled_at is null
    from public.organization_finance_records
    where id = '10000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'Finance reconciliation did not update the record';
  end if;

  if (
    select amount_cents <> 5000
    from public.organization_finance_records
    where id = '10000000-0000-0000-0000-000000000001'
  ) or (
    select amount_cents <> 6500 or status <> 'reconciled'
    from public.organization_finance_records
    where id = '10000000-0000-0000-0000-000000000003'
  ) or not exists (
    select 1
    from public.organization_finance_record_corrections
    where original_record_id = '10000000-0000-0000-0000-000000000001'
      and replacement_record_id = '10000000-0000-0000-0000-000000000003'
  ) then
    raise exception 'Finance correction did not preserve and link its records';
  end if;

  begin
    update public.organization_finance_records
    set amount_cents = amount_cents + 1
    where id = '10000000-0000-0000-0000-000000000001';
    raise exception 'Reconciled Finance record was rewritten';
  exception when raise_exception then
    if sqlerrm <> 'Reconciled Finance record fields are immutable' then
      raise;
    end if;
  end;

  begin
    update public.organization_finance_records
    set program_id = null
    where id = '10000000-0000-0000-0000-000000000001';
    raise exception 'Verified Finance record program was rewritten';
  exception when raise_exception then
    if sqlerrm <> 'Reconciled Finance record fields are immutable' then
      raise;
    end if;
  end;

  begin
    update public.organization_finance_record_evidence
    set external_reference = 'changed'
    where record_id = '10000000-0000-0000-0000-000000000001';
    raise exception 'Finance reconciliation evidence was rewritten';
  exception when raise_exception then
    if sqlerrm <> 'Finance record evidence is immutable' then
      raise;
    end if;
  end;

  begin
    update public.organization_finance_record_corrections
    set reason = 'changed'
    where original_record_id = '10000000-0000-0000-0000-000000000001';
    raise exception 'Finance correction link was rewritten';
  exception when raise_exception then
    if sqlerrm <> 'Finance record corrections are immutable' then
      raise;
    end if;
  end;

  begin
    update public.organization_finance_record_provider_evidence
    set payload_sha256 = 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    where provider_record_id = 'txn_fixture';
    raise exception 'Finance provider evidence was rewritten';
  exception when raise_exception then
    if sqlerrm <> 'Finance record evidence is immutable' then
      raise;
    end if;
  end;

  begin
    insert into public.organization_finance_record_evidence (
      org_id,
      record_id,
      external_reference,
      storage_path,
      file_name,
      mime_type,
      size_bytes,
      file_sha256,
      created_by
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      'cross-organization',
      'cross/evidence.pdf',
      'evidence.pdf',
      'application/pdf',
      128,
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      '00000000-0000-0000-0000-000000000001'
    );
    raise exception 'Cross-organization Finance evidence link succeeded';
  exception when foreign_key_violation then
    null;
  end;

  if has_function_privilege(
    'authenticated',
    'public.reconcile_organization_finance_record(uuid,uuid,uuid,text,text,text,text,bigint,text)',
    'EXECUTE'
  ) then
    raise exception 'Authenticated role can execute Finance reconciliation';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.reconcile_organization_finance_record(uuid,uuid,uuid,text,text,text,text,bigint,text)',
    'EXECUTE'
  ) then
    raise exception 'Service role cannot execute Finance reconciliation';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.correct_organization_finance_record(uuid,uuid,uuid,uuid,uuid,timestamptz,text,text,text,text,bigint,text,text,text,text,text,text,bigint,text)',
    'EXECUTE'
  ) then
    raise exception 'Authenticated role can execute Finance correction';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.correct_organization_finance_record(uuid,uuid,uuid,uuid,uuid,timestamptz,text,text,text,text,bigint,text,text,text,text,text,text,bigint,text)',
    'EXECUTE'
  ) then
    raise exception 'Service role cannot execute Finance correction';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.complete_organization_finance_stripe_install(text,uuid,text,text,boolean)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.import_organization_finance_stripe_records(uuid,uuid,text,jsonb)',
    'EXECUTE'
  ) then
    raise exception 'Authenticated role can execute Stripe Finance transitions';
  end if;

  if not has_function_privilege(
    'service_role',
    'public.complete_organization_finance_stripe_install(text,uuid,text,text,boolean)',
    'EXECUTE'
  ) or not has_function_privilege(
    'service_role',
    'public.import_organization_finance_stripe_records(uuid,uuid,text,jsonb)',
    'EXECUTE'
  ) then
    raise exception 'Service role cannot execute Stripe Finance transitions';
  end if;
end;
$$;
