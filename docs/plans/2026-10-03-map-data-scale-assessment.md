# Map/data: 30,000 organizations, then national coverage

Date: 2026-10-03. Status: assessment and proposed execution plan; no acquisition or publication launched.

Updated after review of the external proposal: [implementation decisions](2026-10-03-map-data-harness-review.md). No paid enrichment/search/geocoding/data services. The 30,000 milestone counts enriched organization profiles; verified services and public publication are separate measures.

## Workstream

Reactivate the existing `H-ACQUISITION` lane as **Map/data acquisition and scale**.
Do not create a competing acquisition lane or reopen unrelated Find UI work.

- Active worktree: `/Users/calebhamernick/Development/coach-house-platform-map-data-scale-20261003`.
- Branch: `feat/map-data-scale-20261003`, based on freshly fetched `origin/main` `29de1fe1`.
- Preserve root `chore/local-development-20260907` at `e5799298`, its existing dirty handoffs, servers and private datasets.
- Preserve enrichment worktree `coach-house-platform-resource-map-enrichment-20260831` and crawler repair worktree `coach-house-platform-pr231-stack-repair-20260910`.
- GitHub checked this session: [PR #231](https://github.com/Hamernick/coach-house-lms/pull/231) remains open, draft and unmerged at `ad4c5541`. Its historical checks do not establish readiness against current main.
- This assessment used the root's acquisition implementation and saved private artifacts, compared with current main. The new worktree contains documentation only; acquisition commands are not yet available there.

## Recommendation

Keep the existing safeguards and schema. Invest first in reusable bulk source adapters, joins by EIN, completion of evidence-backed locations, and efficient publication review. Use crawling for gaps. Use AI only where retained evidence is ambiguous.

Maintain two distinct coverage measures:

1. **Organization coverage:** unique nonprofit identities, deduplicated primarily by EIN. Long-term nationwide organization search can include entities that do not offer direct public services, but needs an explicitly designed registry listing policy and presentation.
2. **Resource coverage:** verified services, access instructions and supported locations/service areas. Only these pass the existing resource publication contract. An IRS mailing address must never silently become a service pin.

For the first milestone, target **30,000 distinct enriched nonprofit organization profiles**, and report verified fields, searchable profiles, services and locations separately. A direct public service is not required for organization enrichment. Libraries, government services and multiple branches remain useful resources but cannot inflate the nonprofit-organization count. A registry-only searchable tier is a separate product/policy decision; this plan does not weaken `/find` admission rules.

Planning assumption pending Caleb's preference: nationwide service diversity with additional depth in priority regions. No geographic acquisition allocation has been executed.

## Evidence from this assessment

These are exact saved-input results, freshly inspected or recomputed, not live database counts. Do not add overlapping datasets together.

| Dataset/stage | Observed result | Interpretation |
| --- | ---: | --- |
| Six local IRS CSVs, downloaded August 24 | 1,962,246 rows; 1,957,340 unique EINs; 4,906 duplicates | Full identity base; not verified resources |
| Existing direct-service shortlist | 824,706 identities in import manifest | Heuristic prioritization; not the national population |
| Weighted benchmark | 10,000 identities; 1,560 state/NTEE strata | Cohort and 20,000 identity-event hashes reproduced by fresh read-only planning |
| Saved research ledger | 98 results: 38 evidence fetched, 8 website matched, 52 held | Stage completion, not public-record completion |
| Private drafts | 46; all publication-blocked | 36 with service candidates, 30 access, 9 eligibility, 18 service-area candidates; 0 service locations/coordinates |
| `public-resource-map-preview.jsonl` | 942 records; 0 complete; 0 verified; 0 audit-publishable | Saved food/housing/immigrant-resource cohort |
| `source-family-plus-brooklyn-preview.jsonl` | 5,046 records; 741 complete; 741 verified; 741 audit-publishable | Saved audit flags; current evidence freshness and administrator/publication state still require reconciliation |
| Source registry | 30 configured sources | Many weather-relief feeds; insufficient diversity for the national goal |
| Production population | Not measured this session | Must reconcile distinct organizations/services/locations before setting net-new targets |

The 5,046-row file has title/category/location/source presence on all rows, 3,091 service/access, 3,054 summary, 3,625 contact/link, 1,752 eligibility, and 1,668 two-comparison passes. Presence checks do not prove field accuracy. Its 741 audit-passing rows include 81 library records and 660 weather-relief records, not 741 distinct nonprofits. Seasonal records require current availability checks.

The [IRS currently reports 1,964,958 records, posted September 8, 2026](https://www.irs.gov/charities-non-profits/exempt-organizations-business-master-file-extract-eo-bmf). That is a newer source snapshot than our August files, not a freshly deduplicated application count. Define the target universe by snapshot, exemption types, geography and status; “1.8 million” is a strategic approximation, not a fixed denominator. The IRS explicitly says filing geography may differ from operating geography.

## Infrastructure: reuse and gaps

| Area | Reuse | Required next work |
| --- | --- | --- |
| Public data model | Existing `resource_map_organizations`, services, locations, contacts, field evidence and curation tables; PostGIS location index and text-search columns | Keep imported identities separate from account-owned `organizations`; establish durable EIN/external-ID crosswalks and source precedence |
| Source ingestion | CSV/JSON/XML/Socrata/ArcGIS connectors, source registry, normalization, geocode cache, source-specific enrichment and audits | Prioritize sources by net-new nonprofit yield and field quality; add bulk filing-to-website joins and high-value directory adapters |
| Research controls | Deterministic benchmark, append-only logical state transitions, 25-record packages, leases/retries/dead letters, source/evidence hashes | 26 acquisition script files are absent from current main. Port only reviewed dependencies, commands and tests; do not merge the mixed historical stack wholesale |
| Discovery | Cache and authoritative-directory adapters, provider identity checks, bounded service evidence | Domain discovery and structured service/location extraction remain incomplete; social links and search snippets are insufficient |
| Crawler | Exact-plan gates, robots, network destination checks, byte/request caps and resumable receipts | Serial requests within a plan; no demonstrated national throughput. Prove a tiny live run, then bounded concurrency across domains with shared host pacing |
| Private persistence | Portable JSONL inputs/exports and receipts | Shared helpers read/rewrite whole JSONL files, including `appendJsonl`. Avoid growing concurrent whole-file mutations; use a transactional local work ledger first, partitioned immutable artifacts, and a multi-worker queue only when warranted |
| Provenance | Plan/evidence hashes and timestamps | Benchmark source fingerprint currently hashes path/size/mtime metadata, not source bytes. Add content SHA-256, parser/policy versions and source snapshot IDs. Hash consistency is not an approval signature |
| Publication | Separate evidence comparison, administrator review and promotion gates | Measure reviewer capacity and create bounded evidence packets with exact record IDs; no automatic approval |
| Map/search delivery | Sanitized cursor-paged index and detail-on-demand; existing spatial/text indexes | Browser still walks every page. Introduce server-filtered viewport/search/category queries, bounded results and clustering; avoid downloading the national catalog |

Serving detail: the older full-resource helper caps results at 5,000, but the current `/find` cursor route can read beyond it. `/find` requests 200 items/page and the client stops after 200 pages: about 40,000 resource items, potentially fewer organizations because one organization can have multiple services. Even 30,000 items require about 150 sequential page requests. Raising caps alone is not the scale solution. The current cursor query also requests an exact count per page; design cached, filter-consistent counts and stable paging semantics.

Code anchors: `scripts/resource-map/lib/irs-eo-{benchmark,work-packages,owned-crawler,private-drafts}.mjs`, `scripts/resource-map/lib/data-engine/shared.mjs`, `src/lib/queries/resource-map-public-items.ts`, `src/components/public/public-map-index/use-resource-map-items.ts`, `src/features/find-map/components/public-find-route.tsx`, and `supabase/migrations/20260625214500_add_resource_map_catalog.sql`. Acquisition files refer to the preserved root until ported.

## Efficient acquisition strategy

Run three coordinated paths against one entity crosswalk and evidence store:

1. **Bulk identity and website discovery.** Refresh IRS snapshots once, stream/deduplicate by EIN, and compare changes. Join the newest applicable [IRS Form 990 XML filings](https://www.irs.gov/charities-non-profits/form-990-series-downloads) by EIN. Extract filed website and mission/program candidates deterministically; record filing year and amendments. [Form 990 instructions](https://www.irs.gov/instructions/i990) identify the website as current at filing time, so confirm present ownership before trusting it. Measure coverage; many organizations lack suitable recent filings.
2. **Directory-first service acquisition.** Ingest structured, reusable provider/government feeds. Rank each source by expected distinct eligible organizations added, completeness, freshness, overlap, permission and maintenance effort. Reuse food-bank and community-service adapters; evaluate HRSA health sites, permitted 211 feeds, legal aid, workforce, housing and family-service directories. Do not assume public browsing grants bulk reuse rights or that all directory providers are nonprofits.
3. **Targeted evidence completion.** Reuse cache, then fetch the confirmed provider and only relevant service/access/location pages. Deduplicate fetches across organizations sharing a site. Stop on sufficient evidence or budget exhaustion; retain explicit unknown/held reasons. Search/rendered browsing comes last. Optional model output must cite retained field evidence and pass independent verification; model calls remain disabled by default.

Useful source candidates:

| Source | Benefit | Boundary |
| --- | --- | --- |
| IRS BMF + 990 XML | Broad entity coverage and inexpensive bulk website candidates | Identity/filing evidence, not proof of current service availability |
| [HRSA service-delivery data](https://data.hrsa.gov/topics/health-centers) | Structured nationwide health locations; HRSA describes over 16,200 sites | Sites are not unique organizations. Separate administrative/service locations and verify nonprofit identity |
| [HRSA download terms and metadata](https://data.hrsa.gov/data/download?titleFilter=Health+Center) | Published refresh/usage information | Preserve suppressed shelter addresses; never reconstruct them through geocoding |
| [211 data platform](https://211.org/about-usblog/how-will-national-211-data-platform-support-public-health-0) | Rich service/access/eligibility information | Proprietary network data; confirm access and permitted reuse before bulk acquisition |
| Current food-bank/local government/provider directories | Existing extraction patterns and actionable services | Deduplicate branches and overlapping feed coverage; verify current provider evidence |

Model organization, service and location separately, consistent with [Open Referral HSDS](https://docs.openreferral.org/en/v3.3.1/hsds/overview.html); adapt the existing schema rather than replacing it wholesale.

Geocode only supported public physical service addresses, reusing source coordinates when valid. [Census supports batches up to 10,000 addresses](https://www.census.gov/programs-surveys/geography/technical-documentation/complete-technical-documentation/census-geocoder.html); evaluate match quality on the pilot; use only permitted free alternatives or retain unresolved coordinates. Store precision and provenance. PO boxes, confidential addresses and virtual/service-area-only resources must not acquire fabricated physical pins.

## Data-science evaluation

Keep the **measurement cohort** separate from the **production acquisition queue**. The latter should favor expected useful yield and coverage gaps; it cannot support unbiased national projections.

- The existing benchmark balances 1,560 state/NTEE strata. Use `populationCount / sampleCount` weights; their sum is 1,957,242 previously unresearched identities. Historical 98-record results belong to a different selection process and are not a national success-rate estimate.
- A diagnostic from the saved weights gives `(sum w)^2 / sum(w^2) = 1,359.5`. This is a weight-dispersion diagnostic, not the actual precision of any measured outcome. Do not advertise the precision of a simple random sample of 10,000. Collapse sparse strata or allocate additional proportional samples after the first measurement; retain coverage of small/rural/unclassified populations.
- Freeze a held-out, independently reviewed sample before tuning extraction/matching rules. Measure incorrect entity matches, unsupported service claims, address errors, duplicate entities, stale availability and category errors. Report uncertainty by source and major cohort; investigate failures before scaling that source.
- Measure the full funnel: unique identities, matched websites, fetched evidence, each required field, field-complete, independently verified, administrator-approved, published organizations, services and locations. Keep records with unknown EINs out of the confirmed nonprofit denominator until resolved.
- Record per-stage HTTP requests, downloaded/retained bytes, cache hits, retries, wall/CPU time, model tokens/cost if enabled, and reviewer minutes. Report costs per **net-new approved organization**, not per fetched page.
- Exact EIN match is strongest. Exact supported name/state and corroborating provider evidence can generate candidates; ambiguous shared domains, affiliates, fiscal sponsors and renamed entities require resolution. Fuzzy matching may rank review candidates, never automatically merge them.
- Refresh by source cadence and evidence risk. Retire or hold closed/stale services; a removal from one registry alone does not establish organizational closure. Use conditional requests/content hashes and reprocess only changed evidence.

The benchmark was rerun dry-run against all six CSVs this session. Output hashes matched the saved cohort (`223d1b29…ceb8ec`) and event ledger (`edee1701…f82d85`); no network, AI, research-state, database, review or publication writes occurred.

## Phased delivery

| Phase | Deliverable | Exit evidence |
| --- | --- | --- |
| 0. Reconcile | Scoped acquisition port; fresh source hashes; read-only live count reconciliation; exact entity/service/location denominator | Runnable tools on current main base, reproducible offline benchmark and separate live/saved counts |
| 1. Calibrate | Small 25-record crawler canary; 250-record stratified operational pilot; source-adapter samples | Network/cache/retry accounting, independently checked identity/fields, location coverage, elapsed cost and reviewer capacity; no broad crawl |
| 2. Prove repeatability | 1,000 eligible candidate organizations across multiple source families, retained separately from held-out evaluation | Idempotent replay, no duplicate identities, exact failure reasons, complete evidence packets and source-specific quality estimates |
| 3. Reach 30,000 | Measured source waves, first 5,000 then 10,000 then 30,000 distinct enriched nonprofit organization profiles | Gates pass for each batch; source/geographic diversity measured; approved public rows reconcile with API/search/map |
| 4. National catalog | Full identity index, ongoing source deltas, economical enrichment tiers, approved registry-search presentation | Search works without direct-service claims; verified services remain separately evidenced; no full-catalog browser downloads |

Before public scale, extend `find-resource-index` with bounded server-side filtering and spatial clustering. Keep PostgreSQL/PostGIS initially; assess query plans and realistic load before adding a search service. Benchmark isolated 30k/100k/million-scale fixtures outside public preview with target p95 query latency under 500 ms and compact initial responses under 250 KB compressed (proposed budgets, not measured results). Validate privacy, cursor consistency, count semantics, mobile behavior, source withdrawal and rollback.

Focused implementation checks should cover entity matching/duplicate branches, location evidence and confidential-address suppression, cache reuse/expiry, lease retry/resume/idempotency, no raw/private data in public responses, source-specific extraction and publication gates. Required hosted quality/review remain release gates; no full local quality suite is needed for this assessment.

## Capacity and cost: measure before committing

There is no credible delivery-date or dollar estimate until the pilot measures yield and review effort. Illustrative arithmetic, not forecasts:

| Net approved organization yield from candidates | Candidates needed for 30,000 net-new organizations |
| --- | ---: |
| 75% | 40,000 |
| 50% | 60,000 |
| 25% | 120,000 |

Use `remaining target / measured net-new yield`, accounting for overlap, ineligible providers and existing public organizations. Separately project each source family; a high-yield directory does not represent the IRS universe.

Review can dominate cost: two minutes per approved organization means 1,000 reviewer-hours for 30,000, and 60,000 hours for 1.8 million, before rework. Improve evidence packets and reviewer ergonomics; do not silently remove required administrator approval. The registry tier needs its own review/publication policy before national exposure.

For each wave calculate processing + source/search/model/geocode charges + reviewer labor + refresh/storage cost. Count deduplicated domains/pages/addresses, not one paid query per organization. Bound the next run using observed p95 costs and an explicit source/request/byte/time budget. Existing 25-record packages permit up to 150 HTTP requests and zero model calls; those ceilings are not observed consumption.

## Immediate next implementation batch

1. Isolate the existing acquisition dependency closure from preserved code, including commands/tests; retain current-main app behavior and private state untouched.
2. Reconcile production counts read-only, refresh the identity-source manifest with byte hashes, and produce a source scorecard with distinct nonprofit yields.
3. Build one bulk IRS-filing website adapter and one structured service-directory adapter; connect them to the existing normalized evidence pipeline.
4. Complete source-supported location extraction and a strict audit export, then present a bounded pilot plan with exact sources, request ceilings and expected reviewer workload.
5. Use pilot measurements to prioritize sources and publish a defensible 30,000-organization schedule/cost range.

No production import, approval, promotion, deployment, paid provider setup or broad live crawl was performed. Those are execution steps beyond this assessment. The current permission boundary does not block offline preparation or the scoped implementation work.
