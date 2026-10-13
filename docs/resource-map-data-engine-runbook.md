# Resource Map Data Engine Runbook

Local-first prototype for finding, fetching, preserving, parsing, normalizing,
classifying, deduping, scoring, and staging real-world public resources.

## Architecture

Pipeline:

```text
Source Discovery
-> Source Registry
-> Connector Selection
-> Raw Fetch
-> Raw Store
-> Parse
-> Normalize
-> Geocode
-> Taxonomy Classify
-> Dedupe
-> Trust/Freshness Score
-> Data-Quality Flags
-> Existing resource-map import flow
```

Local state lives in `data/resource-map/.engine/` by default. That directory is
ignored by `data/resource-map/.gitignore` so raw payload text is not committed.

```text
source-registry.jsonl
raw-payloads.jsonl
candidate-records.jsonl
runs.jsonl
geocode-cache.jsonl
```

Override that path with:

```bash
RESOURCE_MAP_ENGINE_DIR=/tmp/coach-house-resource-engine pnpm data:ingest -- --all --write
```

## Source Registry

Discovery writes source candidates compatible with `resource_map_sources`.
Provider-specific detail stays in metadata until a source is vetted.

Required source fields:

```text
sourceId, slug, name, connectorType, sourceType, trustLevel
```

Supported source types for registry intake:

```text
manual, csv, api, directory, scrape, partner, seed
```

Useful optional fields:

```text
rawUrl, homepageUrl, apiEndpoint, categories, coverageAreas,
licenseLabel, licenseUrl, attribution, termsNotes,
publicDisplayAllowed, manualConfirmationRequired, discoveryQueries
```

Generate candidates:

```bash
pnpm data:discover -- --location "Chicago, IL" --categories food,health
pnpm data:discover -- --location "Chicago, IL" --categories food,health --write
```

Template discovery includes national open-data catalogs, CKAN/Socrata/ArcGIS
portals, explicit city/county/state open-data portal candidates, IRS EO BMF,
Grants.gov, SAM.gov, OSM/Wikidata, GitHub/Common Crawl, sitemap/robots, 211,
food bank, shelter, clinic, library, school, faith/community, nonprofit,
mutual-aid, and public-benefits directories. These are source leads until
terms, license, attribution, and field quality are confirmed.

Template rows include `ingestionReadiness` plus
`metadata.connectorSupported`/`metadata.connectorReady`. A supported connector
only means the engine has code for that connector type; `connectorReady: true`
means the row has enough fetch target/query information for ingestion.
`--registry-apply` refuses lead-only rows by default so manual search leads do
not enter `resource_map_sources` as runnable sources before review.

Parse known open-data catalog payloads into source candidates without live
network access:

```bash
pnpm data:discover -- --location "Chicago, IL" --categories food --templates false --catalog-provider ckan --catalog-input ./catalog.json
```

Supported offline catalog providers are `ckan`, `data_gov`, `socrata`,
`arcgis`, `github`, `common_crawl`, `sitemap`, and `robots`. GitHub and Common
Crawl candidates remain manual-confirmation/source-quality leads until terms,
license, attribution, and field quality are reviewed.

Remote catalog inputs require explicit network opt-in:

```bash
pnpm data:discover -- --location "Chicago, IL" --categories food --catalog-provider data_gov --catalog-input "https://catalog.data.gov/api/3/action/package_search?q=food%20Chicago" --network true
```

Validate the same discovered candidates against the existing source-registry
intake without writing to Supabase:

```bash
pnpm data:discover -- --location "Chicago, IL" --categories food --registry-dry-run
```

Only after terms, license, attribution, and source quality are confirmed, write
reviewable source rows into `resource_map_sources`:

```bash
pnpm data:discover -- --location "Chicago, IL" --categories food --registry-apply
```

`resource-map:discover-sources` stores connector selection metadata on the
source row, including `sourceId`, `connectorType`, `rawUrl`, `apiEndpoint`,
`discoveryQueries`, and `rawStoreTable`, so later ingestion runners can repeat
the same source without reconstructing the discovery context. `pnpm data:ingest`
promotes those metadata fields at runtime when the local source row does not
have top-level connector fields.

## Connector Interface

Connectors fetch a source and produce raw payload records. The prototype
accepts these connector types and currently implements generic fetch/parser
routing for them; dedicated source-specific adapters can be added behind the
same contract:

```text
csv, json, xml, excel, ckan, socrata, arcgis, irs_eo_bmf,
osm_overpass, wikidata_sparql, sitemap, rss_atom, static_html,
playwright_scrape
```

Each raw payload stores:

```text
source_id, run_id, raw_url, raw_payload, raw_text, content_type,
checksum, fetched_at, parser_version, connector_version,
fetch_status, error_message
```

`raw_payload` includes connector metadata such as `connectorOptions`,
`fetchAttempts`, final URL, status code, and byte length. Checksum dedupe is
`source_id + checksum`.

CKAN, Socrata, and ArcGIS connectors support bounded API pagination for
reviewed structured sources. Source rows can set `pageSize`, `maxPages`, and
optionally `totalRows`/`metadata.totalRows`; each page attempt is preserved in
`raw_payload.fetchAttempts` with its page number and page URL, while the merged
raw payload records `paginated: true` and `pagesFetched`. CKAN stops from the
catalog `result.count`, ArcGIS stops from `exceededTransferLimit`, and Socrata
uses `totalRows` when known or otherwise probes until a short/empty page or
`maxPages`. Keep `maxPages` conservative until the source terms and payload
quality have been reviewed.

Normalized candidates are written to `candidate-records.jsonl` with an
idempotent upsert key based on the source plus `sourceRecordId`. Rerunning one
source or retrying failures updates that source's candidates without erasing
candidate records collected from other sources.
If a raw payload checksum already exists, the rerun records the fetch as a
duplicate but still reparses the stored raw payload so normalization,
classification, and quality logic can be rerun safely. The raw store keeps one
payload row per `source_id + checksum`; unchanged successful reruns update that
row's `fetched_at`, preserve the original first fetch timestamp, and append a
small `duplicateFetchReceipts` audit trail so source freshness reflects the
latest successful observation without duplicating raw text.
When a source query is intentionally narrowed or a source should be rebuilt,
use `--replace-source-candidates` with a selected source to remove prior
candidates from that source before writing the new candidates:

```bash
pnpm data:ingest -- --source chicago-food --replace-source-candidates --write
```

When parser output is still good but taxonomy, geocoding, dedupe, scoring, or
quality logic changed, reprocess existing candidates without refetching source
payloads:

```bash
pnpm data:reprocess -- --input data/resource-map/.engine/candidate-records.jsonl
pnpm data:reprocess -- --input data/resource-map/.engine/candidate-records.jsonl --output data/resource-map/.engine/candidate-records.reprocessed.jsonl --write
pnpm data:run-jobs -- --jobs candidate_reprocess --input data/resource-map/.engine/candidate-records.jsonl --write
```

Reprocess is dry-run-first. It strips stale derived classifier/geocoder/quality
state, keeps source evidence, reruns the current deterministic pipeline, writes
a `candidate_reprocess` run only with `--write`, and never fetches raw payloads.

Excel `.xlsx` payloads are preserved as base64 `raw_text` with
`raw_payload.rawTextEncoding = "base64"` and the original byte length stored in
metadata. The local prototype parses the first worksheet into header-keyed rows
before applying the same normalizer, taxonomy, geocoding, dedupe, and quality
steps as CSV/JSON sources.

IRS EO BMF-style delimited extracts are parsed through the `irs_eo_bmf`
connector. The parser preserves EIN as the source record ID, maps name and
mailing address fields into candidate records, and converts NTEE prefixes into
deterministic category hints such as health, education, food, housing,
international, animal welfare, and organization-support before taxonomy
classification. These rows still require source/license review and normal
quality flags before any public display.

`rss_atom` uses the XML parser path. RSS `<item>` and Atom `<entry>` rows map
paired tags plus Atom `link href` and `category term/label` attributes into
candidate title, description, source category text, website URL, source URL,
and update timestamps. It does not infer missing addresses or contacts.

For `static_html` and `playwright_scrape` sources, the parser first uses usable
JSON-LD/schema.org resource rows when present, including provider, postal
address, phone/email/website, opening hours, audience/eligibility, offers/cost,
required documentation, available language, available channel/delivery mode,
and area served fields. Page-chrome JSON-LD such as `BreadcrumbList` is ignored
so it does not suppress visible-page parsing. Without structured resource data
the parser falls back to visible page signals: title/meta description, H1-H3
headings, address blocks, telephone/email links, HTTP links, labeled
category/hours/eligibility/cost, required-document, language, service-area,
location-type, and delivery-mode text, and page keywords. These fields remain
candidate data that must pass normalization, taxonomy, quality flags, and
review.

`playwright_scrape` first attempts a rendered headless Chromium capture. Source
records can specify:

```text
playwrightWaitUntil, playwrightWaitForSelector, playwrightRequired,
playwrightExecutablePath
```

If Playwright or a local browser is unavailable and `playwrightRequired` is not
true, the connector records `renderingMode = "static_fallback"`, preserves the
render error in raw metadata, and fetches the same URL as static HTML. If
`playwrightRequired` is true, render failure is stored as a failed raw payload
instead of silently falling back.

## Ingestion Commands

Dry-run one source:

```bash
pnpm data:ingest -- --source chicago-food
```

Write all registry sources:

```bash
pnpm data:ingest -- --all --write
```

External geocoding is off by default. Source coordinates are preserved first,
online-only resources are marked `not_applicable`, and service-area-only
resources are marked `service_area_only` without inventing a point location.
Invalid source coordinates are rejected before map preparation: the original
bad latitude/longitude are nulled, `geocodingAccuracy` becomes
`invalid_source_coordinates`, and data-quality emits `bad_geocode`.
Online-only and service-area resources are not penalized by normalization for
missing physical addresses.
The local cache is used before network calls; call Census/Nominatim only when
you explicitly pass:

```bash
pnpm data:ingest -- --all --write --network true
```

Network geocoding is bounded and resilient. Each provider call has a timeout,
Census is attempted before Nominatim, Nominatim is delayed by a small polite
throttle, and provider timeout/error details are stored in
`extractedFields.geocodingErrors` when no result can be resolved. Failed
network geocoding stays explicit as `geocodingAccuracy: "failed"` instead of
inventing coordinates.

Run one connector type:

```bash
pnpm data:ingest -- --type socrata --write
```

Run local maintenance jobs through one dry-run-first orchestrator:

```bash
pnpm data:run-jobs
pnpm data:run-jobs -- --jobs source_discovery --location "Chicago, IL" --categories food --write
pnpm data:run-jobs -- --jobs source_ingestion --source chicago-food --write
pnpm data:run-jobs -- --jobs connector_ingestion --type socrata --write
pnpm data:run-jobs -- --jobs source_freshness,failed_retry --write
```

Supported local jobs are `source_discovery`, `source_ingestion`,
`connector_ingestion`, `source_freshness`, `failed_retry`,
`freshness_refresh`, and `broken_link_check`. The default run stays limited to
maintenance jobs (`source_freshness`, retry, stale refresh, and link checks).
Discovery and ingestion jobs are opt-in because they need source-specific
arguments and may fetch or write new local data. `source_discovery` passes
through `--location`, `--locations`, `--category`, `--categories`, catalog
flags, `--templates`, `--network`, `--append`, `--output`, `--limit`,
`--registry-dry-run`, `--registry-apply`, and
`--allow-lead-registry-apply`.
`source_ingestion` requires `--source <sourceId>` or `--all`; connector
ingestion requires `--type <connectorType>`. Ingestion jobs pass through
`--registry`, `--output`, `--network`, `--replace-source-candidates`, retry,
timeout, retry-delay, and stale-day options. The runner uses the existing local
commands, writes a `local_job_runner` summary to `runs.jsonl` only with
`--write`, and skips link checks when the candidate input does not exist. When
child commands write run records, the runner also summarizes child-run
`fetched_count`, `parsed_count`, `normalized_count`, `classified_count`,
`deduped_count`, `flagged_count`, and child errors in its JSON output and parent
run record.

For OSM and Wikidata sources, store explicit vetted query text on the source
record. The connector encodes these fields into the request URL and does not
invent geographic or category queries:

```json
{
  "connectorType": "osm_overpass",
  "rawUrl": "https://overpass-api.de/api/interpreter",
  "overpassQuery": "[out:json][timeout:25];node[\"amenity\"=\"food_bank\"](41.6,-88,42,-87.4);out center;"
}
```

Short explicit OSM/Wikidata queries use GET for transparency. Long Overpass or
SPARQL queries, or source rows with `fetchMethod: "POST"`, use
`application/x-www-form-urlencoded` POST while preserving the original query URL
in raw metadata.

OSM Overpass `tags` are flattened and normalized into candidate fields. Common
tags such as `addr:housenumber`, `addr:street`, `addr:city`, `addr:state`,
`addr:postcode`, `opening_hours`, `contact:phone`, `contact:email`,
`contact:website`, and `amenity` map to address, city/state/postal code, hours,
contact, website, and source category text.

```json
{
  "connectorType": "wikidata_sparql",
  "rawUrl": "https://query.wikidata.org/sparql",
  "sparqlQuery": "SELECT ?item ?itemLabel WHERE { ?item wdt:P31 wd:Q7075 . SERVICE wikibase:label { bd:serviceParam wikibase:language \"en\". } } LIMIT 25"
}
```

Wikidata SPARQL bindings preserve the item URI as `sourceUrl`. Optional
bindings such as `website`, `address`, `cityLabel`, `stateLabel`, `postalCode`,
`phone`, `email`, `categoryLabel`, and `coordinate` map into candidate website,
address/contact/category, and source-coordinate fields without inventing
missing values.

Tune safe retry behavior for flaky sources:

```bash
pnpm data:ingest -- --source chicago-food --retries 2 --timeout-ms 15000 --retry-delay-ms 500 --write
```

Stage existing local candidates through the current import dry-run:

```bash
pnpm data:ingest -- --input data/resource-map/.engine/candidate-records.jsonl --stage --dry-run
```

When `data/resource-map/.engine/candidate-records.jsonl` exists, `/find`
loads it as the default local preview source before trying the public Supabase
RPC or admin seed fallback. Explicit `RESOURCE_MAP_LOCAL_PREVIEW_FILE` still
wins when set. Seed preview resources are treated as empty-state scaffolding and
are not mixed into the map once real resource items are available.

Check collected source, website, and intake links without network requests:

```bash
pnpm data:check-links -- --input data/resource-map/.engine/candidate-records.jsonl
```

Attach malformed-link evidence to a review copy of candidate records without
network requests:

```bash
pnpm data:check-links -- --input data/resource-map/.engine/candidate-records.jsonl --annotate-output data/resource-map/.engine/candidate-records.link-checked.jsonl
```

Run an explicit network status check and save local results:

```bash
pnpm data:check-links -- --input data/resource-map/.engine/candidate-records.jsonl --network true --write
```

Report stale, failed, and never-fetched local sources:

```bash
pnpm data:source-freshness -- --stale-days 90 --only-stale
```

Retry failed fetches or refresh stale sources:

```bash
pnpm data:retry-failed -- --write
pnpm data:refresh-stale -- --stale-days 90 --write
```

## Adding A Source

Add one JSONL row to `data/resource-map/.engine/source-registry.jsonl`:

```json
{
  "sourceId": "example-food",
  "slug": "example-food",
  "name": "Example food resources",
  "connectorType": "csv",
  "sourceType": "csv",
  "trustLevel": "official",
  "rawUrl": "./data/resource-map/example-food.csv",
  "categories": ["food"],
  "coverageAreas": ["Chicago, IL"],
  "manualConfirmationRequired": true,
  "publicDisplayAllowed": false
}
```

Then run:

```bash
pnpm data:ingest -- --source example-food --write --network false
```

## Adding A Connector

Add fetch behavior in `scripts/resource-map/lib/data-engine/connectors.mjs`.
Connector output must become a raw payload; parser output must become the
existing local resource JSONL shape. Do not write public rows directly.

## Adding A Parser

Parser logic lives in `scripts/resource-map/lib/data-engine/parsers.mjs`.
Extract:

```text
organizationName, title, description, sourceCategoryText,
address, city, state, postalCode, latitude, longitude,
phone, email, websiteUrl, hours, eligibility, cost,
documentsNeeded, languages, deliveryModes, serviceArea, sourceUrl
```

Every parsed field should carry field evidence when source context exists.

## Normalization

The normalizer adds canonical names, normalized name/domain/phone/email/address,
searchable text, parse confidence, missing-field flags, and field-level
provenance.

Text hours are normalized deterministically when they match common public-data
formats:

```text
Mon-Fri 9-5
Monday-Friday 9am-5pm
Tue, Thu 10:30am-2pm
24/7
By appointment only
```

Parsed hours are stored as:

```json
{
  "schemaVersion": 1,
  "label": "Monday-Friday 9am-5pm",
  "weekly": [
    {
      "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
      "opensAt": "09:00",
      "closesAt": "17:00"
    }
  ],
  "exceptions": []
}
```

The normalizer also carries `timezone`, `appointmentRequired`,
`availabilityStatus`, `availabilityNotes`, and `temporaryClosedUntil` into
candidate records. If hours are present but cannot be parsed into a weekly
schedule or known availability state, the record gets `hours_unparseable`,
which later becomes a review flag.

## Taxonomy Model

Classifier version: `coach-house-taxonomy-v1`.

The classifier is deterministic. It uses canonical keys, legacy keys, aliases,
phrase matching, token-overlap fuzzy matching, edit-distance fuzzy matching for
category-like inputs, and parent rollups. Fuzzy matches add `fuzzy_match` so a
reviewer can inspect typo-tolerant mappings such as `Food Pantriez` ->
`food_food_pantries`. The local catalog includes every Coach House top-level
group and subcategory used by `/find` and `resource_map_categories`, including
Health, Food, Housing, Education, Employment, Finance, Legal, Family,
Community, Emergency, Environment, Safety, Organizations, International, and
Animals.
Original source category text is preserved, while legacy source terms such as
`medical`, `shelter`, `mental_health`, `transportation`, `womens_health`, and
`community_resource` map into canonical keys.
It stores:

```text
resourceCategories, primaryResourceCategory, confidence,
matchedTerms, unmatchedTerms, needsReview, flags, taxonomyVersion
```

No AI dependency is used for category assignment.
When approved imports are promoted, `resource_map_service_categories.confidence`
prefers the classifier confidence for each category key and falls back to the
record confidence only when classifier detail is missing.

## Provenance Model

Raw payloads are preserved before parsing. Candidate records also include:

```text
rawSnapshot, fieldEvidence, fieldConfidence, confidenceScore,
trustScore, freshnessScore, qualityFlags, reasonCodes, needsReview,
sourceUrl, lastSeenAt, lastScrapedAt, attribution, licenseNotes, termsNotes
```

`fieldEvidence` carries both source evidence and deterministic derived evidence.
The same field path can have both entries: source evidence preserves the
observed value, while derived evidence records the normalized value plus
`derivedFrom` and `transformation`. Auto-generated passthrough evidence is
marked `source_field_passthrough` so reprocessing can strip and rebuild it
without dropping parser-provided source evidence. Derived entries include
`evidenceType`, `derivedFrom`, and `transformation` so normalized names, phones,
domains, addresses, taxonomy classification, category rollups, cost/free
status, geocoding, trust/freshness scores, and data-quality flags remain
traceable to source fields.

The existing `resource-map:import` flow maps `fieldEvidence` into
`resource_map_field_evidence`, including `evidenceType`, `derivedFrom`,
`transformation`, source URL, observed time, and metadata. It preserves each
unique raw payload in `resource_map_raw_ingestion_records`, records a private
`resource_map_ingestion_runs` row, and links staged rows through
`resource_map_import_records.raw_ingestion_record_id`. It also maps
`trustScore`, `freshnessScore`, `qualityFlags`, `reasonCodes`, and
`needsReview` into first-class `resource_map_import_records` columns so review
queues do not need to mine JSON for quality state.

When approved staged records are promoted, promotion clones the staged
`resource_map_field_evidence` rows onto the created canonical organization and
service, and attaches matching location/contact/link IDs when the field path is
specific enough. The cloned evidence keeps the original import record, source,
field path, value, source URL, observed time, evidence type, derived fields, and
transformation, and adds promotion metadata with the original evidence ID and
canonical target IDs.

## Dedupe Logic

Signals:

```text
website domain, phone, email, normalized name, normalized address,
coordinate proximity, source cross-reference, service-title similarity
```

Duplicate source records are preserved in local candidate output with
`duplicateMatchStatus`, duplicate confidence, reasons, and conflict metadata.
Uncertain matches are flagged for review. Shared organization/location signals
are not enough to hard-drop a record when service title or service category
conflicts; those become review candidates so distinct services at the same
library, clinic, shelter, or community site are preserved.

## Trust And Freshness

Scores use source authority, source type, contact completeness, domain
presence, scraped-only evidence, duplicate conflicts, broken-link evidence,
normalization warnings, and last observed age. Official/verified and known
directory sources score higher; unknown or unverified structured sources remain
review-first even when the record has a website, contact method, and recent
fetch. Scraped third-party evidence, field conflicts, and failed link checks
lower trust and add explicit reason codes.

Stored output:

```text
trustScore, freshnessScore, confidenceScore, reasonCodes, needsReview
```

## Refresh Strategy

Use `runs.jsonl` for local rerun history. Use checksum dedupe to identify
unchanged raw payloads; local unchanged reruns update the existing raw row's
latest `fetched_at` and duplicate-fetch receipts instead of writing a second
raw-text row. For Supabase-backed staging, the migration
`20260628162000_resource_map_data_engine_contract.sql` defines private
`resource_map_ingestion_runs` and `resource_map_raw_ingestion_records` tables.
The staging import path dedupes raw records by `source_id + checksum`, so
multiple parsed services from the same fetched file keep one shared raw payload
reference.
Use `pnpm data:check-links` for broken-link refresh jobs; network checks are
explicit and write local `link-checks.jsonl` rows only with `--write`.
`--annotate-output` writes a candidate-record review copy with `linkChecks`
evidence attached; failed or malformed URL checks produce `broken_url`
data-quality flags.
Use `pnpm data:source-freshness` to inspect stale/failed/never-fetched local
sources before running `pnpm data:retry-failed` or `pnpm data:refresh-stale`.

## Debugging Failed Ingests

1. Run with local fixtures and `--network false`.
2. Inspect `data/resource-map/.engine/runs.jsonl`.
3. Inspect failed `fetch_status` rows in `raw-payloads.jsonl`.
4. Confirm parser warnings in candidate `extractedFields.normalization`.
5. Confirm taxonomy detail in `extractedFields.taxonomyClassification`.
6. Validate final local output:

```bash
pnpm resource-map:validate-local -- --input data/resource-map/.engine/candidate-records.jsonl
```
