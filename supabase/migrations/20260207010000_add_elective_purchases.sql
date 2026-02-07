set check_function_bodies = off;
set search_path = public;

create table if not exists elective_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  module_slug text not null,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint elective_purchases_status_check check (status in ('active', 'refunded')),
  constraint elective_purchases_module_slug_check check (
    module_slug in ('retention-and-security', 'due-diligence', 'financial-handbook')
  ),
  constraint elective_purchases_checkout_session_unique unique (stripe_checkout_session_id),
  constraint elective_purchases_payment_intent_unique unique (stripe_payment_intent_id),
  constraint elective_purchases_user_module_unique unique (user_id, module_slug)
);

create index if not exists elective_purchases_user_id_idx on elective_purchases (user_id);
create index if not exists elective_purchases_status_idx on elective_purchases (status);
create index if not exists elective_purchases_user_status_idx on elective_purchases (user_id, status);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_elective_purchases'
  ) then
    execute 'create trigger set_updated_at_elective_purchases before update on elective_purchases for each row execute procedure public.handle_updated_at()';
  end if;
end $$;

alter table elective_purchases enable row level security;
alter table elective_purchases force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'elective_purchases'
      and policyname = 'elective_purchases_select'
  ) then
    execute 'create policy "elective_purchases_select" on elective_purchases for select to authenticated using (public.is_admin() or user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'elective_purchases'
      and policyname = 'elective_purchases_insert'
  ) then
    execute 'create policy "elective_purchases_insert" on elective_purchases for insert to authenticated with check (public.is_admin())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'elective_purchases'
      and policyname = 'elective_purchases_update'
  ) then
    execute 'create policy "elective_purchases_update" on elective_purchases for update to authenticated using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'elective_purchases'
      and policyname = 'elective_purchases_delete'
  ) then
    execute 'create policy "elective_purchases_delete" on elective_purchases for delete to authenticated using (public.is_admin())';
  end if;
end $$;
