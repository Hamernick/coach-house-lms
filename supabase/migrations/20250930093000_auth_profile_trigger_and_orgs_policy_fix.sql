set check_function_bodies = off;
set search_path = public;

-- Ensure profiles has an email column (used by admin lists)
alter table profiles add column if not exists email text;

-- Auto-create/maintain profiles from auth.users
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(profiles.full_name, excluded.full_name),
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url);
  return new;
end;
$$;

create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_auth_user_created();

drop trigger if exists on_auth_user_email_change on auth.users;
create trigger on_auth_user_email_change
after update of email on auth.users
for each row execute procedure public.handle_auth_user_email_change();

-- Allow learners to insert/update their own organization rollup directly (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_self_insert'
  ) then
    execute 'create policy "organizations_self_insert" on organizations for insert with check (user_id = auth.uid())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_self_update'
  ) then
    execute 'create policy "organizations_self_update" on organizations for update using (user_id = auth.uid()) with check (user_id = auth.uid())';
  end if;
end $$;

-- Make the assignment→organization trigger function run with elevated rights
-- so it can call the secured rollup function without granting EXECUTE broadly.
create or replace function public.on_assignment_submission_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.apply_submission_to_organization(new.user_id, new.answers);
  return new;
end;
$$;
