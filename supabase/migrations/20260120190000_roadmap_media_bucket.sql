set check_function_bodies = off;

-- Private storage bucket for roadmap inline images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'roadmap-media', 'roadmap-media', false, 10485760, array['image/png','image/jpeg','image/webp','image/svg+xml']::text[]
where not exists (select 1 from storage.buckets where id = 'roadmap-media');

-- Policies for roadmap-media bucket (org-scoped access)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'roadmap_media_read_own'
  ) then
    execute 'create policy "roadmap_media_read_own" on storage.objects
      for select
      to authenticated
      using (
        bucket_id = ''roadmap-media''
        and (
          public.is_admin()
          or split_part(name, ''/'', 1) = auth.uid()::text
          or exists (
            select 1
            from public.organization_memberships om
            where om.org_id::text = split_part(name, ''/'', 1)
              and om.member_id = auth.uid()
              and om.role in (''admin'', ''staff'')
          )
        )
      )';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'roadmap_media_insert_own'
  ) then
    execute 'create policy "roadmap_media_insert_own" on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = ''roadmap-media''
        and (
          public.is_admin()
          or split_part(name, ''/'', 1) = auth.uid()::text
          or exists (
            select 1
            from public.organization_memberships om
            where om.org_id::text = split_part(name, ''/'', 1)
              and om.member_id = auth.uid()
              and om.role in (''admin'', ''staff'')
          )
        )
      )';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'roadmap_media_update_own'
  ) then
    execute 'create policy "roadmap_media_update_own" on storage.objects
      for update
      to authenticated
      using (
        bucket_id = ''roadmap-media''
        and (
          public.is_admin()
          or split_part(name, ''/'', 1) = auth.uid()::text
          or exists (
            select 1
            from public.organization_memberships om
            where om.org_id::text = split_part(name, ''/'', 1)
              and om.member_id = auth.uid()
              and om.role in (''admin'', ''staff'')
          )
        )
      )
      with check (
        bucket_id = ''roadmap-media''
        and (
          public.is_admin()
          or split_part(name, ''/'', 1) = auth.uid()::text
          or exists (
            select 1
            from public.organization_memberships om
            where om.org_id::text = split_part(name, ''/'', 1)
              and om.member_id = auth.uid()
              and om.role in (''admin'', ''staff'')
          )
        )
      )';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'roadmap_media_delete_own'
  ) then
    execute 'create policy "roadmap_media_delete_own" on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = ''roadmap-media''
        and (
          public.is_admin()
          or split_part(name, ''/'', 1) = auth.uid()::text
          or exists (
            select 1
            from public.organization_memberships om
            where om.org_id::text = split_part(name, ''/'', 1)
              and om.member_id = auth.uid()
              and om.role in (''admin'', ''staff'')
          )
        )
      )';
  end if;
end $$;
