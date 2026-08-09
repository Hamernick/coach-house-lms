set check_function_bodies = off;
set search_path = public;

alter table public.organization_finance_records
  add column if not exists program_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_finance_records_program_id_fkey'
      and conrelid = 'public.organization_finance_records'::regclass
  ) then
    alter table public.organization_finance_records
      add constraint organization_finance_records_program_id_fkey
      foreign key (program_id)
      references public.programs (id)
      on delete set null;
  end if;
end $$;

create index if not exists organization_finance_records_program_org_effective_idx
  on public.organization_finance_records (
    program_id,
    org_id,
    effective_at desc,
    id desc
  )
  where program_id is not null;

create or replace function public.validate_finance_record_program_org()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.program_id is not null and not exists (
    select 1
    from public.programs program
    where program.id = new.program_id
      and program.user_id = new.org_id
  ) then
    raise foreign_key_violation using
      message = 'Finance record program must belong to its organization',
      constraint = 'organization_finance_records_program_org_check';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_finance_record_program_org() from public;

drop trigger if exists validate_finance_record_program_org
  on public.organization_finance_records;

create trigger validate_finance_record_program_org
  before insert or update of program_id, org_id
  on public.organization_finance_records
  for each row execute function public.validate_finance_record_program_org();
