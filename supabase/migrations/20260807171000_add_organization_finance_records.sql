set check_function_bodies = off;
set search_path = public;

create table if not exists public.organization_finance_access (
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  access_level text not null default 'viewer',
  granted_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (org_id, member_id),
  constraint organization_finance_access_level_check
    check (access_level in ('viewer', 'manager'))
);

create index if not exists organization_finance_access_member_id_idx
  on public.organization_finance_access (member_id, org_id);

create table if not exists public.organization_finance_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  effective_at timestamptz not null,
  record_type text not null,
  direction text not null,
  source_kind text,
  source_label text not null,
  amount_cents bigint not null,
  currency_code text not null default 'USD',
  status text not null default 'recorded',
  external_provider text,
  external_record_id text,
  created_source text not null default 'manual',
  created_by uuid references public.profiles(id) on delete set null,
  reconciled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_records_record_type_check
    check (
      record_type in (
        'donation',
        'grant',
        'earned_revenue',
        'other_income',
        'expense',
        'fee',
        'reversal',
        'correction'
      )
    ),
  constraint organization_finance_records_direction_check
    check (direction in ('in', 'out')),
  constraint organization_finance_records_source_kind_check
    check (
      source_kind is null
      or source_kind in ('donations', 'grants', 'earned_revenue', 'other')
    ),
  constraint organization_finance_records_inbound_source_check
    check (direction = 'out' or source_kind is not null),
  constraint organization_finance_records_source_label_check
    check (char_length(btrim(source_label)) between 1 and 120),
  constraint organization_finance_records_amount_check
    check (amount_cents >= 0),
  constraint organization_finance_records_currency_check
    check (currency_code ~ '^[A-Z]{3}$'),
  constraint organization_finance_records_status_check
    check (status in ('draft', 'recorded', 'reconciled')),
  constraint organization_finance_records_reconciled_at_check
    check (
      (status = 'reconciled' and reconciled_at is not null)
      or (status <> 'reconciled' and reconciled_at is null)
    ),
  constraint organization_finance_records_external_reference_check
    check (
      (external_provider is null and external_record_id is null)
      or (
        char_length(btrim(external_provider)) between 1 and 40
        and char_length(btrim(external_record_id)) between 1 and 256
      )
    ),
  constraint organization_finance_records_created_source_check
    check (created_source in ('manual', 'import', 'stripe', 'system'))
);

create index if not exists organization_finance_records_org_effective_idx
  on public.organization_finance_records (org_id, effective_at desc, id desc);

create index if not exists organization_finance_records_org_status_effective_idx
  on public.organization_finance_records (org_id, status, effective_at desc);

create index if not exists organization_finance_records_org_source_effective_idx
  on public.organization_finance_records (
    org_id,
    source_kind,
    effective_at desc
  )
  where direction = 'in';

create unique index if not exists organization_finance_records_external_id_idx
  on public.organization_finance_records (
    org_id,
    external_provider,
    external_record_id
  )
  where external_provider is not null and external_record_id is not null;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_organization_finance_access'
  ) then
    create trigger set_updated_at_organization_finance_access
      before update on public.organization_finance_access
      for each row execute procedure public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_organization_finance_records'
  ) then
    create trigger set_updated_at_organization_finance_records
      before update on public.organization_finance_records
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table public.organization_finance_access enable row level security;
alter table public.organization_finance_access force row level security;
alter table public.organization_finance_records enable row level security;
alter table public.organization_finance_records force row level security;

create or replace function public.can_view_organization_finance(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (
      target_org_id = (select auth.uid())
      or exists (
        select 1
        from public.organization_finance_access access
        where access.org_id = target_org_id
          and access.member_id = (select auth.uid())
      )
    );
$$;

revoke all on function public.can_view_organization_finance(uuid) from public;
grant execute on function public.can_view_organization_finance(uuid)
  to authenticated, service_role;

drop policy if exists "organization_finance_access_select"
  on public.organization_finance_access;
drop policy if exists "organization_finance_access_insert"
  on public.organization_finance_access;
drop policy if exists "organization_finance_access_update"
  on public.organization_finance_access;
drop policy if exists "organization_finance_access_delete"
  on public.organization_finance_access;

create policy "organization_finance_access_select"
  on public.organization_finance_access
  for select
  to authenticated
  using (
    org_id = (select auth.uid())
    or member_id = (select auth.uid())
  );

create policy "organization_finance_access_insert"
  on public.organization_finance_access
  for insert
  to authenticated
  with check (
    org_id = (select auth.uid())
    and granted_by = (select auth.uid())
  );

create policy "organization_finance_access_update"
  on public.organization_finance_access
  for update
  to authenticated
  using (org_id = (select auth.uid()))
  with check (
    org_id = (select auth.uid())
    and granted_by = (select auth.uid())
  );

create policy "organization_finance_access_delete"
  on public.organization_finance_access
  for delete
  to authenticated
  using (org_id = (select auth.uid()));

drop policy if exists "organization_finance_records_select"
  on public.organization_finance_records;

create policy "organization_finance_records_select"
  on public.organization_finance_records
  for select
  to authenticated
  using ((select public.can_view_organization_finance(org_id)));

revoke all on table public.organization_finance_access from anon, authenticated;
revoke all on table public.organization_finance_records from anon, authenticated;

grant select, insert, update, delete
  on table public.organization_finance_access to authenticated;
grant select on table public.organization_finance_records to authenticated;
