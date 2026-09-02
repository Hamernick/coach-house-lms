set role service_role;

insert into public.google_drive_oauth_intents (
  id, user_id, org_id, state_sha256,
  pkce_verifier_ciphertext, pkce_verifier_iv, pkce_verifier_auth_tag,
  key_version, expires_at
) values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  repeat('a', 64), 'ciphertext', 'iv', 'tag', 'v1', now() + interval '10 minutes'
);

insert into public.google_drive_connections (
  id, user_id, google_subject, google_email,
  refresh_token_ciphertext, refresh_token_iv, refresh_token_auth_tag,
  key_version, granted_scopes, status
) values (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'google-subject', 'drive-owner@example.com',
  'ciphertext', 'iv', 'tag', 'v1',
  array['https://www.googleapis.com/auth/drive.file'], 'connected'
);

insert into public.organization_external_documents (
  id, org_id, provider_file_id, connection_id, name, mime_type,
  web_view_link, status, attached_by
) values (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'drive-file-one',
  '20000000-0000-0000-0000-000000000001',
  'Board packet', 'application/vnd.google-apps.document',
  'https://docs.google.com/document/d/test', 'available',
  '00000000-0000-0000-0000-000000000001'
);

reset role;

do $$
declare
  actor uuid;
begin
  foreach actor in array array[
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid
  ] loop
    perform set_config('request.jwt.claim.sub', actor::text, true);
    set local role authenticated;
    if (select count(*) from public.organization_external_documents) <> 1 then
      raise exception 'organization member could not read Drive metadata';
    end if;
    reset role;
  end loop;
end;
$$;

do $$
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
  set local role authenticated;
  if (select count(*) from public.organization_external_documents) <> 0 then
    raise exception 'unrelated user crossed Drive metadata boundary';
  end if;
  reset role;
end;
$$;

do $$
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
  set local role authenticated;
  begin
    update public.organization_external_documents set name = 'Forbidden';
    raise exception 'authenticated user retained Drive metadata write access';
  exception when insufficient_privilege then null;
  end;
  begin
    perform id from public.google_drive_connections;
    raise exception 'authenticated user read Drive credentials';
  exception when insufficient_privilege then null;
  end;
  begin
    perform id from public.google_drive_oauth_intents;
    raise exception 'authenticated user read OAuth intents';
  exception when insufficient_privilege then null;
  end;
  reset role;
end;
$$;

set role service_role;
update public.google_drive_connections
set status = 'disconnected',
    refresh_token_ciphertext = null,
    refresh_token_iv = null,
    refresh_token_auth_tag = null,
    key_version = null
where id = '20000000-0000-0000-0000-000000000001';

do $$
begin
  if (
    select status from public.organization_external_documents
    where id = '30000000-0000-0000-0000-000000000001'
  ) <> 'needs_reconnect' then
    raise exception 'disconnect did not mark Drive document for reconnect';
  end if;
end;
$$;

update public.organization_external_documents set status = 'available'
where id = '30000000-0000-0000-0000-000000000001';
delete from public.google_drive_connections
where id = '20000000-0000-0000-0000-000000000001';

do $$
begin
  if exists (
    select 1 from public.organization_external_documents
    where id = '30000000-0000-0000-0000-000000000001'
      and (status <> 'needs_reconnect' or connection_id is not null)
  ) then
    raise exception 'connection deletion did not preserve reconnect state';
  end if;
end;
$$;

reset role;
