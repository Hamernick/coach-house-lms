# Nonprofit enrichment: start here

This is the stable plan and implementation-progress entry point. Update this file in place; do not create competing handoffs. The private live ledger records data progress independently of chats and worktrees.

## Current plan

[National nonprofit implementation plan](2026-10-06-national-nonprofit-implementation-plan.md) is the current build specification. It supersedes the October 5 strategy and earlier pilot-first task orders where they differ. Those documents remain historical context. Proposed commands are not working commands until implemented and tested.

[National category-filter integration plan](2026-10-07-national-nonprofit-category-filters.md) is the current category work package. It adds bulk NTEE mapping, independent category backfill, indexed search/counts, existing filter integration and incremental refinement. Status: planned, not implemented; background identity publication and filing enrichment continue.

Permanent machine entry point: `/Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/START-HERE.md`.

## Resume without losing progress

1. Read the repository AGENTS.md, current monthly runlog and open-work index.
2. Read permanent `CURRENT.json` and `RESUME.md`. Locate the code using `runtime.codeDirectory`, `runtime.cli` and `runtime.node`; inspect its current Git status. Do not check out an older saved revision over newer work.
3. Read this file in that checkout, then the current plan linked above. Run the located CLI's `handoff --state /Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment` with Node 22.13 or newer. Live ledger outcomes and current code/tests establish progress; old chat counts and saved checkpoint counts do not.
4. Resume unfinished imports and recover expired claims through supported commands. Preserve live claims, completed evidence, source hashes and caches. Never delete, reinitialize or replace the existing ledger to start a new chat. A missing ledger is a recovery problem: locate its backup before doing new work.
5. Reconcile the implementation checklist below with current code, tests and the latest monthly log. Continue the first unfinished dependency. Reprocess completed work only for changed sources, policy, staleness or an explicitly recorded correction.

## Implementation checklist

Last reconciled: October 7, 2026. This is build progress, not organization counts. Update each row as implementation advances; record the commit/test/artifact proving completion. A newer documented implementation supersedes these dated rows.

| Work | Recorded status / evidence |
| --- | --- |
| Private harness, durable SQLite, imports, evidence, queue, backups and cross-chat checkpoints | Implemented locally; October runlog and `src/features/nonprofit-enrichment` contain validation |
| Bounded crawler with retained follow-up links and network deadlines | Implemented locally; `3931a839` and October runlog; no national crawler claim |
| Detailed national build specification | Saved at `d4be1edb`; documentation only |
| A: Audit all retained organizations for field/directory/pin eligibility | Completed locally October 6; [results, artifacts and commands](2026-10-06-retained-nonprofit-audit.md). All 10,001 IRS identities qualify; 2,462 address candidates; no public writes |
| B: Versioned full-corpus IRS import and bulk joins | Additive corpus schema v1 migrated after verified backup; retained source snapshots, row observations/conflicts and restart-safe import implemented October 7 UTC. 10K/100K benchmarks and recovery tests pass. Full import reconciled: 1,962,246 accepted rows / 1,957,340 unique EINs / 4,906 identical duplicate rows, zero rejects/conflicts, all six sources complete. See `corpus-import-full-20261007.json` and live `handoff`. Bulk archive continuation implemented October 7; exact-EIN filing ingestion is running from retained January/February/May archives. New data remains dated private candidates until selective field publication; expanded archives and dated conflict resolution remain pending. |
| C: Directory publication and scalable search | Released via PR #270 / `e6361167`; production schema and APIs verified October 6. Initial 10,001 identities published in 11 chunks; October 7 expansion added 49,667 with 333 unchanged, yielding 59,668 public identities. Public search/readback verified; no new map pins. National-size local test passes at ten readers; production is not yet national size. Saved `PUBLICATION.json`, all manifests/receipts and verification in permanent state. The full national audit is complete; later live census confirmed 508,132 public identities. Remaining publication partitions and expanded filters are pending. |
| D: Address classification, bulk geocoding and labeled pins | Pending |
| E: Autonomous domain crawling and additional source adapters | Pending beyond the existing bounded crawler |
| F: National stage orchestration, measured evaluation and incremental refresh | Pending beyond existing private queue/checkpoint support |

## Current next action

**Priority: enrich missing fields while the existing identity publisher continues.** `enrich-irs-archive.py` now advances through every selected filing in bounded, resumable batches; do not repeat the old 1,000-member prefix. Run locators and commands live in `<state>/FILING-ENRICHMENT.json`; per-archive progress is `filing-enrichment-national-20261007/<batch>/batch-NNNNN/{extraction,completed}.json`. `complete.json` proves an archive's selected members are finished. Read those files before starting another worker.

First 1,000 January members: 977 newly ingested supported filings, three already imported, 20 unsupported returns retained as parse errors. 958 organizations gained their first non-address filing evidence; previously absent website/phone/description fields added for 485/894/846 organizations respectively. These overlap and are private source-reported candidates, not newly public contacts or provider-confirmed services. New evidence does not silently modify immutable publication plans.

Resume an archive with the same exact arguments/output and `--all --write`; saved input hashes, population membership, batch size, member cursor and ingestion receipts prevent regression. The old standalone extractor remains supported, now with `--after <saved-last-member>`. No new dependencies/network are required for retained archives. Next after ingestion: select latest supported filing fields only for affected EINs, publish eligible deltas through existing ownership/suppression gates, and crawl those official-domain leads. Program extraction, new archive acquisition and current-provider checks remain unfinished.


All 1,957,340 unique IRS identities have now passed the retained-source audit. Do not repeat imports or audits. The remaining 39 immutable partitions are complete in `audit-national-remaining-v3-20261007`; `result.json` confirms 1,907,340 eligible after the first 50K, zero identity holds and final EIN `999009356`.

Publication continues through `production-remaining-20261007`. At the last live census (October 7 05:44:36 UTC), 508,132 directory identities were public. Nine partitions had full canonical read-back; plan 010 was partially committed. Resume existing immutable plans and receipts, never recreate them. Read `ACTIVE-PUBLICATION.json` for current process/status and `PUBLICATION.json` for dated census versus newer local receipt progress. Local receipt totals are not a fresh public-visibility census.

The private `PUBLICATION-OPERATOR-20261007.json` stores the exact repeatable operator. It uses one worker, 250-row chunks, routine existing GIN pending-list cleanup every 2,500 rows, and anonymous search checks. Failed checks pause writes for 10/30-second recovery attempts; persistent failure stops after saved receipts. The operator verifies accepted canonical fields and public canaries before marking a batch complete. No heavy full-table progress census runs during writes. Check process ownership before starting another operator.
### End-to-end execution order (seven steps)

1. **Validate a 50,000-record batch (complete locally, October 7).** Add bounded EIN cursor selection to the existing audit, retain evidence/field rules, create an immutable public projection, and load it through the existing chunk RPC into disposable local PostgreSQL. Verify exact counts, forbidden-field exclusion, anonymous access, pagination, replay after lost acknowledgment, write throughput, storage and query latency. This ordered operational batch is not a representative precision study or proof of national capacity. Save commands, hashes and measurements.
2. **Publish eligible national identities (in progress; all identities audited, national publication underway).** Confirm live target storage/headroom and hosting allowance; validate queries with national-size local/staging data before full rollout. Audit/project bounded partitions tied to immutable inputs. Reuse the existing target-bound publisher and atomic receipts, preserving current public fields, owner changes and suppressions. Verify the first chunk, then continue every eligible chunk. Stop on mismatched hashes/counts, unavailable capacity or failed access/performance gates. Report inserted/updated/unchanged/held separately. Missing coordinates or contacts do not block identities.
3. **Bulk-add filing fields.** Join retained IRS indexes against the full population; add manifest-bound archive continuation; parse each relevant filing once. Resolve dates/amendments, independently admit supported contacts/descriptions and republish changed records. Do not repeat the old 1,000-member archive prefix.
4. **Crawl useful gaps.** Prioritize food, housing, healthcare and other direct services; reuse known official domains and cached evidence before discovery. Bound pages, bytes, retries and per-host concurrency. Keep service verification distinct from registry identity and retain unknowns/conflicts. Classify supported services using the current taxonomy; model reasoning is optional.
5. **Add supported pins.** Deduplicate physical addresses, exclude mailboxes/confidential addresses, geocode bounded cached batches, retain precision and distinguish filing/headquarters/service locations. Verify viewport filtering/clustering at scale before national pin display.
6. **Measure usefulness and errors.** Review a stratified sample and targeted hard cases separately; measure entity/contact/service/location accuracy, source freshness, working contacts, actionable resources, search latency and coverage. Fix high-frequency failure modes; do not equate identity publication with service availability.
7. **Operate incrementally.** Schedule source diffs and stale-field/domain refreshes with resource budgets, resumable receipts and periodic restore checks. Preserve unresolved outcomes. Every session updates this file, the monthly log and the permanent checkpoint; another chat resumes the first unfinished dependency.

Each step has a saved outcome; stages 3–7 can improve published records incrementally. No new infrastructure platform, paid source or per-record manual research is required. Code release changes still need the repository release gates.

Read permanent `PUBLICATION.json` for the latest dated verified census and separate receipt progress. The following 59,668 total is historical, from October 7 04:12 UTC. The 50K batch is `production-plan-50k-20261007`, `887ae75a-8d8e-46f4-953c-6c4cafa2452a`; all 50 chunks committed. Historical first production plan: `~/.local/share/coach-house/nonprofit-enrichment/production-plan-20261006`; batch `a0c29ecb-e9a7-4afa-97ff-f7717a08b159`; manifest `2c419c0d5951466c6ee02c3a55ab0ed5a5d376893b9c09c68f983d7067bed9da`. All 11 chunks committed on October 6; do not replay them as new additions. Public search can include records without coordinates. Website/phone/description coverage: 536/971/897; source-reported fields retain their filing dates. New map pins: zero.

PR #270 merged as `e6361167` after Caleb's instruction to continue. Both production deployments succeeded. The three unrelated Workspace Tools visual failures remain recorded; the user-performed merge is not evidence that quality became green. No preview branch or capacity setting was changed. The private CLI remains in the research checkout located by CURRENT.json. The B migration/import commands below are implemented and the full import completed; `inventory-corpus`, `prepare-directory`, `plan-publish` and `publish` are implemented. Never infer production zeroes from legacy research overview placeholders.


## Step 1 results and exact continuation

- Audit: `audit-national-50k-20261007/{report.json,eligibility.jsonl,sources.json,filings.json}` in permanent state. Exactly 50,000 selected and directory-eligible; zero identity holds; 2,244 retained source entries hash-matched. Eligible fields in this batch: 40 websites (38 filing-reported, two provider-confirmed), 55 phones (53/two), 55 descriptions. Zero new services/pins. This is an ordered EIN partition, not a representative quality sample.
- Audit elapsed 538.855 seconds; max RSS 242,819,072 bytes. The unchanged whole-ledger integrity scan and repeated source scan/reparse are national throughput bottlenecks. Reuse a bound validated snapshot/source cache in step 2; identity selection is bounded, but the legacy source/filing inventory is still global. Do not blindly launch forty copies of this audit.
- Projection: `directory-national-50k-20261007`, 50,000 records, SHA256 `481bf59dd0ba899f22f1bda0de9002db2098572a326616ee5df4687b1a47677c`. Saved published-cohort overlap: 333; 49,667 are not in that older manifest. Live preflight subsequently confirmed 49,667 new / 333 identical / zero holds, and publication/readback completed for that exact manifest.
- PostgreSQL report/log: `directory-benchmark-50k-20261007.{json,log}`. All 50,000 insertions reconciled; first/last chunk replay after reconnect added no duplicates; complete digest/count check, anonymous detail, field allowlist and stable pages passed. Insert time 31.007s. Directory/index storage 45,096,960 bytes; receipts 6,266,880; runs 32,768. Maximum compressed 20-result response 1,199 bytes. Five warm sequential query families measured p95 20.72–21.93 ms including psql startup. This is a disposable local database, not production/concurrent/national-load proof. Synthetic contract fixtures were removed before measuring the real cohort.
- **Published and verified:** plan `production-plan-50k-20261007`, batch `887ae75a-8d8e-46f4-953c-6c4cafa2452a`, manifest `75b893113fbe690b65323df1ae1c27788cd2bb32d6d39359a9b11560d7a07f24`. Fifty chunks committed October 7 04:08:56–04:10:04 UTC: 49,667 inserted / zero updated / 333 unchanged / zero held. Complete 50K field/digest readback and anonymous search/detail passed; total public identities 59,668. Contacts remain 536 websites / 971 phones / 897 descriptions. Existing 63 platform and 877 curated organizations unchanged. Verification: `production-verification-50k-20261007.json`. A saved receipt, not this audit cursor, proves publication.
- **National serving gate:** `directory-national-benchmark-20261007.json` tested 1,957,340 real identity-shaped rows, ten concurrent readers, ten query families; p95 115.7–338.3ms, all below the 500ms local target. Table/index 1,173,692,416 bytes; initial read after PostgreSQL restart 118.5ms (OS cache not cleared). Identity-only shape does not establish performance after full contact/mission enrichment or production load. Runner restart-output pipe issue was fixed; existing loaded database was reused and cleaned up, then the corrected complete runner passed a 1,000-row smoke test. No export/load timings claimed for the recovered national run.
- **Production headroom:** saved `production-capacity-20261007.json`, `production-before-national-20261007.json`, `production-functions-match-20261007.json`. Existing Pro gp3 disk 8 GB, observed 7.8 GB free before expansion; no provider/billing change. All eight deployed directory functions match the local SQL, and access protection passed. After expansion database 246,246,547 bytes; directory/index 54,804,480. Current production API canaries returned 200; individual response times 1,714/308/200/279ms are not a production p95 claim.
- **Historical next action, now completed:** replace repeated global audit setup with a source-hash-bound reusable snapshot or disk-backed BMF lookup, keeping the existing field policies and immutable per-partition artifacts. Benchmark that path, then audit/project/preflight/publish all remaining partitions through the existing receipt-based CLI. Do not re-run a 9-minute full-ledger scan forty times. Existing publication authorization and exact target remain valid; fresh owner/suppression/digest checks still apply on every chunk.
- Historical first-batch audit cursor was `061257568` (`--after 061257568 --limit 50000`) once the shared snapshot/performance work is ready. This cursor records audit completion only; it must never mark the first batch published. Code used for this first audit was the working implementation over `ee354dd9`; the session commit records the final tested implementation. No claim of a committed-code replay.

## National import commands and evidence

Use Node 22.13+ from the current checkout and the same permanent state. Commands
are private/offline; they do not publish organizations or create map pins.

```bash
node src/features/nonprofit-enrichment/server/cli.mjs import-corpus --input /Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/corpus-inventory-20261006.json --all --write
node src/features/nonprofit-enrichment/server/cli.mjs checkpoint --write
```

- `migrate-corpus --output <new-backup.sqlite> --write` is already complete here.
  Verified pre-migration backup: `backups/pre-corpus-20261007.sqlite`. Base schema
  remains v1; `meta.corpus_schema=1` records the additive extension. Repeated
  migrations are no-ops. Never restore this older backup over newer progress.
- Full post-import backup: `backups/post-corpus-20261007.sqlite`, 4,813,332,480 bytes; SQLite quick check passed with 1,957,340 organizations/jobs and 1,962,246 observations. Evidence: `corpus-backup-verification-20261007.json`.
- Immutable source copies are under `sources/bmf/<sha256>.csv`. Import binds to
  the saved inventory, hashes retained bytes, checkpoints rows transactionally,
  refuses concurrent cursor changes and quarantines rejected rows. Original
  download replacement cannot corrupt a retained snapshot's resume.
- Existing identities/jobs/evidence are preserved. Changed names or BMF rows
  become retained conflicts, not automatic canonical overwrites. Dated
  reconciliation remains a later bulk decision step.
- `--limit 10000` bounds new rows per invocation; `--all` continues to EOF. SIGINT
  or SIGTERM finishes the current batch and checkpoints; crashes replay safely.
- Benchmarks: first 10K took 10.43 seconds including source retention, 135 MiB
  maximum RSS; next 90K took 15.00 seconds, 163 MiB RSS. Ledger at 100K: 272 MiB.
  These are private import measurements, not enrichment/publication throughput.
- The remaining 1,862,246 source rows took 411.92 seconds, with 170 MiB maximum RSS. This is still identity/address/classification-source ingestion, not verified website/phone/service enrichment.
- Full replay scanned/added zero rows. Preservation comparison found zero missing/changed original organization, job, evidence, event, cache, unresolved, source or submission rows; foreign-key check passed. Ledger: 4,917,211,136 bytes before the filing replay. See `corpus-import-preservation-20261007.json`.
- Existing extracted XML rejoin: 1,079 already-ingested files skipped, 39 unsupported 990T returns recorded, zero new assertions. Do not mistake re-running the old extracted cohort for national filing enrichment; the next work is expanded index selection and archive partitions.
- Reports/logs: `corpus-import-10k-20261007.*`, `corpus-import-100k-20261007.*`,
  `corpus-import-full-20261007.*` under permanent state. Research overview's
  `corpusImports` reports live source cursors; original publication is separate.
- Validation: migration backup/restore, interruption/replay, duplicate/reject
  reconciliation, changed original/retained bytes, differing observations,
  shortened manifest rejection, and prior research preservation. Full existing
  enrichment acceptance wrapper passes. No public schema/provider changes.


## Shared national audit (October 7 continuation)

`audit-national` now shares one read-only ledger transaction, integrity checks on publication input tables,
source hash inventory, disk-backed BMF lookup and filing parse across bounded
50,000-record partitions. Eligibility rules are unchanged. Completed audit and
projection directories plus `completed-NNN.json` are immutable resume boundaries;
`result.json` is written after the run completes or stops between batches.

Completed run: `<state>/audit-national-remaining-v3-20261007`, started strictly after
`061257568` and finished all 39 partitions at `999009356`. Do not restart this completed audit. This is private
validation, not a publication receipt. Do not rerun the first published 50K.

```bash
node src/features/nonprofit-enrichment/server/cli.mjs audit-national --input <retained-BMF-paths-comma-separated> --output <new-private-directory> --after <last-completed-EIN> --write
```

On interruption, find the last `completed-NNN.json`, confirm its audit/projection
hashes, then use its `lastEin` in a new output directory. Completed audits remain
usable even if a later partition fails. An incomplete partition is retried; source
context is rebuilt and hashed once per new process, never trusted from stale
memory or an old checkpoint. SIGINT/SIGTERM stops after the current partition.
The temporary BMF index is disposable and removed on normal/failure cleanup;
forced process termination can leave private scratch files, never progress claims.
Each audit identifies its shared context; BMF `matchedRows` counts cover the whole
source context, while organization/field counts cover only that partition.

## After every working session

- Update this checklist with completed work, validation, blockers, exact next supported command and artifacts. Keep planned, implemented, tested, deployed and publicly verified status distinct.
- Edit the linked plan when the design changes. If replacing it, update the link here and mark the previous plan superseded; do not leave two plans claiming to be current.
- Append the current monthly runlog. Commit scoped code/docs when appropriate, then run the located CLI's `checkpoint --write --state /Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment` so the permanent locator records the latest checkout/revision. Uncommitted work must be explicitly recorded and preserved.
- Back up the research database before migrations and periodically during operation. Git saves code/docs, not the research database. Checkpointing is not a remote backup.
- Keep this stable entry-point filename when moving workstreams. Carry it and the latest plan into the new code checkout, then refresh CURRENT.json. Never replace newer live data with an older backup merely to match an old branch.

## Settled scope and known stale instructions

Prioritize full-corpus bulk enrichment and publication of eligible directory identities; coordinates are optional for search. Map only supported physical addresses, label filing addresses accurately, and preserve the stricter actionable-service publication rules. No paid data services.

Caleb authorized publishing eligible data. Older generated handoffs say “No paid services or public publication”; the blanket publication prohibition is historical, and the continuation generator is now corrected. The local publisher is implemented and tested; complete its scoped release before writing publicly. Do not bypass evidence, database or release gates.

## Prompt for any future AI

> Continue nonprofit enrichment. Read `/Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/START-HERE.md`, locate the current code through CURRENT.json, and follow `docs/plans/nonprofit-enrichment-continuation.md` there. Read the latest linked plan and live handoff before changing anything. Resume the first unfinished dependency using existing state; do not restart or repeat completed work from an old chat. Update the implementation checklist, monthly runlog and permanent checkpoint before stopping.

### Category mapping checkpoint (October 7, 06:39 UTC)

Full corpus mapping completed: 1,337,767 organizations mapped; 619,573 remain unclassified. Read the [category plan](2026-10-07-national-nonprofit-category-filters.md) and permanent `CATEGORY-MAPPING.json`. These are private organization topics, not published categories or verified services. Public implementation is isolated in `coach-house-platform-category-filters-20261007`; the private harness remains here. Do not rerun completed mapping or change existing publication manifests.

Category serving/backfill is implemented locally in the isolated category release checkout; see the category plan for exact artifacts and tests. First 50K category plan is prepared, not published. National read benchmark passed. The filing operator resumed after commit `280df5f9` added explicit oversized-member quarantine; completed extraction receipts are preserved. Read current locators for live progress.
