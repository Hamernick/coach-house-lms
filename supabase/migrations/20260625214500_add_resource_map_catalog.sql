set check_function_bodies = off;
set search_path = public;

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

create table if not exists public.resource_map_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  homepage_url text,
  source_type text not null default 'manual',
  license_label text,
  license_url text,
  attribution text,
  refresh_cadence text,
  trust_level text not null default 'unverified',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_sources_name_check check (length(btrim(name)) > 0),
  constraint resource_map_sources_slug_check check (length(btrim(slug)) > 0),
  constraint resource_map_sources_source_type_check
    check (source_type in ('manual', 'csv', 'api', 'directory', 'scrape', 'partner', 'seed')),
  constraint resource_map_sources_trust_level_check
    check (trust_level in ('official', 'partner', 'community', 'unverified')),
  constraint resource_map_sources_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists resource_map_sources_slug_idx
  on public.resource_map_sources (slug);
create index if not exists resource_map_sources_source_type_idx
  on public.resource_map_sources (source_type);

create table if not exists public.resource_map_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.resource_map_sources(id) on delete cascade,
  import_kind text not null default 'full',
  status text not null default 'pending',
  source_uri text,
  row_count integer not null default 0,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb,
  error_log jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_import_batches_import_kind_check
    check (import_kind in ('full', 'incremental', 'refresh', 'manual_review')),
  constraint resource_map_import_batches_status_check
    check (status in ('pending', 'running', 'completed', 'completed_with_errors', 'failed')),
  constraint resource_map_import_batches_counts_check
    check (
      row_count >= 0
      and imported_count >= 0
      and skipped_count >= 0
      and error_count >= 0
    ),
  constraint resource_map_import_batches_summary_check
    check (jsonb_typeof(summary) = 'object'),
  constraint resource_map_import_batches_error_log_check
    check (jsonb_typeof(error_log) = 'array')
);

create index if not exists resource_map_import_batches_source_created_at_idx
  on public.resource_map_import_batches (source_id, created_at desc);
create index if not exists resource_map_import_batches_status_idx
  on public.resource_map_import_batches (status);

create table if not exists public.resource_map_import_records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.resource_map_sources(id) on delete cascade,
  batch_id uuid references public.resource_map_import_batches(id) on delete set null,
  source_record_id text,
  source_url text,
  source_type text not null default 'website',
  raw_snapshot jsonb not null default '{}'::jsonb,
  extracted_fields jsonb not null default '{}'::jsonb,
  field_confidence jsonb not null default '{}'::jsonb,
  confidence_score numeric(5,2),
  trust_score numeric(5,2),
  freshness_score numeric(5,2),
  quality_flags jsonb not null default '[]'::jsonb,
  reason_codes text[] not null default '{}'::text[],
  needs_review boolean not null default false,
  normalized_name text,
  normalized_domain text,
  normalized_phone text,
  normalized_email text,
  normalized_address text,
  normalized_fingerprint text,
  review_status text not null default 'new',
  duplicate_match_status text not null default 'unknown',
  promotion_status text not null default 'not_promoted',
  promoted_organization_id uuid,
  promoted_service_id uuid,
  license_notes text,
  attribution text,
  terms_notes text,
  rejection_reason text,
  stale_reason text,
  last_seen_at timestamptz,
  last_scraped_at timestamptz,
  last_verified_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_import_records_source_type_check
    check (source_type in ('website', 'api', 'csv', 'directory', 'manual')),
  constraint resource_map_import_records_review_status_check
    check (review_status in ('new', 'needs_review', 'approved', 'rejected', 'stale')),
  constraint resource_map_import_records_duplicate_match_status_check
    check (duplicate_match_status in ('unknown', 'candidate', 'matched', 'duplicate', 'unique')),
  constraint resource_map_import_records_promotion_status_check
    check (promotion_status in ('not_promoted', 'ready', 'promoted', 'blocked')),
  constraint resource_map_import_records_confidence_score_check
    check (confidence_score is null or confidence_score between 0 and 100),
  constraint resource_map_import_records_trust_score_check
    check (trust_score is null or trust_score between 0 and 100),
  constraint resource_map_import_records_freshness_score_check
    check (freshness_score is null or freshness_score between 0 and 100),
  constraint resource_map_import_records_raw_snapshot_check
    check (jsonb_typeof(raw_snapshot) = 'object'),
  constraint resource_map_import_records_extracted_fields_check
    check (jsonb_typeof(extracted_fields) = 'object'),
  constraint resource_map_import_records_field_confidence_check
    check (jsonb_typeof(field_confidence) = 'object'),
  constraint resource_map_import_records_quality_flags_check
    check (jsonb_typeof(quality_flags) = 'array')
);

create unique index if not exists resource_map_import_records_source_record_idx
  on public.resource_map_import_records (source_id, lower(source_record_id))
  where source_record_id is not null;
create index if not exists resource_map_import_records_batch_id_idx
  on public.resource_map_import_records (batch_id)
  where batch_id is not null;
create index if not exists resource_map_import_records_review_status_idx
  on public.resource_map_import_records (review_status, updated_at desc);
create index if not exists resource_map_import_records_needs_review_idx
  on public.resource_map_import_records (needs_review, updated_at desc)
  where needs_review;
create index if not exists resource_map_import_records_quality_flags_gin_idx
  on public.resource_map_import_records using gin (quality_flags);
create index if not exists resource_map_import_records_duplicate_status_idx
  on public.resource_map_import_records (duplicate_match_status, updated_at desc);
create index if not exists resource_map_import_records_promotion_status_idx
  on public.resource_map_import_records (promotion_status, updated_at desc);
create index if not exists resource_map_import_records_fingerprint_idx
  on public.resource_map_import_records (normalized_fingerprint)
  where normalized_fingerprint is not null;

create table if not exists public.resource_map_categories (
  key text primary key,
  label text not null,
  parent_key text references public.resource_map_categories(key) on delete set null,
  sort_order integer not null default 0,
  marker_color text,
  icon_name text,
  aliases text[] not null default '{}'::text[],
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_categories_key_check check (length(btrim(key)) > 0),
  constraint resource_map_categories_label_check check (length(btrim(label)) > 0)
);

create index if not exists resource_map_categories_parent_key_idx
  on public.resource_map_categories (parent_key);
create index if not exists resource_map_categories_active_sort_idx
  on public.resource_map_categories (is_active, sort_order, label);

insert into public.resource_map_categories
  (key, label, sort_order, marker_color, icon_name, aliases, description)
values
  ('food', 'Food', 10, '#e11d48', 'utensils', array['food', 'meal', 'meals', 'pantry', 'groceries', 'nutrition'], 'Food access, pantry, grocery, and meal support.'),
  ('water', 'Water', 20, '#0891b2', 'droplets', array['water', 'hydration', 'drinking water', 'bottled water'], 'Water access and hydration support.'),
  ('housing', 'Housing', 30, '#4f46e5', 'home', array['housing', 'rent', 'tenant', 'affordable housing', 'supportive housing'], 'Housing navigation, rental support, and long-term placement.'),
  ('shelter', 'Shelter', 40, '#4f46e5', 'bed', array['shelter', 'homeless', 'overnight', 'warming'], 'Shelter, temporary housing, and intake support.'),
  ('medical', 'Medical', 50, '#059669', 'heart-pulse', array['medical', 'health', 'clinic', 'primary care', 'care access'], 'Medical care, clinic, and health access.'),
  ('dental', 'Dental', 60, '#0d9488', 'badge-plus', array['dental', 'dentist', 'oral', 'teeth'], 'Dental care and oral health services.'),
  ('womens_health', 'Women''s health', 70, '#db2777', 'heart-handshake', array['women', 'womens health', 'maternal', 'reproductive'], 'Women''s health, maternal care, and related support.'),
  ('transportation', 'Transportation', 80, '#2563eb', 'bus', array['transportation', 'transit', 'bus', 'rides', 'travel'], 'Transportation, transit, ride, and mobility support.'),
  ('jobs', 'Jobs', 90, '#ea580c', 'briefcase-business', array['jobs', 'employment', 'workforce', 'career', 'placement'], 'Employment, workforce, training, and placement support.'),
  ('funding', 'Funding', 100, '#65a30d', 'circle-dollar-sign', array['funding', 'grant', 'grants', 'stipend', 'financial assistance', 'cash assistance'], 'Funding, grants, stipends, and financial assistance.'),
  ('legal_benefits', 'Legal + benefits', 110, '#7c3aed', 'scale', array['legal', 'benefits', 'aid', 'case management', 'rights'], 'Legal aid, benefits navigation, and eligibility support.'),
  ('mental_health', 'Mental health', 120, '#9333ea', 'brain', array['mental', 'therapy', 'counseling', 'wellness', 'behavioral'], 'Mental health, counseling, and behavioral health support.'),
  ('education_resource', 'Education', 130, '#d97706', 'graduation-cap', array['education', 'school', 'student', 'learning', 'literacy'], 'Education, student, training, and learning resources.'),
  ('online_media', 'Online + media', 140, '#0284c7', 'radio', array['online', 'media', 'resource', 'guide', 'web resource'], 'Online resources, guides, media, and information hubs.'),
  ('community_resource', 'Community', 150, '#16a34a', 'users-round', array['community', 'mutual aid', 'family', 'neighbors', 'support'], 'Community support, mutual aid, and general resources.')
on conflict (key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order,
  marker_color = excluded.marker_color,
  icon_name = excluded.icon_name,
  aliases = excluded.aliases,
  description = excluded.description,
  updated_at = timezone('utc', now());

create table if not exists public.resource_map_organizations (
  id uuid primary key default gen_random_uuid(),
  platform_org_id uuid references public.organizations(user_id) on delete set null,
  source_id uuid references public.resource_map_sources(id) on delete set null,
  source_record_id text,
  name text not null,
  legal_name text,
  ein text,
  slug text,
  tagline text,
  description text,
  website_url text,
  donate_url text,
  logo_url text,
  favicon_url text,
  mission text,
  vision text,
  values text[] not null default '{}'::text[],
  aliases text[] not null default '{}'::text[],
  domain text,
  contact_name text,
  email text,
  phone text,
  normalized_email text,
  normalized_phone text,
  social_links jsonb not null default '{}'::jsonb,
  visibility text not null default 'draft',
  review_status text not null default 'pending_review',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  hidden_by uuid references public.profiles(id) on delete set null,
  hidden_at timestamptz,
  hidden_reason text,
  suppressed_by uuid references public.profiles(id) on delete set null,
  suppressed_at timestamptz,
  suppression_reason text,
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  delete_reason text,
  data_quality_score numeric(5,2),
  source_url text,
  source_snapshot jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  last_verified_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A')
    || setweight(to_tsvector('english', coalesce(legal_name, '')), 'B')
    || setweight(to_tsvector('english', coalesce(tagline, '')), 'B')
    || setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,
  constraint resource_map_organizations_name_check check (length(btrim(name)) > 0),
  constraint resource_map_organizations_visibility_check
    check (visibility in ('draft', 'published', 'hidden', 'archived', 'suppressed', 'deleted')),
  constraint resource_map_organizations_review_status_check
    check (review_status in ('pending_review', 'approved', 'external_data', 'verified', 'needs_update', 'rejected', 'stale')),
  constraint resource_map_organizations_data_quality_score_check
    check (data_quality_score is null or data_quality_score between 0 and 100),
  constraint resource_map_organizations_social_links_check
    check (jsonb_typeof(social_links) = 'object'),
  constraint resource_map_organizations_source_snapshot_check
    check (jsonb_typeof(source_snapshot) = 'object')
);

create unique index if not exists resource_map_organizations_slug_idx
  on public.resource_map_organizations (slug)
  where slug is not null;
create unique index if not exists resource_map_organizations_source_record_idx
  on public.resource_map_organizations (source_id, lower(source_record_id))
  where source_id is not null and source_record_id is not null;
create unique index if not exists resource_map_organizations_ein_idx
  on public.resource_map_organizations (ein)
  where ein is not null;
create index if not exists resource_map_organizations_platform_org_id_idx
  on public.resource_map_organizations (platform_org_id)
  where platform_org_id is not null;
create index if not exists resource_map_organizations_source_id_idx
  on public.resource_map_organizations (source_id);
create index if not exists resource_map_organizations_public_idx
  on public.resource_map_organizations (visibility, review_status, updated_at desc)
  where deleted_at is null;
create index if not exists resource_map_organizations_curation_idx
  on public.resource_map_organizations (review_status, visibility, approved_at desc, updated_at desc)
  where deleted_at is null;
create index if not exists resource_map_organizations_domain_idx
  on public.resource_map_organizations (domain)
  where domain is not null;
create index if not exists resource_map_organizations_aliases_idx
  on public.resource_map_organizations using gin (aliases);
create index if not exists resource_map_organizations_search_idx
  on public.resource_map_organizations using gin (search_document);

create table if not exists public.resource_map_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.resource_map_organizations(id) on delete cascade,
  source_id uuid references public.resource_map_sources(id) on delete set null,
  source_record_id text,
  title text not null,
  subtitle text,
  description text,
  service_kind text not null default 'service',
  delivery_modes text[] not null default '{}'::text[],
  eligibility text,
  cost text,
  who_it_helps text,
  insurance_accepted text,
  intake_url text,
  appointment_info text,
  documents_needed text[] not null default '{}'::text[],
  accessibility_notes text,
  urgent_availability text,
  languages text[] not null default '{}'::text[],
  hours jsonb not null default '{}'::jsonb,
  coverage_area text[] not null default '{}'::text[],
  minimum_age integer,
  maximum_age integer,
  visibility text not null default 'draft',
  review_status text not null default 'pending_review',
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  hidden_by uuid references public.profiles(id) on delete set null,
  hidden_at timestamptz,
  hidden_reason text,
  suppressed_by uuid references public.profiles(id) on delete set null,
  suppressed_at timestamptz,
  suppression_reason text,
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  delete_reason text,
  source_url text,
  source_snapshot jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  last_verified_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(subtitle, '')), 'B')
    || setweight(to_tsvector('english', coalesce(description, '')), 'C')
    || setweight(to_tsvector('english', coalesce(eligibility, '')), 'C')
  ) stored,
  constraint resource_map_services_id_organization_id_key unique (id, organization_id),
  constraint resource_map_services_title_check check (length(btrim(title)) > 0),
  constraint resource_map_services_service_kind_check
    check (service_kind in ('service', 'program', 'online_resource', 'hotline', 'event', 'funding', 'referral', 'other')),
  constraint resource_map_services_delivery_modes_check
    check (delivery_modes <@ array['in_person', 'online', 'phone', 'hybrid', 'mobile']::text[]),
  constraint resource_map_services_visibility_check
    check (visibility in ('draft', 'published', 'hidden', 'archived', 'suppressed', 'deleted')),
  constraint resource_map_services_review_status_check
    check (review_status in ('pending_review', 'approved', 'external_data', 'verified', 'needs_update', 'rejected', 'stale')),
  constraint resource_map_services_age_check
    check (
      (minimum_age is null or minimum_age >= 0)
      and (maximum_age is null or maximum_age >= 0)
      and (minimum_age is null or maximum_age is null or minimum_age <= maximum_age)
    ),
  constraint resource_map_services_hours_check
    check (jsonb_typeof(hours) = 'object'),
  constraint resource_map_services_source_snapshot_check
    check (jsonb_typeof(source_snapshot) = 'object')
);

create unique index if not exists resource_map_services_source_record_idx
  on public.resource_map_services (source_id, lower(source_record_id))
  where source_id is not null and source_record_id is not null;
create index if not exists resource_map_services_organization_id_idx
  on public.resource_map_services (organization_id, updated_at desc);
create index if not exists resource_map_services_source_id_idx
  on public.resource_map_services (source_id);
create index if not exists resource_map_services_public_idx
  on public.resource_map_services (visibility, review_status, updated_at desc)
  where deleted_at is null;
create index if not exists resource_map_services_curation_idx
  on public.resource_map_services (review_status, visibility, approved_at desc, updated_at desc)
  where deleted_at is null;
create index if not exists resource_map_services_service_kind_idx
  on public.resource_map_services (service_kind);
create index if not exists resource_map_services_delivery_modes_idx
  on public.resource_map_services using gin (delivery_modes);
create index if not exists resource_map_services_languages_idx
  on public.resource_map_services using gin (languages);
create index if not exists resource_map_services_coverage_area_idx
  on public.resource_map_services using gin (coverage_area);
create index if not exists resource_map_services_search_idx
  on public.resource_map_services using gin (search_document);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'resource_map_import_records_promoted_org_fkey'
  ) then
    alter table public.resource_map_import_records
      add constraint resource_map_import_records_promoted_org_fkey
      foreign key (promoted_organization_id)
      references public.resource_map_organizations(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'resource_map_import_records_promoted_service_fkey'
  ) then
    alter table public.resource_map_import_records
      add constraint resource_map_import_records_promoted_service_fkey
      foreign key (promoted_service_id)
      references public.resource_map_services(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.resource_map_service_categories (
  service_id uuid not null references public.resource_map_services(id) on delete cascade,
  category_key text not null references public.resource_map_categories(key) on delete restrict,
  is_primary boolean not null default false,
  confidence numeric(5,2),
  source_id uuid references public.resource_map_sources(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (service_id, category_key),
  constraint resource_map_service_categories_confidence_check
    check (confidence is null or confidence between 0 and 100)
);

create unique index if not exists resource_map_service_categories_primary_idx
  on public.resource_map_service_categories (service_id)
  where is_primary;
create index if not exists resource_map_service_categories_category_key_idx
  on public.resource_map_service_categories (category_key, service_id);
create index if not exists resource_map_service_categories_source_id_idx
  on public.resource_map_service_categories (source_id);

create table if not exists public.resource_map_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.resource_map_organizations(id) on delete cascade,
  service_id uuid,
  label text,
  location_type text not null default 'physical',
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  county text,
  postal_code text,
  country text not null default 'United States',
  latitude double precision,
  longitude double precision,
  geo_point extensions.geography(Point, 4326) generated always as (
    case
      when latitude is null or longitude is null then null
      else extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
    end
  ) stored,
  geocoding_accuracy text,
  service_radius_miles numeric(8,2),
  location_url text,
  service_area text[] not null default '{}'::text[],
  accessibility_notes text,
  hours jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_locations_service_org_fkey
    foreign key (service_id, organization_id)
    references public.resource_map_services(id, organization_id)
    on delete cascade,
  constraint resource_map_locations_location_type_check
    check (location_type in ('physical', 'service_area', 'online')),
  constraint resource_map_locations_latitude_check
    check (latitude is null or latitude between -90 and 90),
  constraint resource_map_locations_longitude_check
    check (longitude is null or longitude between -180 and 180),
  constraint resource_map_locations_geocoding_accuracy_check
    check (
      geocoding_accuracy is null
      or geocoding_accuracy in ('rooftop', 'parcel', 'street', 'city', 'county', 'state', 'manual', 'unknown')
    ),
  constraint resource_map_locations_service_radius_check
    check (service_radius_miles is null or service_radius_miles >= 0),
  constraint resource_map_locations_coordinate_pair_check
    check (
      (latitude is null and longitude is null)
      or (latitude is not null and longitude is not null)
    ),
  constraint resource_map_locations_hours_check
    check (jsonb_typeof(hours) = 'object')
);

create unique index if not exists resource_map_locations_primary_org_idx
  on public.resource_map_locations (organization_id)
  where is_primary and service_id is null;
create unique index if not exists resource_map_locations_primary_service_idx
  on public.resource_map_locations (service_id)
  where is_primary and service_id is not null;
create index if not exists resource_map_locations_organization_id_idx
  on public.resource_map_locations (organization_id);
create index if not exists resource_map_locations_service_id_idx
  on public.resource_map_locations (service_id)
  where service_id is not null;
create index if not exists resource_map_locations_city_state_idx
  on public.resource_map_locations (city, state);
create index if not exists resource_map_locations_coordinates_idx
  on public.resource_map_locations (latitude, longitude)
  where latitude is not null and longitude is not null;
create index if not exists resource_map_locations_geo_point_gist_idx
  on public.resource_map_locations
  using gist (geo_point)
  where geo_point is not null;

create table if not exists public.resource_map_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.resource_map_organizations(id) on delete cascade,
  service_id uuid,
  contact_type text not null,
  label text,
  value text not null,
  url text,
  is_primary boolean not null default false,
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_contacts_service_org_fkey
    foreign key (service_id, organization_id)
    references public.resource_map_services(id, organization_id)
    on delete cascade,
  constraint resource_map_contacts_value_check check (length(btrim(value)) > 0),
  constraint resource_map_contacts_contact_type_check
    check (contact_type in ('email', 'phone', 'sms', 'whatsapp', 'contact_form', 'person', 'other')),
  constraint resource_map_contacts_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists resource_map_contacts_primary_org_type_idx
  on public.resource_map_contacts (organization_id, contact_type)
  where is_primary and service_id is null;
create unique index if not exists resource_map_contacts_primary_service_type_idx
  on public.resource_map_contacts (service_id, contact_type)
  where is_primary and service_id is not null;
create index if not exists resource_map_contacts_organization_id_idx
  on public.resource_map_contacts (organization_id);
create index if not exists resource_map_contacts_service_id_idx
  on public.resource_map_contacts (service_id)
  where service_id is not null;
create index if not exists resource_map_contacts_contact_type_idx
  on public.resource_map_contacts (contact_type);

create table if not exists public.resource_map_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.resource_map_organizations(id) on delete cascade,
  service_id uuid,
  link_type text not null,
  label text,
  url text not null,
  domain text,
  is_primary boolean not null default false,
  is_public boolean not null default false,
  discovered_at timestamptz,
  last_checked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_links_service_org_fkey
    foreign key (service_id, organization_id)
    references public.resource_map_services(id, organization_id)
    on delete cascade,
  constraint resource_map_links_url_check check (length(btrim(url)) > 0),
  constraint resource_map_links_link_type_check
    check (link_type in ('website', 'donate', 'intake', 'apply', 'referral', 'resource', 'calendar', 'social', 'logo', 'source', 'other')),
  constraint resource_map_links_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create unique index if not exists resource_map_links_primary_org_type_idx
  on public.resource_map_links (organization_id, link_type)
  where is_primary and service_id is null;
create unique index if not exists resource_map_links_primary_service_type_idx
  on public.resource_map_links (service_id, link_type)
  where is_primary and service_id is not null;
create index if not exists resource_map_links_organization_id_idx
  on public.resource_map_links (organization_id);
create index if not exists resource_map_links_service_id_idx
  on public.resource_map_links (service_id)
  where service_id is not null;
create index if not exists resource_map_links_link_type_idx
  on public.resource_map_links (link_type);
create index if not exists resource_map_links_domain_idx
  on public.resource_map_links (domain)
  where domain is not null;

create table if not exists public.resource_map_import_record_matches (
  id uuid primary key default gen_random_uuid(),
  import_record_id uuid not null references public.resource_map_import_records(id) on delete cascade,
  organization_id uuid references public.resource_map_organizations(id) on delete set null,
  service_id uuid references public.resource_map_services(id) on delete set null,
  match_kind text not null default 'candidate',
  match_status text not null default 'pending',
  match_score numeric(5,2),
  match_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_import_record_matches_kind_check
    check (match_kind in ('ein', 'domain', 'phone', 'email', 'address', 'name', 'manual', 'composite')),
  constraint resource_map_import_record_matches_status_check
    check (match_status in ('pending', 'accepted', 'rejected', 'superseded')),
  constraint resource_map_import_record_matches_score_check
    check (match_score is null or match_score between 0 and 100),
  constraint resource_map_import_record_matches_target_check
    check (organization_id is not null or service_id is not null)
);

create index if not exists resource_map_import_record_matches_record_idx
  on public.resource_map_import_record_matches (import_record_id, match_score desc);
create index if not exists resource_map_import_record_matches_org_idx
  on public.resource_map_import_record_matches (organization_id)
  where organization_id is not null;
create index if not exists resource_map_import_record_matches_service_idx
  on public.resource_map_import_record_matches (service_id)
  where service_id is not null;
create index if not exists resource_map_import_record_matches_status_idx
  on public.resource_map_import_record_matches (match_status, updated_at desc);

create table if not exists public.resource_map_field_evidence (
  id uuid primary key default gen_random_uuid(),
  import_record_id uuid references public.resource_map_import_records(id) on delete cascade,
  source_id uuid references public.resource_map_sources(id) on delete set null,
  organization_id uuid references public.resource_map_organizations(id) on delete cascade,
  service_id uuid references public.resource_map_services(id) on delete cascade,
  location_id uuid references public.resource_map_locations(id) on delete cascade,
  contact_id uuid references public.resource_map_contacts(id) on delete cascade,
  link_id uuid references public.resource_map_links(id) on delete cascade,
  field_path text not null,
  field_value jsonb not null default 'null'::jsonb,
  confidence_score numeric(5,2),
  source_url text,
  evidence_type text not null default 'source',
  derived_from text[] not null default '{}'::text[],
  transformation text,
  evidence_metadata jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_field_evidence_field_path_check
    check (length(btrim(field_path)) > 0),
  constraint resource_map_field_evidence_confidence_score_check
    check (confidence_score is null or confidence_score between 0 and 100),
  constraint resource_map_field_evidence_type_check
    check (length(btrim(evidence_type)) > 0),
  constraint resource_map_field_evidence_metadata_check
    check (jsonb_typeof(evidence_metadata) = 'object')
);

create index if not exists resource_map_field_evidence_import_record_idx
  on public.resource_map_field_evidence (import_record_id)
  where import_record_id is not null;
create index if not exists resource_map_field_evidence_source_idx
  on public.resource_map_field_evidence (source_id, observed_at desc)
  where source_id is not null;
create index if not exists resource_map_field_evidence_type_idx
  on public.resource_map_field_evidence (evidence_type, observed_at desc);
create index if not exists resource_map_field_evidence_organization_idx
  on public.resource_map_field_evidence (organization_id, field_path)
  where organization_id is not null;
create index if not exists resource_map_field_evidence_service_idx
  on public.resource_map_field_evidence (service_id, field_path)
  where service_id is not null;

create table if not exists public.resource_map_curation_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  organization_id uuid references public.resource_map_organizations(id) on delete cascade,
  service_id uuid references public.resource_map_services(id) on delete cascade,
  import_record_id uuid references public.resource_map_import_records(id) on delete set null,
  contact_id uuid references public.resource_map_contacts(id) on delete set null,
  link_id uuid references public.resource_map_links(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  reason text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint resource_map_curation_events_action_check
    check (
      action in (
        'approve',
        'edit',
        'hide',
        'suppress',
        'restore',
        'delete',
        'reject',
        'mark_stale',
        'merge_duplicate',
        'promote',
        'contact_visibility',
        'link_visibility'
      )
    ),
  constraint resource_map_curation_events_target_check
    check (
      organization_id is not null
      or service_id is not null
      or import_record_id is not null
      or contact_id is not null
      or link_id is not null
    ),
  constraint resource_map_curation_events_before_state_check
    check (jsonb_typeof(before_state) = 'object'),
  constraint resource_map_curation_events_after_state_check
    check (jsonb_typeof(after_state) = 'object')
);

create index if not exists resource_map_curation_events_org_idx
  on public.resource_map_curation_events (organization_id, created_at desc)
  where organization_id is not null;
create index if not exists resource_map_curation_events_service_idx
  on public.resource_map_curation_events (service_id, created_at desc)
  where service_id is not null;
create index if not exists resource_map_curation_events_import_record_idx
  on public.resource_map_curation_events (import_record_id, created_at desc)
  where import_record_id is not null;
create index if not exists resource_map_curation_events_action_idx
  on public.resource_map_curation_events (action, created_at desc);

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
  service.hours,
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
  greatest(service.updated_at, organization.updated_at) as last_updated_at
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

drop function if exists public.get_resource_map_public_items(text, text[], integer);

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

comment on function public.get_resource_map_public_items(text, text[], integer, double precision, double precision, double precision) is
  'Public resource-map reader. Returns the sanitized resource_map_public_items projection only, with optional PostGIS radius filtering.';

revoke all on function public.get_resource_map_public_items(text, text[], integer, double precision, double precision, double precision) from public;
grant execute on function public.get_resource_map_public_items(text, text[], integer, double precision, double precision, double precision) to anon, authenticated;

do $$
declare
  trigger_table text;
begin
  foreach trigger_table in array array[
    'resource_map_sources',
    'resource_map_import_batches',
    'resource_map_import_records',
    'resource_map_categories',
    'resource_map_organizations',
    'resource_map_services',
    'resource_map_locations',
    'resource_map_contacts',
    'resource_map_links',
    'resource_map_import_record_matches'
  ]
  loop
    if not exists (
      select 1
      from pg_trigger
      where tgname = 'set_updated_at_' || trigger_table
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute procedure public.handle_updated_at()',
        'set_updated_at_' || trigger_table,
        trigger_table
      );
    end if;
  end loop;
end $$;

alter table public.resource_map_sources enable row level security;
alter table public.resource_map_sources force row level security;
alter table public.resource_map_import_batches enable row level security;
alter table public.resource_map_import_batches force row level security;
alter table public.resource_map_import_records enable row level security;
alter table public.resource_map_import_records force row level security;
alter table public.resource_map_categories enable row level security;
alter table public.resource_map_categories force row level security;
alter table public.resource_map_organizations enable row level security;
alter table public.resource_map_organizations force row level security;
alter table public.resource_map_services enable row level security;
alter table public.resource_map_services force row level security;
alter table public.resource_map_service_categories enable row level security;
alter table public.resource_map_service_categories force row level security;
alter table public.resource_map_locations enable row level security;
alter table public.resource_map_locations force row level security;
alter table public.resource_map_contacts enable row level security;
alter table public.resource_map_contacts force row level security;
alter table public.resource_map_links enable row level security;
alter table public.resource_map_links force row level security;
alter table public.resource_map_import_record_matches enable row level security;
alter table public.resource_map_import_record_matches force row level security;
alter table public.resource_map_field_evidence enable row level security;
alter table public.resource_map_field_evidence force row level security;
alter table public.resource_map_curation_events enable row level security;
alter table public.resource_map_curation_events force row level security;

drop policy if exists "resource_map_sources_admin_manage" on public.resource_map_sources;
create policy "resource_map_sources_admin_manage" on public.resource_map_sources
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_import_batches_admin_manage" on public.resource_map_import_batches;
create policy "resource_map_import_batches_admin_manage" on public.resource_map_import_batches
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_import_records_admin_manage" on public.resource_map_import_records;
create policy "resource_map_import_records_admin_manage" on public.resource_map_import_records
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_categories_public_select" on public.resource_map_categories;
create policy "resource_map_categories_public_select" on public.resource_map_categories
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "resource_map_categories_admin_manage" on public.resource_map_categories;
create policy "resource_map_categories_admin_manage" on public.resource_map_categories
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_organizations_admin_manage" on public.resource_map_organizations;
create policy "resource_map_organizations_admin_manage" on public.resource_map_organizations
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_services_admin_manage" on public.resource_map_services;
create policy "resource_map_services_admin_manage" on public.resource_map_services
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_service_categories_admin_manage" on public.resource_map_service_categories;
create policy "resource_map_service_categories_admin_manage" on public.resource_map_service_categories
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_locations_admin_manage" on public.resource_map_locations;
create policy "resource_map_locations_admin_manage" on public.resource_map_locations
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_contacts_admin_manage" on public.resource_map_contacts;
create policy "resource_map_contacts_admin_manage" on public.resource_map_contacts
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_links_admin_manage" on public.resource_map_links;
create policy "resource_map_links_admin_manage" on public.resource_map_links
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_import_record_matches_admin_manage" on public.resource_map_import_record_matches;
create policy "resource_map_import_record_matches_admin_manage" on public.resource_map_import_record_matches
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_field_evidence_admin_manage" on public.resource_map_field_evidence;
create policy "resource_map_field_evidence_admin_manage" on public.resource_map_field_evidence
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "resource_map_curation_events_admin_manage" on public.resource_map_curation_events;
create policy "resource_map_curation_events_admin_manage" on public.resource_map_curation_events
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
