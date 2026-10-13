# National nonprofit data: build plan

Status: implementation plan; bounded crawler improvements implemented locally, national pipeline not shipped. Updated October 5, 2026.

Execution detail: [October 6 implementation checklist](2026-10-06-national-nonprofit-implementation-plan.md) specifies files, schema, field/publication rules, batch sizes, APIs, crawler limits, recovery, tests and delivery gates. Use it for implementation; this document remains the overall strategy.

## Outcome and priority

Populate useful, evidence-backed data across the entire nonprofit corpus as quickly as possible, and make supported records searchable as work progresses. Map pins are also a required outcome wherever supported addresses can be reliably geocoded; only records without suitable coordinates remain search-only. Run bulk address processing alongside enrichment, not as a distant optional feature. Importing names alone is a foundation, not completion of the enrichment objective.

Run national identity ingestion and bulk field enrichment first. Do not make the entire corpus wait for website crawling, complete profiles, coordinates, or a 30,000-record research milestone. Use smaller batches to prove deployment and quality, not to cap the population. Continue toward richer records after publication.

“1.8 million” is the target scale, not a count to force. Freeze the actual source snapshot and reconcile all distinct EINs, exclusions, duplicates and invalid rows. Previously measured local IRS inputs contained 1,957,340 distinct EINs; recount before execution. A tax-exempt entity is not necessarily a public charity or currently operating service provider.

## Starting point, checked October 6 at 02:07 UTC

Live local handoff: 10,001 identities, 1,049 organizations with candidate enrichment, ten with verified website/phone pairs, 76 completed partial research passes, no active workers or unfinished imports. These are local research counts, not a fresh production census. The number eligible for publication remains unaudited; ten verified contact pairs is not a publication limit.

Reuse `src/features/nonprofit-enrichment/server/`: streaming identity import, IRS parsing, source hashes, SQLite evidence, claim fencing/retries, retained-page cache, verification, classification, backups and permanent continuation. Preserve all existing progress.

Gaps: direct bulk enrichment adapters; newer-source identity updates; independent field verification; source supersession; publication bridge; national server-side search. Current `--all` imports identities only. Current public resource queries require service records, and the browser progressively downloads pages. Neither is a national organization-directory implementation.

## Chosen architecture

Extend the current harness. Avoid a replacement framework or an AI browser loop per nonprofit. Buying enrichment is excluded. Bulk joins plus selective crawling offer the best testable path within the existing infrastructure.

```text
Immutable IRS + reusable bulk snapshots
                  |
          Normalize and join by EIN
                  |
       Private identities and field evidence
                  |
       Field checks and canonical selection
                  |
       Versioned public directory projection ---> bounded search
                  |
       Missing fields / ambiguous matches
                  |
       Cached domain extraction, then optional AI
                  |
       Incremental field updates; supported locations ---> map
```

Node remains the orchestrator. Keep SQLite for local durable work and Python for existing parsing. Add DuckDB/Parquet only for measured bulk-query needs; check installed equivalents first. Use existing Supabase/Postgres for public serving. No mandatory model key, paid enrichment service, new admin UI or distributed platform.

## Build sequence

| Order | Deliverable | Completion evidence |
| --- | --- | --- |
| 1 | Full-corpus inventory and publication audit | Every input row accounted for; exact EIN population; existing 1,049 records assessed field by field, with reasons for holds |
| 2 | National identity import, bulk enrichment and address processing | All eligible identities imported; filing fields joined; street/PO-box classification, address deduplication and bulk geocoding underway without individual browsing |
| 3 | Public directory projection, scalable search and map delivery | Supported organizations searchable without complete profiles; suitable geocoded addresses produce clearly typed pins; public field allowlist and source dates verified |
| 4 | Additional bulk data and matching | Measured incremental field gains from provider directories, AllThePlaces/Overture and other permitted sources |
| 5 | Automated missing-field processing | Bounded domain workers, field-specific checks, optional reasoning, resumable publication of improvements |
| 6 | Continuous refresh and full-corpus operation | Source deltas, withdrawals, backups, metrics and recovery work independently of chats/worktrees |

Begin the search/publication implementation while bulk processing runs. Do not wait for every adapter or every field to be complete before releasing useful data. Release code in small PRs; required hosted quality and branch protection still apply.

### 1. Inventory, audit and explicit publication rules

- Back up the current ledger. Identify actual input paths, byte hashes, dates, geographic/exemption coverage and current production EIN matches. Keep existing account-owned `organizations` untouched.
- Audit retained evidence for all 1,049 enriched organizations without new browsing. Report usable fields and missing implementation/review separately from weak evidence. Promote eligible fields independently; a missing phone must not invalidate a verified website.
- Define three independent eligibility results: directory listing, service listing, physical pin. A directory listing needs a supported EIN/name identity, source snapshot, allowed public fields and no identity/suppression conflict. Missing enrichment fields remain null.
- Label IRS-derived facts as reported in the dated source. A filed website can be retained as a historical assertion; do not present an unchecked old URL as the current official website. A filing date is not a website verification date.
- Current service publication requires provider evidence, separate comparison passes and identified administrator approval. Implement a separate bulk registry-listing policy for IRS-backed organization facts; do not fabricate services, human approvals or verification timestamps to pass the existing service gate. Record authorization and policy version once per exact publication manifest, with automated row validation.
- Preserve organization type and source-reported status. Do not equate a missing annual filing, an old revocation entry or absence from one snapshot with current closure. Reinstatements and source conflicts need explicit resolution.

### 2. Full import and highest-yield fields

- Use the existing streaming importer against every selected immutable IRS input. Retain leading-zero EINs and source-to-row provenance. Process bounded transactions; resume from checkpoints. Quarantine malformed rows with reasons instead of losing an entire national run.
- Replace first-observation-wins identity behavior with versioned observations and deterministic precedence. Newer sources must not overwrite protected corrections or erase earlier evidence. Bulk import remains separate from expensive research jobs.
- Join existing/recent IRS 990, EZ and PF data by exact EIN. Assess 990-N bulk fields for small organizations as well. Preserve amendments and reporting periods; do not make multiple copies of a filing look like corroboration.
- Evaluate GivingTuesday prepared datasets on a fixed cohort against our parser: field yield, recency, provenance, license, bytes and end-to-end time. Use whichever covers the required fields more efficiently. Do not make 1.8 million per-EIN API requests or block on a third-party adapter when local IRS parsing already works.
- Extract legal/alternate names, reported website/phone, filing location, mission and program text, NTEE and organization relationships where directly supported. Keep reported organization categories distinct from claims about current services.

### 3. Minimal public schema and search

The inspected schema already has `resource_map_organizations.ein` with a unique partial index, aliases, contacts, source metadata and text search. Its public view joins published services. Reuse existing resource entities for verified service records; do not create dummy services for registry organizations.

Proposed minimum additions, finalized against live schema before migration:

| Component | Purpose |
| --- | --- |
| `nonprofit_directory` | Rebuildable public projection keyed by EIN: legal/display names, aliases, source-reported type/status, filing locality, supported enrichment fields, source dates, optional linked resource organization ID, search vector and publication version; nullable primary `geography(Point,4326)` with location role, geocode precision/source and a spatial index. Additional verified service locations reuse the resource location model |
| `nonprofit_publication_runs` | Private manifest hash, source/policy/code versions, expected counts, chunk checkpoints, applied counts, rollback references and authorization audit |
| Local ledger migrations | Versioned identity observations, stage-specific jobs and canonical field decisions linked to existing evidence; do not replace the ledger |

The directory is a projection of retained evidence, not a second independent identity authority. Exact EIN links it to existing resource entities; service records without resolved EINs remain separate. Resolve name-only possible duplicates before linking. Respect existing suppression and owner corrections.

- Create a private bulk staging path and atomic, idempotent chunk merge. Prefer `COPY` through existing authorized database connectivity; otherwise use bounded batch RPCs. Never one REST request per organization. No new paid database tier assumed.
- Public projection uses an explicit allowlist. Raw filings, officer/person contacts, private notes, tokens and source-download endpoints stay private. Filing locality may appear as mailing geography; exact residential/confidential addresses must not become public service pins.
- Enforce RLS and server-side write authorization; public reads see published projection fields only. Unknown fields never become default guesses. Publish by exact manifest with preflight counts, resumable chunk receipts and post-write reconciliation.
- Extend `find-resource-index` with a typed organization result and bounded server-side queries: name/EIN, aliases, city/state/ZIP, organization category and separately evidenced service categories. Stable cursor includes sort and filter identity; unique tie-break by EIN/ID.
- Use Postgres full-text search, exact/prefix indexes and `pg_trgm` where measured useful. Never fetch the national catalog into a browser. Build bounded PostGIS viewport queries and server-side clustering alongside search so bulk geocoded records can appear on the map from the first rollout.
- Load-test the full-size projection before activation. Initial proposed budgets: 50 results/page, p95 server query under 500 ms at a declared concurrency, initial response under 250 KB compressed. These are test targets, not current measurements. Check disk/index space and existing hosting limits first.
- Prove the complete path on a small deployment canary, then 10,000 records, then bounded national chunks as checks pass. Report actual distinct searchable EINs; 10,000 is a rollout checkpoint, not the user's target or a cap. Rollback withdraws only the affected version and preserves newer corrections.

### Bulk addresses and map pins

The [IRS BMF field dictionary](https://www.irs.gov/pub/foia/ig/tege/eo-info.pdf) includes STREET, CITY, STATE and ZIP. These do not include latitude/longitude. [Form 990 instructions](https://www.irs.gov/instructions/i990) allow PO boxes and care-of addresses for third parties such as accountants or attorneys. Therefore a geocoded street address establishes a reported address, not automatically an operating headquarters or walk-in service.

1. Normalize and classify all reported addresses during bulk import. Exclude PO boxes, private mailboxes, known mail drops and confidential/suppressed locations from physical pins; retain useful mailing data separately. Flag care-of/third-party addresses for location review rather than labeling them service sites. An organization with a PO box can still acquire a pin later from another supported physical address.
2. Deduplicate address queries, reuse licensed existing coordinates only for matching address versions, then submit unresolved street addresses through bounded free Census batches. Cache positive/negative results by normalized address, source version and geocoder version. Keep match status, precision and original/matched addresses.
3. Publish suitable matched addresses as `filing` pins labeled **IRS-reported address** with source date. Use `headquarters` or `service` only with supporting evidence; service searches and visit/directions messaging must respect the distinction. Never assign a PO box to a post office or turn a city/ZIP centroid into a precise organization pin.
4. Preserve no-match/ambiguous results for later enrichment. Keep these organizations searchable. Count searchable organizations, geocoded addresses and published pins separately, including exclusions by reason.

### 4. Bulk sources that add data beyond IRS

| Source/tool | Intended use | Adoption condition |
| --- | --- | --- |
| [GivingTuesday Data Marts](https://nonprofitecosystem.givingtuesday.org/datamarts/) | Prepared filing data and mission/program text | Reproducible field mapping, freshness, provenance and permitted reuse; compare with current parser |
| [AllThePlaces](https://github.com/alltheplaces/alltheplaces) | Published official-directory location extracts and reusable scrapers | Measure nonprofit overlap; preserve original provider source; data CC0/software MIT |
| [Overture Places](https://docs.overturemaps.org/guides/places/) | Websites, phones, socials and location candidates | Download only relevant partitions/columns; preserve source licenses and attribution; validate entity matches |
| [NCCS address metadata](https://nccs.urban.org/nccs/datasets/metadata-address/) | Existing geocodes and address-match metadata | Verify release/license and exact address vintage; filing-location evidence only, not proof of service location |
| [Splink](https://github.com/moj-analytical-services/splink) | Rank cross-source matches without EINs | Add only after exact joins leave measurable gaps; calibrate against independent labels |
| [Extruct](https://github.com/scrapinghub/extruct) | Website JSON-LD/Microdata/OpenGraph extraction | Benchmark against existing extractors before adding a dependency |

Add one adapter at a time using the same normalized assertion contract: EIN or unresolved match, field/value, source record, original source, snapshot/hash, observation/reporting date, extraction method/version, reuse terms and identity evidence. Reject unsupported schemas and preserve adapter error counts.

Match exact EIN first. For sources without EIN, restrict comparisons using several passes over locality/name, phone and domain; avoid all-pairs comparisons. Shared addresses/domains and affiliate names are not unique identifiers. Keep parent/affiliate/chapter relationships rather than merging legal entities.

AllThePlaces feeds Overture, and GivingTuesday republishes IRS material. Record original-source lineage so copied records do not count as independent confirmations. Location matching and organization matching are separate decisions.

### 5. Missing-field workers and verification

- Schedule by expected useful fields per second, coverage gaps and refresh need. Keep a fixed representative evaluation cohort separate from the high-yield production queue. The 30K cohort measures enrichment and rollout quality; it does not gate full-corpus identity import/search.
- Claim domain jobs once for shared sites; reuse responses and extract several fields per request. Visit contact/about/program/location pages selectively. Preserve robots, SSRF/DNS protections and source-specific limits.
- Add absolute DNS/connect/body deadlines and phase timing before raising concurrency. Start with bounded cross-domain concurrency and shared per-host pacing; tune from measured network and database pressure.
- Verify each field independently. Maintain unknown, candidate, verified, conflicting and unavailable states, plus publication eligibility and source freshness. Numeric model scores are not calibrated probabilities.
- Give optional AI only retained ambiguous evidence, a bounded task and narrow tools. Validate citations and values in application code. Stop after source/request/time budgets; unknown is a successful outcome. Do not rely on interactive Codex search as an unattended bulk API.
- Version taxonomy and evidence-based multi-label classification. NTEE supplies an organization classification/prior; it never proves a particular service. Preserve unsupported/ambiguous categories as private candidates.
- Run the bulk address/pin track above alongside field enrichment; coordinates do not block search. Crawl for physical locations when filings supply only a PO box or an unsuitable address. Logos need asset provenance and separate usage status; discovering an image does not authorize display.

### 6. Continuous operation, metrics and recovery

- Add a stage runner over durable jobs: ingest, join, verify, project/publish, enrich, refresh. Retry only transient failures, use backoff, recover expired leases and fence stale workers. Transactional acknowledgments and idempotency prevent duplicate writes after crashes.
- Reprocess changed source records and affected fields only. New contradiction/removal must supersede old approval and propagate to the public projection. Keep historical evidence; distinguish a source disappearing from an organization closing.
- Persist per-source cursors, manifest hashes, job state, policy/code versions, field coverage and publication receipts outside worktrees. Extend existing `RESUME.md`/`CURRENT.json` generation to identify the next stage and publication state; update obsolete blanket “no publication” continuation text through an explicit versioned policy change, not manual ledger edits.
- Support a normal local runner independent of chat duration, with logs and stop/resume controls. Closing chat does not require restarting work; machine sleep/offline pauses local execution. An always-on existing host is an optional later deployment, not an assumed free resource.
- Measure imported, candidate-enriched, verified-field, searchable and mapped distinct EINs separately. Track per-field current coverage, conflicts/unknowns, source overlap, net-new useful fields/hour, records/hour, bytes, requests, cache hits, retries, model usage and elapsed operator effort. Derive public counts from real publication receipts/database reconciliation, not existing hardcoded zero counters.
- Estimate completion time after the first timed bulk pass using remaining rows and measured stage rates. Website enrichment cannot honestly promise complete coverage; publish a decreasing unresolved remainder.

## Tests and release gates

Use focused checks for the behavior in each PR. Include leading-zero/duplicate EINs, malformed rows, newer filings/amendments, shared-domain affiliates, copied-source correlation, stale/conflicting fields, confidentiality, identity-vs-service distinctions, no-coordinate search, public allowlists/RLS, replay, chunk failures and worker crash recovery. Test an interrupted import/publication followed by restart and prove no omissions or duplicates.

Use independently labeled stratified matches and difficult negatives to measure false entity matches and field/category precision with uncertainty. Freeze a holdout before tuning. New probabilistic matches remain private until their rule clears its evaluation gate; exact IRS identity publication does not wait for fuzzy matching research.

Reconcile manifest counts, unique EINs and public API/search results after each rollout wave, including early/middle/late corpus records. Verify records beyond the former browser pagination limit. Build/test on a clean current-main release branch when shipping; this planning lane is four commits ahead/four behind the locally recorded `origin/main`. Preserve the current state and unrelated worktrees.

## First implementation slice

1. Audit the existing enriched cohort and freeze the full IRS inventory.
2. Implement versioned national import, bulk filing enrichment, address classification/deduplication and geocoding with exact coverage reports.
3. Build the directory projection, batch publisher, server-side search and bounded map delivery together.
4. Release supported data in increasing chunks while enrichment continues.
5. Add the next adapter only when its benchmark demonstrates useful incremental coverage.

This plan supersedes the older “30K enrichment before national catalog” order. It does not claim the proposed national commands, schema or publication path already exist. On the user's subsequent crawler instruction, implemented `plan-crawl --follow-links`, parent-evidence binding, homepage preservation, cached replay, DNS/request deadlines and timing receipts; see the runbook. No production writes, new dependencies or large downloads were performed.
