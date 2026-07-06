-- Remove public "Emergency" labeling from the resource-map taxonomy.

update public.resource_map_categories
set
  label = 'Crisis support',
  description = 'Crisis response, urgent shelter, disaster relief, and recovery.',
  aliases = array['emergency', 'crisis', 'disaster'],
  updated_at = timezone('utc', now())
where key = 'emergency';

update public.resource_map_categories
set
  label = 'Shelter',
  updated_at = timezone('utc', now())
where key = 'housing_emergency_shelter';

update public.resource_map_categories
set
  label = 'Urgent Assistance',
  updated_at = timezone('utc', now())
where key = 'finance_emergency_assistance';

update public.resource_map_categories
set
  label = 'Urgent Shelter',
  updated_at = timezone('utc', now())
where key = 'emergency_emergency_shelter';

update public.resource_map_categories
set
  label = 'Urgent Food',
  updated_at = timezone('utc', now())
where key = 'emergency_emergency_food';

update public.resource_map_categories
set
  label = 'Urgent Cash',
  updated_at = timezone('utc', now())
where key = 'emergency_emergency_cash';

update public.resource_map_categories
set
  label = 'Disaster Preparedness',
  updated_at = timezone('utc', now())
where key = 'emergency_emergency_preparedness';

update public.resource_map_categories
set
  parent_key = 'environment',
  sort_order = 2,
  marker_color = '#0284c7',
  icon_name = 'wind',
  aliases = array['cooling center', 'cooling site', 'heat relief'],
  description = 'Cooling centers, heat relief, and hydration locations.',
  updated_at = timezone('utc', now())
where key = 'emergency_cooling_centers';

update public.resource_map_categories
set
  parent_key = 'environment',
  sort_order = 3,
  icon_name = 'wind',
  aliases = array['warming center', 'warming site', 'cold weather relief'],
  description = 'Warming centers and cold-weather relief locations.',
  updated_at = timezone('utc', now())
where key = 'emergency_warming_centers';

with weather_relief_services as (
  select distinct service_id
  from public.resource_map_service_categories
  where category_key in (
    'emergency_cooling_centers',
    'emergency_warming_centers'
  )
)
update public.resource_map_service_categories category
set is_primary = false
from weather_relief_services service
where category.service_id = service.service_id;

with cooling_services as (
  select service_id
  from public.resource_map_service_categories
  where category_key = 'emergency_cooling_centers'
)
update public.resource_map_service_categories category
set is_primary = true
from cooling_services service
where
  category.service_id = service.service_id
  and category.category_key = 'emergency_cooling_centers';

with warming_services as (
  select service_id
  from public.resource_map_service_categories
  where category_key = 'emergency_warming_centers'
),
cooling_services as (
  select service_id
  from public.resource_map_service_categories
  where category_key = 'emergency_cooling_centers'
)
update public.resource_map_service_categories category
set is_primary = true
from warming_services service
where
  category.service_id = service.service_id
  and category.category_key = 'emergency_warming_centers'
  and not exists (
    select 1
    from cooling_services cooling
    where cooling.service_id = service.service_id
  );

with weather_relief_services as (
  select distinct service_id
  from public.resource_map_service_categories
  where category_key in (
    'emergency_cooling_centers',
    'emergency_warming_centers'
  )
)
delete from public.resource_map_service_categories category
using weather_relief_services service
where
  category.service_id = service.service_id
  and category.category_key = 'emergency';
