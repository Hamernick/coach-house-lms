create table public.google_drive_oauth_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  state_sha256 text not null unique check (state_sha256 ~ '^[a-f0-9]{64}$'),
  pkce_verifier_ciphertext text not null,
  pkce_verifier_iv text not null,
  pkce_verifier_auth_tag text not null,
  key_version text not null,
  return_path text not null default '/organization/documents'
    check (return_path in (
      '/my-organization/documents',
      '/organization/documents',
      '/workspace/documents'
    )),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index google_drive_oauth_intents_user_id_idx
  on public.google_drive_oauth_intents(user_id);
create index google_drive_oauth_intents_org_id_idx
  on public.google_drive_oauth_intents(org_id);
create index google_drive_oauth_intents_pending_idx
  on public.google_drive_oauth_intents(expires_at)
  where consumed_at is null;

create table public.google_drive_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  google_subject text not null check (char_length(google_subject) between 1 and 255),
  google_email text not null check (char_length(google_email) between 3 and 320),
  refresh_token_ciphertext text,
  refresh_token_iv text,
  refresh_token_auth_tag text,
  key_version text,
  granted_scopes text[] not null default '{}',
  status text not null default 'connected'
    check (status in ('connected', 'revoked', 'error', 'disconnected')),
  last_verified_at timestamptz,
  last_error_code text,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint google_drive_connections_token_state_check check (
    (status = 'connected' and refresh_token_ciphertext is not null
      and refresh_token_iv is not null and refresh_token_auth_tag is not null
      and key_version is not null)
    or
    (status <> 'connected' and refresh_token_ciphertext is null
      and refresh_token_iv is null and refresh_token_auth_tag is null
      and key_version is null)
  )
);

create table public.organization_external_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  provider text not null default 'google_drive' check (provider = 'google_drive'),
  provider_file_id text not null
    check (provider_file_id ~ '^[A-Za-z0-9_-]{10,200}$'),
  connection_id uuid references public.google_drive_connections(id) on delete set null,
  name text not null check (char_length(name) between 1 and 1024),
  mime_type text not null check (char_length(mime_type) between 1 and 255),
  web_view_link text not null check (char_length(web_view_link) between 1 and 2048),
  drive_id text check (drive_id is null or char_length(drive_id) between 1 and 200),
  modified_at timestamptz,
  status text not null default 'available'
    check (status in ('available', 'trashed', 'inaccessible', 'needs_reconnect')),
  attached_by uuid references public.profiles(id) on delete set null,
  attached_at timestamptz not null default now(),
  last_verified_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (org_id, provider, provider_file_id)
);

create index organization_external_documents_org_id_idx
  on public.organization_external_documents(org_id);
create index organization_external_documents_connection_id_idx
  on public.organization_external_documents(connection_id);
create index organization_external_documents_attached_by_idx
  on public.organization_external_documents(attached_by);

create trigger set_google_drive_connections_updated_at
before update on public.google_drive_connections
for each row execute procedure public.handle_updated_at();

create trigger set_organization_external_documents_updated_at
before update on public.organization_external_documents
for each row execute procedure public.handle_updated_at();

alter table public.google_drive_oauth_intents enable row level security;
alter table public.google_drive_oauth_intents force row level security;
alter table public.google_drive_connections enable row level security;
alter table public.google_drive_connections force row level security;
alter table public.organization_external_documents enable row level security;
alter table public.organization_external_documents force row level security;

revoke all on public.google_drive_oauth_intents from anon, authenticated;
revoke all on public.google_drive_connections from anon, authenticated;
revoke all on public.organization_external_documents from anon, authenticated;
grant all on public.google_drive_oauth_intents to service_role;
grant all on public.google_drive_connections to service_role;
grant all on public.organization_external_documents to service_role;
grant select on public.organization_external_documents to authenticated;

create policy organization_external_documents_select
on public.organization_external_documents
for select
to authenticated
using (
  org_id = (select auth.uid())
  or exists (
    select 1
    from public.organization_memberships membership
    where membership.org_id = organization_external_documents.org_id
      and membership.member_id = (select auth.uid())
  )
);

create or replace function public.mark_google_drive_documents_needs_reconnect()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.organization_external_documents
    set status = 'needs_reconnect', last_verified_at = now()
    where connection_id = old.id;
    return old;
  end if;
  if old.status = 'connected' and new.status <> 'connected' then
    update public.organization_external_documents
    set status = 'needs_reconnect', last_verified_at = now()
    where connection_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.mark_google_drive_documents_needs_reconnect() from public;

create trigger google_drive_connection_status_documents
after update of status on public.google_drive_connections
for each row execute function public.mark_google_drive_documents_needs_reconnect();

create trigger google_drive_connection_delete_documents
before delete on public.google_drive_connections
for each row execute function public.mark_google_drive_documents_needs_reconnect();
