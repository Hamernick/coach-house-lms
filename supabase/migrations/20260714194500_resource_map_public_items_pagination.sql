alter function public.get_resource_map_public_items(
  text,
  text[],
  integer,
  double precision,
  double precision,
  double precision
) set search_path = '';

create or replace function public.get_resource_map_public_items_page(
  p_query text default null,
  p_category_keys text[] default null,
  p_limit integer default 500,
  p_offset integer default 0,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_radius_miles double precision default null
)
returns setof public.resource_map_public_items
language sql
stable
security definer
set search_path = ''
as $$
  select *
  from public.resource_map_public_items item
  where (
    nullif(btrim(coalesce(p_query, '')), '') is null
    or (
      item.title || ' ' ||
      coalesce(item.subtitle, '') || ' ' ||
      coalesce(item.description, '') || ' ' ||
      item.organization_name || ' ' ||
      coalesce(item.city, '') || ' ' ||
      coalesce(item.state, '') || ' ' ||
      array_to_string(item.resource_categories, ' ')
    ) ilike '%' || btrim(coalesce(p_query, '')) || '%'
  )
  and (
    p_category_keys is null
    or cardinality(p_category_keys) = 0
    or item.resource_categories && p_category_keys
  )
  and (
    p_latitude is null
    or p_longitude is null
    or p_radius_miles is null
    or exists (
      select 1
      from public.resource_map_locations location
      where location.organization_id = item.organization_id
        and (location.service_id = item.service_id or location.service_id is null)
        and location.geo_point is not null
        and extensions.st_dwithin(
          location.geo_point,
          extensions.st_setsrid(
            extensions.st_makepoint(p_longitude, p_latitude),
            4326
          )::extensions.geography,
          least(greatest(p_radius_miles, 0), 500) * 1609.344
        )
    )
  )
  order by
    case
      when p_latitude is not null
        and p_longitude is not null
        and p_radius_miles is not null
        and item.latitude is not null
        and item.longitude is not null
      then extensions.st_distance(
        extensions.st_setsrid(
          extensions.st_makepoint(item.longitude, item.latitude),
          4326
        )::extensions.geography,
        extensions.st_setsrid(
          extensions.st_makepoint(p_longitude, p_latitude),
          4326
        )::extensions.geography
      )
      else null
    end asc nulls last,
    coalesce(item.last_verified_at, item.last_updated_at) desc nulls last,
    item.title asc,
    item.item_id asc
  limit least(greatest(coalesce(p_limit, 500), 1), 1000)
  offset least(greatest(coalesce(p_offset, 0), 0), 1000000);
$$;

comment on function public.get_resource_map_public_items_page(
  text,
  text[],
  integer,
  integer,
  double precision,
  double precision,
  double precision
) is 'Paginated public resource-map reader over the sanitized projection.';

revoke all on function public.get_resource_map_public_items_page(
  text,
  text[],
  integer,
  integer,
  double precision,
  double precision,
  double precision
) from public;
grant execute on function public.get_resource_map_public_items_page(
  text,
  text[],
  integer,
  integer,
  double precision,
  double precision,
  double precision
) to anon, authenticated;
