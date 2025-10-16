set check_function_bodies = off;
set search_path = public;

-- Restrict next_unlocked_module to enrolled classes only
create or replace function public.next_unlocked_module(p_user_id uuid)
returns uuid
language sql
set search_path = public
as $$
  with enrolled_classes as (
    select class_id from enrollments where user_id = p_user_id
  ),
  visible_modules as (
    select m.id, c.created_at, m.idx
    from modules m
    join classes c on c.id = m.class_id
    join enrolled_classes ec on ec.class_id = c.id
    where c.is_published = true
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
