set check_function_bodies = off;
set search_path = public;

-- Supabase linter: multiple_permissive_policies
-- Consolidate RLS policies so each role/action evaluates a single permissive policy.
-- Also ensure all auth.* usage follows the initplan pattern `(select auth.*())`.

-- profiles
drop policy if exists "profiles_self_manage" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_self_insert" on public.profiles;
drop policy if exists "profiles_admin_manage" on public.profiles;

create policy "profiles_select" on public.profiles
  for select
  to authenticated
  using (public.is_admin() or id = (select auth.uid()));

create policy "profiles_insert" on public.profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()) and role = 'member');

create policy "profiles_update" on public.profiles
  for update
  to authenticated
  using (public.is_admin() or id = (select auth.uid()))
  with check (
    public.is_admin()
    or (
      id = (select auth.uid())
      and role = (select role from public.profiles where id = (select auth.uid()))
    )
  );

create policy "profiles_delete" on public.profiles
  for delete
  to authenticated
  using (public.is_admin());

-- classes
drop policy if exists "classes_view_published" on public.classes;
drop policy if exists "classes_view_enrolled" on public.classes;
drop policy if exists "classes_read_access" on public.classes;
drop policy if exists "classes_admin_manage" on public.classes;
drop policy if exists "read published classes" on public.classes;
drop policy if exists "admins manage classes" on public.classes;

create policy "classes_select" on public.classes
  for select
  to authenticated
  using (
    public.is_admin()
    or is_published
    or exists (
      select 1
      from public.enrollments e
      where e.class_id = public.classes.id
        and e.user_id = (select auth.uid())
    )
  );

create policy "classes_insert" on public.classes
  for insert
  to authenticated
  with check (public.is_admin());

create policy "classes_update" on public.classes
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "classes_delete" on public.classes
  for delete
  to authenticated
  using (public.is_admin());

-- modules
drop policy if exists "modules_view_published" on public.modules;
drop policy if exists "modules_admin_manage" on public.modules;
drop policy if exists "read published modules" on public.modules;
drop policy if exists "admins manage modules" on public.modules;

create policy "modules_select" on public.modules
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.classes c
      where c.id = public.modules.class_id
        and c.is_published
        and public.modules.is_published
    )
    or exists (
      select 1
      from public.enrollments e
      where e.class_id = public.modules.class_id
        and e.user_id = (select auth.uid())
    )
  );

create policy "modules_insert" on public.modules
  for insert
  to authenticated
  with check (public.is_admin());

create policy "modules_update" on public.modules
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "modules_delete" on public.modules
  for delete
  to authenticated
  using (public.is_admin());

-- module_content
drop policy if exists "read module content" on public.module_content;
drop policy if exists "admins manage content" on public.module_content;

create policy "module_content_select" on public.module_content
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.modules m
      join public.classes c on c.id = m.class_id
      left join public.enrollments e on e.class_id = c.id and e.user_id = (select auth.uid())
      where m.id = public.module_content.module_id
        and (
          public.is_admin()
          or e.id is not null
          or (m.is_published and c.is_published)
        )
    )
  );

create policy "module_content_insert" on public.module_content
  for insert
  to authenticated
  with check (public.is_admin());

create policy "module_content_update" on public.module_content
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "module_content_delete" on public.module_content
  for delete
  to authenticated
  using (public.is_admin());

-- enrollments
drop policy if exists "enrollments_self_read" on public.enrollments;
drop policy if exists "enrollments_self_insert" on public.enrollments;
drop policy if exists "enrollments_admin_manage" on public.enrollments;

create policy "enrollments_select" on public.enrollments
  for select
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

create policy "enrollments_insert" on public.enrollments
  for insert
  to authenticated
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "enrollments_update" on public.enrollments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "enrollments_delete" on public.enrollments
  for delete
  to authenticated
  using (public.is_admin());

-- module_progress
drop policy if exists "progress_self_access" on public.module_progress;
drop policy if exists "progress_self_upsert" on public.module_progress;
drop policy if exists "progress_self_update" on public.module_progress;
drop policy if exists "progress_admin_manage" on public.module_progress;

create policy "module_progress_select" on public.module_progress
  for select
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

create policy "module_progress_insert" on public.module_progress
  for insert
  to authenticated
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "module_progress_update" on public.module_progress
  for update
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()))
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "module_progress_delete" on public.module_progress
  for delete
  to authenticated
  using (public.is_admin());

-- subscriptions
drop policy if exists "subscriptions_self_read" on public.subscriptions;
drop policy if exists "subscriptions_admin_manage" on public.subscriptions;

create policy "subscriptions_select" on public.subscriptions
  for select
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

-- module_assignments
drop policy if exists "module_assignments_read_enrolled_or_published" on public.module_assignments;
drop policy if exists "module_assignments_admin_manage" on public.module_assignments;

create policy "module_assignments_select" on public.module_assignments
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.modules m
      join public.classes c on c.id = m.class_id
      left join public.enrollments e on e.class_id = m.class_id and e.user_id = (select auth.uid())
      where m.id = public.module_assignments.module_id
        and (c.is_published or e.id is not null)
    )
  );

create policy "module_assignments_insert" on public.module_assignments
  for insert
  to authenticated
  with check (public.is_admin());

create policy "module_assignments_update" on public.module_assignments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "module_assignments_delete" on public.module_assignments
  for delete
  to authenticated
  using (public.is_admin());

-- assignment_submissions
drop policy if exists "submissions_self_read" on public.assignment_submissions;
drop policy if exists "submissions_self_insert" on public.assignment_submissions;
drop policy if exists "submissions_self_update" on public.assignment_submissions;
drop policy if exists "submissions_admin_manage" on public.assignment_submissions;

create policy "assignment_submissions_select" on public.assignment_submissions
  for select
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

create policy "assignment_submissions_insert" on public.assignment_submissions
  for insert
  to authenticated
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "assignment_submissions_update" on public.assignment_submissions
  for update
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()))
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "assignment_submissions_delete" on public.assignment_submissions
  for delete
  to authenticated
  using (public.is_admin());

-- attachments
drop policy if exists "attachments_admin_manage" on public.attachments;
drop policy if exists "attachments_self_submission_read" on public.attachments;
drop policy if exists "attachments_enrolled_read" on public.attachments;

create policy "attachments_select" on public.attachments
  for select
  to authenticated
  using (
    public.is_admin()
    or (
      scope_type = 'submission'
      and exists (
        select 1
        from public.assignment_submissions s
        where s.id = public.attachments.scope_id
          and s.user_id = (select auth.uid())
      )
    )
    or (
      scope_type = 'class'
      and exists (
        select 1
        from public.classes c
        left join public.enrollments e on e.class_id = c.id and e.user_id = (select auth.uid())
        where c.id = public.attachments.scope_id
          and (c.is_published or e.id is not null)
      )
    )
    or (
      scope_type = 'module'
      and exists (
        select 1
        from public.modules m
        join public.classes c on c.id = m.class_id
        left join public.enrollments e on e.class_id = c.id and e.user_id = (select auth.uid())
        where m.id = public.attachments.scope_id
          and (
            (m.is_published and c.is_published)
            or e.id is not null
          )
      )
    )
  );

create policy "attachments_insert" on public.attachments
  for insert
  to authenticated
  with check (public.is_admin());

create policy "attachments_update" on public.attachments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "attachments_delete" on public.attachments
  for delete
  to authenticated
  using (public.is_admin());

-- organizations
drop policy if exists "organizations_self_read" on public.organizations;
drop policy if exists "organizations_self_insert" on public.organizations;
drop policy if exists "organizations_self_update" on public.organizations;
drop policy if exists "organizations_admin_manage" on public.organizations;
drop policy if exists "organizations_public_read" on public.organizations;
drop policy if exists "organizations_public_roadmap_read" on public.organizations;

create policy "organizations_select" on public.organizations
  for select
  to anon, authenticated
  using (
    public.is_admin()
    or user_id = (select auth.uid())
    or (is_public and public_slug is not null)
    or (is_public_roadmap and public_slug is not null)
  );

create policy "organizations_insert" on public.organizations
  for insert
  to authenticated
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "organizations_update" on public.organizations
  for update
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()))
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "organizations_delete" on public.organizations
  for delete
  to authenticated
  using (public.is_admin());

-- programs
drop policy if exists "programs_public_read" on public.programs;
drop policy if exists "programs_self_read" on public.programs;
drop policy if exists "programs_self_insert" on public.programs;
drop policy if exists "programs_self_update" on public.programs;
drop policy if exists "programs_admin_manage" on public.programs;

create policy "programs_select" on public.programs
  for select
  to anon, authenticated
  using (public.is_admin() or user_id = (select auth.uid()) or is_public);

create policy "programs_insert" on public.programs
  for insert
  to authenticated
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "programs_update" on public.programs
  for update
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()))
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "programs_delete" on public.programs
  for delete
  to authenticated
  using (public.is_admin());

-- onboarding_responses
drop policy if exists "onboarding_responses_self_select" on public.onboarding_responses;
drop policy if exists "onboarding_responses_self_insert" on public.onboarding_responses;
drop policy if exists "onboarding_responses_self_update" on public.onboarding_responses;
drop policy if exists "onboarding_responses_admin_manage" on public.onboarding_responses;

create policy "onboarding_responses_select" on public.onboarding_responses
  for select
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

create policy "onboarding_responses_insert" on public.onboarding_responses
  for insert
  to authenticated
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "onboarding_responses_update" on public.onboarding_responses
  for update
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()))
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "onboarding_responses_delete" on public.onboarding_responses
  for delete
  to authenticated
  using (public.is_admin());

-- roadmap_events
drop policy if exists "roadmap_events_owner_select" on public.roadmap_events;
drop policy if exists "roadmap_events_owner_insert" on public.roadmap_events;
drop policy if exists "roadmap_events_admin_manage" on public.roadmap_events;

create policy "roadmap_events_select" on public.roadmap_events
  for select
  to authenticated
  using (public.is_admin() or org_id = (select auth.uid()));

create policy "roadmap_events_insert" on public.roadmap_events
  for insert
  to authenticated
  with check (public.is_admin() or org_id = (select auth.uid()));

create policy "roadmap_events_delete" on public.roadmap_events
  for delete
  to authenticated
  using (public.is_admin());

-- schedule_events
drop policy if exists "schedule_events_public_or_enrolled_select" on public.schedule_events;
drop policy if exists "schedule_events_admin_manage" on public.schedule_events;

create policy "schedule_events_select" on public.schedule_events
  for select
  to anon, authenticated
  using (
    is_public
    or public.is_admin()
    or (
      class_id is not null
      and exists (
        select 1
        from public.enrollments e
        where e.class_id = public.schedule_events.class_id
          and e.user_id = (select auth.uid())
      )
    )
  );

create policy "schedule_events_insert" on public.schedule_events
  for insert
  to authenticated
  with check (public.is_admin());

create policy "schedule_events_update" on public.schedule_events
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "schedule_events_delete" on public.schedule_events
  for delete
  to authenticated
  using (public.is_admin());

-- search_events
drop policy if exists "search_events_self_insert" on public.search_events;
drop policy if exists "search_events_admin_read" on public.search_events;
drop policy if exists "search_events_admin_manage" on public.search_events;

create policy "search_events_insert" on public.search_events
  for insert
  to authenticated
  with check (public.is_admin() or user_id = (select auth.uid()));

create policy "search_events_select" on public.search_events
  for select
  to authenticated
  using (public.is_admin());

create policy "search_events_delete" on public.search_events
  for delete
  to authenticated
  using (public.is_admin());

-- accelerator_purchases
drop policy if exists "accelerator_purchases_self_read" on public.accelerator_purchases;
drop policy if exists "accelerator_purchases_admin_manage" on public.accelerator_purchases;

create policy "accelerator_purchases_select" on public.accelerator_purchases
  for select
  to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));

create policy "accelerator_purchases_insert" on public.accelerator_purchases
  for insert
  to authenticated
  with check (public.is_admin());

create policy "accelerator_purchases_update" on public.accelerator_purchases
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "accelerator_purchases_delete" on public.accelerator_purchases
  for delete
  to authenticated
  using (public.is_admin());
