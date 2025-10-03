set check_function_bodies = off;

-- Create public lms-resources bucket if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'lms-resources', 'lms-resources', true, 26214400, array[
  'application/pdf',
  'image/png','image/jpeg','image/webp','image/gif',
  'text/plain','text/csv',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]::text[]
where not exists (select 1 from storage.buckets where id = 'lms-resources');

-- Public read
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'lms_resources_public_read'
  ) then
    execute 'create policy "lms_resources_public_read" on storage.objects for select to anon, authenticated using (bucket_id = ''lms-resources'')';
  end if;
end $$;

-- Authenticated write to own folder
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'lms_resources_insert_own'
  ) then
    execute 'create policy "lms_resources_insert_own" on storage.objects for insert to authenticated with check (bucket_id = ''lms-resources'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'lms_resources_update_own'
  ) then
    execute 'create policy "lms_resources_update_own" on storage.objects for update to authenticated using (bucket_id = ''lms-resources'' and split_part(name, ''/'', 1) = auth.uid()::text) with check (bucket_id = ''lms-resources'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'lms_resources_delete_own'
  ) then
    execute 'create policy "lms_resources_delete_own" on storage.objects for delete to authenticated using (bucket_id = ''lms-resources'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

