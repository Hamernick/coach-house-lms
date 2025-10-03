set check_function_bodies = off;

-- Create public org-media bucket if not exists
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'org-media', 'org-media', true, 10485760, array['image/png','image/jpeg','image/webp']::text[]
where not exists (select 1 from storage.buckets where id = 'org-media');

-- Policies for org-media bucket
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'org_media_public_read'
  ) then
    execute 'create policy "org_media_public_read" on storage.objects for select to anon, authenticated using (bucket_id = ''org-media'')';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'org_media_insert_own'
  ) then
    execute 'create policy "org_media_insert_own" on storage.objects for insert to authenticated with check (bucket_id = ''org-media'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'org_media_update_own'
  ) then
    execute 'create policy "org_media_update_own" on storage.objects for update to authenticated using (bucket_id = ''org-media'' and split_part(name, ''/'', 1) = auth.uid()::text) with check (bucket_id = ''org-media'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'org_media_delete_own'
  ) then
    execute 'create policy "org_media_delete_own" on storage.objects for delete to authenticated using (bucket_id = ''org-media'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;

