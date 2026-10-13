-- Ordinary projects may remain undated. Monthly recurrence needs both dates
-- so completion cannot silently generate an undated successor.
-- A conflicting existing row aborts this migration; never invent its dates.
alter table public.organization_projects
  add constraint organization_projects_monthly_dates_check
  check (recurrence <> 'monthly' or (start_date is not null and end_date is not null));

-- Rollback: alter table public.organization_projects
--   drop constraint organization_projects_monthly_dates_check;
