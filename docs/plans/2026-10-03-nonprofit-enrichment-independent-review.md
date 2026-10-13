# Independent review: nonprofit enrichment

Give this document to the reviewing AI. It contains a standalone brief plus paths for inspecting the actual implementation. Snapshot: **2026-10-04 02:55 UTC**. Later live ledger results supersede these counts.

## Your assignment

Act as an independent data engineer and data scientist. Evaluate whether our current approach can efficiently produce accurate, useful nonprofit directory data at national scale. Challenge the approach, including unnecessary restrictions, missing safeguards, misleading metrics and work that creates little public value. Do not assume the implementation fulfills its original specification.

Review only; do not modify code/data, start jobs, publish, deploy or purchase services. Cite code, logs or source documentation for findings. Clearly separate demonstrated defects, likely risks and unanswered questions. If you cannot access the files, review the brief provisionally and name the exact evidence you need; do not claim to have inspected it.

## Intended outcome and constraints

- Build a free public nonprofit/resource directory. First meaningful release: roughly 10,000 new useful organizations; evaluation milestone: 30,000; eventual scope: approximately 1.8 million U.S. nonprofits.
- Desired fields: EIN, legal/public names, website, phone, filing address, headquarters, service locations, coordinates, social profiles, primary services, description, our taxonomy categories, logo/source/rights and parent/affiliate/chapter relationships.
- Maximize accurate coverage per unit of time and compute. Unknown is acceptable. Do not require every field before an otherwise useful record can progress.
- No paid enrichment, geocoding, search or scraping services. Reuse existing infrastructure and free, appropriately licensed sources. Our interactive AI work still consumes time/compute; zero paid data-provider calls does not mean zero total cost.
- Bulk exact-identifier joins and deterministic extraction first; use AI for cases where reasoning materially improves results. Preserve evidence, uncertainty, conflicts and source dates.
- A legal organization and an actionable public service are different things. A filing address is not proof of a service location; an NTEE code is not proof of an offered service. Separate EINs must not merge merely because they share a domain/address.
- Existing public-resource publication rules require service evidence, verification and review. Assess whether a separate organization-directory projection is needed; do not silently weaken existing rules to increase counts.

## What exists today

A **local, agent-operated research harness**, not a completed unattended national enrichment/publication system:

1. Import identities by EIN into private SQLite; preserve immutable source hashes and import checkpoints.
2. Join local IRS index/ZIP/XML snapshots by EIN and filing identifier. Parse 990, 990-EZ and 990-PF contact/mission/address candidates.
3. Claim bounded jobs using transactions, leases, ownership tokens, retries and crash recovery.
4. Fetch known website candidates with existing DNS/SSRF, redirect, robots, host pacing, timeout and size controls. Cache normalized page evidence across organizations.
5. Apply narrow deterministic contact verification; retain other fields as candidates or unresolved. Classify against the existing taxonomy, with abstention.
6. Save idempotent submissions, receipts, metrics, backups and a durable continuation entry point outside worktrees.

No new package dependencies. Node 22.13+ uses built-in SQLite; Python standard library handles XML/ZIP. Existing IRS crawler, taxonomy and provider extraction code were reused. No Supabase schema or production data was changed.

`--all` currently imports identities. It does **not** enrich/index/publish the entire corpus. `--sample` is an input-row limit, not a representative sampler. End-to-end batch orchestration still involves the AI issuing commands.

## Observed progress

| Measure | Snapshot |
| --- | ---: |
| Six source EO CSVs, previously counted | 1,962,246 rows / 1,957,340 unique EINs |
| Identities in working ledger | 10,001 |
| Completed bounded research passes, all partial | 51 |
| Pending jobs | 9,950 |
| Organizations with useful candidate/verified enrichment beyond filing address | 231 |
| Organizations with fresh rule-verified fields | 7 |
| Verified fields on those seven | Website and phone |
| Field-complete / reviewed / published additions | 0 / 0 / 0 |
| Active workers / expired leases / unfinished imports | 0 / 0 / 0 |
| Successfully imported IRS filings | 239 of 243 selected; four unsupported forms |

Candidate coverage by distinct organization: websites **139**, phones **218**, descriptions **211**, filing addresses **231**, categories **158**, services **28**, socials **31**, logos **28**. These counts overlap with verified records and each other. Seven verified contact pairs do not mean seven complete, independently reviewed or publishable organizations.

The ledger's zero public/searchable counts describe this private pipeline, not a live census of the existing application database. Bulk imports can enrich pending organizations, so 231 enriched and 51 completed jobs measure different activities.

The population is an existing seeded, weighted 10,000-record state/NTEE benchmark plus one canary. Two subsequent website batches selected 25 website-bearing organizations each; the first spanned 25 filing states. These are useful operating trials, **not an independent representative accuracy evaluation**. No 30,000-record run has happened.

## Resource use and evidence quality

- Downloaded one 2026 IRS index and January/February archives: **347,671,843 bytes** total. Selected 243 XML files for this cohort. Archives may be reused across a larger population; pilot download cost is not a national per-record estimate.
- Crawler totals: **134 HTTP requests**, **119 receipts**, **218,417 retained normalized bytes**. Retained bytes are not total network transfer. Bulk downloads are separate.
- No paid provider calls or programmatic model-adapter calls. Interactive AI development/orchestration usage is unmetered.
- No defensible records/hour, human time/record, field precision/recall, national coverage or completion-time estimate yet.
- One stale nonprofit domain led to a domain-for-sale page. Its seller-derived assertions were retained as conflicting and excluded from usable candidates/classification. This is one detected failure, not proof that all misidentifications are caught.

Contact verification re-reads original hashed/index-linked IRS XML, selects the latest available tax period within 730 days, and requires agreement with a cached page no older than 30 days: normalized legal name, declared/current hostname and exact U.S. phone. Conflicting or incomplete latest filings abstain. A separate narrow crawler rule can verify a website when its page contains the exact EIN and legal name. Agent-supplied confidence cannot self-approve fields.

These are heuristic evidence rules, **not statistically calibrated accuracy guarantees**. The website/phone pairing may reject good websites when phone evidence is missing. Legal names, aliases, redirects, amendments, shared domains and source dependence deserve scrutiny.

## Known unfinished work

- Direct GivingTuesday/Overture/OSM/Wikidata/Census adapters, broad website discovery and model/search automation.
- Whole-site crawling: current reuse is principally URL-level; collected follow-up links are not automatically traversed.
- Independent labeled evaluation, useful-service/location verification, calibrated confidence and publication eligibility measurement.
- Complete source refresh, canonical supersession, owner corrections, stale-field invalidation and automatic incremental scheduling.
- Production projection, search indexing and national-scale public query changes. Existing resource-map schema should be reused; the account-oriented `public.organizations` table is not the national registry.
- Portable off-device disaster recovery. Local SQLite backups exist; earlier backups were restored and checked, latest backup had an integrity/count check. Code and data remain local, with no hosted CI or deployment.

Scale-sensitive details to inspect: archive extraction has a 1,000-member cap without an advancing partition cursor; retained verification holds when more than five original filings must be considered; import rescans/re-hashes and XML subprocess work may become costly. Current network execution is conservative and serial. Determine what is genuinely limiting before proposing distributed infrastructure.

## Evidence and access

Permanent state, independent of whichever workstream is open:

```text
/Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/
```

Start with `RESUME.md` and `CURRENT.json` there. They locate the harness. At this snapshot:

```text
Worktree: /Users/calebhamernick/Development/coach-house-platform-map-data-scale-20261003
Branch: feat/map-data-scale-20261003
Code revision: 795543a1747cbeb3894e9ef37c7d619a9cc74f3f
```

Three local implementation commits; no push/PR/deployment. Review current Git status as well as the recorded revision. This review document was added afterward.

Read-only live progress command:

```bash
/Users/calebhamernick/.nvm/versions/node/v22.13.0/bin/node \
  /Users/calebhamernick/Development/coach-house-platform-map-data-scale-20261003/src/features/nonprofit-enrichment/server/cli.mjs \
  handoff --state /Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment
```

`status` and `context --ein <EIN>` also inspect state. Do not add `--write` or open SQLite in writable mode for this review. Follow repository instructions, including Graphify navigation, before code inspection.

Read these repository files, in order:

1. `AGENTS.md`, `docs/RUNLOG.md`, `docs/agent/open-work-index.md`.
2. `docs/agent/nonprofit-enrichment-runbook.md` — supported commands, recovery and limitations.
3. `docs/runlog/2026-10.md` — October 3 entries at 20:40, 21:25, 21:55 and 22:35 EDT describe decisions, trials and checks.
4. `docs/plans/2026-10-03-map-data-scale-assessment.md` and `2026-10-03-map-data-harness-review.md` in the same directory — rationale and original gaps.
5. `docs/agent/resource-map-enrichment.md`, `docs/DB_SCHEMA.md`, relevant `supabase/migrations/`, and `src/lib/public-map/resource-categories.ts` — publication, existing schema and taxonomy. Versioned schema inspection is not live database verification.
6. `src/features/nonprofit-enrichment/server/` — especially `store.mjs`, `queue.mjs`, `import.mjs`, `filings.mjs`, `parse-filings.py`, `extract-irs-archive.py`, `crawl.mjs`, `verification.mjs`, `classification.mjs`, `continuation.mjs`, `artifacts.mjs` and `cli.mjs`.
7. `src/features/nonprofit-enrichment/tests/`, `tests/acceptance/nonprofit-enrichment.test.ts`, and reused IRS/provider modules under `scripts/resource-map/lib/`.

Private state artifacts:

| Path relative to state | What it establishes |
| --- | --- |
| `research.sqlite` | Live identities, jobs, assertions, events, sources, pages and run records |
| `inputs/irs-2026/` | Original index/archives, download provenance, extraction manifests and selected XML |
| `batches/irs-2026-01A-web-001/` | First 25-organization web trial and receipts/outcomes |
| `batches/retained-verification-001.json` | Verification of previously retained pages |
| `batches/irs-2026-web-002/` | Second 25-organization web trial and receipts/outcomes |
| `checkpoints/`, `CURRENT.json`, `RESUME.md` | Durable continuation and historical snapshots |
| `backup-20261003-bulk002.sqlite` | Latest recorded local database backup |

Do not upload the whole state directory. For an AI without filesystem access, attach this brief, the runbook, relevant runlog entries, selected source/tests and redacted batch summaries. Exclude credentials, claim tokens and unrelated private data. Request specific additional evidence when necessary.

Latest focused acceptance wrapper passed **29 Node runtime tests plus one Python archive/provenance test**. Earlier checks passed 56 inherited IRS/source tests and six provider-comparison tests. Focused lint/structure checks passed. Functional tests do not establish real-world extraction accuracy. Full local quality, hosted CI and public canaries were not run.

## Questions your review must answer

1. What is the shortest credible route to 10,000 useful public additions? Which fields and publication criteria actually matter for organization search versus actionable map resources?
2. Are we spending too much effort on scaffolding or individual homepages before exhausting bulk reusable data? Identify concrete free datasets, their field coverage, freshness, matching identifiers and actual redistribution terms. Verify current primary-source documentation; public access and open-source software do not imply reusable data.
3. Which verification rules create false matches or unnecessary abstentions? How should website, phone, services and locations be evaluated separately? Examine stale/conflicting evidence withdrawal across multiple pages and source versions.
4. How should we construct a labeled, stratified holdout and measure precision, coverage and uncertainty? What can the current biased operational trials legitimately tell us? Do not count two repackaged IRS sources as independent corroboration.
5. Which measured or testable bottlenecks matter at 30,000 and 1.8 million? Examine archive partitioning, repeated parsing/hashing, indexes, bounded queue fairness, cache reuse, worker concurrency and per-host budgets.
6. Can any AI resume safely after a crash, new chat or different checkout? What remains untested about leases, replay, schema migration, backup recovery and missing source files?
7. What is missing between private candidate evidence and the existing database/public search? Can we reuse the resource schema and avoid full-corpus browser downloads? Identify the smallest integration slice and its checks.
8. What should we stop, retain and do next? Distinguish urgent correctness fixes from optimizations that should wait for measurements.

Return a short verdict, then a ranked table: **finding, supporting evidence, impact, proposed fix, effort, validation**. Finish with the three highest-value next experiments and their pass/fail criteria. Give a staged 10K → 30K → full-corpus plan with explicit assumptions; do not invent throughput or accuracy estimates.
