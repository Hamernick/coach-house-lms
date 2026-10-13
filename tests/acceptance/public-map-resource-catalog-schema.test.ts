import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const MIGRATION =
  "supabase/migrations/20260625214500_add_resource_map_catalog.sql"
const PUBLIC_READ_PATCH_MIGRATION =
  "supabase/migrations/20260626214500_resource_map_public_read_contract_patch.sql"
const AVAILABILITY_PATCH_MIGRATION =
  "supabase/migrations/20260628131000_resource_map_availability_contract.sql"
const TAXONOMY_PATCH_MIGRATION =
  "supabase/migrations/20260628150000_resource_map_taxonomy_categories.sql"

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("public map resource catalog schema", () => {
  it("adds a scalable source-aware resource map catalog", () => {
    const migration = readSource(MIGRATION)
    const taxonomyPatch = readSource(TAXONOMY_PATCH_MIGRATION)
    const schemaIndex = readSource("src/lib/supabase/schema/tables/index.ts")

    expect(migration).toContain(
      "create table if not exists public.resource_map_sources"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_import_batches"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_import_records"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_categories"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_organizations"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_services"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_service_categories"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_locations"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_contacts"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_links"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_import_record_matches"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_field_evidence"
    )
    expect(migration).toContain(
      "create table if not exists public.resource_map_curation_events"
    )

    expect(migration).toContain(
      "source_type in ('manual', 'csv', 'api', 'directory', 'scrape', 'partner', 'seed')"
    )
    expect(migration).toContain("'housing', 'Housing'")
    expect(migration).toContain("'funding', 'Funding'")
    expect(taxonomyPatch).toContain("'health', 'Health'")
    expect(taxonomyPatch).toContain("'animals', 'Animals'")
    expect(taxonomyPatch).toContain("'health_dental', 'Dental'")
    expect(taxonomyPatch).toContain(
      "'organizations_fiscal_sponsorship', 'Fiscal Sponsorship'"
    )
    expect(taxonomyPatch).toContain("parent_key")
    expect(taxonomyPatch).toContain("on conflict (key) do update")
    expect(migration).toContain(
      "platform_org_id uuid references public.organizations(user_id)"
    )
    expect(migration).toContain("source_record_id text")
    expect(migration).toContain("promotion_status text not null default")
    expect(migration).toContain("promoted_organization_id uuid")
    expect(migration).toContain("promoted_service_id uuid")
    expect(migration).toContain("donate_url text")
    expect(migration).toContain("logo_url text")
    expect(migration).toContain("favicon_url text")
    expect(migration).toContain("mission text")
    expect(migration).toContain("aliases text[] not null")
    expect(migration).toContain("search_document tsvector generated always as")
    expect(migration).toContain("delivery_modes text[] not null")
    expect(migration).toContain("who_it_helps text")
    expect(migration).toContain("insurance_accepted text")
    expect(migration).toContain("documents_needed text[] not null")
    expect(migration).toContain(
      "category_key text not null references public.resource_map_categories(key)"
    )
    expect(migration).toContain("latitude double precision")
    expect(migration).toContain("create extension if not exists postgis")
    expect(migration).toContain("geo_point extensions.geography(Point, 4326)")
    expect(migration).toContain("geocoding_accuracy text")
    expect(migration).toContain("service_radius_miles numeric(8,2)")
    expect(migration).toContain("approved_by uuid references public.profiles")
    expect(migration).toContain("approved_at timestamptz")
    expect(migration).toContain("hidden_at timestamptz")
    expect(migration).toContain("suppressed_at timestamptz")
    expect(migration).toContain("deleted_at timestamptz")
    expect(migration).toContain(
      "contact_type in ('email', 'phone', 'sms', 'whatsapp', 'contact_form', 'person', 'other')"
    )
    expect(migration).toContain(
      "link_type in ('website', 'donate', 'intake', 'apply', 'referral', 'resource', 'calendar', 'social', 'logo', 'source', 'other')"
    )
    expect(
      migration.match(/is_public boolean not null default false/g)
    ).toHaveLength(2)
    expect(migration).not.toContain("is_public boolean not null default true")

    expect(migration).toContain("resource_map_organizations_search_idx")
    expect(migration).toContain("resource_map_services_search_idx")
    expect(migration).toContain("resource_map_locations_coordinates_idx")
    expect(migration).toContain("resource_map_locations_geo_point_gist_idx")
    expect(migration).toContain("resource_map_import_records_fingerprint_idx")
    expect(migration).toContain("resource_map_import_record_matches_record_idx")
    expect(migration).toContain("resource_map_field_evidence_service_idx")
    expect(migration).toContain("resource_map_curation_events_action_idx")
    expect(migration).toContain(
      "resource_map_service_categories_category_key_idx"
    )
    expect(migration).toContain("resource_map_organizations_source_record_idx")
    expect(migration).toContain("resource_map_services_source_record_idx")

    expect(migration).toContain(
      "alter table public.resource_map_organizations force row level security"
    )
    expect(migration).toContain(
      "alter table public.resource_map_curation_events force row level security"
    )
    expect(migration).toContain(
      'create policy "resource_map_categories_public_select"'
    )
    expect(migration).toContain(
      'create policy "resource_map_curation_events_admin_manage"'
    )
    expect(migration).toContain("to anon, authenticated")
    expect(migration).toContain("using ((select public.is_admin()))")
    expect(migration).not.toContain("resource_map_organizations_public_select")
    expect(migration).not.toContain("resource_map_services_public_select")
    expect(migration).not.toContain("resource_map_links_public_select")
    expect(migration).not.toContain("resource_map_import_records_public_select")

    expect(schemaIndex).toContain("ResourceMapSourcesTable")
    expect(schemaIndex).toContain("resource_map_sources:")
    expect(schemaIndex).toContain("ResourceMapImportBatchesTable")
    expect(schemaIndex).toContain("resource_map_import_batches:")
    expect(schemaIndex).toContain("ResourceMapImportRecordsTable")
    expect(schemaIndex).toContain("resource_map_import_records:")
    expect(schemaIndex).toContain("ResourceMapCategoriesTable")
    expect(schemaIndex).toContain("resource_map_categories:")
    expect(schemaIndex).toContain("ResourceMapOrganizationsTable")
    expect(schemaIndex).toContain("resource_map_organizations:")
    expect(schemaIndex).toContain("ResourceMapServicesTable")
    expect(schemaIndex).toContain("resource_map_services:")
    expect(schemaIndex).toContain("ResourceMapServiceCategoriesTable")
    expect(schemaIndex).toContain("resource_map_service_categories:")
    expect(schemaIndex).toContain("ResourceMapLocationsTable")
    expect(schemaIndex).toContain("resource_map_locations:")
    expect(schemaIndex).toContain("ResourceMapContactsTable")
    expect(schemaIndex).toContain("resource_map_contacts:")
    expect(schemaIndex).toContain("ResourceMapLinksTable")
    expect(schemaIndex).toContain("resource_map_links:")
    expect(schemaIndex).toContain("ResourceMapImportRecordMatchesTable")
    expect(schemaIndex).toContain("resource_map_import_record_matches:")
    expect(schemaIndex).toContain("ResourceMapFieldEvidenceTable")
    expect(schemaIndex).toContain("resource_map_field_evidence:")
    expect(schemaIndex).toContain("ResourceMapCurationEventsTable")
    expect(schemaIndex).toContain("resource_map_curation_events:")
  })

  it("defines a sanitized public read contract instead of exposing raw tables", () => {
    const migration = readSource(MIGRATION)
    const publicReadPatch = readSource(PUBLIC_READ_PATCH_MIGRATION)
    const availabilityPatch = readSource(AVAILABILITY_PATCH_MIGRATION)
    const functions = readSource("src/lib/supabase/schema/functions.ts")
    const views = readSource("src/lib/supabase/schema/views.ts")
    const databaseTypes = readSource("src/lib/supabase/types.ts")

    expect(migration).toContain(
      "create or replace view public.resource_map_public_items"
    )
    expect(migration).toContain("with (security_barrier = true)")
    expect(migration).toContain(
      "create or replace function public.get_resource_map_public_items"
    )
    expect(migration).toContain(
      "returns setof public.resource_map_public_items"
    )
    expect(migration).toContain(
      "grant select on public.resource_map_public_items to anon, authenticated"
    )
    expect(migration).toContain(
      "grant execute on function public.get_resource_map_public_items(text, text[], integer, double precision, double precision, double precision) to anon, authenticated"
    )
    expect(publicReadPatch).toContain(
      "add column if not exists geo_point extensions.geography(Point, 4326)"
    )
    expect(publicReadPatch).toContain(
      "resource_map_locations_geo_point_gist_idx"
    )
    expect(publicReadPatch).toContain(
      "create or replace view public.resource_map_public_items"
    )
    expect(publicReadPatch).toContain(
      "create or replace function public.get_resource_map_public_items"
    )
    expect(publicReadPatch).toContain(
      "grant select on public.resource_map_public_items to anon, authenticated"
    )
    expect(publicReadPatch).toContain(
      "grant execute on function public.get_resource_map_public_items(text, text[], integer, double precision, double precision, double precision) to anon, authenticated"
    )
    expect(publicReadPatch).not.toContain("resource_map_import_records")
    expect(publicReadPatch).not.toContain("raw_snapshot")
    expect(availabilityPatch).toContain(
      "add column if not exists timezone text"
    )
    expect(availabilityPatch).toContain(
      "add column if not exists appointment_required boolean"
    )
    expect(availabilityPatch).toContain(
      "add column if not exists availability_status text"
    )
    expect(availabilityPatch).toContain(
      "add column if not exists temporary_closed_until timestamptz"
    )
    expect(availabilityPatch).toContain(
      "resource_map_services_availability_status_check"
    )
    expect(availabilityPatch).toContain(
      "resource_map_locations_availability_status_check"
    )
    expect(availabilityPatch).toContain(
      "coalesce(nullif(service.hours, '{}'::jsonb), primary_location.hours"
    )
    expect(availabilityPatch).toContain(
      "service.appointment_required or coalesce(primary_location.appointment_required, false)"
    )
    expect(availabilityPatch).toContain("availability_status")
    expect(availabilityPatch).toContain("location_hours")
    expect(migration).toContain(
      "drop function if exists public.get_resource_map_public_items(text, text[], integer)"
    )
    expect(migration).toContain("p_latitude double precision default null")
    expect(migration).toContain("p_longitude double precision default null")
    expect(migration).toContain("p_radius_miles double precision default null")
    expect(migration).toContain("extensions.st_dwithin")
    expect(migration).toContain("extensions.st_distance")
    expect(migration).toContain("organization.visibility = 'published'")
    expect(migration).toContain("service.visibility = 'published'")
    expect(migration).toContain(
      "organization.review_status in ('approved', 'verified')"
    )
    expect(migration).toContain(
      "service.review_status in ('approved', 'verified')"
    )
    expect(migration).toContain("organization.approved_at is not null")
    expect(migration).toContain("service.approved_at is not null")
    expect(migration).toContain("organization.hidden_at is null")
    expect(migration).toContain("service.hidden_at is null")
    expect(migration).toContain("organization.suppressed_at is null")
    expect(migration).toContain("service.suppressed_at is null")
    expect(migration).toContain("organization.deleted_at is null")
    expect(migration).toContain("service.deleted_at is null")
    expect(migration).toContain("contact.is_public")
    expect(migration).toContain("link.is_public")

    const viewBlock = migration.slice(
      migration.indexOf(
        "create or replace view public.resource_map_public_items"
      ),
      migration.indexOf("comment on view public.resource_map_public_items")
    )
    expect(viewBlock).not.toContain("raw_snapshot")
    expect(viewBlock).not.toContain("source_snapshot")
    expect(viewBlock).not.toContain("field_confidence")
    expect(viewBlock).not.toContain("confidence_score")
    expect(viewBlock).not.toContain("error_log")
    expect(viewBlock).not.toContain("reviewed_by")
    expect(viewBlock).not.toContain("before_state")
    expect(viewBlock).not.toContain("after_state")

    expect(functions).toContain("get_resource_map_public_items")
    expect(functions).toContain("p_category_keys?: string[] | null")
    expect(functions).toContain("p_latitude?: number | null")
    expect(functions).toContain("p_longitude?: number | null")
    expect(functions).toContain("p_radius_miles?: number | null")
    expect(views).toContain("ResourceMapPublicItemsView")
    expect(views).toContain("public_contacts: Json")
    expect(views).toContain("public_links: Json")
    expect(views).toContain("timezone: string | null")
    expect(views).toContain("appointment_required: boolean")
    expect(views).toContain("availability_status: string")
    expect(views).toContain("location_hours: Json")
    expect(databaseTypes).toContain("Views: PublicViews")
  })

  it("types minimum display data for right-rail resource cards", () => {
    const organizations = readSource(
      "src/lib/supabase/schema/tables/resource_map_organizations.ts"
    )
    const services = readSource(
      "src/lib/supabase/schema/tables/resource_map_services.ts"
    )
    const locations = readSource(
      "src/lib/supabase/schema/tables/resource_map_locations.ts"
    )
    const contacts = readSource(
      "src/lib/supabase/schema/tables/resource_map_contacts.ts"
    )
    const links = readSource(
      "src/lib/supabase/schema/tables/resource_map_links.ts"
    )
    const importRecords = readSource(
      "src/lib/supabase/schema/tables/resource_map_import_records.ts"
    )
    const importMatches = readSource(
      "src/lib/supabase/schema/tables/resource_map_import_record_matches.ts"
    )
    const fieldEvidence = readSource(
      "src/lib/supabase/schema/tables/resource_map_field_evidence.ts"
    )
    const curationEvents = readSource(
      "src/lib/supabase/schema/tables/resource_map_curation_events.ts"
    )

    expect(organizations).toContain("name: string")
    expect(organizations).toContain("website_url: string | null")
    expect(organizations).toContain("donate_url: string | null")
    expect(organizations).toContain("logo_url: string | null")
    expect(organizations).toContain("favicon_url: string | null")
    expect(organizations).toContain("mission: string | null")
    expect(organizations).toContain("aliases: string[]")
    expect(organizations).toContain("normalized_phone: string | null")
    expect(organizations).toContain("contact_name: string | null")
    expect(organizations).toContain("review_status: string")
    expect(organizations).toContain("approved_at: string | null")
    expect(organizations).toContain("hidden_reason: string | null")
    expect(organizations).toContain("suppression_reason: string | null")
    expect(organizations).toContain("delete_reason: string | null")
    expect(services).toContain("title: string")
    expect(services).toContain("delivery_modes: string[]")
    expect(services).toContain("eligibility: string | null")
    expect(services).toContain("who_it_helps: string | null")
    expect(services).toContain("intake_url: string | null")
    expect(services).toContain("documents_needed: string[]")
    expect(services).toContain("timezone: string | null")
    expect(services).toContain("appointment_required: boolean")
    expect(services).toContain("availability_status: string")
    expect(services).toContain("temporary_closed_until: string | null")
    expect(services).toContain("approved_at: string | null")
    expect(services).toContain("hidden_reason: string | null")
    expect(locations).toContain("city: string | null")
    expect(locations).toContain("county: string | null")
    expect(locations).toContain("latitude: number | null")
    expect(locations).toContain("geo_point: unknown | null")
    expect(locations).toContain("geocoding_accuracy: string | null")
    expect(locations).toContain("timezone: string | null")
    expect(locations).toContain("appointment_required: boolean")
    expect(locations).toContain("availability_status: string")
    expect(locations).toContain("temporary_closed_until: string | null")
    expect(contacts).toContain("contact_type: string")
    expect(contacts).toContain("is_public: boolean")
    expect(links).toContain("link_type: string")
    expect(links).toContain("domain: string | null")
    expect(importRecords).toContain("raw_snapshot: Json")
    expect(importRecords).toContain("field_confidence: Json")
    expect(importRecords).toContain("review_status: string")
    expect(importRecords).toContain("duplicate_match_status: string")
    expect(importRecords).toContain("promotion_status: string")
    expect(importRecords).toContain("promoted_organization_id: string | null")
    expect(importRecords).toContain("promoted_service_id: string | null")
    expect(importMatches).toContain("match_score: number | null")
    expect(importMatches).toContain("match_status: string")
    expect(fieldEvidence).toContain("field_path: string")
    expect(fieldEvidence).toContain("confidence_score: number | null")
    expect(curationEvents).toContain("action: string")
    expect(curationEvents).toContain("before_state: Json")
    expect(curationEvents).toContain("after_state: Json")
  })
})
