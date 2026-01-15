set check_function_bodies = off;
set search_path = public;

-- Supabase linter: auth_rls_initplan
-- Wrap auth.* calls in `(select auth.*())` to avoid per-row re-evaluation in RLS policies.

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_manage'
  ) then
    execute 'alter policy "profiles_self_manage" on public.profiles '
         || 'using ((select auth.uid()) = id)';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_insert'
  ) then
    execute 'alter policy "profiles_self_insert" on public.profiles '
         || 'with check ((select auth.uid()) = id and role = ''member'')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_self_update'
  ) then
    execute 'alter policy "profiles_self_update" on public.profiles '
         || 'using ((select auth.uid()) = id) '
         || 'with check ('
         || '  (select auth.uid()) = id'
         || '  and role = (select role from public.profiles where id = (select auth.uid()))'
         || ')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'classes' and policyname = 'classes_view_enrolled'
  ) then
    execute 'alter policy "classes_view_enrolled" on public.classes '
         || 'using (exists ('
         || '  select 1 from public.enrollments e'
         || '  where e.class_id = public.classes.id'
         || '    and e.user_id = (select auth.uid())'
         || '))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'classes' and policyname = 'classes_read_access'
  ) then
    execute 'alter policy "classes_read_access" on public.classes '
         || 'using ('
         || '  public.is_admin()'
         || '  or ('
         || '    is_published'
         || '    or exists ('
         || '      select 1 from public.enrollments e'
         || '      where e.class_id = public.classes.id'
         || '        and e.user_id = (select auth.uid())'
         || '    )'
         || '  )'
         || ')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'enrollments' and policyname = 'enrollments_self_read'
  ) then
    execute 'alter policy "enrollments_self_read" on public.enrollments '
         || 'using (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'enrollments' and policyname = 'enrollments_self_insert'
  ) then
    execute 'alter policy "enrollments_self_insert" on public.enrollments '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'module_progress' and policyname = 'progress_self_access'
  ) then
    execute 'alter policy "progress_self_access" on public.module_progress '
         || 'using (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'module_progress' and policyname = 'progress_self_upsert'
  ) then
    execute 'alter policy "progress_self_upsert" on public.module_progress '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'module_progress' and policyname = 'progress_self_update'
  ) then
    execute 'alter policy "progress_self_update" on public.module_progress '
         || 'using (user_id = (select auth.uid())) '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'subscriptions' and policyname = 'subscriptions_self_read'
  ) then
    execute 'alter policy "subscriptions_self_read" on public.subscriptions '
         || 'using (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'schedule_events' and policyname = 'schedule_events_public_or_enrolled_select'
  ) then
    execute 'alter policy "schedule_events_public_or_enrolled_select" on public.schedule_events '
         || 'using ('
         || '  is_public'
         || '  or ('
         || '    class_id is not null and exists ('
         || '      select 1 from public.enrollments e'
         || '      where e.class_id = public.schedule_events.class_id'
         || '        and e.user_id = (select auth.uid())'
         || '    )'
         || '  )'
         || '  or public.is_admin()'
         || ')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_self_read'
  ) then
    execute 'alter policy "organizations_self_read" on public.organizations '
         || 'using (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_self_insert'
  ) then
    execute 'alter policy "organizations_self_insert" on public.organizations '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'organizations' and policyname = 'organizations_self_update'
  ) then
    execute 'alter policy "organizations_self_update" on public.organizations '
         || 'using (user_id = (select auth.uid())) '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'assignment_submissions' and policyname = 'submissions_self_read'
  ) then
    execute 'alter policy "submissions_self_read" on public.assignment_submissions '
         || 'using (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'assignment_submissions' and policyname = 'submissions_self_insert'
  ) then
    execute 'alter policy "submissions_self_insert" on public.assignment_submissions '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'assignment_submissions' and policyname = 'submissions_self_update'
  ) then
    execute 'alter policy "submissions_self_update" on public.assignment_submissions '
         || 'using (user_id = (select auth.uid())) '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'attachments' and policyname = 'attachments_self_submission_read'
  ) then
    execute 'alter policy "attachments_self_submission_read" on public.attachments '
         || 'using ('
         || '  scope_type = ''submission'''
         || '  and exists ('
         || '    select 1 from public.assignment_submissions s'
         || '    where s.id = public.attachments.scope_id'
         || '      and s.user_id = (select auth.uid())'
         || '  )'
         || ')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'attachments' and policyname = 'attachments_enrolled_read'
  ) then
    execute 'alter policy "attachments_enrolled_read" on public.attachments '
         || 'using ('
         || '  (scope_type = ''class'' and exists ('
         || '    select 1 from public.classes c'
         || '    left join public.enrollments e on e.class_id = c.id and e.user_id = (select auth.uid())'
         || '    where c.id = public.attachments.scope_id and (c.is_published or e.id is not null)'
         || '  ))'
         || '  or (scope_type = ''module'' and exists ('
         || '    select 1 from public.modules m'
         || '    join public.classes c on c.id = m.class_id'
         || '    left join public.enrollments e on e.class_id = c.id and e.user_id = (select auth.uid())'
         || '    where m.id = public.attachments.scope_id'
         || '      and ('
         || '        (m.is_published and c.is_published)'
         || '        or e.id is not null'
         || '      )'
         || '  ))'
         || ')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'modules' and policyname = 'modules_view_published'
  ) then
    execute 'alter policy "modules_view_published" on public.modules '
         || 'using ('
         || '  public.is_admin()'
         || '  or exists ('
         || '    select 1 from public.classes c'
         || '    where c.id = public.modules.class_id'
         || '      and c.is_published'
         || '      and public.modules.is_published'
         || '  )'
         || '  or exists ('
         || '    select 1 from public.enrollments e'
         || '    where e.class_id = public.modules.class_id'
         || '      and e.user_id = (select auth.uid())'
         || '  )'
         || ')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'module_assignments' and policyname = 'module_assignments_read_enrolled_or_published'
  ) then
    execute 'alter policy "module_assignments_read_enrolled_or_published" on public.module_assignments '
         || 'using ('
         || '  public.is_admin()'
         || '  or exists ('
         || '    select 1 from public.modules m'
         || '    join public.classes c on c.id = m.class_id'
         || '    left join public.enrollments e on e.class_id = m.class_id and e.user_id = (select auth.uid())'
         || '    where m.id = public.module_assignments.module_id'
         || '      and (c.is_published or e.id is not null)'
         || '  )'
         || ')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'module_content' and policyname = 'read module content'
  ) then
    execute 'alter policy "read module content" on public.module_content '
         || 'using ('
         || '  exists ('
         || '    select 1'
         || '    from public.modules m'
         || '    join public.classes c on c.id = m.class_id'
         || '    left join public.enrollments e on e.class_id = c.id and e.user_id = (select auth.uid())'
         || '    where m.id = public.module_content.module_id'
         || '      and ('
         || '        public.is_admin()'
         || '        or e.id is not null'
         || '        or (m.is_published and c.is_published)'
         || '      )'
         || '  )'
         || ')';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_self_read'
  ) then
    execute 'alter policy "programs_self_read" on public.programs '
         || 'using (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_self_insert'
  ) then
    execute 'alter policy "programs_self_insert" on public.programs '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'programs' and policyname = 'programs_self_update'
  ) then
    execute 'alter policy "programs_self_update" on public.programs '
         || 'using (user_id = (select auth.uid())) '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'onboarding_responses' and policyname = 'onboarding_responses_self_select'
  ) then
    execute 'alter policy "onboarding_responses_self_select" on public.onboarding_responses '
         || 'using (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'onboarding_responses' and policyname = 'onboarding_responses_self_insert'
  ) then
    execute 'alter policy "onboarding_responses_self_insert" on public.onboarding_responses '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'onboarding_responses' and policyname = 'onboarding_responses_self_update'
  ) then
    execute 'alter policy "onboarding_responses_self_update" on public.onboarding_responses '
         || 'using (user_id = (select auth.uid())) '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'roadmap_events' and policyname = 'roadmap_events_owner_select'
  ) then
    execute 'alter policy "roadmap_events_owner_select" on public.roadmap_events '
         || 'using (org_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'roadmap_events' and policyname = 'roadmap_events_owner_insert'
  ) then
    execute 'alter policy "roadmap_events_owner_insert" on public.roadmap_events '
         || 'with check (org_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'search_events' and policyname = 'search_events_self_insert'
  ) then
    execute 'alter policy "search_events_self_insert" on public.search_events '
         || 'with check (user_id = (select auth.uid()))';
  end if;
end $$;

do $$ begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'accelerator_purchases' and policyname = 'accelerator_purchases_self_read'
  ) then
    execute 'alter policy "accelerator_purchases_self_read" on public.accelerator_purchases '
         || 'using (user_id = (select auth.uid()))';
  end if;
end $$;
