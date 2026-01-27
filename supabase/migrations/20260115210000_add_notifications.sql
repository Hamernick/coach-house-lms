set check_function_bodies = off;
set search_path = public;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  description text not null,
  href text,
  tone text,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_updated_at_notifications'
  ) then
    create trigger set_updated_at_notifications
    before update on notifications
    for each row execute procedure public.handle_updated_at();
  end if;
end $$;

create index if not exists notifications_user_id_idx on notifications (user_id);
create index if not exists notifications_user_id_archived_at_idx on notifications (user_id, archived_at);
create index if not exists notifications_user_id_created_at_idx on notifications (user_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notifications_tone_check'
  ) then
    alter table notifications
      add constraint notifications_tone_check
      check (tone is null or tone in ('warning', 'info', 'success'));
  end if;
end $$;

alter table notifications enable row level security;
alter table notifications force row level security;

drop policy if exists "notifications_select" on public.notifications;
drop policy if exists "notifications_insert" on public.notifications;
drop policy if exists "notifications_update" on public.notifications;
drop policy if exists "notifications_delete" on public.notifications;

create policy "notifications_select" on public.notifications
  for select
  to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
  );

create policy "notifications_insert" on public.notifications
  for insert
  to authenticated
  with check (
    public.is_admin()
    or user_id = (select auth.uid())
  );

create policy "notifications_update" on public.notifications
  for update
  to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
  )
  with check (
    public.is_admin()
    or user_id = (select auth.uid())
  );

create policy "notifications_delete" on public.notifications
  for delete
  to authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
  );

