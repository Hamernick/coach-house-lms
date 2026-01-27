set check_function_bodies = off;
set search_path = public;

alter table notifications
  add column if not exists type text,
  add column if not exists org_id uuid references organizations(user_id) on delete cascade,
  add column if not exists actor_id uuid references auth.users on delete set null,
  add column if not exists metadata jsonb;

create index if not exists notifications_org_id_idx on notifications (org_id);
create index if not exists notifications_type_idx on notifications (type);
