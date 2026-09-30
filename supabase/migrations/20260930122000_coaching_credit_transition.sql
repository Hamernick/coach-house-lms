-- Enrollment receipt prevents existing balances >=10 from receiving another allowance later.
create table public.coaching_accelerator_credit_receipts (
  user_id uuid primary key references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.coaching_accelerator_credit_receipts enable row level security;
alter table public.coaching_accelerator_credit_receipts force row level security;
grant all on public.coaching_accelerator_credit_receipts to service_role;

-- Carry forward personal ledger balances without rewriting old history.
-- Legacy entries stay unlinked and visible; only the opening grant is spendable.
-- Include the former implicit four-credit allowance so balances above ten never shrink.
do $$
declare r record; v_org uuid; v_balance integer;
begin
  perform set_config('request.jwt.claim.role','service_role',true);
  if exists(select 1 from public.coaching_credit_ledger where expires_at is not null) then
    raise exception 'Legacy expiring credits require an audited grant allocation before migration';
  end if;
  for r in
    with old_allowances as (
      select user_id from public.accelerator_purchases where status='active' and coaching_included is distinct from false
      union
      select user_id from public.subscriptions where status in ('active','trialing') and metadata->>'kind'='accelerator'
        and (metadata->>'coaching_included'='true' or metadata->>'accelerator_variant'='with_coaching')
    ), balances as (
      select user_id,quantity from public.coaching_credit_ledger
      union all select user_id,4 from old_allowances
    )
    select user_id,sum(quantity)::integer balance from balances group by user_id having sum(quantity)>0
  loop
    select org_id into v_org from public.coaching_credit_ledger where user_id=r.user_id order by created_at desc limit 1;
    perform public.issue_coaching_credits(r.user_id,v_org,r.balance,'legacy','Existing coaching balance',
      'Opening personal balance carried forward from the original ledger; prior history is retained.',null,null,'transition:'||r.user_id);
  end loop;
  -- Actual participants are named by purchases/subscriptions; org membership is not enrollment.
  for r in
    select user_id from public.accelerator_purchases where status='active'
    union
    select user_id from public.subscriptions where status in ('active','trialing') and metadata->>'kind'='accelerator'
  loop
    insert into public.coaching_accelerator_credit_receipts(user_id) values(r.user_id);
    select user_id into v_org from public.organizations where user_id=r.user_id;
    v_balance:=(public.coaching_credit_account(r.user_id)->>'available')::integer;
    if v_balance<10 then
      perform public.issue_coaching_credits(r.user_id,v_org,10-v_balance,'accelerator','Accelerator 2026',
        'One-time transition: top up this Accelerator participant to 10 available credits.',null,null,'accelerator-initial:'||r.user_id);
    end if;
  end loop;
end; $$;

-- Future participants receive ten once; repeated checkout/subscription updates cannot reissue.
create or replace function public.grant_accelerator_coaching_credits()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_org uuid;
begin
  if new.status not in ('active','trialing') then return new; end if;
  if tg_table_name='subscriptions' and to_jsonb(new)->'metadata'->>'kind' is distinct from 'accelerator' then return new; end if;
  perform pg_advisory_xact_lock(hashtextextended('coaching-credit:'||new.user_id::text,0));
  insert into coaching_accelerator_credit_receipts(user_id) values(new.user_id) on conflict do nothing;
  if not found then return new; end if;
  select user_id into v_org from organizations where user_id=new.user_id;
  perform issue_coaching_credits(new.user_id,v_org,10,'accelerator','Accelerator',
    'Ten coaching credits included with Accelerator enrollment.',null,null,'accelerator-initial:'||new.user_id);
  return new;
end; $$;
revoke all on function public.grant_accelerator_coaching_credits() from public,anon,authenticated;
create trigger accelerator_purchase_coaching_grant after insert or update on public.accelerator_purchases
for each row execute function public.grant_accelerator_coaching_credits();
create trigger accelerator_subscription_coaching_grant after insert or update on public.subscriptions
for each row execute function public.grant_accelerator_coaching_credits();
