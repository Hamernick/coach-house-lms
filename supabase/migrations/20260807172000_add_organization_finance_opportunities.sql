set check_function_bodies = off;
set search_path = public;

create table if not exists public.organization_finance_opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(user_id) on delete cascade,
  title text not null,
  source_label text,
  opportunity_type text not null default 'other',
  due_at timestamptz,
  status text not null default 'new',
  external_provider text not null,
  external_opportunity_id text not null,
  discovered_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint organization_finance_opportunities_title_check
    check (char_length(btrim(title)) between 1 and 200),
  constraint organization_finance_opportunities_source_label_check
    check (
      source_label is null
      or char_length(btrim(source_label)) between 1 and 120
    ),
  constraint organization_finance_opportunities_type_check
    check (
      opportunity_type in (
        'grant',
        'contract',
        'sponsorship',
        'award',
        'partnership',
        'other'
      )
    ),
  constraint organization_finance_opportunities_status_check
    check (status in ('new', 'reviewing', 'saved', 'dismissed')),
  constraint organization_finance_opportunities_provider_check
    check (char_length(btrim(external_provider)) between 1 and 40),
  constraint organization_finance_opportunities_external_id_check
    check (char_length(btrim(external_opportunity_id)) between 1 and 256)
);

create index if not exists organization_finance_opportunities_active_queue_idx
  on public.organization_finance_opportunities (
    org_id,
    due_at asc nulls last,
    discovered_at desc,
    id
  )
  where status <> 'dismissed';

create unique index if not exists organization_finance_opportunities_external_id_idx
  on public.organization_finance_opportunities (
    org_id,
    external_provider,
    external_opportunity_id
  );

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_organization_finance_opportunities'
  ) then
    create trigger set_updated_at_organization_finance_opportunities
      before update on public.organization_finance_opportunities
      for each row execute procedure public.handle_updated_at();
  end if;
end $$;

alter table public.organization_finance_opportunities enable row level security;
alter table public.organization_finance_opportunities force row level security;

drop policy if exists "organization_finance_opportunities_select"
  on public.organization_finance_opportunities;

create policy "organization_finance_opportunities_select"
  on public.organization_finance_opportunities
  for select
  to authenticated
  using ((select public.can_view_organization_finance(org_id)));

revoke all on table public.organization_finance_opportunities
  from anon, authenticated;

grant select on table public.organization_finance_opportunities
  to authenticated;
