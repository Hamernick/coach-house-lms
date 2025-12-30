-- Private storage bucket for org documents (e.g., 501(c)(3) verification letters)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'org-documents', 'org-documents', false, 15728640, array['application/pdf']
where not exists (select 1 from storage.buckets where id = 'org-documents');

-- Policies: only authenticated users can read/write their own folder
DO $$
begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'org_documents_read_own') then
    execute 'create policy "org_documents_read_own" on storage.objects for select to authenticated using (bucket_id = ''org-documents'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;

  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'org_documents_insert_own') then
    execute 'create policy "org_documents_insert_own" on storage.objects for insert to authenticated with check (bucket_id = ''org-documents'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;

  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'org_documents_update_own') then
    execute 'create policy "org_documents_update_own" on storage.objects for update to authenticated using (bucket_id = ''org-documents'' and split_part(name, ''/'', 1) = auth.uid()::text) with check (bucket_id = ''org-documents'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;

  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'org_documents_delete_own') then
    execute 'create policy "org_documents_delete_own" on storage.objects for delete to authenticated using (bucket_id = ''org-documents'' and split_part(name, ''/'', 1) = auth.uid()::text)';
  end if;
end $$;
