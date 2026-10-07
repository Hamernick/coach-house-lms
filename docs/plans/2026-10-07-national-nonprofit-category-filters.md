# National nonprofit category filters

Status: private mapping implemented and full corpus classified October 7, 2026. Public schema, backfill and filter release remain in progress.

This supplements the [national plan](2026-10-06-national-nonprofit-implementation-plan.md). Resume through [the stable continuation entry point](nonprofit-enrichment-continuation.md); do not restart identity imports, publication or filing enrichment. Existing background operators continue independently.

## Outcome

Selecting a category returns matching nonprofit organizations, including those without coordinates, alongside existing resources. Category browsing works without a typed query. Search, state, pagination and counts stay consistent. IRS organizational classifications do not imply that an organization currently offers a particular public service.

## Current implementation and measured gaps

- `src/components/public/public-map-index/search-panel-content.tsx` renders `NonprofitDirectoryResults` only for `activeGroup === "all"` and at least two search characters.
- `src/features/find-resource-index/components/nonprofit-directory-results.tsx` and its client currently accept text/cursor, not categories. The route/query/cursor contracts support query and state but no category.
- `src/features/nonprofit-enrichment/server/publication-policy.mjs` retains IRS NTEE codes privately. `directory-projection.mjs` does not export them. The serving table/search RPC has no category index.
- `category-filter.tsx` displays counts calculated from loaded resource items and disables zero-count categories. Those counts cannot describe the national directory.
- `src/lib/public-map/resource-categories.ts` already has 15 top-level categories. Faith, sports, recreation and arts exist under Community; nonprofit support contains grant-support/fundraising labels but no clear grantmaker category.
- A read-only count of the retained six BMF CSVs, deduplicated by EIN, found 1,957,340 organizations. Blank NTEE: 574,447; religion X: 204,365; arts A: 118,457; recreation/sports N: 113,170; philanthropy T: 105,079. These are organization counts, not verified service counts or current public totals. Nonblank codes include unknown/malformed values; nonblank does not mean safely mapped.
- IRS code definitions: https://www.irs.gov/pub/irs-soi/eo-info.pdf. Confirm detailed code meanings against this source when building the mapping; do not infer them from names.

## Six implementation steps

### 1. Define a versioned mapping and practical category navigation

Build the first mapping inside the existing nonprofit-enrichment feature. Reuse the canonical category registry and classifier where appropriate; do not create a competing vocabulary in the UI.

- Propose top-level Arts & Culture, Faith & Religion, Sports & Recreation, and Philanthropy & Grantmaking. Promote existing relevant leaves; preserve their stable IDs and old URL aliases. Keep nonprofit operational support distinct from grantmakers.
- Keep the frequently used service categories prominent. Put additional categories in an existing suitable overflow/popover pattern instead of widening the default row indefinitely. User reviews the working arrangement before visual baselines change.
- Preserve raw NTEE; normalize case/whitespace for matching. Use explicit detailed-code overrides before broad letter mappings. Record mapping version, source snapshot and basis `irs_classification`.
- Map only meaningful matches. Blank, malformed, unknown Z codes and unsupported groups remain unclassified; never force them into Community. Retain all organizations in All/text search.
- Treat a classification as an organizational topic. For example, medical research can match broad Health among organizations, but not Primary Care. Religion does not imply food assistance. Grantmaking does not imply applications are open.
- Save a coverage report: unique mapped/unmapped EINs, counts by category, unknown reasons and mapping collisions. Multiple labels are allowed only when supported; counts deduplicate EINs within each category and parent.

Done when: every mapping rule has a checked meaning, compatibility aliases are defined, and a reproducible coverage report exists. This is classification work, not another IRS identity audit.

### 2. Add an independent category backfill

Use an additive serving sidecar so the running identity publisher cannot erase categories or invalidate already confirmed identity manifests.

- Proposed `nonprofit_directory_categories`: EIN foreign key, category key, mapping version, classification basis, source version/evidence reference and UTC update time. Unique EIN/category assignment; index category/EIN for cursor reads. Keep private provenance out of public results.
- Add a target-bound category-write RPC with existing owner/staff/suppression protections. Reuse atomic publication receipt machinery only if its existing contract fits; otherwise use a small category-chunk receipt table keyed by batch/chunk with payload hash, outcomes and rollback values. Do not change historical identity receipt meanings.
- Enable and force RLS; no direct anonymous table access. Public reads join the existing visible-directory rules, including later suppressions and platform/curated duplicates.
- Generate immutable category manifests from retained source data, process bounded chunks, and save inserted/updated/unchanged/held outcomes. A lost acknowledgment replays safely. Unknown rows remain searchable without fabricated assignments.
- Categories for identities not published yet stay pending in the private backfill. Revisit those after identity publication; do not mark them completed or lose them.
- Mapping updates replace only that import's assignments with an expected-version check. Preserve owner corrections. Retain old mapping/manifests for selective rollback.

Done when: a bounded backfill can stop/restart, overlap ongoing identity publication safely, preserve manual changes and reconcile its outcomes.

### 3. Implement indexed category search and correct counts

Extend `src/features/find-resource-index/server/nonprofit-query.ts`, `nonprofit-routes.ts`, result types and additive SQL functions together.

- Accept validated category IDs and documented aliases. Support category-only browsing, category plus text/state, and All without requiring a fake search term.
- Include category, normalized query, state, taxonomy/contract version in cursor binding. Filter changes reset cursor; reject cursors from a different query. Keep bounded pages and stable EIN ordering.
- Match parent/child assignments with indexed joins and distinct EINs; avoid duplicate results for multiple labels. Preserve current anonymous visibility/suppression rules on every request.
- Counts represent the same query/state/visibility population as the results; facet counts ignore the currently selected category so alternative categories remain discoverable. Do not use the current page length as a total.
- Keep resource and organization count units explicit. Reuse server-side resource counts if they share the same scope; otherwise show separate totals until a combined result-count contract is available. Never add loaded/nearby resource counts to national organization counts and label the sum exact.
- Benchmark facets separately. Use versioned, bounded caching for expensive queries; global precomputed totals must not impersonate filtered totals. Suppress stale counts or invalidate affected caches after visibility changes. If a count is unavailable, omit it/show loading and keep the category enabled.
- Preserve old API compatibility during deployment; use a versioned response/cursor contract if required by the existing strict result schema.

Done when: national-sized tests prove bounded results, filter-consistent counts and acceptable latency while publication writes continue. Initial target: search API p95 below 500 ms in a declared benchmark, no timeouts; document actual provider/network conditions rather than claiming an SLA.

### 4. Connect the existing category controls

Primary owner is `src/components/public/public-map-index/category-filter.tsx`; the shared `src/components/ui/button.tsx` needs no category-specific modification.

- Remove the All-only rendering restriction in `search-panel-content.tsx`; pass selected category, text and state to the directory client.
- Permit empty-query category browsing in `NonprofitDirectoryResults`. Reset pagination on filters; cancel old requests so a slower previous category cannot replace newer results.
- Update category counts/loading/disabled logic in `public-map-index-filter-state.ts` and the filter component. Zero means measured zero, not absent/unloaded data.
- Keep existing resource cards and nonprofit organization results clearly identifiable. Show organizational category and a concise classification source where useful; do not imply provider verification.
- Preserve selected-category URLs, back navigation and old category aliases. Preserve pin behavior: an organization category alone never creates a map location.

Done when: selecting Food or Education displays matching organizations without typing, refined service filters avoid topic-only matches, and existing resource filtering still works.

### 5. Refine unresolved classifications through the running enrichment pipeline

- Do not delay the NTEE-backed release until all 574,447 blank-code organizations are classified.
- Classify retained missions/program descriptions and provider text incrementally for affected EINs. Reuse evidence hashes, filing dates and the existing taxonomy classifier; add rules only when measured examples justify them.
- Separate topic classification from current service evidence. Filing descriptions can support dated organizational topics; present-day service subcategories need the established service policy.
- Multiple supported categories are valid. Conflicts and insufficient evidence remain unresolved. Preserve raw IRS classifications when stronger evidence adds or supersedes a derived assignment.
- Reprocess changed evidence/mapping versions, not the entire national dataset. Track source-reported versus provider-supported assignments separately.

Done when: a newly enriched organization can gain or change category assignments through a repeatable delta without rerunning national import/publication.

### 6. Test, release and scale once

- Focused mapping tests: all major NTEE families, detailed overrides, lowercase/malformed/blank/Z codes, multi-label deduplication, parent resolution and old URL aliases. Review a small stratified set of classification examples, not millions of identities.
- Database tests: RLS, anonymous allowlist, owner/suppression/duplicate holds, category chunk replay/rollback, and identity/category writes in either order.
- API tests: empty-query category browse, query/state combination, changed-category cursor rejection, result/count consistency, no duplicated EINs and no private provenance exposure.
- UI regression tests: category-only results, stale request cancellation, pagination reset/back navigation, unavailable counts not disabling categories and existing resources remaining visible.
- Start with 5,000 categorized identities spanning mapping families; compare returned categories and counts, then advance through 50,000 and the remaining eligible corpus with the existing serving-health guard. This is a rollout gate, not a permanent publication cap.
- Implement shippable app/SQL changes in a fresh isolated release checkout from current main. Do not push the accumulated research branch. Suggested two small PRs: additive category data/search contract, then UI/navigation connection. Require current-revision GitHub quality and branch protections; no full local quality suite unless needed for a specific CI failure.
- Deploy additive database capability first, then compatible app, then backfill. A failure pauses category writes; rollback only matching category revisions and UI enablement. Preserve identities, contacts, enrichment and receipts.

Done when: deployed category browsing works against published national data, counts have a documented scope, unknown classifications remain searchable, and resume/rollback are documented with live evidence.

## Continuation checklist

- [ ] Versioned mapping, taxonomy navigation proposal and coverage report.
- [ ] Additive category storage, safe write RPC and receipt-based backfill.
- [ ] Indexed category search, bound cursors and honest facet counts.
- [ ] Existing filter UI connected, including category-only browsing.
- [ ] Incremental mission/program/provider classification.
- [ ] Focused validation, protected release, staged backfill and live verification.

Next implementation action: step 1. Existing data workers keep running. Before starting, read `ACTIVE-PUBLICATION.json` and `FILING-ENRICHMENT.json` under the permanent state directory; inspect live PIDs and completed receipts. This plan adds a category work package to the national effort and does not reset its progress. Update this checklist in place, the stable continuation entry point and the monthly runlog as steps complete.

## Step 1 execution checkpoint — October 7, 06:39 UTC

- Mapper: `src/features/nonprofit-enrichment/server/map-category-corpus.mjs`; independent SQLite output, source/rule hashes, atomic per-source checkpoints and repeat-safe completion. Existing research ledger and publishers untouched.
- Completed all 1,957,340 unique EINs (1,962,246 rows) in 108.947 seconds: **1,337,767 mapped; 619,573 unclassified**. Unclassified: 574,447 missing, 25,901 no suitable topic, 10,933 unrecognized core, 8,059 IRS unknown, 233 malformed. No public writes or service claims.
- Retained 645 core codes from the IRS November 2023 reference, including alphabetic endings. Raw codes/source row references preserved. Four new navigation groups remain proposed until the public registry ships.
- Durable locator: `<state>/CATEGORY-MAPPING.json`; report and database: `<state>/category-mapping-20261007/{report.json,classifications.sqlite}`. Do not repeat the completed run; new rules require new version/output.
- Five mapper tests pass: official-code/target validity, normalization and abstention, resume/replay, duplicate/conflict/provenance, changed-source rejection and failed-chunk rollback. Focused lint and structure pass.
- Public implementation checkout: `/Users/calebhamernick/Development/coach-house-platform-category-filters-20261007`, branch `feat/nonprofit-category-filters-20261007`, based on `209af15c`. Keep the private harness locator in the research checkout; never push its mixed history as the public release.
- Next: additive category storage and target-bound resumable writes, indexed search, then existing filter wiring. Navigation aliases and UI review remain part of step 1/4.

## Serving and backfill checkpoint — October 7

- Release checkout implements three additive migrations: category sets/index/receipts, target-bound compare-and-set writes with rollback, and four canonical topic groups. Anonymous RPC reads preserve suppression/curated-duplicate rules; private tables force RLS. Identity manifests remain unchanged.
- Existing public controls now support category-only browsing, category-bound cursors, and four topics under More categories. Existing leaf IDs/URLs survive promotion. Broad topics never satisfy service leaves. Unknown national counts are omitted; complete saved-map counts remain.
- Private backfill: `publish-categories.mjs`, immutable plans, saved preflight payloads, atomic RPC receipts, lost-ack replay, remote receipt reconciliation, pending-EIN retry plans. First plan `<state>/category-plan-50k-20261007`: 50,000 EINs / 200 chunks, last EIN `134162119`, batch `50348fa2-3cc1-4ac5-8dce-f86621e6448d`, manifest `530d33540388f89d8fd12f9b312c2bc886d774775dbfceb2e2bdb54e305e7d59`. Prepared only; zero category publication.
- National disposable PostgreSQL benchmark: 1,957,340 identities, 1,337,767 mapped organizations, 1,352,930 topic assignments. Ten concurrent readers; nine category query families p95 65.4–459.1 ms, all below the local 500 ms target. Category/index storage 518,774,784 bytes with identity-shaped records. No hosted-network, enriched-row or concurrent-writer performance claim. `<state>/category-national-benchmark-20261007.{json,log}`.
- Validation: five mapping tests; three publication-plan/replay tests; 92 targeted search/UI/taxonomy acceptance tests; disposable PostgreSQL access/write/rollback/visibility tests. Browser category-only Food→Faith→Arts navigation sends the correct filter; desktop/mobile no React errors or horizontal document overflow. Browser directory responses deliberately empty to test controls before schema deployment. No visual baselines changed.
- Next: finish release checks/review, deploy additive migrations before category client, publish one 250-record chunk, verify anonymous matches/absence from service leaves, then advance saved chunks and subsequent EIN plans. Pending identities require a new retry plan, not a false completed status. Category publication and evidence-based service refinement remain unfinished.
