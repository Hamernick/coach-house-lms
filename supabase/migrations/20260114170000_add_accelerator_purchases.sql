set check_function_bodies = off;
set search_path = public;

create table if not exists accelerator_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint accelerator_purchases_status_check check (status in ('active', 'refunded')),
  constraint accelerator_purchases_checkout_session_unique unique (stripe_checkout_session_id),
  constraint accelerator_purchases_payment_intent_unique unique (stripe_payment_intent_id)
);

create index if not exists accelerator_purchases_user_id_idx on accelerator_purchases (user_id);
create index if not exists accelerator_purchases_created_at_idx on accelerator_purchases (created_at);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at_accelerator_purchases'
  ) then
    execute 'create trigger set_updated_at_accelerator_purchases before update on accelerator_purchases for each row execute procedure public.handle_updated_at()';
  end if;
end $$;

alter table accelerator_purchases enable row level security;
alter table accelerator_purchases force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'accelerator_purchases'
      and policyname = 'accelerator_purchases_self_read'
  ) then
    execute 'create policy "accelerator_purchases_self_read" on accelerator_purchases for select using (user_id = auth.uid())';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'accelerator_purchases'
      and policyname = 'accelerator_purchases_admin_manage'
  ) then
    execute 'create policy "accelerator_purchases_admin_manage" on accelerator_purchases for all using (public.is_admin()) with check (public.is_admin())';
  end if;
end $$;

