do $$
begin
  if (
    select file_size_limit
    from storage.buckets
    where id = 'org-documents'
  ) <> 15728640 then
    raise exception 'existing bucket file-size limit changed';
  end if;

  if (
    select allowed_mime_types is not null
    from storage.buckets
    where id = 'org-documents'
  ) then
    raise exception 'bucket MIME allowlist was not removed';
  end if;
end;
$$;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000002',
    true
  );
  set local role authenticated;
  insert into public.organization_document_files (
    org_id,
    storage_path,
    name,
    mime_type,
    size_bytes,
    created_by
  ) values (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001/library/staff-file.zip',
    'staff-file.zip',
    'application/zip',
    1,
    '00000000-0000-0000-0000-000000000002'
  );
  update public.organization_document_files
  set deleted_at = now()
  where storage_path = '00000000-0000-0000-0000-000000000001/library/staff-file.zip';
  if (
    select deleted_at is null
    from public.organization_document_files
    where storage_path = '00000000-0000-0000-0000-000000000001/library/staff-file.zip'
  ) then
    raise exception 'organization staff could not soft-delete document metadata';
  end if;
  reset role;
end;
$$;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000003',
    true
  );
  set local role authenticated;
  if (select count(*) from public.organization_document_files) <> 1 then
    raise exception 'organization member could not read document metadata';
  end if;
  update public.organization_document_files
  set deleted_at = null;
  if found then
    raise exception 'board member updated document metadata';
  end if;
  delete from public.organization_document_files;
  if found then
    raise exception 'board member deleted document metadata';
  end if;
  begin
    insert into public.organization_document_files (
      org_id,
      storage_path,
      name,
      mime_type,
      size_bytes,
      created_by
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001/library/board-file.zip',
      'board-file.zip',
      'application/zip',
      1,
      '00000000-0000-0000-0000-000000000003'
    );
    raise exception 'board member wrote document metadata';
  exception when insufficient_privilege then null;
  end;
  reset role;
end;
$$;

do $$
begin
  perform set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000004',
    true
  );
  set local role authenticated;
  if (select count(*) from public.organization_document_files) <> 0 then
    raise exception 'unrelated user crossed document metadata boundary';
  end if;
  reset role;
end;
$$;

set role service_role;

delete from public.organization_document_files;

insert into public.organization_document_files (
  org_id,
  storage_path,
  name,
  mime_type,
  size_bytes,
  created_by
)
select
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001/library/quota-' || value,
  'quota-' || value,
  'application/octet-stream',
  52428800,
  '00000000-0000-0000-0000-000000000001'
from generate_series(1, 102) value;

insert into public.organization_document_files (
  org_id,
  storage_path,
  name,
  mime_type,
  size_bytes,
  created_by
) values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001/library/quota-exact',
  'quota-exact',
  'application/octet-stream',
  20971520,
  '00000000-0000-0000-0000-000000000001'
);

update public.organization_document_files
set deleted_at = now()
where storage_path = '00000000-0000-0000-0000-000000000001/library/quota-1';

do $$
begin
  begin
    insert into public.organization_document_files (
      org_id,
      storage_path,
      name,
      mime_type,
      size_bytes,
      created_by
    ) values (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001/library/quota-over',
      'quota-over',
      'application/octet-stream',
      1,
      '00000000-0000-0000-0000-000000000001'
    );
    raise exception 'organization quota allowed more than 5 GB';
  exception
    when check_violation then
      if sqlerrm <> 'Organization document storage quota exceeded.' then
        raise;
      end if;
  end;
end;
$$;

reset role;
