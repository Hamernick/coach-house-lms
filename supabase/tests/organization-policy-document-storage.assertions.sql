-- The preceding quota tests leave this organization exactly at its 5 GB cap.
update public.organization_document_files set document_kind = 'bylaws'
where storage_path = '00000000-0000-0000-0000-000000000001/library/quota-2';
insert into public.organization_document_files (
  org_id, document_kind, storage_path, name, mime_type, size_bytes, created_by
)
select org_id, document_kind, storage_path, 'Replacement at cap', mime_type, size_bytes, created_by
from public.organization_document_files where document_kind = 'bylaws'
on conflict (org_id, document_kind) do update set name = excluded.name, size_bytes = excluded.size_bytes;

do $$
begin
  begin
    update public.organizations set profile = jsonb_build_object('policies',
      jsonb_build_array(jsonb_build_object('id', 'quota-test', 'title', 'Quota test',
        'document', jsonb_build_object(
          'path', user_id::text || '/policies/quota-test/file.pdf',
          'name', 'file.pdf', 'mime', 'application/pdf', 'size', 1
        ))));
    raise exception 'policy attachment bypassed quota';
  exception when check_violation then
    if sqlerrm <> 'Organization document storage quota exceeded.' then raise; end if;
  end;
  if exists(select 1 from public.organizations where profile ? 'policies') then
    raise exception 'failed policy write was not rolled back';
  end if;
end;
$$;

delete from public.organization_document_files;
update public.organizations set profile = jsonb_build_object('policies',
  jsonb_build_array(jsonb_build_object('id', 'quota-test', 'title', 'Quota test',
    'document', jsonb_build_object(
      'path', user_id::text || '/policies/quota-test/file.pdf',
      'name', 'file.pdf', 'mime', 'application/pdf', 'size', 100
    ))));
do $$
begin
  if (select sum(size_bytes) from public.organization_document_files) <> 100 then
    raise exception 'policy file did not count toward storage';
  end if;
  update public.organizations set profile = jsonb_set(profile,
    '{policies,0,document,size}', '200'::jsonb);
  if (select sum(size_bytes) from public.organization_document_files) <> 200
    or (select count(*) from public.organization_document_files) <> 1 then
    raise exception 'replacement double counted policy storage';
  end if;
  if exists(select 1 from public.organization_document_files where document_kind is null) then
    raise exception 'policy attachment appeared as duplicate library upload';
  end if;
  if has_function_privilege('authenticated',
    'public.sync_organization_policy_document_files(uuid,jsonb)', 'execute') then
    raise exception 'authenticated users can call privileged synchronization';
  end if;
  update public.organizations set profile = jsonb_set(profile,
    '{policies,0,document}', 'null'::jsonb);
  if exists(select 1 from public.organization_document_files) then
    raise exception 'removed policy attachment still consumed storage';
  end if;
end;
$$;
