set search_path = public;

do $$
declare
  pilot_module_id uuid;
begin
  select m.id
  into pilot_module_id
  from classes c
  join modules m on m.class_id = c.id
  where c.slug = 'piloting-programs'
    and m.slug = 'designing-your-pilot'
  limit 1;

  if pilot_module_id is null then
    raise notice 'Designing your pilot module not found; skipping video update.';
    return;
  end if;

  insert into module_content (module_id, video_url)
  values (
    pilot_module_id,
    'https://vswzhuwjtgzrkxknrmxu.supabase.co/storage/v1/object/public/accelerator-videos/S4%20M3%20Design%20your%20pilot.mp4'
  )
  on conflict (module_id) do update set
    video_url = excluded.video_url;
end $$;
