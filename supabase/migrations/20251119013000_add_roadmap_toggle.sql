set check_function_bodies = off;
set search_path = public;

alter table organizations
  add column if not exists is_public_roadmap boolean not null default false;

comment on column organizations.is_public_roadmap is 'Controls visibility of the Strategic Roadmap public page';

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'organizations'
      and policyname = 'organizations_public_roadmap_read'
  ) then
    execute 'create policy "organizations_public_roadmap_read" on organizations for select to anon, authenticated using (is_public_roadmap and public_slug is not null)';
  end if;
end $$;
