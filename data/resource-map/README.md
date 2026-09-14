# Resource Map Local Data

Use this directory for local resource-map scrape/search dumps only.

For the local discovery/fetch/parse/normalize/classify/dedupe/scoring engine,
see `docs/resource-map-data-engine-runbook.md`.

Large IRS EO BMF files use `pnpm resource-map:eo-import` and
`pnpm resource-map:eo-run`. Bounded search candidates can be checked with
`pnpm resource-map:eo-resolve-websites -- --candidates <file> --network true
--write`; it never guesses provider domains or treats directories as websites.
For matched providers, `pnpm resource-map:eo-collect-service-evidence -- --ein
<ein> --max-records 1 --max-pages 3 --network true --write` checks the confirmed
page first, reuses website evidence, and retains bounded same-site service
evidence without creating public claims.
The identity pool, work queue, evidence cache, result ledger, and checkpoints
stay under ignored `.engine/eo/` storage and never feed `/find` directly.

Build the full-corpus performance and coverage benchmark separately:

```bash
pnpm resource-map:eo-plan-benchmark -- --input <eo1.csv,eo2.csv,...> --sample 10000
pnpm resource-map:eo-plan-benchmark -- --input <eo1.csv,eo2.csv,...> --sample 10000 --write
```

It includes every valid EIN regardless of direct-service score, excludes already
researched records, balances the sample by filing state and NTEE major group,
retains population projection weights, and writes only private signed cohort and
identity-event files. It never writes to the application database or `/find`.

Split a signed benchmark into resumable discovery work:

```bash
pnpm resource-map:eo-plan-work -- --package-size 25 --write
pnpm resource-map:eo-work-lease -- --action status --plan <plan-directory>
```

Plans, packages, leases, heartbeats, failure history, dead letters, and completion
receipts stay under ignored `.engine/eo/work/`. Package generation and status are
offline. Claim, heartbeat, completion, and failure mutations require `--write`.

Plan provider discovery for one signed package:

```bash
pnpm resource-map:eo-plan-search -- --package <package.json>
pnpm resource-map:eo-plan-search -- --package <package.json> --adapter-results <results.jsonl> --write
```

The adapter contract keeps search replaceable. It normalizes and deduplicates
URLs, shares one fetch across matching EIN consumers, enforces exact-host
budgets, plans robots checks, and emits private stage telemetry. It performs no
network calls itself and never treats a snippet as service evidence.

Offline adapters use the same signed plan:

```bash
pnpm resource-map:eo-run-search-adapter -- --plan <search-plan.json> --adapter local_evidence_cache --input <candidate-sets.jsonl>
pnpm resource-map:eo-run-search-adapter -- --plan <search-plan.json> --adapter authoritative_directory_index --input <directory-records.jsonl>
```

Add `--write` only after reviewing the report. A directory match requires exact
EIN or exact normalized provider name plus state; misses remain eligible for the
next adapter.

Plan the owned discovery tiers from private evidence already collected:

```bash
pnpm resource-map:eo-plan-owned-discovery -- --plan <search-plan.json> --evidence-documents <evidence.jsonl> --directory-records <directory-records.jsonl>
```

The owned planner uses no paid provider. It builds a private sharded evidence
index, requires exact EIN or exact normalized name plus state, creates at most
two explicitly unverified `.org` hypotheses for distinctive names, and emits a
deduplicated robots-aware crawl plan. It performs no network calls and writes
only with `--write`.

## Write Batches Here

```text
data/resource-map/<area>-<category-or-source>-<YYYY-MM-DD>.jsonl
```

Examples:

```text
data/resource-map/chicago-food-2026-06-27.jsonl
data/resource-map/miami-housing-2026-06-27.jsonl
```

Local data files in this directory are ignored by git by default.

## Record Shape

Use JSONL: one JSON object per line.

Minimum useful fields:

```text
sourceRecordId, sourceName, sourceUrl,
extractedFields.organizationName,
extractedFields.title,
extractedFields.description,
extractedFields.category,
extractedFields.subcategory,
extractedFields.latitude,
extractedFields.longitude,
extractedFields.address,
extractedFields.city,
extractedFields.state,
extractedFields.phone,
extractedFields.email,
extractedFields.websiteUrl,
extractedFields.hours,
extractedFields.timezone
```

## Field Checklist

Top-level fields:

```text
sourceRecordId, sourceName, sourceUrl, sourceLabel, sourceType,
lastSeenAt, lastScrapedAt, lastVerifiedAt, lastUpdatedAt,
rawSnapshot, rawIngestion, fieldConfidence, confidenceScore,
trustScore, freshnessScore, qualityFlags, reasonCodes, needsReview,
attribution, licenseNotes, termsNotes
```

When `rawSnapshot` or `rawIngestion` includes raw URL, checksum, fetched text,
content type, parser version, and connector version, `resource-map:import`
preserves that raw payload in private ingestion tables and links the staged
record back to it. `resource-map:import` also maps top-level quality scores,
reason codes, review flags, and `needsReview` into first-class staged import
columns while preserving the full JSON in `extractedFields`.

Local ingestion keeps one raw row per `source_id + checksum`. If a rerun fetches
unchanged content, the existing raw row gets a refreshed `fetched_at` and
`duplicateFetchReceipts` entry instead of duplicating raw text, so source
freshness stays current while checksum dedupe is preserved.

Main `extractedFields` fields:

```text
organizationName, providerName, title, serviceTitle, subtitle,
description, organizationDescription, serviceDescription, category,
subcategory, subcategoryKey, subcategory_key, resourceCategories,
primaryResourceCategory, deliveryModes,
whoItHelps, eligibility, cost, languages, intakeUrl,
appointmentInfo, documentsNeeded, accessibilityNotes,
urgentAvailability, hours
timezone, appointmentRequired, availabilityStatus, availabilityNotes,
temporaryClosedUntil
```

Location fields:

```text
latitude, longitude, address, fullAddress, addressLine1,
addressLine2, streetAddress, city, state, county, postalCode,
country, locationType, locationLabel, locationUrl,
serviceArea, coverageArea, serviceRadiusMiles, geocodingAccuracy
```

Contact/link/media fields:

```text
phone, email, contactEmail, phoneNumber, contacts, links,
websiteUrl, donateUrl, logoUrl, imageUrl, faviconUrl
```

`contacts` entries can use:

```text
type, label, value, phone, email, url, isPrimary
```

`links` entries can use:

```text
type, label, title, url, href, domain, isPrimary
```

```json
{
  "sourceRecordId": "source-stable-id",
  "sourceName": "Source name",
  "sourceUrl": "https://example.org/resource",
  "extractedFields": {
    "organizationName": "Provider name",
    "title": "Service title",
    "description": "Short service description",
    "category": "food",
    "subcategory": "food_food_pantries",
    "resourceCategories": ["food", "food_food_pantries"],
    "latitude": 41.8781,
    "longitude": -87.6298,
    "address": "123 Example St, Chicago, IL",
    "city": "Chicago",
    "state": "IL",
    "phone": "312-555-0100",
    "email": "hello@example.org",
    "websiteUrl": "https://example.org",
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
      "exceptions": [
        { "date": "2026-07-04", "closed": true, "note": "Holiday" }
      ]
    },
    "appointmentRequired": false,
    "availabilityStatus": "available",
    "availabilityNotes": "Call before visiting if weather is severe."
  }
}
```

Structured `hours` JSON is preferred. The local data engine can also normalize
common text labels like `Mon-Fri 9-5`, `Monday-Friday 9am-5pm`,
`Tue, Thu 10:30am-2pm`, `24/7`, and `By appointment only`.

Accepted resource categories:

```text
health, food, housing, education, employment, finance, legal, family,
community, emergency, environment, safety, organizations, international,
animals
```

Accepted `subcategory` values are prefixed keys under those top-level
categories, for example `health_dental`, `food_food_pantries`,
`housing_emergency_shelter`, `employment_job_search`,
`finance_benefits_enrollment`, `legal_immigration`,
`family_childcare`, `community_transportation`,
`emergency_cooling_centers`, `environment_air_quality`,
`safety_survivor_support`, `organizations_fiscal_sponsorship`,
`international_refugee_services`, and `animals_veterinary_assistance`.

For researched records, set `category` to one top-level key and add the
subcategory key when source evidence is specific enough. Include both keys in
`resourceCategories` when possible.

## Local Flow

Discover source candidates:

```bash
pnpm data:discover -- --location "Chicago, IL" --categories food,health --write
pnpm data:discover -- --location "Chicago, IL" --categories food --registry-dry-run
pnpm data:discover -- --location "Chicago, IL" --categories food --templates false --catalog-provider ckan --catalog-input ./catalog.json --write
```

Fetch and prepare candidate records from the local source registry:

```bash
pnpm data:ingest -- --all --write
```

Check collected links without making network requests:

```bash
pnpm data:check-links -- --input data/resource-map/.engine/candidate-records.jsonl
```

Attach malformed-link evidence and `broken_url` review flags to a candidate
review copy:

```bash
pnpm data:check-links -- --input data/resource-map/.engine/candidate-records.jsonl --annotate-output data/resource-map/.engine/candidate-records.link-checked.jsonl
```

Check and refresh source freshness locally:

```bash
pnpm data:source-freshness -- --only-stale
pnpm data:retry-failed -- --write
pnpm data:refresh-stale -- --stale-days 90 --write
```

Fetch one source or connector type:

```bash
pnpm data:ingest -- --source <sourceId> --write
pnpm data:ingest -- --type socrata --write
pnpm data:ingest -- --type excel --write
pnpm data:ingest -- --type irs_eo_bmf --write
pnpm data:ingest -- --type playwright_scrape --write
pnpm data:ingest -- --source <sourceId> --retries 2 --timeout-ms 15000 --write
```

External Census/Nominatim geocoding stays opt-in with `--network true`; provider
calls are timeout-bounded and failed provider details are stored as
`geocodingErrors` instead of inventing coordinates.

Validate:

```bash
pnpm resource-map:validate-local -- --input data/resource-map/<batch>.jsonl
```

Preview:

```bash
RESOURCE_MAP_LOCAL_PREVIEW_FILE=./data/resource-map/<batch>.jsonl pnpm dev
```

For an explicit local review of discovery-only rows that remain excluded from
public results, also set
`RESOURCE_MAP_LOCAL_PREVIEW_INCLUDE_DISCOVERY=true`. These rows retain
`superadmin_preview` visibility and are never enabled implicitly.

`/find` never selects `data/resource-map/.engine/candidate-records.jsonl`
automatically. Review a specific curated file through
`RESOURCE_MAP_LOCAL_PREVIEW_FILE`. Discovery-only rows also require the explicit
`RESOURCE_MAP_LOCAL_PREVIEW_INCLUDE_DISCOVERY=true` review flag and remain
`superadmin_preview`; they are never public output.

The data engine upserts normalized candidates by source plus `sourceRecordId`.
Source retries and partial refreshes update matching records while preserving
records already collected from other sources.

When candidate records need the latest taxonomy, geocoding, dedupe, scoring, or
quality logic but source payloads do not need to be fetched again, reprocess the
candidate file locally:

```bash
pnpm data:reprocess -- --input data/resource-map/.engine/candidate-records.jsonl
pnpm data:reprocess -- --input data/resource-map/.engine/candidate-records.jsonl --output data/resource-map/.engine/candidate-records.reprocessed.jsonl --write
```

This command is dry-run-first. It keeps source evidence, strips stale derived
state, and writes a `candidate_reprocess` run only with `--write`.

Reprocessing also reapplies the current geocoding and dedupe guardrails: invalid
source coordinates are removed before map preview, online/service-area records
are not treated as missing physical addresses, and distinct services at the same
place are kept as review candidates instead of hard duplicates.

Dry-run staging upload after review:

```bash
pnpm resource-map:schema-status -- --strict
pnpm resource-map:import -- --input ./data/resource-map/<batch>.jsonl --source-slug <slug> --source-name "<Source name>" --dry-run
```

If schema status fails, print the current DB patch bundle:

```bash
pnpm resource-map:schema-setup-sql
```

Do not run the non-dry-run import until the batch is confirmed.

After a confirmed non-dry-run staging import, review individual staged records
before promotion:

```bash
pnpm resource-map:match -- --apply
pnpm resource-map:review-matches -- --limit 25
pnpm resource-map:review-matches -- --id <uuid> --status accepted --reason "Same provider" --apply
pnpm resource-map:review-imports -- --limit 25
pnpm resource-map:review-imports -- --id <uuid> --status approved --reason "Reviewed source evidence" --apply
```

Promotion keeps canonical records draft-only unless `--publish` is explicitly
passed. It also clones staged field evidence onto the promoted organization and
service rows, with matching location/contact/link IDs when the field path maps
cleanly, so canonical review records remain traceable to the original source
payload.

## Prompt For Future Codex Runs

```text
Do not upload anything to Supabase.
Do not run resource-map:import.

Find/scrape resource-map data for [CITY/AREA] and [CATEGORIES].
Write the results to:
data/resource-map/[area]-[category-or-source]-[YYYY-MM-DD].jsonl

Write one JSON object per line using sourceRecordId, sourceName, sourceUrl,
and extractedFields with organizationName, title, description, category,
subcategory, resourceCategories,
latitude, longitude, address, city, state, phone, email, websiteUrl, links,
contacts, timezone, structured hours, appointmentRequired, availabilityStatus,
and availabilityNotes when available.

After writing the file, run:
pnpm resource-map:validate-local -- --input data/resource-map/[file].jsonl

Do not start Supabase upload. Do not publish anything. Stop after validation
and summarize what was written.
```
