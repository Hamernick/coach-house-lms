# Resource Map DB Spike Review Report

Date: 2026-06-25
Status: unapproved implementation spike, not merge-ready

## Context

The user asked for planning around a scalable resource-map database. I implemented an initial schema spike instead. Treat the code as review material only until a human reviewer signs off.

The current `/find` UI/runtime was not intentionally switched to this schema. The existing prototype path remains in place.

## Files In This Spike

- `supabase/migrations/20260625214500_add_resource_map_catalog.sql`
- `src/lib/supabase/schema/tables/index.ts`
- `src/lib/supabase/schema/tables/resource_map_sources.ts`
- `src/lib/supabase/schema/tables/resource_map_import_batches.ts`
- `src/lib/supabase/schema/tables/resource_map_categories.ts`
- `src/lib/supabase/schema/tables/resource_map_organizations.ts`
- `src/lib/supabase/schema/tables/resource_map_services.ts`
- `src/lib/supabase/schema/tables/resource_map_service_categories.ts`
- `src/lib/supabase/schema/tables/resource_map_locations.ts`
- `src/lib/supabase/schema/tables/resource_map_contacts.ts`
- `src/lib/supabase/schema/tables/resource_map_links.ts`
- `tests/acceptance/public-map-resource-catalog-schema.test.ts`
- `docs/RUNLOG.md`

## What The Spike Tries To Model

The schema separates organizations from services/resources because one organization can expose many resources, and an online-only resource still needs to show in the right rail without a map marker.

Tables proposed:

- `resource_map_sources`: where data came from, license/attribution, trust level, source metadata.
- `resource_map_import_batches`: ingestion run tracking for CSV/API/scrape/manual imports.
- `resource_map_categories`: resource taxonomy seeded with food, water, housing, shelter, medical, dental, women's health, transportation, jobs, funding, legal/benefits, mental health, education, online/media, community.
- `resource_map_organizations`: normalized organization profile for imported or platform-linked orgs.
- `resource_map_services`: actual services/resources under an organization.
- `resource_map_service_categories`: many-to-many service category tagging.
- `resource_map_locations`: physical, service-area, or online location metadata.
- `resource_map_contacts`: public/private contact methods.
- `resource_map_links`: website, donate, intake, apply, referral, resource, calendar, social, logo, source links.

Minimum intended display fields:

- Organization/resource title
- Category
- Location or online mode
- Logo if available
- Contact if public
- Website, intake/apply, donate, and resource links
- Source/verification state
- Basic description/eligibility/cost/language/hours metadata

## Security Boundary In The Spike

Raw catalog tables are admin-managed through RLS. Only `resource_map_categories` has public read access.

That is intentional because imported records can include scraped snapshots, raw source metadata, unreviewed links, private contacts, error logs, and possible PII. Public app display should use a later sanitized server query, RPC, or view that exposes only approved fields.

## Specific Review Requests

### 1. Product/Data Model

Please review whether the org/service split is the right long-term shape.

Questions:

- Should the primary public item be `service`, `organization`, or a flattened public search item?
- Are online-only resources adequately represented without requiring coordinates?
- Should donation links live on orgs only, services only, or both?
- Should contact records support per-service contacts, or is org-level contact enough for v1?
- Are `eligibility`, `cost`, `languages`, `hours`, and `coverage_area` the right minimum for useful public profiles?
- Should categories be hardcoded/seeded in a migration, or managed in code/admin UI first?
- Do we need parent/child category hierarchy now, or keep a flat taxonomy for v1?

### 2. Public Exposure/RLS

Please review the RLS carefully before any DB apply.

Questions:

- Are raw catalog tables correctly admin-only?
- Is public category read safe?
- Should public search read from a sanitized SQL view, RPC, or server-only query using service role?
- Should `source_snapshot`, `metadata`, `error_log`, and raw scraped fields be completely unavailable to public clients?
- Should contacts default to private instead of public?
- Should `resource_map_links.is_public` default to false until reviewed?
- Is `(select public.is_admin())` the right project convention for these policies?
- Should imported records require review before any public display, even if source is trusted?

### 3. SQL Correctness

This migration has not been applied to a local Supabase database.

Please run a real migration apply/reset and check:

- PostgreSQL accepts the generated `search_document tsvector generated always as (...) stored` columns.
- The PL/pgSQL trigger loop syntax works.
- Composite FK from locations/contacts/links to `(service_id, organization_id)` behaves correctly with nullable `service_id`.
- Unique expression indexes on `lower(source_record_id)` are valid and useful.
- `on delete cascade` behavior is acceptable for deleting organizations/services.
- Timestamp triggers are installed on all updateable tables.
- SQL formatting/linting is acceptable because repo Prettier has no SQL parser configured.

### 4. Scale/Performance

Please review index choices before adoption.

Questions:

- Is plain `double precision` latitude/longitude enough, or should this use PostGIS `geography` with GiST indexes?
- Are B-tree coordinate indexes useful for map bounds/radius queries at expected scale?
- Are full-text GIN indexes on orgs and services enough for public search?
- Is JSONB being used too broadly for source snapshots, social links, hours, metadata, and logs?
- Should import batches/error logs be partitioned or moved out if data volume grows?
- Are there too many indexes for write-heavy ingestion?

### 5. Data Ingestion/Dedupe

The spike does not implement ingestion.

Review questions:

- Is `source_id + source_record_id` enough for idempotency?
- Do we need a separate staging table before promoting records into canonical org/service tables?
- Should dedupe use EIN, normalized name/domain/address, or a dedicated match table?
- How should conflicting fields from multiple sources be ranked?
- How do we track stale records that disappear from a source?
- What manual review workflow is needed before public display?

### 6. App Integration

The app is not wired to this schema.

Review questions:

- Should `/find` eventually query a flattened `resource_map_public_items` view?
- Should the existing public org profile data be copied into this catalog or unioned at query time?
- Should right-rail list items show services first and orgs second?
- Should map markers represent service locations, org headquarters, or both?
- What fields should be hidden until verified?

## Risks / Possible Bad Ideas

- Public access is not fully solved. A sanitized public read model is still required.
- PostGIS may be the better choice for serious geo scale.
- The migration may fail on real DB apply; it has only been source-tested.
- Contacts/links defaulting public may be too permissive for imported data.
- Raw source snapshots can become a privacy/security liability.
- Category seed data in SQL may be premature if taxonomy will change often.
- Generated search columns may be less flexible than a dedicated indexed search view.
- No import staging/review pipeline exists.
- No RLS test currently proves anon/authenticated access behavior against a real DB.

## Validation Already Done

- `./node_modules/.bin/prettier --write` on touched TypeScript/test files.
- `./node_modules/.bin/vitest tests/acceptance/public-map-resource-catalog-schema.test.ts --run` passed.
- Focused `./node_modules/.bin/eslint` on touched TypeScript/test files passed.
- Scoped `git diff --check` passed.

## Validation Not Done

- No Supabase local DB reset/apply.
- No SQL lint against a live DB.
- No RLS integration test.
- No full build.
- No full acceptance suite.
- No browser visual pass.
- No production deploy.

## Recommended Next Step

Do not apply or merge this as-is.

Recommended review path:

1. Review this report and the migration as a schema proposal.
2. Decide whether the correct public read shape is a sanitized view/RPC before any UI integration.
3. Run the migration against a disposable local Supabase DB.
4. Add real RLS tests for anon, authenticated non-admin, and admin.
5. Decide whether PostGIS is required before locking the location model.
6. Decide whether imports need staging tables before canonical tables.
7. Only then wire `/find` behind a feature flag or separate query path.

## Reviewer Sign-Off Checklist

- Data model is approved.
- RLS/public exposure model is approved.
- Migration applies cleanly to a disposable DB.
- RLS tests pass against a real DB.
- Geo/index strategy is approved for expected scale.
- Public read model excludes raw snapshots, private contacts, import logs, and unreviewed data.
- Ingestion/dedupe plan is agreed before source scraping starts.
