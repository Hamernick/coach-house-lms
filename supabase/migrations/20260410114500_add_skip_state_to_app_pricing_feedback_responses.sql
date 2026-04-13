set check_function_bodies = off;
set search_path = public;

alter table if exists app_pricing_feedback_responses
  add column if not exists response_kind text;

update app_pricing_feedback_responses
set response_kind = 'answered'
where response_kind is null;

alter table if exists app_pricing_feedback_responses
  alter column would_pay drop not null;

alter table if exists app_pricing_feedback_responses
  alter column response_kind set default 'answered';

alter table if exists app_pricing_feedback_responses
  alter column response_kind set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_pricing_feedback_responses_response_kind_check'
  ) then
    alter table app_pricing_feedback_responses
      add constraint app_pricing_feedback_responses_response_kind_check
      check (response_kind in ('answered', 'skipped'));
  end if;
end $$;
