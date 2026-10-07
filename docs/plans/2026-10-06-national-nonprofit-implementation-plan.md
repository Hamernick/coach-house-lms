# National nonprofit enrichment: executable implementation plan

October 7 category addendum: [National category-filter integration plan](2026-10-07-national-nonprofit-category-filters.md). Follow its versioned mapping, sidecar backfill, filter/search/count contract and release sequence; it supplements this plan without resetting ingestion/publication.

Status: proposed implementation, October 6, 2026. This specifies the next build; commands marked proposed do not exist yet. No national publication or production migration has occurred in this planning session.

**Resume first:** [Stable continuation and implementation checklist](nonprofit-enrichment-continuation.md). Read its current-plan pointer and live ledger before executing this dated specification.

Execution-order update, October 7: follow the seven-step sequence in the stable checklist. Validate and publish eligible identities before waiting for additional filing enrichment. The detailed policies below remain in force; dated starting counts are historical.

## 1. Outcome and starting point

Make every eligible nonprofit searchable, fill useful fields from bulk sources first, and add map pins where a supported physical address can be geocoded. Continue filling gaps after publication. Missing phone, website, category or coordinates must not block a supported organization identity from directory search. A directory listing does not assert that an organization currently provides a particular service.

Extend the existing `feat/map-data-scale-20261003` lane. Permanent progress stays in `~/.local/share/coach-house/nonprofit-enrichment`, independent of branch, chat or working directory. Never initialize a replacement database over that state.

Last recorded research checkpoint, October 6 at 02:07 UTC: 10,001 identities; 1,049 organizations with candidate enrichment; ten verified website/phone pairs; 76 partial passes; no publication eligibility audit. These are dated local counts, not a current production census. Refresh them before execution. Ten contact pairs is not the number we are allowed to publish.

Treat 1.8M as scale, not an exact denominator. Recount the frozen IRS snapshots and report valid distinct EINs, duplicates, excluded rows and source dates. Previously counted files contained 1,957,340 distinct EINs; that is historical evidence only.

## 2. Existing parts to reuse, and the specific gaps

All paths below are repository-relative. `NE` means `src/features/nonprofit-enrichment`; `FI` means `src/features/find-resource-index`. These abbreviations are documentation shorthand, not shell variables.

| Existing part | Keep | Change needed |
| --- | --- | --- |
| `NE/server/store.mjs`, `queue.mjs` | SQLite WAL, transactions, evidence history, fenced claims | Add versioned identities and independent stage/domain jobs; current jobs are per EIN |
| `NE/server/import.mjs` | Streaming parsing, immutable file hashes, checkpoints | Replace first-row-wins refresh behavior; full-snapshot reconciliation; `--sample` currently takes a prefix |
| `NE/server/filings.mjs`, `parse-filings.py`, `extract-irs-archive.py` | Exact-EIN XML parsing, source provenance, bounded archive handling | National archive manifest, newest-period/amendment selection, source coverage accounting |
| `NE/server/evidence-import.mjs` | Normalized candidate ingestion | Direct bulk source adapters and streaming contracts |
| `NE/server/verification.mjs` | Evidence checks and parked-domain quarantine | Independent field rules; website approval must not require a matching phone |
| `NE/server/crawl*.mjs` | Robots, SSRF checks, pinned DNS, deadlines, hashes, page cache, bounded follow-up links | Domain queue, bounded concurrency, richer deterministic extraction, refresh scheduling |
| `NE/server/classification.mjs` | Existing taxonomy and abstention | Distinguish organizational classifications from evidence of actual services |
| `NE/server/artifacts.mjs`, `continuation.mjs` | Exports, backups, permanent handoff | Stage counters, resumable publication, current policy and next action |
| `scripts/resource-map/lib/data-engine/geocoder.mjs` | Pure address comparison logic | New batch adapter and database cache; do not reuse its national-scale-unfriendly whole-file cache or default public Nominatim fallback |
| `resource_map_organizations`, `resource_map_services`, `resource_map_locations` | Approved, actionable resource catalog and its promotion RPC | Separate organization-directory projection; current public view requires a service |
| `FI`, existing public map components | Existing search presentation, map and resource detail behavior | Bounded server search and viewport queries; remove client all-pages download for this flow |

Do not populate account-owned `public.organizations` with national imports. Do not create fake service rows to make IRS organizations appear in the existing resource view.

Before national writes, measure current Supabase storage/index headroom, connection limits and the existing hosting allowance; measure local free disk and memory. Project national database/index/backup sizes from 10K and 100K representative rows. Keep raw pages/XML private and off the public database. Do not assume that free source data makes storage or hosting unlimited, or silently buy capacity. If the current allocation cannot hold the projection, document the measured shortfall and reduce the serving projection/index cost before proposing a capacity change.

## 3. Publication rules: three separate decisions

| Output | Required evidence | Not required |
| --- | --- | --- |
| Organization search listing | Valid EIN, name and provenance from accepted IRS snapshot; resolved identity; suppression/status policy applied | Phone, website, service, taxonomy match, coordinates |
| Individual enrichment field | Field-specific rule passed, evidence retained, reuse permitted, no unresolved winning conflict | Every other field being complete |
| Map pin | Eligible address role, suitable address, acceptable geocoder match and coordinates; no confidentiality/mailbox hold | Verified service offering, if explicitly labeled an IRS-reported address |

Preserve the existing stricter approved-service publication contract, including comparisons and review. Introduce a separately documented directory policy; IRS identity evidence is enough for a registry listing, not an actionable service claim. Label registry entries as organizations and distinguish their tax/source status from operating status. Inactive/revoked records may remain discoverable with status labels; exclude them from default active-location results. Unknown status is not proof of current operation.

For each selected field, persist both its decision (`unknown`, `candidate`, `verified`, `conflicting`, `unavailable`) and its basis (`source_reported`, `provider_confirmed`, `derived`). A source-reported filing phone can be displayed as reported with its date without pretending we recently confirmed it with the provider. Unsupported inferred contacts remain private candidates.

Specific first rules:

- EIN/name: exact source identity; nine digits with leading zeroes preserved. Never merge by name, domain or address alone.
- Website: an organization website explicitly declared in an exact-EIN filing can be source-reported. Current official-site confirmation requires matching organization identity, no parking/sale signal and a safe resolved destination. Recent filing domain plus matching name and location, or explicit matching EIN, can establish identity without a phone. Conflicting shared-network domains are held for resolution.
- Phone: accept organization contact fields in an exact-EIN filing as source-reported; provider confirmation requires a contact page already matched to that entity. Never republish preparer/officer personal contact fields as public organization contacts.
- Description: retain dated mission/program text as source-reported. Publish a bounded excerpt or supported paraphrase; do not invent current service availability. Preserve multilingual source text.
- Categories: deterministic NTEE crosswalk may establish organizational subject categories, tagged with mapping version. A specific service category requires explicit service evidence. Allow multiple labels and no label; no catch-all category fabricated to satisfy a required property.
- Socials: provider-confirmed outbound profile links, scoped to the correct organization. Same-name profiles and unrelated footer links remain candidates.
- Logo: separate asset URL, source and observation from rights status. Only assets allowed by the published asset-use policy are rendered; use a neutral marker otherwise. Logo availability never gates search or pins.
- Relationships: publish parent/affiliate/chapter/branch links only from explicit evidence. Shared domains create research associations, not legal-entity merges.

Resolve competing observations by field policy, tax/source period, amendment/supersession and provider freshness. Do not let download order or a global source ranking decide every field. Equal-priority incompatible observations remain conflicting. Imported confidence numbers are not calibrated match probabilities.

## 4. Private schema changes

Add a versioned local migration in `NE/server/migrations.mjs`; extend `store.mjs` to apply it transactionally after a verified backup. Keep existing evidence/events and old job history. Proposed additions:

| Table | Key and essential columns |
| --- | --- |
| `source_snapshots` | `id`; source, version, URL/path, SHA-256, license/reuse decision, lineage, retrieved time, source period, completion/cursor, counts |
| `identity_observations` | `(snapshot_id, row_key)`; EIN, normalized fields, raw-row hash, source period; no duplicate observation on replay |
| `field_decisions` | `(ein, field, policy_version)`; selected observation IDs, value, state, basis, reason code, valid/observed time, decision hash |
| `stage_jobs` | Unique `(stage, scope_key, input_digest, policy_version)`; state, priority, attempts, lease owner/token/expiry, next retry, cursor, outcome |
| `domain_entities` | `(domain_key, ein)`; identity evidence and relationship scope; supports many EINs without merging them |
| `address_candidates` | Stable address ID; EIN, original and normalized components, role, address digest, source observation, eligibility/hold reason |
| `geocode_cache` | `(address_digest, provider, benchmark_digest)`; outcome, matched address, lat/lon, precision, receipt hash, observed time, retry time |
| `publication_batches` | Batch ID; target, policy, source/manifest hashes, state, counts, chunk cursor, authorization reference, timestamps |
| `publication_items` | `(batch_id, ein)`; proposed public digest, expected previous digest, chunk ID, result/error; private rollback reference |

Use existing `pages` and immutable evidence rather than introducing duplicate page/assertion stores. Index stage claims on ready state/next retry/priority, observations on EIN/field/period, and source deltas on snapshot/row hash. Do not write thirteen unresolved rows for every untouched EIN: derive untouched fields as unknown, persist actual attempts and decisions.

Migration acceptance: schema-1 fixture upgrades without lost evidence, second migration is a no-op, old claims cannot publish with expired tokens, and backup restoration reproduces counts and hashes. UTC throughout. Benchmark disk growth on 10K and 100K before estimating national storage.

## 5. Bulk ingestion and enrichment

Implement `NE/server/source-inventory.mjs`, `adapters/irs-bmf.mjs`, `adapters/irs-filings.mjs` and `bulk-runner.mjs`; extend rather than replace existing parsing.

1. Inventory existing files and receipts first. Record snapshot hash, schema, period, bytes and reuse policy. Reuse already downloaded archives. Quarantine changed files instead of resuming at their old cursor.
2. Stream the full BMF into transactions of 1,000 rows initially. Upsert current identity through dated observations, not `INSERT OR IGNORE` alone. Preserve aliases and conflicting identities. Invalid records go into counted quarantine with reason and source row.
3. Reconcile: `input rows = accepted rows + rejected rows`; account for duplicate EINs separately. Publish the distinct-EIN denominator, never the sum of regional files.
4. Enumerate all available filing indexes once; select needed filings by EIN, tax period and amendment. Download each required archive once, extract applicable returns in bulk and retain original provenance. Preserve amended-return ties for resolution. Unsupported forms and entities without full returns remain searchable.
5. Extract all available website, public contact, mission, program, classification and address fields in the same parse. Do not open the same XML separately for each field.
6. Update decisions only where input digest or policy changed. Queue only missing/stale/conflicting fields for more expensive work.

Add `adapters/giving-tuesday.mjs` only after checking the exact downloadable release, license, schema, provenance and date. Benchmark a prepared bulk cut against existing IRS parsing on the same 10K EINs: incremental fields, mismatches, CPU, elapsed time and downloaded bytes. Use it when it saves work; do not make 1.8M single-EIN API requests. Two redistributions of the same filing are one evidence lineage.

Starting source references: [IRS EO BMF](https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf), [GivingTuesday datamarts](https://nonprofitecosystem.givingtuesday.org/datamarts/), [AllThePlaces](https://github.com/alltheplaces/alltheplaces), [Overture Places](https://docs.overturemaps.org/guides/places/). Availability is not acceptance: the inventory records the exact release, permitted reuse and coverage before an adapter is enabled.

Adapter output contract: source snapshot ID, source record ID, EIN if supplied, field, typed value, source URL, source period, observation date, lineage, reuse decision and method. Reject unrecognized fields/types at ingestion. Network adapters cannot directly edit public records.

After exact-EIN data, evaluate AllThePlaces and US-only Overture partitions for incremental websites, contacts and physical locations. Use published downloadable datasets where permitted; retain provider IDs and attribution. Treat Wikidata as discovery and OSM as a separate licensed source requiring an explicit reuse design. NCCS geocodes are an optional benchmark after freshness/reuse checks. None of these integrations blocks IRS publication.

For records without EIN: block candidates using state/locality plus normalized name, domain or exact phone; cap at 50 candidates, abstain on overflow/ambiguity. Initially allow automatic links only when an evaluated deterministic rule establishes identity with corroboration; otherwise retain candidates. Shared national domains and shared buildings require entity-level evidence. Add probabilistic matching only if measured unmatched coverage justifies it; no guessed numerical confidence cutoff.

## 6. Address processing and pins

Implement `NE/server/addresses.mjs`, `adapters/census-batch.mjs` and `geocode.mjs` alongside bulk ingestion.

1. Preserve original address and classify role: filing, mailing, headquarters, service, unknown or confidential. Classify PO box/PMB/mail drop; flag care-of, accounting/legal agents and suspected residential/confidential addresses for pin review. Avoid equating a street address with a service site.
2. Build conservative normalized address digests including unit and Puerto Rico urbanization where present. Share geocoding results for the same address; never share organization identity because addresses match.
3. Skip geocoding mailbox-only, insufficient and confidential addresses. Keep those organizations in search. A city/ZIP centroid may support area filtering, never a precise organization pin.
4. Default to 5,000 unique addresses per Census batch, maximum 10,000; start with one in-flight batch. POST multipart `addressFile` and `benchmark` to `https://geocoding.geo.census.gov/geocoder/locations/addressbatch`. Persist input IDs, request hash and actual benchmark metadata before submission. Preserve CSV quoting and Puerto Rico components.
5. Parse returned IDs rather than trusting row order. Detect missing, duplicate and unexpected IDs. Check match status, house number/street/locality compatibility and valid longitude/latitude; ties and material mismatches remain held. Batch responses may need a matching helper different from single-address JSON.
6. Cache positive matches by address and benchmark snapshot. Cache no-match outcomes for 30 days; retry only on address/source/benchmark change or expiry. Start with a ten-minute total batch deadline and two transient retries with backoff; measure before increasing limits. A read-only batch retry is safe, but duplicate replies cannot duplicate evidence.
7. Store Census results as street-range/interpolated precision, not rooftop. An eligible filing address gets the visible label “IRS-reported address; service availability unconfirmed.” Provider-confirmed headquarters and service locations have different labels and filters.

Census supports up to 10,000 addresses per batch and calculates coordinates from address ranges. Its `Current` benchmark changes, so the cache must preserve retrieval/benchmark identity. [Official Census API documentation](https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html).

Do not use the public Nominatim endpoint as a national fallback. Do not infer a location from a phone area code. Geocoding success verifies an address match, not that the organization is still there.

## 7. Public storage and publication

Create timestamped migrations under `supabase/migrations/` following repository conventions. Proposed minimal public-serving additions:

- `nonprofit_directory`: EIN primary key; legal/public names and aliases; reported tax/status fields; city/state/ZIP; nullable website/phone/description; selected social/asset fields; organization category IDs; public field basis/source dates; optional link to an existing resource-map organization; record digest, policy version, revision, publication/suppression timestamps; generated search document. No raw evidence, job tokens or private reviews.
- `nonprofit_directory_locations`: deterministic location ID, EIN foreign key, typed role, eligible public address, PostGIS point, precision, public source/date and record digest. Multiple rows per organization; unique constraint prevents replay duplicates. Keep existing resource service locations intact.
- `nonprofit_publication_runs` and `nonprofit_publication_chunks`: private manifests, expected/current hashes, row counts, chunk outcomes and recovery state. Public roles cannot read or write these tables.

Use RLS and explicit column/row exposure. Anonymous users can read only published, unsuppressed directory fields through the serving interface. No anonymous writes. Publication functions must have a fixed search path, constrained execution privileges and server-only credentials. Add GIN full-text, exact EIN, locality and GiST location indexes; add trigram indexes only for the measured queries that need them.

Implement `NE/server/publication-policy.mjs`, `publication-plan.mjs` and `publisher.mjs`:

1. Audit every retained organization/field before new crawling. Produce private `eligibility.jsonl` with source-reported/verified publishable fields, directory eligibility, pin eligibility, service eligibility and exact hold reasons.
2. Build an immutable manifest containing target project, source/policy versions, proposed row digests, expected previous digests, totals and the existing authorization reference. Streaming manifest; do not load a national JSON array into memory.
3. Upsert through a bounded transactional server-only RPC, initially 1,000 organizations per chunk with a 2 MiB payload cap. Split by bytes when necessary. RPC records the chunk receipt in the same transaction as the data changes. Avoid one REST request per EIN. Consider COPY staging only if this measured path is inadequate and a suitable direct connection exists.
4. Apply one production canary chunk, reconcile written rows and public search/detail/pin results, then continue through the entire eligible manifest. The canary is an operational check, not a publication ceiling. Do not stop at ten records or wait for every profile to be complete.
5. On restart, ask the database for committed chunk receipts before retrying. Wrong target, policy mismatch, changed manifest or inconsistent counts stop the run. Individual bad records are quarantined with explicit counts; systemic errors pause the affected stage.
6. Rollback only rows whose current revision still matches this publication; restore prior values or suppress new rows without overwriting later corrections. Existing owner claims, manual overrides and suppression tombstones take precedence over imported fields.

Keep current verified-service promotion through its existing RPC and approval requirements. Directory publication is a separate rule set, not a bypass disguised as a service promotion. Update generated continuation policy at implementation time: its current blanket “no public publication” instruction is stale for the planned authorized workflow.

## 8. Search and map delivery at national scale

Extend `FI/types.ts` with a distinct organization result, nullable service category and dated field basis. Do not silently change the existing version-2 resource response contract. Add new directory search/detail/map endpoints, composed in `src/app/api/public/nonprofits/**/route.ts`; implement queries/validation in `FI/server/` and export through its feature boundary.

Proposed interfaces:

- `GET /api/public/nonprofits/search?q=&state=&category=&status=&cursor=&limit=50`: default 50, maximum 100; normalized query, deterministic ranking and keyset cursor bound to query/version. No expensive exact national count on each request.
- `GET /api/public/nonprofits/[ein]`: one public organization, its field source dates and eligible locations. Return existing resource detail links when available.
- `GET /api/public/nonprofits/map?bbox=&zoom=&types=`: bounded viewport query; at most 1,000 clusters/pins. Cluster across the complete filtered result before limiting; never truncate a raw set and present its clusters as complete. At low zoom use PostGIS grid aggregation, with cached/materialized grid summaries if measured plans require them; expand clusters at higher zoom. Handle antimeridian and invalid bounds.

Update `src/components/public/public-map-index/use-resource-map-items.ts` and the owning map/search presentation to request visible search pages and viewport data rather than loop through every directory page. Abort stale requests, debounce text input by 250 ms, and bound retained pages. Preserve existing approved resources and deduplicate linked organization presentations by explicit IDs/EIN. Do not deduplicate different services or legal entities merely because names match.

Keep the resource/organization distinction visible in search. Map filters distinguish service locations, headquarters and reported filing addresses. Search-only organizations remain selectable without manufacturing a marker.

Performance acceptance targets, not current measurements: test with a national-size staging dataset; first search response at most 250 KiB compressed; search p95 under 500 ms and viewport p95 under 1 second at ten concurrent readers on the declared environment, with warm and cold measurements separately. Check query plans and memory. No browser request chain that downloads the national catalog. No national map query that scans all location rows per pan without a measured acceptable plan.

## 9. Bounded crawler/scraper for the remaining gaps

Implement `NE/server/domain-jobs.mjs`, `page-extraction.mjs` and `crawl-runner.mjs`; reuse `crawl.mjs`, `crawl-links.mjs`, `crawl-network.mjs` and shared extraction helpers.

- Schedule one domain research job per normalized host and input/policy digest, with entity-specific evidence scopes. Reuse results across linked EINs only where the page identifies the particular entity/location. Keep strict host boundaries; do not broaden redirect permissions merely to increase coverage.
- Start at four concurrent distinct hosts, one request in flight per host, at least one second between requests or longer robots/retry instructions. One coordinator owns SQLite writes and leases. Keep a global network budget; there is no worker per nonprofit.
- First pass: homepage plus at most two useful contact/location/program pages. Retain the existing maximum of three provider requests per host and six network requests per organization/plan, including applicable overhead; persist host budgets across claims so shared domains cannot multiply them. A shared national directory needing more coverage gets a separately bounded source-specific adapter.
- Keep five-second DNS and fifteen-second request deadlines, 1 MiB page/256 KiB robots limits, three-redirect ceiling, SSRF protections and a ninety-second domain-attempt wall limit. Treat these as initial limits to measure, not guaranteed complete-site coverage.
- Fetch only URLs in a persisted bounded plan. The runner may create the next follow-up plan from retained links automatically, but it cannot fetch unplanned links. Plans record cache/parent hashes, budgets and policy. Existing `--confirm-plan` hashes remain integrity controls, not a demand for a new human question per organization.
- Extract deterministic JSON-LD/schema.org, contact details, service/location pages, social links and logo metadata. Support linked/nested JSON-LD nodes with depth/size caps; never fetch external JSON-LD contexts. Distinguish publisher, organization, location and person nodes. Treat scraped text as untrusted data, never agent instructions.
- Improve follow-up discovery for “services”, “programs”, “contact”, “locations” and “about”; deduplicate canonical URLs and skip calendars, endless query strings, donation/login flows and large assets.
- Cache normalized text, relevant snippets, typed signals, source URL, hashes, retrieval time, ETag/Last-Modified when supplied and extraction version privately. Use conditional fetches when eligible. Cache blocked/not-found outcomes with reasons; do not repeatedly hammer failures.
- Playwright is an optional final adapter only for measured high-yield JavaScript-only sites. No CAPTCHA bypass or national browser search loop. Codex's interactive web search is not assumed to be an unattended production API. Missing model/search/browser capabilities produce a resumable unresolved outcome, not a stopped national pipeline.

Initial priority: missing website/contact/service evidence on likely-match official domains, then stale evidence; include a separate unbiased evaluation sample so easy-site gains do not masquerade as national coverage. Record useful accepted fields per request, not just fetched pages.

## 10. Orchestration, recovery and refresh

Implement `NE/server/pipeline.mjs`, `metrics.mjs` and `evaluation.mjs`; extend existing `cli.mjs` with subcommands rather than add a new launcher.

Stage graph: `inventory -> import -> bulk-fields -> decide -> publish`. `addresses -> geocode -> decide -> publish` and `domain-plan -> crawl -> decide -> publish` consume changes independently. Extra bulk adapters feed the same decision stage. Publication is incremental; it never waits for all crawl jobs.

Jobs are keyed by stage + scope + input digest + policy version. Claims use atomic transactions, lease tokens and compare-and-set completion. Start with fifteen-minute leases and a heartbeat every minute; long downloads checkpoint progress. Expired work is reclaimed with a new token. Three transient attempts, exponential backoff and jitter, respecting Retry-After; robots/reuse/identity holds are reasoned outcomes, not endless retries. SIGTERM stops new claims, finishes or safely releases bounded work, and writes a checkpoint.

Proposed CLI contract (not available yet; paths in angle brackets are placeholders):

```text
pnpm resource-map:enrich-organizations inventory --output <new-inventory.json> --write
pnpm resource-map:enrich-organizations audit-publication --output <new-audit.jsonl> --write
pnpm resource-map:enrich-organizations migrate --backup <new-backup.sqlite> --write
pnpm resource-map:enrich-organizations plan-national --input <source-manifest.json> --output <new-run.json> --write
pnpm resource-map:enrich-organizations run-national --input <run.json> --network --confirm-plan <hash> --write
pnpm resource-map:enrich-organizations plan-publish --run <run-id> --output <new-publication.json> --write
pnpm resource-map:enrich-organizations publish --input <publication.json> --confirm-plan <hash> --write
pnpm resource-map:enrich-organizations report --run <run-id>
```

`run-national` defaults to private processing; publication requires its versioned target/policy manifest. Once a release is validated, the supervisor can create and apply subsequent manifests within the recorded authorized scope. Retain current `handoff`, `status`, `context`, `checkpoint`, `backup` and bounded research commands. Existing `init --all` still means identity import, not enrichment completion.

Persist config, stage cursors, source manifests, timing summaries, failure reasons and next runnable action under the existing state directory. Write CURRENT.json and RESUME.md after every completed chunk/stage and on orderly shutdown. Keep credentials in the existing environment, never in artifacts. Back up before migrations, daily during large runs and before public release; exercise restore on a copy. Check free disk before downloads and pause cleanly rather than fill the machine.

Refresh only affected records: changed IRS rows/returns, changed normalized addresses, changed pages, changed taxonomy or changed verification policy. Initial website revalidation window: 90 days; active crawl page cache: 30 days; retry unavailable discovery after 90 days unless source changes sooner. A removed IRS row alone does not prove dissolution. Propagate explicit withdrawals, revocations, owner corrections and suppression separately, preserving history.

An independent terminal/service process can continue without the chat; it cannot continue while this machine is asleep or offline. Document foreground and supervisor operation on the chosen existing host. Do not promise unattended uptime or install an OS service during the planning task.

## 11. Metrics and acceptance tests

Every report includes source snapshot and policy, distinct population, source dates, elapsed time and reason-coded exclusions. Count these separately: identities imported; organizations with useful added fields; source-reported fields; provider-confirmed fields; directory eligible; directory actually published; live searchable; pin eligible; live mapped; service eligible; services actually approved/published. Unknowns are expected, not failures.

Measure per field and source: coverage, new accepted values, conflicts, unresolved reasons, match errors, records/hour, bytes downloaded/retained, requests, cache hits, retries, CPU/RSS/disk and model use when present. Never report interactive AI effort as zero because the production model adapter is disabled. Compute ETA from remaining stage units and measured throughput; avoid promising a date before bulk and network benchmarks.

Create a deterministic 30K evaluation manifest stratified by state, return type/availability, size, NTEE and urban/rural data where available; put unknown strata explicitly in unknown. Include small/990-N organizations, ambiguous names, shared domains and stale records. The national exact-source pipeline does not wait for all 30K to be crawled.

For human review, export an initial 600-record sample spanning publication rules/sources plus targeted hard cases separately. Compute population estimates with sampling weights and uncertainty; do not treat targeted errors as an unbiased national rate. Target at least 99.5% identity/contact precision, report the interval, and hold unvalidated fuzzy auto-publication rules rather than claiming the target is already achieved. Assess category precision/recall against labeled data, not self-agreement. Manual review is calibration and release assessment, not a requirement to research each of 1.8M rows.

Focused tests to add under `NE/tests/`, through the existing runtime acceptance wrapper:

1. Migration/replay: restore old state, migrate twice, import same files twice; unchanged counts and decisions.
2. Source refresh: newer, older, amended and conflicting returns; leading-zero EIN; invalid row accounting; changed interrupted file rejected.
3. Field policy: website without phone can pass its rule; preparer phone, stale parked site, unrelated footer socials and NTEE-only specific service cannot.
4. Location: PO box, PMB, care-of, confidential, apartment, PR urbanization, ambiguous/mismatched geocode, reordered batch IDs and swapped lat/lon.
5. Queue/network: crash before/after chunk commit, expired/stale tokens, concurrent shared-domain claims, DNS rebinding, private redirects, slow/dripping responses, robots holds, 429 backoff and exhausted budget.
6. Publication: anonymous access restrictions, source-only listing without a service, no-coordinate listing, exact chunk replay, changed manifest rejection, suppression/owner precedence, partial failure and rollback that preserves a later update.
7. Search/map: stable pagination, nullable category/coordinates, linked-resource deduplication, no full-catalog browser fetch, filters applied before clustering, antimeridian and cluster totals.
8. Continuation: restart from another working directory using permanent state; resume after simulated process termination with neither lost nor duplicate results.

Add RLS tests for migrations, API/feature acceptance coverage and query benchmarks. Register new acceptance files in `tests/acceptance/projects.json` through the repository helper. Run focused checks per change; complete hosted quality and branch protection are release gates. No unrelated visual-baseline updates or preview deployments.

## 12. Delivery order and exact completion gates

| Build slice | Files/modules | Done when |
| --- | --- | --- |
| A. Audit existing work | `source-inventory.mjs`, `publication-policy.mjs`, audit CLI | Every existing identity assessed; all previously enriched records included; field/pin/service hold counts and source manifests saved, with no new browsing |
| B. Durable national bulk pipeline | `migrations.mjs`, `store.mjs`, `import.mjs`, IRS adapters, `bulk-runner.mjs` | Full frozen BMF reconciles; latest useful filing fields joined; interrupted replay does not duplicate evidence; measured 10K/100K resource use |
| C. Publish and search | Supabase migrations, publisher, `FI` API/types, search client | Entire eligible audited cohort published after canary; no-coordinate records discoverable; scalable queries and RLS pass |
| D. Geocode and display pins | Address/Census modules, directory locations, map queries/client | One 5K-address batch reconciled, all eligible results mapped with correct labels; remaining batches resume; no mailbox/centroid pins |
| E. Improve coverage efficiently | Domain runner/extractor, GivingTuesday/POI adapters | Measured new accepted fields per source/request; bounded crawl recovery and identity tests pass; improvements republish incrementally |
| F. National operation | Pipeline/report/evaluation/continuation modules | Full corpus has recorded bulk-stage outcome; measured unresolved remainder, source deltas, restore drill and cross-chat handoff work |

Check the stable continuation checklist and live state first; start A only if it remains unfinished. B and C share the agreed schema/policy; address normalization and Census adapter work can proceed once B's address contract is stable. Publish known-good existing evidence through C without waiting for E. Keep each code change reviewable; split a large slice into dependent PRs where needed. Reconcile against current main before opening release PRs; do not ship the preservation branch wholesale without checking its scope.

The first meaningful public milestone is **every eligible record already in our ledger**, followed by all eligible bulk-derived records. No arbitrary ten-place or 30K ceiling. The final bulk milestone is a reconciled outcome for every source EIN, not a claim that every field was found.

## 13. Next-AI entry point

Copyable instruction, valid at any population size:

> Continue Coach House nonprofit enrichment. Read AGENTS.md, the current runlog, open-work index and nonprofit enrichment runbook. Read `~/.local/share/coach-house/nonprofit-enrichment/RESUME.md` and CURRENT.json, locate the recorded code checkout, then run the live `handoff` command with Node 22.13 or newer. Use this implementation plan and the live stage ledger to choose the first unfinished dependency. Preserve the permanent database, live claims, evidence and source manifests. Do not infer progress from this chat or reset at a fixed milestone. Make source-backed records searchable independently of coordinates; create only eligible, accurately labeled pins; enrich with bulk joins before targeted crawling. Use existing publication authorization within the recorded target/policy scope, preserve resource-service approval rules, and report actual published/searchable/mapped counts separately. At the end, save a checkpoint with completed work, exact next command, failure reasons and release status. Never put credentials in the handoff.

Current working read-only entry command, from the recorded code checkout:

```sh
/Users/calebhamernick/.nvm/versions/node/v22.13.0/bin/node src/features/nonprofit-enrichment/server/cli.mjs handoff
```

This plan does not change the existing run state or enable publication by itself. Implemented policy, migration and live release evidence must back those steps.
