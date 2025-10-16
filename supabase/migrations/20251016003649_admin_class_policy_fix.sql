-- Allow admins and enrolled users to read classes regardless of published state

DROP POLICY IF EXISTS "classes_view_published" ON public.classes;
CREATE POLICY "classes_read_access" ON public.classes
  FOR SELECT USING (
    public.is_admin()
    OR (
      is_published
      OR EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.class_id = public.classes.id
          AND e.user_id = auth.uid()
      )
    )
  );
