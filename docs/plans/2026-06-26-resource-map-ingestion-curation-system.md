# Resource Map Ingestion + Curation System

Date: 2026-06-26
Status: staged implementation with local scraped-data preview

## Goal

Build the DB-backed pipeline that lets Coach House scrape, preview, import, review, and publish public resources without pushing unfinished batches into the production public app.

## Data Boundary

- Raw source payloads live only in `resource_map_import_records.raw_snapshot`.
- Extracted/confidence data lives only in import/evidence tables until reviewed.
- Contacts and links default private and require explicit `is_public = true`.
- Public reads must use `resource_map_public_items` or `get_resource_map_public_items()`.
- Public reads must never select from raw catalog/import tables directly.

## Geo Strategy

- Keep `latitude`/`longitude` fields for Mapbox and simple display compatibility.
- Enable PostGIS in the migration and derive `resource_map_locations.geo_point` as a generated geography point from `longitude, latitude`.
- Index `geo_point` with GiST for radius lookups at real resource-map scale.
- Keep radius search behind `get_resource_map_public_items()` so public callers still receive only the sanitized read contract.
- Do not expose raw geocoding/import confidence maps through public reads; public output may include coordinates, geocoding accuracy, and service radius only after approval.

## Working Flow

1. Set up the Supabase schema from `supabase/migrations/20260625214500_add_resource_map_catalog.sql`.
2. Verify the connected Supabase project has the resource-map tables/view/RPC with `pnpm resource-map:schema-status -- --strict`.
3. Scrape/API/CSV/manual-collect resource rows into local JSON or JSONL files.
4. Preview those local files on `/find` by starting the app with `RESOURCE_MAP_LOCAL_PREVIEW_FILE=./path/to/scraped.jsonl`.
5. Iterate locally until the map/list/detail output looks right.
6. Upload the confirmed first batch to Supabase staging with `resource-map:import`.
7. Use scripts/server actions to dedupe, promote, and publish only confirmed records.
8. Use the `/find` profile hide/delete buttons for super-admin public-surface corrections after records appear.

Local preview is intentionally not blocked by source registry or review state. Those controls matter when moving data into Supabase and production public reads.

## Source Discovery

Use whatever source-finding and scraping path is fastest for local iteration. Before uploading a batch to Supabase, record useful source metadata when it exists:

- Government and official open-data portals.
- Existing CKAN/Data.gov, Socrata, ArcGIS, sitemap, and robots payloads parsed into source-registry candidates.
- 211/open referral directories where terms allow reuse.
- Nonprofit websites with explicit public service pages.
- Partner CSV/API uploads.
- Manual super-admin entries.

Each source should record:

- `source_type`, license/terms notes, attribution, trust level, homepage/source URL.
- Refresh cadence and last import batch.
- Whether source data can be displayed publicly, requires attribution, or needs manual confirmation.

## Local Preview Flow

Dump local batches under `data/resource-map/`. That directory ignores local JSON/JSONL outputs by default and documents the prompt to give future Codex scrape/search runs.

Scraper output can be JSON, JSONL, `{ "records": [...] }`, `{ "resources": [...] }`, or `{ "items": [...] }`.

```bash
pnpm resource-map:validate-local -- --input ./data/resource-map/chicago-food.jsonl
RESOURCE_MAP_LOCAL_PREVIEW_FILE=./data/resource-map/chicago-food.jsonl pnpm dev
```

The local preview adapter accepts practical scraper fields such as `extractedFields`, `fields`, `organizationName`, `title`, `description`, top-level `category`, optional `subcategory`, `resourceCategories`, `latitude`, `longitude`, `address`, `city`, `state`, `phone`, `email`, `websiteUrl`, `links`, `contacts`, `hours`, `timezone`, `appointmentRequired`, `availabilityStatus`, `availabilityNotes`, and `sourceUrl`.

Availability data should prefer structured `hours` JSON over text-only labels:

```json
{
  "timezone": "America/Chicago",
  "hours": {
    "schemaVersion": 1,
    "label": "Mon-Fri 9-5",
    "weekly": [
      {
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "opensAt": "09:00",
        "closesAt": "17:00"
      }
    ],
    "exceptions": [{ "date": "2026-07-04", "closed": true }]
  },
  "appointmentRequired": false,
  "availabilityStatus": "available",
  "availabilityNotes": "Call before visiting if weather is severe."
}
```

When that same file is ready for Supabase staging:

```bash
pnpm resource-map:validate-local -- --input ./data/resource-map/chicago-food.jsonl --strict
pnpm resource-map:import -- --input ./data/resource-map/chicago-food.jsonl --source-slug chicago-food --source-name "Chicago food scrape" --dry-run
pnpm resource-map:import -- --input ./data/resource-map/chicago-food.jsonl --source-slug chicago-food --source-name "Chicago food scrape"
```

## Import Flow

1. Create or select `resource_map_sources` for the confirmed batch.
2. Create `resource_map_import_batches` with `pending`/`running`/terminal status.
3. Write every confirmed scraped/API/CSV/manual row to `resource_map_import_records`.
4. Normalize name, domain, phone, email, address, and fingerprint.
5. Store field-level confidence in `field_confidence` when available.
6. Store source snippets/URLs in `resource_map_field_evidence` when available.
7. Generate `resource_map_import_record_matches` candidates.
8. Review/edit/hide/delete/promote from staging before production public reads use the data.

## Dedupe Strategy

Match in this order:

- EIN exact match when present.
- Domain exact match.
- Phone/email normalized exact match.
- Address plus normalized name.
- Composite fingerprint across name, city/state, category/subcategory, and URL.

Match outcomes:

- `candidate`: needs super-admin decision.
- `matched`: accepted as same entity.
- `duplicate`: record should not create a new public resource.
- `unique`: safe to create a new canonical org/service after review.

## Super-Admin Curation

Current visible curation is intentionally narrow:

- Super-admin-only hide/delete buttons on `/find` organization/resource profiles.
- No standalone `/admin/platform/resource-map` review queue is exposed right now.
- Data collection, validation, local preview, staging import, dedupe, and promotion stay in scripts/server actions until product scope calls for a larger UI.
- Platform organization hide/delete actions write `public_map_organization_curation_events`; canonical resource-map actions write `resource_map_curation_events`.

Backend state still needs to support:

- New import records.
- Needs review.
- Duplicate candidates.
- Approved but not promoted.
- Stale or source-disappeared records.
- Published resources flagged for correction.

Required non-public controls:

- Approve import record.
- Reject with reason.
- Mark stale with reason.
- Promote to canonical org/service.
- Merge duplicate into existing org/service.
- Edit canonical public fields.
- Explicitly approve/revoke public contact visibility.
- Explicitly approve/revoke public link visibility.
- Hide from `/find` without deleting.
- Suppress for policy/safety reason.
- Restore hidden/suppressed records.
- Soft-delete with reason.

Every mutation should insert `resource_map_curation_events` with action, actor, target, reason, and before/after JSON.

## Public Promotion Rules

A resource appears in `resource_map_public_items` only when:

- Organization and service are `visibility = 'published'`.
- Organization and service are `review_status in ('approved', 'verified')`.
- Organization and service have `approved_at`.
- Neither organization nor service is hidden, suppressed, or deleted.
- Contacts/links included in JSON arrays are explicitly `is_public`.

Promotion from import records may create canonical organization, service, primary location, categories, contacts, and links. Promotion defaults canonical records to draft unless `--publish` is passed, and promoted contacts/links always remain `is_public = false` until a super-admin visibility action approves them. Approved imports with accepted duplicate matches are blocked from new-record promotion until a deliberate merge path is used, so accepted dedupe decisions cannot accidentally create duplicate public resources.

## Tooling Plan

Initial scripts/jobs:

- `scripts/resource-map/data-discover.mjs` / `pnpm data:discover`: local-first source discovery candidate generator for Data.gov, CKAN, Socrata, ArcGIS, public agency directories, IRS EO BMF, Grants.gov, SAM.gov, OSM/Wikidata, GitHub datasets, sitemaps/robots, 211, food bank, shelter, clinic, library, school, faith/community, nonprofit, mutual aid, and benefits directories. Dry-run by default; writes `data/resource-map/.engine/source-registry.jsonl` only with `--write`, validates the same candidates against source-registry intake with `--registry-dry-run`, and writes `resource_map_sources` only with explicit `--registry-apply`. For actual catalog payloads, `--catalog-provider` plus `--catalog-input` parses CKAN/Data.gov, Socrata, ArcGIS, sitemap, and robots files or explicit `--network true` URLs into traceable source candidates.
- `scripts/resource-map/data-ingest.mjs` / `pnpm data:ingest`: local ingestion runner for source, all sources, connector type, failed retry selection, and stale-source refresh selection. It stores raw payload checksums and connector fetch-attempt metadata, supports bounded retry/timeout options, parses candidate records, normalizes, geocodes from source/cache/free endpoints when enabled, classifies against the Coach House taxonomy, dedupes, scores trust/freshness, writes quality flags with deterministic derived field evidence, and emits candidate JSONL for the existing staging import path.
- Excel `.xlsx` inputs are preserved as base64 raw text with original byte-length metadata, then parsed from the first worksheet into header-keyed rows before normal resource normalization/classification.
- IRS EO BMF delimited extracts preserve EIN as `sourceRecordId`, map organization/address fields, and convert NTEE prefixes into deterministic taxonomy hints before classification.
- OSM Overpass and Wikidata SPARQL source records can carry explicit vetted `overpassQuery` / `sparqlQuery` text; connectors encode those into request URLs and do not invent query geometry or entity classes.
- Static HTML and `playwright_scrape` parsing uses JSON-LD/schema.org first, then deterministic visible-page fallback extraction for headings, meta description, address blocks, phone/email links, HTTP links, labeled category/hours/eligibility/language text, and page keywords.
- `playwright_scrape` attempts a rendered Chromium capture with source-level wait options; if the local browser is unavailable and rendering is not required, raw metadata records `static_fallback` plus the render error before parsing static HTML. Required rendering failures stay failed raw payloads.
- The local normalizer parses common text-hour labels such as `Mon-Fri 9-5`, `Monday-Friday 9am-5pm`, `Tue, Thu 10:30am-2pm`, `24/7`, and `By appointment only` into weekly hours plus `appointmentRequired` / `availabilityStatus` fields; unparsed hours become reviewable normalization warnings.
- `scripts/resource-map/check-local-source-freshness.mjs` / `pnpm data:source-freshness`: local stale/failed/never-fetched source report over `source-registry.jsonl` and `raw-payloads.jsonl`; no Supabase or network calls.
- `scripts/resource-map/check-links.mjs` / `pnpm data:check-links`: local broken-link job that reads candidate JSON/JSONL, reports malformed URLs without network access by default, and runs explicit HTTP status checks only with `--network true`.
- `scripts/resource-map/build-source-search-plan.mjs`: non-network search task generator for category/location discovery, with source preference, terms/license checks, evidence requirements, and source-candidate shape.
- `scripts/resource-map/check-schema-status.mjs`: read-only connected-Supabase schema check for required resource-map tables/columns, sanitized public view, and public RPC; does not migrate, import, upload, or publish.
- `scripts/resource-map/print-schema-setup-sql.mjs`: prints the current connected-DB patch bundle for the sanitized public read contract, platform-organization curation audit table, resource availability contract, taxonomy categories, and local data-engine ingestion/raw/evidence contract; does not connect to Supabase.
- `scripts/resource-map/print-public-read-contract-sql.mjs`: prints the sanitized public view/RPC SQL from the migration for deliberate Supabase SQL editor or psql application; does not connect to Supabase.
- `scripts/resource-map/discover-sources.mjs`: dry-run-first source candidate intake into `resource_map_sources`, with license, terms, attribution, trust, manual-confirmation, coverage, category, and scrape-strategy metadata.
- `scripts/resource-map/validate-local-records.mjs`: local-only JSON/JSONL validator that reports previewable rows, coordinates, source URLs, contacts, links, categories, duplicates, and the exact preview/import commands.
- `scripts/resource-map/import-records.mjs`: JSONL runner that imports records into staging only, records private ingestion-run/raw-payload provenance, links staged rows through `raw_ingestion_record_id`, and maps trust/freshness scores, reason codes, quality flags, and review-needed state into first-class staged import columns.
- `scripts/resource-map/generate-match-candidates.mjs`: exact normalized-field dedupe candidate rows, dry-run by default.
- `scripts/resource-map/review-match-candidates.mjs`: dry-run-first duplicate match review tool; applies accepted/rejected/superseded decisions only by explicit match ID, reason, and `--apply`, and writes curation events.
- `scripts/resource-map/review-import-records.mjs`: dry-run-first staged import review tool; applies approved/rejected/stale/needs_review decisions only by explicit ID, reason, and `--apply`, and writes curation events.
- `scripts/resource-map/promote-approved-records.mjs`: admin-approved promotion only; creates draft canonical resources by default, carries location/category/contact/link payloads into canonical review tables, keeps promoted contacts/links private, and requires `--publish` for approved public records.
- `scripts/resource-map/check-source-freshness.mjs`: source/import freshness report for stale or never-imported sources.

Supabase target tables for the local engine are defined in
`20260628162000_resource_map_data_engine_contract.sql`:
`resource_map_ingestion_runs`, `resource_map_raw_ingestion_records`, and
`resource_map_import_records.raw_ingestion_record_id`. These tables are private
admin-only RLS surfaces and are not exposed through `resource_map_public_items`.

Next scripts/jobs:

- Per-source adapter scripts for approved sources only, each writing JSONL for staging import review.
- Scheduled internal jobs for freshness reports, not automatic publishing.

Source search plan usage:

```bash
pnpm resource-map:schema-status -- --strict
pnpm resource-map:schema-setup-sql
pnpm resource-map:public-read-sql
pnpm resource-map:source-search-plan -- --location "Chicago, IL" --categories food,health --pretty
```

If `resource-map:schema-status` reports missing `resource_map_locations.geo_point`, `resource_map_public_items`, `get_resource_map_public_items`, `public_map_organization_curation_events`, `timezone`, `appointment_required`, `availability_status`, `resource_map_ingestion_runs`, `resource_map_raw_ingestion_records`, staged quality columns, or `resource_map_field_evidence` metadata columns, apply the relevant migrations intentionally to the target Supabase project, or use `pnpm resource-map:schema-setup-sql` to print the current patch bundle for Supabase SQL editor/psql. Re-run `pnpm resource-map:schema-status -- --strict` afterward. Do not start imports until that strict check passes.

Use the generated search tasks to find candidate official/partner/community sources. Only after source terms, attribution, public-display permission, and sample evidence are captured should the vetted source be converted into `sources.jsonl` and passed to `resource-map:discover-sources -- --apply`.

Scrape locally first. Do not upload a batch to production Supabase until the local `/find` preview looks right and the DB migration has been applied to the target Supabase project.

## Validation

Before live imports:

- Apply migration to a non-production Supabase project or reviewed staging target before production.
- Run RLS tests for anon, authenticated non-admin, admin, and service-role/import paths.
- Test that public reads cannot return raw snapshots, private contacts, private links, import logs, confidence maps, or curation events.
- Test that hidden/suppressed/deleted resources disappear from `resource_map_public_items`.
- Run focused acceptance tests and `pnpm check:structure`.
