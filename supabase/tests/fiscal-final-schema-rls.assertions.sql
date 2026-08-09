set row_security = on;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  false
);
do $$
begin
  if (select count(*) from public.fiscal_sponsorship_applications) <> 1
    or (select count(*) from public.fiscal_sponsorship_reviews) <> 1
    or (select count(*) from public.fiscal_sponsorship_documents) <> 2
    or (select count(*) from public.fiscal_sponsorship_signature_packets) <> 1
    or (select count(*) from public.fiscal_sponsorship_events) <> 1 then
    raise exception 'Organization owner fiscal read matrix failed';
  end if;
end;
$$;

insert into public.fiscal_sponsorship_signing_drafts (
  id,
  packet_id,
  application_id,
  org_id,
  project_id,
  signer_id,
  signer_role
) values (
  '80000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'applicant'
);
update public.fiscal_sponsorship_signing_drafts
set revision = 1
where id = '80000000-0000-0000-0000-000000000001';
delete from public.fiscal_sponsorship_signing_drafts
where id = '80000000-0000-0000-0000-000000000001';

do $$
begin
  begin
    insert into public.fiscal_sponsorship_applications (
      id,
      org_id,
      project_id,
      status
    ) values (
      '10000000-0000-0000-0000-000000000099',
      '00000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      'draft'
    );
    raise exception 'Direct application insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.fiscal_sponsorship_reviews (
      id,
      application_id,
      org_id,
      project_id
    ) values (
      '30000000-0000-0000-0000-000000000099',
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001'
    );
    raise exception 'Direct review insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.fiscal_sponsorship_events (
      id,
      application_id,
      org_id,
      project_id
    ) values (
      '60000000-0000-0000-0000-000000000099',
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001'
    );
    raise exception 'Direct event insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
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
  if (select count(*) from public.fiscal_sponsorship_documents) <> 2 then
    raise exception 'Organization staff fiscal document visibility failed';
  end if;
end;
$$;
reset role;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000003',
  false
);
do $$
begin
  if (select count(*) from public.fiscal_sponsorship_applications) <> 1
    or (select count(*) from public.fiscal_sponsorship_documents) <> 1 then
    raise exception 'Board read-only fiscal visibility failed';
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
  if (select count(*) from public.fiscal_sponsorship_applications) <> 1
    or (select count(*) from public.fiscal_sponsorship_documents) <> 2 then
    raise exception 'Sponsor operator fiscal visibility failed';
  end if;

  begin
    insert into public.fiscal_sponsorship_reviews (
      id,
      application_id,
      org_id,
      project_id
    ) values (
      '30000000-0000-0000-0000-000000000098',
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001'
    );
    raise exception 'Sponsor operator bypassed atomic review transition';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000005',
  false
);
do $$
begin
  if (select count(*) from public.fiscal_sponsorship_applications) <> 1
    or (select count(*) from public.fiscal_sponsorship_reviews) <> 1
    or (select count(*) from public.fiscal_sponsorship_documents) <> 2
    or (select count(*) from public.fiscal_sponsorship_signature_packets) <> 1
    or (select count(*) from public.fiscal_sponsorship_events) <> 1 then
    raise exception 'Assigned coach fiscal read matrix failed';
  end if;
end;
$$;
reset role;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000006',
  false
);
do $$
begin
  if (select count(*) from public.fiscal_sponsorship_applications) <> 0
    or (select count(*) from public.fiscal_sponsorship_reviews) <> 0
    or (select count(*) from public.fiscal_sponsorship_documents) <> 0
    or (select count(*) from public.fiscal_sponsorship_signature_packets) <> 0
    or (select count(*) from public.fiscal_sponsorship_events) <> 0 then
    raise exception 'Unassigned coach crossed the organization boundary';
  end if;

  begin
    insert into public.fiscal_sponsorship_signing_drafts (
      id,
      packet_id,
      application_id,
      org_id,
      project_id,
      signer_id,
      signer_role
    ) values (
      '80000000-0000-0000-0000-000000000099',
      '50000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000006',
      'applicant'
    );
    raise exception 'Unassigned coach created an applicant signing draft';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

set role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000007',
  false
);
do $$
begin
  if (select count(*) from public.fiscal_sponsorship_applications) <> 0
    or (select count(*) from public.fiscal_sponsorship_documents) <> 0 then
    raise exception 'Unrelated authenticated user crossed the organization boundary';
  end if;
end;
$$;
reset role;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'fiscal_sponsorship_applications',
    'fiscal_sponsorship_reviews',
    'fiscal_sponsorship_documents',
    'fiscal_sponsorship_signature_packets',
    'fiscal_sponsorship_events',
    'fiscal_sponsorship_signatures'
  ] loop
    if has_table_privilege('anon', 'public.' || v_table, 'SELECT')
      or has_table_privilege('anon', 'public.' || v_table, 'INSERT')
      or has_table_privilege('anon', 'public.' || v_table, 'UPDATE')
      or has_table_privilege('anon', 'public.' || v_table, 'DELETE') then
      raise exception 'Anonymous role retains fiscal access on %', v_table;
    end if;

    if has_table_privilege('authenticated', 'public.' || v_table, 'INSERT')
      or has_table_privilege('authenticated', 'public.' || v_table, 'UPDATE')
      or has_table_privilege('authenticated', 'public.' || v_table, 'DELETE') then
      raise exception 'Authenticated retains direct DML on %', v_table;
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

  if has_table_privilege(
    'anon',
    'public.fiscal_sponsorship_signing_drafts',
    'SELECT'
  ) or has_table_privilege(
    'anon',
    'public.fiscal_sponsorship_signing_drafts',
    'INSERT'
  ) or has_table_privilege(
    'anon',
    'public.fiscal_sponsorship_signing_drafts',
    'UPDATE'
  ) or has_table_privilege(
    'anon',
    'public.fiscal_sponsorship_signing_drafts',
    'DELETE'
  ) then
    raise exception 'Anonymous role retains signing draft access';
  end if;
end;
$$;
