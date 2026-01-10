set search_path = public;

do $$
declare
  target_module_id uuid;
begin
  select m.id
  into target_module_id
  from modules m
  where m.slug = 'multi-year-budgeting'
     or lower(m.title) = 'multi-year budgeting'
  limit 1;

  if target_module_id is null then
    raise notice 'Multi-year Budgeting module not found; skipping video update.';
    return;
  end if;

  insert into module_content (module_id, video_url)
  values (
    target_module_id,
    'https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/accelerator-videos/S5%20M3%20Budgets%20(multi%20year).mov'
  )
  on conflict (module_id) do update set
    video_url = excluded.video_url;
end $$;
