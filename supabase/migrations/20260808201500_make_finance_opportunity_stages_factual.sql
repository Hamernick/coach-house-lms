set check_function_bodies = off;
set search_path = public;

update public.organization_finance_opportunities
set status = 'saved'
where status = 'reviewing';

alter table public.organization_finance_opportunities
  drop constraint if exists organization_finance_opportunities_status_check;

alter table public.organization_finance_opportunities
  add constraint organization_finance_opportunities_status_check
  check (
    status in (
      'new',
      'saved',
      'applied',
      'awarded',
      'not_awarded',
      'dismissed'
    )
  );
