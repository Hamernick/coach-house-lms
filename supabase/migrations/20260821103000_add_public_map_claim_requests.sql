set check_function_bodies = off;
set search_path = public;

create table if not exists public.public_map_claim_requests (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null,
  target_id uuid,
  listing_name text not null,
  claimant_name text not null,
  claimant_email text not null,
  message text,
  status text not null default 'new',
  submission_key uuid not null,
  risk_key text not null,
  email_target_key text not null,
  task_id uuid references public.organization_tasks(id) on delete set null,
  delivery_status text not null default 'pending',
  delivery_error text,
  assigned_to uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint public_map_claim_requests_target_kind_check
    check (target_kind in ('platform_organization', 'resource_map_organization', 'new')),
  constraint public_map_claim_requests_target_check
    check ((target_kind = 'new') = (target_id is null)),
  constraint public_map_claim_requests_status_check
    check (status in ('new', 'reviewing', 'verified', 'approved', 'rejected', 'spam')),
  constraint public_map_claim_requests_delivery_status_check
    check (delivery_status in ('pending', 'delivered', 'failed')),
  constraint public_map_claim_requests_listing_name_check
    check (char_length(btrim(listing_name)) between 2 and 160),
  constraint public_map_claim_requests_claimant_name_check
    check (char_length(btrim(claimant_name)) between 2 and 120),
  constraint public_map_claim_requests_claimant_email_check
    check (char_length(btrim(claimant_email)) between 3 and 254),
  constraint public_map_claim_requests_message_check
    check (message is null or char_length(message) <= 2000),
  constraint public_map_claim_requests_risk_key_check
    check (risk_key ~ '^[0-9a-f]{64}$'),
  constraint public_map_claim_requests_email_target_key_check
    check (email_target_key ~ '^[0-9a-f]{64}$'),
  constraint public_map_claim_requests_submission_key_key unique (submission_key)
);

create index if not exists public_map_claim_requests_status_created_at_idx
  on public.public_map_claim_requests (status, created_at desc);

create index if not exists public_map_claim_requests_risk_created_at_idx
  on public.public_map_claim_requests (risk_key, created_at desc);

create index if not exists public_map_claim_requests_email_target_created_at_idx
  on public.public_map_claim_requests (email_target_key, created_at desc);

create index if not exists public_map_claim_requests_delivery_created_at_idx
  on public.public_map_claim_requests (delivery_status, created_at asc);

drop trigger if exists set_updated_at_public_map_claim_requests
  on public.public_map_claim_requests;

create trigger set_updated_at_public_map_claim_requests
before update on public.public_map_claim_requests
for each row execute procedure public.handle_updated_at();

alter table public.public_map_claim_requests enable row level security;
alter table public.public_map_claim_requests force row level security;

revoke all on table public.public_map_claim_requests from public, anon, authenticated;
grant select, insert, update on table public.public_map_claim_requests to service_role;

create or replace function public.submit_public_map_claim_request(
  p_target_kind text,
  p_target_id uuid,
  p_listing_name text,
  p_claimant_name text,
  p_claimant_email text,
  p_message text,
  p_submission_key uuid,
  p_risk_key text,
  p_email_target_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_claim_id uuid;
  v_email_target_day_count bigint;
  v_risk_day_count bigint;
  v_risk_hour_count bigint;
begin
  select claim.id
  into v_claim_id
  from public.public_map_claim_requests claim
  where claim.submission_key = p_submission_key;

  if found then
    return jsonb_build_object(
      'claimId', v_claim_id,
      'duplicate', true,
      'status', 'recorded'
    );
  end if;

  if p_target_kind not in ('platform_organization', 'resource_map_organization', 'new')
    or ((p_target_kind = 'new') <> (p_target_id is null))
    or char_length(btrim(coalesce(p_listing_name, ''))) not between 2 and 160
    or char_length(btrim(coalesce(p_claimant_name, ''))) not between 2 and 120
    or char_length(btrim(coalesce(p_claimant_email, ''))) not between 3 and 254
    or char_length(coalesce(p_message, '')) > 2000
    or coalesce(p_risk_key, '') !~ '^[0-9a-f]{64}$'
    or coalesce(p_email_target_key, '') !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid public map claim request' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('public-map-claim:risk:' || p_risk_key, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('public-map-claim:email-target:' || p_email_target_key, 0)
  );

  select count(*)
  into v_risk_hour_count
  from public.public_map_claim_requests claim
  where claim.risk_key = p_risk_key
    and claim.created_at >= now() - interval '1 hour';

  if v_risk_hour_count >= 5 then
    return jsonb_build_object('retryAfterSeconds', 3600, 'status', 'rate_limited');
  end if;

  select count(*)
  into v_risk_day_count
  from public.public_map_claim_requests claim
  where claim.risk_key = p_risk_key
    and claim.created_at >= now() - interval '1 day';

  if v_risk_day_count >= 10 then
    return jsonb_build_object('retryAfterSeconds', 86400, 'status', 'rate_limited');
  end if;

  select count(*)
  into v_email_target_day_count
  from public.public_map_claim_requests claim
  where claim.email_target_key = p_email_target_key
    and claim.created_at >= now() - interval '1 day';

  if v_email_target_day_count >= 3 then
    return jsonb_build_object('retryAfterSeconds', 86400, 'status', 'rate_limited');
  end if;

  insert into public.public_map_claim_requests (
    target_kind,
    target_id,
    listing_name,
    claimant_name,
    claimant_email,
    message,
    submission_key,
    risk_key,
    email_target_key
  ) values (
    p_target_kind,
    p_target_id,
    btrim(p_listing_name),
    btrim(p_claimant_name),
    lower(btrim(p_claimant_email)),
    nullif(btrim(coalesce(p_message, '')), ''),
    p_submission_key,
    p_risk_key,
    p_email_target_key
  )
  returning id into v_claim_id;

  return jsonb_build_object(
    'claimId', v_claim_id,
    'duplicate', false,
    'status', 'recorded'
  );
end;
$$;

revoke all on function public.submit_public_map_claim_request(
  text, uuid, text, text, text, text, uuid, text, text
) from public, anon, authenticated;

grant execute on function public.submit_public_map_claim_request(
  text, uuid, text, text, text, text, uuid, text, text
) to service_role;

create or replace function public.deliver_public_map_claim_request(
  p_claim_id uuid,
  p_owner_id uuid,
  p_project_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_claim public.public_map_claim_requests%rowtype;
  v_project_id uuid;
  v_task_id uuid;
  v_task_result jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('public-map-claim:delivery:' || p_claim_id::text, 0)
  );

  select claim.*
  into v_claim
  from public.public_map_claim_requests claim
  where claim.id = p_claim_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_claim.delivery_status = 'delivered' then
    return jsonb_build_object('ok', true, 'taskId', v_claim.task_id);
  end if;

  if not exists (
    select 1
    from public.platform_staff_members staff
    where staff.user_id = p_owner_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_owner');
  end if;

  if not exists (
    select 1
    from public.organizations organization
    where organization.user_id = p_owner_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'invalid_owner_organization');
  end if;

  v_project_id := p_project_id;

  if v_project_id is null then
    select project.id
    into v_project_id
    from public.organization_projects project
    where project.org_id = p_owner_id
      and project.starter_seed_key = 'platform:public-map-claims';

    if not found then
      insert into public.organization_projects (
        org_id,
        project_kind,
        name,
        description,
        status,
        priority,
        progress,
        start_date,
        end_date,
        type_label,
        tags,
        member_labels,
        created_source,
        starter_seed_key,
        starter_seed_version,
        created_by,
        updated_by
      ) values (
        p_owner_id,
        'standard',
        'Public Map Claims',
        'Review public requests to claim or add nonprofit listings.',
        'active',
        'medium',
        0,
        current_date,
        current_date + 3650,
        'Operations',
        array['Resource Map', 'Claims'],
        array['Coach House'],
        'system',
        'platform:public-map-claims',
        1,
        p_owner_id,
        p_owner_id
      )
      on conflict (org_id, starter_seed_key) do nothing
      returning id into v_project_id;

      if v_project_id is null then
        select project.id
        into v_project_id
        from public.organization_projects project
        where project.org_id = p_owner_id
          and project.starter_seed_key = 'platform:public-map-claims';
      end if;
    end if;
  end if;

  v_task_result := public.create_organization_task_transition(
    p_owner_id,
    v_project_id,
    'Review public map claim request',
    'Open the public map claim queue to review the new request.',
    'task',
    'todo',
    current_date,
    current_date + 2,
    'medium',
    'Public Map Claim',
    'Resource Map',
    p_owner_id
  );

  if coalesce((v_task_result ->> 'ok')::boolean, false) is not true then
    return jsonb_build_object(
      'ok', false,
      'code', coalesce(v_task_result ->> 'code', 'task_failed')
    );
  end if;

  v_task_id := (v_task_result ->> 'taskId')::uuid;

  insert into public.notifications (
    user_id,
    title,
    description,
    href,
    tone,
    type,
    metadata
  ) values (
    p_owner_id,
    'New public map claim request',
    'A nonprofit claim request is ready for review.',
    '/admin/platform/resource-map?view=claims&claim=' || p_claim_id::text,
    'info',
    'public_map_claim',
    jsonb_build_object('claimId', p_claim_id)
  );

  update public.public_map_claim_requests
  set
    assigned_to = p_owner_id,
    task_id = v_task_id,
    delivery_status = 'delivered',
    delivery_error = null
  where id = p_claim_id;

  return jsonb_build_object('ok', true, 'taskId', v_task_id);
end;
$$;

revoke all on function public.deliver_public_map_claim_request(uuid, uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.deliver_public_map_claim_request(uuid, uuid, uuid)
  to service_role;

notify pgrst, 'reload schema';
