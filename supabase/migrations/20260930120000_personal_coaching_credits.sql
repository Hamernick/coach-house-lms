-- Personal grants and immutable credit history. Writes are service-only commands.
create table public.coaching_credit_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  org_id uuid references public.organizations(user_id),
  source_type text not null check (source_type in ('accelerator','alumni','courtesy','purchased','legacy')),
  label text not null check (length(btrim(label)) between 1 and 160),
  quantity integer not null check (quantity between 1 and 10000),
  reason text not null check (length(btrim(reason)) between 1 and 1000),
  expires_at timestamptz,
  issued_by uuid references auth.users(id),
  request_key text not null unique,
  created_at timestamptz not null default now()
);
alter table public.coaching_credit_grants enable row level security;
alter table public.coaching_credit_grants force row level security;
create policy coaching_grants_read on public.coaching_credit_grants for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
grant select on public.coaching_credit_grants to authenticated;
grant all on public.coaching_credit_grants to service_role;

alter table public.coaching_credit_ledger
  add column grant_id uuid references public.coaching_credit_grants(id),
  add column actor_id uuid references auth.users(id),
  add column operation_key text unique;
alter table public.coaching_credit_ledger alter column org_id drop not null;
alter table public.coaching_credit_ledger drop constraint coaching_credit_ledger_quantity_check;
alter table public.coaching_credit_ledger drop constraint coaching_credit_ledger_source_check;
alter table public.coaching_credit_ledger add constraint coaching_credit_ledger_source_check
  check (source in ('included','purchase','adjustment','booking','cancellation','reschedule','completed','no_show','canceled','late_cancellation'));
alter table public.coaching_credit_ledger add constraint coaching_credit_ledger_quantity_check
  check ((quantity <> 0 and source in ('included','purchase','adjustment','booking','cancellation'))
      or (quantity = 0 and source in ('reschedule','completed','no_show','canceled','late_cancellation')));
create index coaching_grants_user_idx on public.coaching_credit_grants(user_id, expires_at);
create index coaching_ledger_grant_idx on public.coaching_credit_ledger(grant_id);
create index coaching_ledger_user_history_idx on public.coaching_credit_ledger(user_id, created_at desc, id);
-- A member must not see another participant's credits through org membership.
drop policy coaching_credit_ledger_select on public.coaching_credit_ledger;
drop policy coaching_credit_ledger_admin_all on public.coaching_credit_ledger;
create policy coaching_credit_ledger_select on public.coaching_credit_ledger for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.coaching_credit_ledger from authenticated;
-- Booking mutations also pass through the transactional policy, not direct REST.
drop policy coaching_bookings_insert on public.coaching_bookings;
drop policy coaching_bookings_update on public.coaching_bookings;
drop policy coaching_bookings_delete on public.coaching_bookings;
revoke insert, update, delete on public.coaching_bookings from authenticated;
alter table public.coaching_bookings drop constraint coaching_bookings_status_check;
alter table public.coaching_bookings add constraint coaching_bookings_status_check
check (status in ('held','pending_payment','confirmed','canceled','rescheduled','completed','no_show'));
alter table public.coaching_bookings
  add column credit_revision integer not null default 0,
  add column current_credit_entry_id uuid references public.coaching_credit_ledger(id),
  add column calendar_pending_action text check (calendar_pending_action in ('create','delete','update')),
  add column calendar_checked_at timestamptz;

create or replace function public.coaching_credit_account(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare result jsonb;
begin
  if coalesce(auth.role(),'') <> 'service_role' and p_user_id is distinct from auth.uid() and not public.is_admin() then raise exception 'Not authorized'; end if;
  with balances as (
    select g.*, coalesce((select sum(l.quantity) from coaching_credit_ledger l where l.grant_id=g.id),0)::integer remaining
    from coaching_credit_grants g where g.user_id=p_user_id
  )
  select jsonb_build_object(
    'available',coalesce(sum(greatest(remaining,0)) filter (where expires_at is null or expires_at > now()),0),
    'includedAllowance',coalesce(sum(quantity) filter (where source_type='accelerator'),0),
    'consumed',coalesce((select -sum(quantity) from coaching_credit_ledger where user_id=p_user_id and source in ('booking','cancellation')),0),
    'grants',coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'sourceType',source_type,'issued',quantity,'available',greatest(remaining,0),'expiresAt',expires_at,'createdAt',created_at) order by created_at desc),'[]'::jsonb)
  ) into result from balances;
  return result;
end; $$;

create or replace function public.issue_coaching_credits(
  p_user_id uuid, p_org_id uuid, p_quantity integer, p_source_type text,
  p_label text, p_reason text, p_expires_at timestamptz, p_actor_id uuid, p_request_key text
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_existing coaching_credit_grants;
begin
  perform pg_advisory_xact_lock(hashtextextended('coaching-credit:'||p_user_id::text,0));
  select * into v_existing from coaching_credit_grants where request_key=p_request_key;
  if found then
    if v_existing.user_id<>p_user_id or v_existing.quantity<>p_quantity or v_existing.org_id is distinct from p_org_id
      or v_existing.source_type<>p_source_type or v_existing.label<>btrim(p_label) or v_existing.reason<>btrim(p_reason)
      or v_existing.expires_at is distinct from p_expires_at or v_existing.issued_by is distinct from p_actor_id then
      raise exception 'Credit request already used with different details';
    end if;
    return v_existing.id;
  end if;
  if p_request_key is null or length(p_request_key) not between 1 and 200 then raise exception 'Invalid credit request'; end if;
  if p_expires_at is not null and p_expires_at<=now() then raise exception 'Expiration must be in the future'; end if;
  insert into coaching_credit_grants(user_id,org_id,quantity,source_type,label,reason,expires_at,issued_by,request_key)
  values(p_user_id,p_org_id,p_quantity,p_source_type,btrim(p_label),btrim(p_reason),p_expires_at,p_actor_id,p_request_key) returning id into v_id;
  insert into coaching_credit_ledger(user_id,org_id,grant_id,actor_id,source,quantity,note,expires_at,operation_key)
  values(p_user_id,p_org_id,v_id,p_actor_id,case p_source_type when 'accelerator' then 'included' when 'purchased' then 'purchase' else 'adjustment' end,p_quantity,btrim(p_reason),p_expires_at,'issue:'||v_id);
  return v_id;
end; $$;

create or replace function public.consume_coaching_credit(p_booking_id uuid,p_actor_id uuid,p_operation_key text)
returns uuid language plpgsql security definer set search_path=public as $$
declare b coaching_bookings; v_grant uuid; v_entry uuid;
begin
  select * into strict b from coaching_bookings where id=p_booking_id for update;
  perform pg_advisory_xact_lock(hashtextextended('coaching-credit:'||b.user_id::text,0));
  select id into v_entry from coaching_credit_ledger where operation_key=p_operation_key;
  if found then return v_entry; end if;
  select g.id into v_grant from coaching_credit_grants g
    where g.user_id=b.user_id and (g.expires_at is null or g.expires_at>now())
      and (select coalesce(sum(quantity),0) from coaching_credit_ledger where grant_id=g.id)>0
    order by g.expires_at nulls last,g.created_at,g.id limit 1;
  if v_grant is null then raise exception 'No coaching credits available. Add a credit before booking or rescheduling.'; end if;
  insert into coaching_credit_ledger(user_id,org_id,booking_id,grant_id,actor_id,source,quantity,note,operation_key)
    values(b.user_id,b.org_id,b.id,v_grant,p_actor_id,'booking',-1,'Credit reserved for a 45-minute coaching session.',p_operation_key)
    returning id into v_entry;
  return v_entry;
end; $$;

create or replace function public.restore_coaching_credit(p_booking_id uuid,p_actor_id uuid,p_reason text)
returns boolean language plpgsql security definer set search_path=public as $$
declare b coaching_bookings; d coaching_credit_ledger; v_grant uuid;
begin
  select * into strict b from coaching_bookings where id=p_booking_id for update;
  perform pg_advisory_xact_lock(hashtextextended('coaching-credit:'||b.user_id::text,0));
  -- Only the current reservation is refundable; previous late-reschedule debits stay used.
  select * into d from coaching_credit_ledger where (b.current_credit_entry_id is not null and id=b.current_credit_entry_id) or (b.current_credit_entry_id is null and booking_id=b.id and source='booking') order by created_at desc,id desc limit 1;
  if not found then return false; end if;
  if exists(select 1 from coaching_credit_ledger where operation_key='restore:'||d.id)
    or (d.grant_id is null and exists(select 1 from coaching_credit_ledger where booking_id=b.id and source='cancellation')) then return false; end if;
  v_grant:=d.grant_id;
  if v_grant is null then
    -- Old reservations predate grants. Preserve history and create a refundable personal grant.
    insert into coaching_credit_grants(user_id,org_id,source_type,label,quantity,reason,issued_by,request_key)
      values(b.user_id,b.org_id,'legacy','Restored coaching credit',1,p_reason,p_actor_id,'legacy-restore:'||d.id) returning id into v_grant;
  end if;
  insert into coaching_credit_ledger(user_id,org_id,booking_id,grant_id,actor_id,source,quantity,note,operation_key)
    values(b.user_id,b.org_id,b.id,v_grant,p_actor_id,'cancellation',1,p_reason,'restore:'||d.id);
  return true;
end; $$;

create or replace function public.confirm_coaching_credit_booking(p_booking_id uuid,p_checkout_id text,p_payment_id text,p_customer_id text)
returns void language plpgsql security definer set search_path=public as $$
declare b coaching_bookings; v_grant uuid; v_entry uuid;
begin
  select * into strict b from coaching_bookings where id=p_booking_id for update;
  if b.status='confirmed' then return; end if;
  perform pg_advisory_xact_lock(hashtextextended('coaching-joint-calendar',0));
  if exists(select 1 from coaching_bookings where id<>b.id and status='confirmed' and starts_at<b.ends_at and ends_at>b.starts_at) then raise exception 'That slot was just taken'; end if;
  if b.status not in ('held','pending_payment') or b.starts_at<=now() then raise exception 'This booking is no longer available'; end if;
  if b.price_tier<>'included' then
    if p_checkout_id is null or b.stripe_checkout_session_id is distinct from p_checkout_id then raise exception 'Payment does not match booking'; end if;
    v_grant:=issue_coaching_credits(b.user_id,b.org_id,1,'purchased','Purchased Coaching','Paid coaching session',null,null,'checkout:'||p_checkout_id);
    update coaching_credit_ledger set stripe_checkout_session_id=p_checkout_id,stripe_payment_intent_id=p_payment_id where grant_id=v_grant and source='purchase';
  end if;
  v_entry:=consume_coaching_credit(b.id,b.user_id,'book:'||b.id||':0');
  update coaching_bookings set status='confirmed',confirmed_at=now(),hold_expires_at=null,calendar_pending_action='create',current_credit_entry_id=v_entry,google_event_id=coalesce(google_event_id,replace(b.id::text,'-','')),
    stripe_payment_intent_id=coalesce(p_payment_id,stripe_payment_intent_id),stripe_customer_id=coalesce(p_customer_id,stripe_customer_id)
    where id=b.id;
end; $$;

revoke all on function public.coaching_credit_account(uuid) from public,anon,authenticated;
revoke all on function public.issue_coaching_credits(uuid,uuid,integer,text,text,text,timestamptz,uuid,text) from public,anon,authenticated;
revoke all on function public.consume_coaching_credit(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.restore_coaching_credit(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.confirm_coaching_credit_booking(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.coaching_credit_account(uuid) to service_role, authenticated;
grant execute on function public.issue_coaching_credits(uuid,uuid,integer,text,text,text,timestamptz,uuid,text) to service_role;
grant execute on function public.consume_coaching_credit(uuid,uuid,text) to service_role;
grant execute on function public.restore_coaching_credit(uuid,uuid,text) to service_role;
grant execute on function public.confirm_coaching_credit_booking(uuid,text,text,text) to service_role;
