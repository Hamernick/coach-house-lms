set search_path = public;

create or replace function public.complete_organization_finance_stripe_install(
  p_state_sha256 text,
  p_user_id uuid,
  p_org_id uuid,
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
  if p_org_id <> p_user_id and not exists (
    select 1
    from public.organization_finance_access access
    inner join public.organization_memberships membership
      on membership.org_id = access.org_id
      and membership.member_id = access.member_id
      and membership.role = 'board'
    where access.org_id = p_org_id
      and access.member_id = p_user_id
      and access.access_level = 'manager'
  ) then
    raise exception 'Finance manager access is required';
  end if;

  select *
  into v_intent
  from public.organization_finance_stripe_install_intents
  where state_sha256 = p_state_sha256
    and user_id = p_user_id
    and org_id = p_org_id
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
    p_org_id,
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

  return jsonb_build_object('orgId', p_org_id);
end;
$$;

revoke all on function public.complete_organization_finance_stripe_install(
  text,
  uuid,
  uuid,
  text,
  text,
  boolean
) from public, anon, authenticated;

grant execute on function public.complete_organization_finance_stripe_install(
  text,
  uuid,
  uuid,
  text,
  text,
  boolean
) to service_role;

-- Keep the released five-argument caller working during a rolling deployment.
-- The wrapper resolves the intent tenant, then delegates to the authorization-
-- checked implementation above.
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
  v_org_id uuid;
begin
  select intent.org_id
  into v_org_id
  from public.organization_finance_stripe_install_intents intent
  where intent.state_sha256 = p_state_sha256
    and intent.user_id = p_user_id
    and intent.consumed_at is null
    and intent.expires_at > timezone('utc', now());

  if not found then
    raise exception 'Stripe install intent is invalid or expired';
  end if;

  return public.complete_organization_finance_stripe_install(
    p_state_sha256,
    p_user_id,
    v_org_id,
    p_stripe_account_id,
    p_stripe_user_id,
    p_livemode
  );
end;
$$;

revoke all on function public.complete_organization_finance_stripe_install(
  text,
  uuid,
  text,
  text,
  boolean
) from public, anon, authenticated;

grant execute on function public.complete_organization_finance_stripe_install(
  text,
  uuid,
  text,
  text,
  boolean
) to service_role;
