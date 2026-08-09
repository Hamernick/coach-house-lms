-- Use concise public copy while preserving the stable taxonomy key.

update public.resource_map_categories
set
  label = 'Reproductive Health',
  updated_at = timezone('utc', now())
where key = 'health_sexual_reproductive_health';
