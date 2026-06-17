set check_function_bodies = off;
set search_path = public;

create table if not exists coaching_coaches (
  id text primary key,
  display_name text not null,
  title text not null,
  focus text not null,
  avatar_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists coaching_bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  coach_id text not null references coaching_coaches(id),
  status text not null default 'held',
  price_tier text not null default 'full',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'America/New_York',
  hold_expires_at timestamptz,
  confirmed_at timestamptz,
  canceled_at timestamptz,
  cancel_reason text,
  rescheduled_from_booking_id uuid references coaching_bookings(id) on delete set null,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  google_event_id text,
  google_event_html_link text,
  google_meet_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists coaching_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(user_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references coaching_bookings(id) on delete set null,
  source text not null,
  quantity integer not null,
  note text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists coaching_coaches_active_sort_idx
  on coaching_coaches (active, sort_order);

create index if not exists coaching_bookings_org_id_starts_at_idx
  on coaching_bookings (org_id, starts_at);

create index if not exists coaching_bookings_user_id_starts_at_idx
  on coaching_bookings (user_id, starts_at);

create index if not exists coaching_bookings_coach_id_starts_at_idx
  on coaching_bookings (coach_id, starts_at);

create index if not exists coaching_bookings_status_hold_idx
  on coaching_bookings (status, hold_expires_at);

create index if not exists coaching_credit_ledger_org_id_created_at_idx
  on coaching_credit_ledger (org_id, created_at);

create index if not exists coaching_credit_ledger_booking_id_idx
  on coaching_credit_ledger (booking_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'coaching_bookings_status_check'
  ) then
    alter table coaching_bookings
      add constraint coaching_bookings_status_check
      check (status in ('held', 'pending_payment', 'confirmed', 'canceled', 'rescheduled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'coaching_bookings_price_tier_check'
  ) then
    alter table coaching_bookings
      add constraint coaching_bookings_price_tier_check
      check (price_tier in ('included', 'discounted', 'full'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'coaching_bookings_time_check'
  ) then
    alter table coaching_bookings
      add constraint coaching_bookings_time_check
      check (ends_at > starts_at);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'coaching_credit_ledger_quantity_check'
  ) then
    alter table coaching_credit_ledger
      add constraint coaching_credit_ledger_quantity_check
      check (quantity <> 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'coaching_credit_ledger_source_check'
  ) then
    alter table coaching_credit_ledger
      add constraint coaching_credit_ledger_source_check
      check (source in ('included', 'purchase', 'adjustment', 'booking', 'cancellation'));
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_coaching_coaches'
  ) then
    create trigger set_updated_at_coaching_coaches
    before update on coaching_coaches
    for each row execute procedure public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_coaching_bookings'
  ) then
    create trigger set_updated_at_coaching_bookings
    before update on coaching_bookings
    for each row execute procedure public.handle_updated_at();
  end if;
end $$;

insert into coaching_coaches (id, display_name, title, focus, avatar_url, sort_order)
values
  (
    'joel',
    'Joel',
    'Strategy coach',
    'Strategy, systems, and next-step planning',
    'https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Joel.png',
    10
  ),
  (
    'paula',
    'Paula',
    'Formation coach',
    'Formation, operations, and coaching support',
    'https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/avatars/Paula.png',
    20
  )
on conflict (id) do update set
  display_name = excluded.display_name,
  title = excluded.title,
  focus = excluded.focus,
  avatar_url = excluded.avatar_url,
  active = true,
  sort_order = excluded.sort_order;

alter table coaching_coaches enable row level security;
alter table coaching_coaches force row level security;

alter table coaching_bookings enable row level security;
alter table coaching_bookings force row level security;

alter table coaching_credit_ledger enable row level security;
alter table coaching_credit_ledger force row level security;

drop policy if exists "coaching_coaches_select" on public.coaching_coaches;
drop policy if exists "coaching_coaches_admin_all" on public.coaching_coaches;

create policy "coaching_coaches_select" on public.coaching_coaches
  for select
  to authenticated
  using (active = true or public.is_admin());

create policy "coaching_coaches_admin_all" on public.coaching_coaches
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "coaching_bookings_select" on public.coaching_bookings;
drop policy if exists "coaching_bookings_insert" on public.coaching_bookings;
drop policy if exists "coaching_bookings_update" on public.coaching_bookings;
drop policy if exists "coaching_bookings_delete" on public.coaching_bookings;

create policy "coaching_bookings_select" on public.coaching_bookings
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = coaching_bookings.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "coaching_bookings_insert" on public.coaching_bookings
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      user_id = (select auth.uid())
      and (
        org_id = (select auth.uid())
        or exists (
          select 1
          from public.organization_memberships om
          where om.org_id = coaching_bookings.org_id
            and om.member_id = (select auth.uid())
        )
      )
    )
  );

create policy "coaching_bookings_update" on public.coaching_bookings
  for update
  to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = coaching_bookings.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('owner', 'admin', 'staff')
    )
  )
  with check (
    public.is_admin()
    or user_id = (select auth.uid())
    or org_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = coaching_bookings.org_id
        and om.member_id = (select auth.uid())
        and om.role in ('owner', 'admin', 'staff')
    )
  );

create policy "coaching_bookings_delete" on public.coaching_bookings
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "coaching_credit_ledger_select" on public.coaching_credit_ledger;
drop policy if exists "coaching_credit_ledger_admin_all" on public.coaching_credit_ledger;

create policy "coaching_credit_ledger_select" on public.coaching_credit_ledger
  for select
  to authenticated
  using (
    public.is_admin()
    or org_id = (select auth.uid())
    or user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships om
      where om.org_id = coaching_credit_ledger.org_id
        and om.member_id = (select auth.uid())
    )
  );

create policy "coaching_credit_ledger_admin_all" on public.coaching_credit_ledger
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
