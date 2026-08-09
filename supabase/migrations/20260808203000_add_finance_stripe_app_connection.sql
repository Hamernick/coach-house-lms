set check_function_bodies = off;
set search_path = public;

create table if not exists public.organization_finance_stripe_install_intents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  state_sha256 text not null unique,
  default_record_type text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_stripe_install_intents_state_check
    check (state_sha256 ~ '^[a-f0-9]{64}$'),
  constraint organization_finance_stripe_install_intents_type_check
    check (default_record_type in ('donation', 'grant', 'earned_revenue', 'other_income')),
  constraint organization_finance_stripe_install_intents_time_check
    check (expires_at > created_at and (consumed_at is null or consumed_at >= created_at))
);

create index if not exists organization_finance_stripe_install_intents_expiry_idx
  on public.organization_finance_stripe_install_intents (expires_at)
  where consumed_at is null;

create table if not exists public.organization_finance_stripe_connections (
  org_id uuid primary key references public.organizations(user_id) on delete cascade,
  stripe_account_id text not null,
  stripe_user_id text not null,
  livemode boolean not null,
  default_record_type text not null,
  status text not null default 'connected',
  connected_by uuid not null references public.profiles(id) on delete restrict,
  connected_at timestamptz not null default timezone('utc', now()),
  last_synced_at timestamptz,
  last_sync_status text not null default 'idle',
  last_sync_error text,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_stripe_connections_account_check
    check (stripe_account_id ~ '^acct_[A-Za-z0-9]+$'),
  constraint organization_finance_stripe_connections_user_check
    check (char_length(btrim(stripe_user_id)) between 1 and 128),
  constraint organization_finance_stripe_connections_type_check
    check (default_record_type in ('donation', 'grant', 'earned_revenue', 'other_income')),
  constraint organization_finance_stripe_connections_status_check
    check (status in ('connected', 'disconnected', 'error')),
  constraint organization_finance_stripe_connections_sync_status_check
    check (last_sync_status in ('idle', 'running', 'succeeded', 'failed')),
  constraint organization_finance_stripe_connections_sync_error_check
    check (
      (last_sync_status = 'failed' and last_sync_error is not null)
      or (last_sync_status <> 'failed' and last_sync_error is null)
    ),
  constraint organization_finance_stripe_connections_sync_error_length_check
    check (last_sync_error is null or char_length(last_sync_error) <= 300),
  constraint organization_finance_stripe_connections_account_mode_key
    unique (stripe_account_id, livemode)
);

create table if not exists public.organization_finance_record_provider_evidence (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete restrict,
  record_id uuid not null,
  provider text not null,
  provider_account_id text not null,
  provider_record_id text not null,
  observed_at timestamptz not null,
  payload_sha256 text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_record_provider_evidence_record_key unique (record_id),
  constraint organization_finance_record_provider_evidence_record_org_fkey
    foreign key (record_id, org_id)
    references public.organization_finance_records(id, org_id)
    on delete restrict,
  constraint organization_finance_record_provider_evidence_provider_check
    check (provider = 'stripe_balance_transaction'),
  constraint organization_finance_record_provider_evidence_account_check
    check (provider_account_id ~ '^acct_[A-Za-z0-9]+$'),
  constraint organization_finance_record_provider_evidence_record_id_check
    check (char_length(btrim(provider_record_id)) between 1 and 256),
  constraint organization_finance_record_provider_evidence_hash_check
    check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  constraint organization_finance_record_provider_evidence_provider_key
    unique (org_id, provider, provider_account_id, provider_record_id)
);

create or replace function public.complete_organization_finance_stripe_install(
  p_state_sha256 text,
  p_user_id uuid,
  p_stripe_account_id text,
  p_stripe_user_id text,
  p_livemode boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_intent public.organization_finance_stripe_install_intents%rowtype;
  v_now timestamptz := timezone('utc', now());
begin
  select *
  into v_intent
  from public.organization_finance_stripe_install_intents
  where state_sha256 = p_state_sha256
    and user_id = p_user_id
    and consumed_at is null
    and expires_at > v_now
  for update;

  if not found then
    raise exception 'Stripe install intent is invalid or expired';
  end if;

  update public.organization_finance_stripe_install_intents
  set consumed_at = v_now
  where id = v_intent.id;

  insert into public.organization_finance_stripe_connections (
    org_id,
    stripe_account_id,
    stripe_user_id,
    livemode,
    default_record_type,
    status,
    connected_by,
    connected_at,
    last_sync_status,
    last_sync_error,
    updated_at
  ) values (
    v_intent.org_id,
    p_stripe_account_id,
    btrim(p_stripe_user_id),
    p_livemode,
    v_intent.default_record_type,
    'connected',
    p_user_id,
    v_now,
    'idle',
    null,
    v_now
  )
  on conflict (org_id) do update set
    stripe_account_id = excluded.stripe_account_id,
    stripe_user_id = excluded.stripe_user_id,
    livemode = excluded.livemode,
    default_record_type = excluded.default_record_type,
    status = 'connected',
    connected_by = excluded.connected_by,
    connected_at = excluded.connected_at,
    last_synced_at = null,
    last_sync_status = 'idle',
    last_sync_error = null,
    updated_at = v_now;

  return jsonb_build_object('orgId', v_intent.org_id);
end;
$$;

create or replace function public.import_organization_finance_stripe_records(
  p_actor_id uuid,
  p_org_id uuid,
  p_stripe_account_id text,
  p_records jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_item jsonb;
  v_record_id uuid;
  v_imported integer := 0;
  v_seen integer := 0;
  v_now timestamptz := timezone('utc', now());
begin
  if jsonb_typeof(p_records) <> 'array' or jsonb_array_length(p_records) > 500 then
    raise exception 'Stripe import batch is invalid';
  end if;

  if not exists (
    select 1
    from public.organization_finance_stripe_connections connection
    where connection.org_id = p_org_id
      and connection.stripe_account_id = p_stripe_account_id
      and connection.status = 'connected'
  ) then
    raise exception 'Stripe connection is unavailable';
  end if;

  for v_item in select value from jsonb_array_elements(p_records)
  loop
    v_seen := v_seen + 1;
    v_record_id := null;

    insert into public.organization_finance_records (
      org_id,
      effective_at,
      record_type,
      direction,
      source_kind,
      source_label,
      amount_cents,
      currency_code,
      status,
      external_provider,
      external_record_id,
      created_source,
      created_by,
      reconciled_at
    ) values (
      p_org_id,
      (v_item->>'effectiveAt')::timestamptz,
      v_item->>'recordType',
      v_item->>'direction',
      nullif(v_item->>'sourceKind', ''),
      v_item->>'sourceLabel',
      (v_item->>'amountCents')::bigint,
      v_item->>'currencyCode',
      'reconciled',
      'stripe_balance_transaction',
      v_item->>'externalRecordId',
      'stripe',
      p_actor_id,
      v_now
    )
    on conflict (org_id, external_provider, external_record_id)
      where external_provider is not null and external_record_id is not null
    do nothing
    returning id into v_record_id;

    if v_record_id is not null then
      insert into public.organization_finance_record_provider_evidence (
        org_id,
        record_id,
        provider,
        provider_account_id,
        provider_record_id,
        observed_at,
        payload_sha256
      ) values (
        p_org_id,
        v_record_id,
        'stripe_balance_transaction',
        p_stripe_account_id,
        v_item->>'externalRecordId',
        v_now,
        v_item->>'payloadSha256'
      );

      insert into public.organization_finance_record_events (
        org_id,
        record_id,
        event_type,
        actor_id,
        metadata,
        occurred_at
      ) values (
        p_org_id,
        v_record_id,
        'reconciled',
        p_actor_id,
        jsonb_build_object(
          'provider', 'stripe_balance_transaction',
          'providerEvidence', true
        ),
        v_now
      );

      v_imported := v_imported + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'imported', v_imported,
    'skipped', v_seen - v_imported,
    'syncedAt', v_now
  );
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_organization_finance_stripe_connections'
  ) then
    create trigger set_updated_at_organization_finance_stripe_connections
      before update on public.organization_finance_stripe_connections
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

drop trigger if exists reject_organization_finance_record_provider_evidence_mutation
  on public.organization_finance_record_provider_evidence;
create trigger reject_organization_finance_record_provider_evidence_mutation
before update or delete on public.organization_finance_record_provider_evidence
for each row execute function public.reject_finance_record_evidence_mutation();

alter table public.organization_finance_stripe_install_intents enable row level security;
alter table public.organization_finance_stripe_install_intents force row level security;
alter table public.organization_finance_stripe_connections enable row level security;
alter table public.organization_finance_stripe_connections force row level security;
alter table public.organization_finance_record_provider_evidence enable row level security;
alter table public.organization_finance_record_provider_evidence force row level security;

create policy "organization_finance_stripe_connections_select"
  on public.organization_finance_stripe_connections
  for select
  to authenticated
  using ((select public.can_view_organization_finance(org_id)));

create policy "organization_finance_record_provider_evidence_select"
  on public.organization_finance_record_provider_evidence
  for select
  to authenticated
  using ((select public.can_view_organization_finance(org_id)));

revoke all on table public.organization_finance_stripe_install_intents from anon, authenticated;
revoke all on table public.organization_finance_stripe_connections from anon, authenticated;
revoke all on table public.organization_finance_record_provider_evidence from anon, authenticated;
grant select on table public.organization_finance_stripe_connections to authenticated;
grant select on table public.organization_finance_record_provider_evidence to authenticated;
grant select, insert, update, delete
  on table public.organization_finance_stripe_install_intents to service_role;
grant select, insert, update, delete
  on table public.organization_finance_stripe_connections to service_role;
grant select, insert, update, delete
  on table public.organization_finance_record_provider_evidence to service_role;

revoke all on function public.complete_organization_finance_stripe_install(
  text, uuid, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.complete_organization_finance_stripe_install(
  text, uuid, text, text, boolean
) to service_role;

revoke all on function public.import_organization_finance_stripe_records(
  uuid, uuid, text, jsonb
) from public, anon, authenticated;
grant execute on function public.import_organization_finance_stripe_records(
  uuid, uuid, text, jsonb
) to service_role;
