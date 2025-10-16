-- Allow admins to read draft classes

drop policy if exists "classes_view_published" on public.classes;
create policy "classes_view_published" on public.classes
  for select using (
    is_published
    or public.is_admin()
  );
