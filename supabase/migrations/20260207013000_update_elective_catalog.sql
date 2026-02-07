set check_function_bodies = off;
set search_path = public;

-- Formerly-elective modules are now part of free Formation.
delete from public.elective_purchases
where module_slug in ('nfp-registration', 'filing-1023');

alter table if exists public.elective_purchases
  drop constraint if exists elective_purchases_module_slug_check;

alter table if exists public.elective_purchases
  add constraint elective_purchases_module_slug_check check (
    module_slug in ('retention-and-security', 'due-diligence', 'financial-handbook')
  );
