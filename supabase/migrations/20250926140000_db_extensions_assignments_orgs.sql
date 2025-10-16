set check_function_bodies = off;
set search_path = public;

-- Enums
create type organization_status as enum ('pending', 'approved', 'n/a');
create type submission_status as enum ('submitted', 'accepted', 'revise');
create type attachment_scope_type as enum ('class', 'module', 'submission');
create type attachment_kind as enum ('deck', 'resource', 'submission');

-- Organizations: per-learner org profile rollup
create table organizations (
  user_id uuid primary key references auth.users on delete cascade,
  ein text,
  status organization_status not null default 'pending',
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Module assignments: JSON schema + completion behavior
create table module_assignments (
  module_id uuid primary key references modules on delete cascade,
  schema jsonb not null default '{}'::jsonb,
  complete_on_submit boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Assignment submissions: one per user per module
create table assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  status submission_status not null default 'submitted',
  feedback text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (module_id, user_id)
);
create index assignment_submissions_user_id_idx on assignment_submissions (user_id);
create index assignment_submissions_module_id_idx on assignment_submissions (module_id);

-- Attachments metadata for storage references
create table attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users on delete set null,
  scope_type attachment_scope_type not null,
  scope_id uuid not null,
  kind attachment_kind not null,
  storage_path text not null,
  mime text,
  size integer,
  meta jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index attachments_scope_idx on attachments (scope_type, scope_id);
create index attachments_owner_idx on attachments (owner_id);

-- Enrollment invites
create table enrollment_invites (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes on delete cascade,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  invited_by uuid references auth.users on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index enrollment_invites_class_idx on enrollment_invites (class_id);
create index enrollment_invites_email_idx on enrollment_invites (email);

-- Updated at triggers
create trigger set_updated_at_organizations
before update on organizations
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_module_assignments
before update on module_assignments
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_assignment_submissions
before update on assignment_submissions
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_attachments
before update on attachments
for each row execute procedure public.handle_updated_at();

create trigger set_updated_at_enrollment_invites
before update on enrollment_invites
for each row execute procedure public.handle_updated_at();

-- RLS enable/force
alter table organizations enable row level security; alter table organizations force row level security;
alter table module_assignments enable row level security; alter table module_assignments force row level security;
alter table assignment_submissions enable row level security; alter table assignment_submissions force row level security;
alter table attachments enable row level security; alter table attachments force row level security;
alter table enrollment_invites enable row level security; alter table enrollment_invites force row level security;

-- RLS policies
-- Organizations: learners read own; admins manage
create policy "organizations_self_read" on organizations
  for select using (user_id = auth.uid());

create policy "organizations_admin_manage" on organizations
  using (public.is_admin()) with check (public.is_admin());

-- Module assignments: readable to enrolled learners and published classes; admins manage
create policy "module_assignments_read_enrolled_or_published" on module_assignments
  for select using (
    public.is_admin()
    or exists (
      select 1 from modules m
      join classes c on c.id = m.class_id
      left join enrollments e on e.class_id = m.class_id and e.user_id = auth.uid()
      where m.id = module_assignments.module_id and (c.is_published or e.id is not null)
    )
  );

create policy "module_assignments_admin_manage" on module_assignments
  using (public.is_admin()) with check (public.is_admin());

-- Assignment submissions: learners RW own; admins manage
create policy "submissions_self_read" on assignment_submissions
  for select using (user_id = auth.uid());

create policy "submissions_self_insert" on assignment_submissions
  for insert with check (user_id = auth.uid());

create policy "submissions_self_update" on assignment_submissions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "submissions_admin_manage" on assignment_submissions
  using (public.is_admin()) with check (public.is_admin());

-- Attachments: admin manage; learners read when:
--  - submission attachments they own
--  - class/module attachments for published or enrolled classes
create policy "attachments_admin_manage" on attachments
  using (public.is_admin()) with check (public.is_admin());

create policy "attachments_self_submission_read" on attachments
  for select using (
    scope_type = 'submission'
    and exists (
      select 1 from assignment_submissions s
      where s.id = attachments.scope_id and s.user_id = auth.uid()
    )
  );

create policy "attachments_enrolled_read" on attachments
  for select using (
    (scope_type = 'class' and exists (
      select 1 from classes c
      left join enrollments e on e.class_id = c.id and e.user_id = auth.uid()
      where c.id = attachments.scope_id and (c.is_published or e.id is not null)
    ))
    or (scope_type = 'module' and exists (
      select 1 from modules m
      join classes c on c.id = m.class_id
      left join enrollments e on e.class_id = c.id and e.user_id = auth.uid()
      where m.id = attachments.scope_id and (c.is_published or e.id is not null)
    ))
  );

-- Enrollment invites: admin-only management
create policy "invites_admin_manage" on enrollment_invites
  using (public.is_admin()) with check (public.is_admin());

-- Trigger helpers to roll up organization profile
create or replace function public.apply_submission_to_organization(p_user_id uuid, p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into organizations (user_id, profile, status)
  values (p_user_id, coalesce(p_answers, '{}'::jsonb), 'pending')
  on conflict (user_id)
  do update set
    profile = coalesce(organizations.profile, '{}'::jsonb) || coalesce(excluded.profile, '{}'::jsonb),
    updated_at = timezone('utc', now());
end;
$$;

revoke all on function public.apply_submission_to_organization(uuid, jsonb) from public;
revoke execute on function public.apply_submission_to_organization(uuid, jsonb) from authenticated;

create or replace function public.on_assignment_submission_change()
returns trigger
language plpgsql
as $$
begin
  perform public.apply_submission_to_organization(new.user_id, new.answers);
  return new;
end;
$$;

create trigger assignment_submissions_after_change
after insert or update on assignment_submissions
for each row execute procedure public.on_assignment_submission_change();

-- RPCs
create or replace function public.next_unlocked_module(p_user_id uuid)
returns uuid
language sql
set search_path = public
as $$
  with visible_modules as (
    select m.id, c.created_at, m.idx
    from modules m
    join classes c on c.id = m.class_id
    left join enrollments e on e.class_id = c.id and e.user_id = p_user_id
    where c.is_published or e.id is not null
  ),
  progress as (
    select module_id, status from module_progress where user_id = p_user_id
  )
  select vm.id
  from visible_modules vm
  left join progress p on p.module_id = vm.id
  where coalesce(p.status::text, 'not_started') <> 'completed'
  order by vm.created_at asc, vm.idx asc
  limit 1
$$;

revoke all on function public.next_unlocked_module(uuid) from public;
grant execute on function public.next_unlocked_module(uuid) to authenticated;

create or replace function public.progress_for_class(p_user_id uuid, p_class_id uuid)
returns table(total integer, completed integer)
language sql
set search_path = public
as $$
  with ms as (
    select id from modules where class_id = p_class_id
  ),
  cmp as (
    select count(*)::int as completed
    from module_progress mp
    join ms on ms.id = mp.module_id
    where mp.user_id = p_user_id and mp.status = 'completed'
  )
  select (select count(*)::int from ms) as total,
         coalesce((select completed from cmp), 0) as completed;
$$;

revoke all on function public.progress_for_class(uuid, uuid) from public;
grant execute on function public.progress_for_class(uuid, uuid) to authenticated;

-- Storage buckets: private, signed URLs only
-- Create if not exists (idempotent); ignore error if already exists
do $$ begin
  perform 1 from storage.buckets where id = 'decks';
  if not found then
    perform storage.create_bucket('decks', false, null, 15728640, array['application/pdf']);
  end if;
exception when others then null; end $$;

do $$ begin
  perform 1 from storage.buckets where id = 'resources';
  if not found then
    perform storage.create_bucket('resources', false);
  end if;
exception when others then null; end $$;

do $$ begin
  perform 1 from storage.buckets where id = 'submissions';
  if not found then
    perform storage.create_bucket('submissions', false);
  end if;
exception when others then null; end $$;
