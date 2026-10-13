-- Switch application to rely solely on is_published flags

-- Ensure publication flag columns exist
alter table if exists public.classes
  add column if not exists is_published boolean not null default false;

alter table if exists public.modules
  add column if not exists is_published boolean not null default false;

-- Backfill from legacy columns if present
update public.classes set is_published = coalesce(published, false);
update public.modules set is_published = coalesce(published, false);

-- Normalise defaults
alter table public.classes alter column is_published set default false;
alter table public.modules alter column is_published set default false;

-- Refresh policies to rely on is_published
drop policy if exists "classes_view_published" on public.classes;
create policy "classes_view_published" on public.classes
  for select using (is_published);

drop policy if exists "modules_view_published" on public.modules;
create policy "modules_view_published" on public.modules
  for select using (
    public.is_admin()
    or exists (
      select 1
      from public.enrollments e
      where e.class_id = public.modules.class_id
        and e.user_id = auth.uid()
    )
    or (
      public.modules.is_published
      and exists (
        select 1 from public.classes c
        where c.id = public.modules.class_id
          and c.is_published
      )
    )
  );

drop policy if exists "module_assignments_read_enrolled_or_published" on public.module_assignments;
create policy "module_assignments_read_enrolled_or_published" on public.module_assignments
  for select using (
    public.is_admin()
    or exists (
      select 1
      from public.modules m
      join public.classes c on c.id = m.class_id
      left join public.enrollments e on e.class_id = m.class_id and e.user_id = auth.uid()
      where m.id = module_assignments.module_id
        and (
          (m.is_published and c.is_published)
          or e.id is not null
        )
    )
  );

drop policy if exists "attachments_enrolled_read" on public.attachments;
create policy "attachments_enrolled_read" on public.attachments
  for select using (
    (scope_type = 'class' and exists (
      select 1 from public.classes c
      left join public.enrollments e on e.class_id = c.id and e.user_id = auth.uid()
      where c.id = attachments.scope_id and (c.is_published or e.id is not null)
    ))
    or (scope_type = 'module' and exists (
      select 1 from public.modules m
      join public.classes c on c.id = m.class_id
      left join public.enrollments e on e.class_id = c.id and e.user_id = auth.uid()
      where m.id = attachments.scope_id
        and (
          (m.is_published and c.is_published)
          or e.id is not null
        )
    ))
  );

drop policy if exists "read module content" on public.module_content;
create policy "read module content" on public.module_content
  for select using (
    exists (
      select 1
      from public.modules m
      join public.classes c on c.id = m.class_id
      left join public.enrollments e on e.class_id = c.id and e.user_id = auth.uid()
      where m.id = module_id
        and (
          public.is_admin()
          or e.id is not null
          or (m.is_published and c.is_published)
        )
    )
  );

-- Refresh helper RPC to honour new publication flag
create or replace function public.next_unlocked_module(p_user_id uuid)
returns uuid
language sql
set search_path = public
as $$
  with visible_modules as (
    select m.id, c.created_at, m.idx
    from public.modules m
    join public.classes c on c.id = m.class_id
    left join public.enrollments e on e.class_id = c.id and e.user_id = p_user_id
    where (m.is_published and c.is_published) or e.id is not null
  ),
  progress as (
    select module_id, status from public.module_progress where user_id = p_user_id
  )
  select vm.id
  from visible_modules vm
  left join progress p on p.module_id = vm.id
  where coalesce(p.status::text, 'not_started') <> 'completed'
  order by vm.created_at asc, vm.idx asc
  limit 1
$$;

-- Drop legacy columns now that policies/functions reference is_published
alter table public.modules drop column if exists published;
alter table public.classes drop column if exists published;
