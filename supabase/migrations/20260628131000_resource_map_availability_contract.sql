set check_function_bodies = off;
set search_path = public;

alter table public.resource_map_services
  add column if not exists hours_schema_version integer not null default 1,
  add column if not exists timezone text,
  add column if not exists appointment_required boolean not null default false,
  add column if not exists availability_status text not null default 'unknown',
  add column if not exists availability_notes text,
  add column if not exists temporary_closed_until timestamptz;

alter table public.resource_map_locations
  add column if not exists hours_schema_version integer not null default 1,
  add column if not exists timezone text,
  add column if not exists appointment_required boolean not null default false,
  add column if not exists availability_status text not null default 'unknown',
  add column if not exists availability_notes text,
  add column if not exists temporary_closed_until timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_map_services_hours_schema_version_check'
  ) then
    alter table public.resource_map_services
      add constraint resource_map_services_hours_schema_version_check
      check (hours_schema_version >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_map_locations_hours_schema_version_check'
  ) then
    alter table public.resource_map_locations
      add constraint resource_map_locations_hours_schema_version_check
      check (hours_schema_version >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_map_services_timezone_check'
  ) then
    alter table public.resource_map_services
      add constraint resource_map_services_timezone_check
      check (timezone is null or length(btrim(timezone)) between 1 and 64);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_map_locations_timezone_check'
  ) then
    alter table public.resource_map_locations
      add constraint resource_map_locations_timezone_check
      check (timezone is null or length(btrim(timezone)) between 1 and 64);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_map_services_availability_status_check'
  ) then
    alter table public.resource_map_services
      add constraint resource_map_services_availability_status_check
      check (
        availability_status in (
          'unknown',
          'available',
          'limited',
          'appointment_only',
          'waitlist',
          'temporarily_closed',
          'seasonal',
          'closed'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'resource_map_locations_availability_status_check'
  ) then
    alter table public.resource_map_locations
      add constraint resource_map_locations_availability_status_check
      check (
        availability_status in (
          'unknown',
          'available',
          'limited',
          'appointment_only',
          'waitlist',
          'temporarily_closed',
          'seasonal',
          'closed'
        )
      );
  end if;
end $$;

create or replace view public.resource_map_public_items
with (security_barrier = true)
as
select
  service.id as item_id,
  'external_resource'::text as item_type,
  organization.id as organization_id,
  service.id as service_id,
  organization.platform_org_id,
  service.title,
  service.subtitle,
  service.description,
  organization.name as organization_name,
  organization.tagline as organization_tagline,
  organization.description as organization_description,
  organization.website_url,
  organization.donate_url,
  organization.logo_url,
  organization.favicon_url,
  organization.mission,
  organization.vision,
  organization.values,
  organization.aliases,
  service.service_kind,
  service.delivery_modes,
  service.eligibility,
  service.cost,
  service.who_it_helps,
  service.insurance_accepted,
  service.intake_url,
  service.appointment_info,
  service.documents_needed,
  service.accessibility_notes,
  service.urgent_availability,
  service.languages,
  coalesce(nullif(service.hours, '{}'::jsonb), primary_location.hours, '{}'::jsonb) as hours,
  service.coverage_area,
  service.minimum_age,
  service.maximum_age,
  primary_location.location_type,
  primary_location.address_line1,
  primary_location.address_line2,
  primary_location.city,
  primary_location.state,
  primary_location.county,
  primary_location.postal_code,
  primary_location.country,
  primary_location.latitude,
  primary_location.longitude,
  primary_location.geocoding_accuracy,
  primary_location.service_radius_miles,
  primary_location.location_url,
  coalesce(
    (
      select array_agg(service_category.category_key order by service_category.is_primary desc, category.sort_order, category.label)
      from public.resource_map_service_categories service_category
      join public.resource_map_categories category
        on category.key = service_category.category_key
      where service_category.service_id = service.id
        and category.is_active
    ),
    '{}'::text[]
  ) as resource_categories,
  (
    select service_category.category_key
    from public.resource_map_service_categories service_category
    join public.resource_map_categories category
      on category.key = service_category.category_key
    where service_category.service_id = service.id
      and category.is_active
    order by service_category.is_primary desc, category.sort_order, category.label
    limit 1
  ) as primary_resource_category,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', contact.id,
          'type', contact.contact_type,
          'label', contact.label,
          'value', contact.value,
          'url', contact.url,
          'isPrimary', contact.is_primary
        )
        order by contact.is_primary desc, contact.contact_type, contact.label
      )
      from public.resource_map_contacts contact
      where contact.organization_id = organization.id
        and (contact.service_id is null or contact.service_id = service.id)
        and contact.is_public
    ),
    '[]'::jsonb
  ) as public_contacts,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', link.id,
          'type', link.link_type,
          'label', link.label,
          'url', link.url,
          'domain', link.domain,
          'isPrimary', link.is_primary
        )
        order by link.is_primary desc, link.link_type, link.label
      )
      from public.resource_map_links link
      where link.organization_id = organization.id
        and (link.service_id is null or link.service_id = service.id)
        and link.is_public
    ),
    '[]'::jsonb
  ) as public_links,
  source.name as source_label,
  coalesce(service.source_url, organization.source_url, source.homepage_url) as source_url,
  source.attribution as source_attribution,
  case
    when organization.platform_org_id is not null then 'verified_platform'
    else 'external_data'
  end as verification_status,
  nullif(
    greatest(
      coalesce(service.last_verified_at, '-infinity'::timestamptz),
      coalesce(organization.last_verified_at, '-infinity'::timestamptz)
    ),
    '-infinity'::timestamptz
  ) as last_verified_at,
  greatest(service.updated_at, organization.updated_at) as last_updated_at,
  coalesce(nullif(service.timezone, ''), nullif(primary_location.timezone, '')) as timezone,
  service.appointment_required or coalesce(primary_location.appointment_required, false) as appointment_required,
  case
    when service.temporary_closed_until > now()
      or primary_location.temporary_closed_until > now()
      then 'temporarily_closed'
    when service.availability_status <> 'unknown' then service.availability_status
    when primary_location.availability_status <> 'unknown' then primary_location.availability_status
    else 'unknown'
  end as availability_status,
  coalesce(service.availability_notes, primary_location.availability_notes) as availability_notes,
  case
    when service.temporary_closed_until is null then primary_location.temporary_closed_until
    when primary_location.temporary_closed_until is null then service.temporary_closed_until
    else greatest(service.temporary_closed_until, primary_location.temporary_closed_until)
  end as temporary_closed_until,
  coalesce(primary_location.hours, '{}'::jsonb) as location_hours
from public.resource_map_services service
join public.resource_map_organizations organization
  on organization.id = service.organization_id
left join public.resource_map_sources source
  on source.id = coalesce(service.source_id, organization.source_id)
left join lateral (
  select location.*
  from public.resource_map_locations location
  where location.organization_id = organization.id
    and (location.service_id = service.id or location.service_id is null)
  order by (location.service_id = service.id) desc, location.is_primary desc, location.created_at
  limit 1
) primary_location on true
where organization.visibility = 'published'
  and service.visibility = 'published'
  and organization.review_status in ('approved', 'verified')
  and service.review_status in ('approved', 'verified')
  and organization.approved_at is not null
  and service.approved_at is not null
  and organization.hidden_at is null
  and service.hidden_at is null
  and organization.suppressed_at is null
  and service.suppressed_at is null
  and organization.deleted_at is null
  and service.deleted_at is null;

comment on view public.resource_map_public_items is
  'Sanitized public resource-map projection. Excludes raw snapshots, import records, private contacts/links, confidence maps, review notes, and curation logs.';

revoke all on public.resource_map_public_items from public;
grant select on public.resource_map_public_items to anon, authenticated;

create or replace function public.get_resource_map_public_items(
  p_query text default null,
  p_category_keys text[] default null,
  p_limit integer default 500,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_radius_miles double precision default null
)
returns setof public.resource_map_public_items
language sql
stable
security definer
set search_path = public, extensions
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
    item.title asc
  limit least(greatest(coalesce(p_limit, 500), 1), 1000);
$$;

grant execute on function public.get_resource_map_public_items(
  text,
  text[],
  integer,
  double precision,
  double precision,
  double precision
) to anon, authenticated;
