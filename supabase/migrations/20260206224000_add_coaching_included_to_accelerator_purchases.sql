set check_function_bodies = off;
set search_path = public;

alter table if exists public.accelerator_purchases
  add column if not exists coaching_included boolean not null default true;

create index if not exists accelerator_purchases_user_id_status_coaching_idx
  on public.accelerator_purchases (user_id, status, coaching_included);
