# Nonprofit enrichment: start here

This is the stable plan and implementation-progress entry point. Update this file in place; do not create competing handoffs. The private live ledger records data progress independently of chats and worktrees.

## Current plan

[National nonprofit implementation plan](2026-10-06-national-nonprofit-implementation-plan.md) is the current build specification. It supersedes the October 5 strategy and earlier pilot-first task orders where they differ. Those documents remain historical context. Proposed commands are not working commands until implemented and tested.

[National category-filter integration plan](2026-10-07-national-nonprofit-category-filters.md) is the current category work package. It adds bulk NTEE mapping, independent category backfill, indexed search/counts, existing filter integration and incremental refinement. Status: PR #273 merged; category schema, publishing RPC and topic navigation are deployed. Category backfill yielded at 401,498 verified rows to missing-field publication; read `FILING-PUBLICATION.json` and its PID before starting anything. National identity publication, four retained filing archive runs and May union reconciliation are complete. Supported field publication is active; see the current next action.

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
| B: Versioned full-corpus IRS import and bulk joins | Additive corpus schema v1 migrated after verified backup; retained source snapshots, row observations/conflicts and restart-safe import implemented October 7 UTC. 10K/100K benchmarks and recovery tests pass. Full import reconciled: 1,962,246 accepted rows / 1,957,340 unique EINs / 4,906 identical duplicate rows, zero rejects/conflicts, all six sources complete. See `corpus-import-full-20261007.json` and live `handoff`. Bulk archive continuation implemented October 7; the four retained January/February/May archive runs completed; May union/quarantine reconciliation is complete; three oversized sources remain excluded. New data remains dated private candidates until selective field publication; expanded archives and dated conflict resolution remain pending. |
| C: Directory publication and scalable search | Released via PR #270 / `e6361167`. Final production census October 7 12:56:51 UTC: 1,957,327 public identities. All 39 remaining batches completed with full accepted-row readback; 13 corpus identities excluded before publication by ownership protections. Search/detail canaries passed. No new pins. See permanent `PUBLICATION.json`; do not restart completed imports/publication. Category serving is deployed; national backfill retains per-chunk canonical verification and currently yields to field publication. |
| D: Address classification, bulk geocoding and labeled pins | Pending |
| E: Autonomous domain crawling and additional source adapters | Existing bounded crawler exercised on eight newly published websites October 7: six gained private provider evidence, one provider-confirmed website/phone pair; zero public service additions/pins. Calendar/schedule filtering corrected with regression. See permanent `PROVIDER-ENRICHMENT.json`; broader domain scheduler/adapters remain pending. |
| F: National stage orchestration, measured evaluation and incremental refresh | Pending beyond existing private queue/checkpoint support |

## Current next action

**Current checkpoint, October 7 22:29 UTC:** Search optimization applied with explicit user-approved quality exception; 11 public checks pass. Improved publisher completed plan013: **64,325 field-updated/read-back organizations**, including4,623 added this continuation. Categories remain401,498. Both writers stopped at bounded checkpoint; next field plan014. Read permanent `OPTIMIZATION-20261007.json` and [optimization plan](2026-10-07-publication-recovery-optimization.md). Prior unauthorized restart remains recorded; no further restart or paid changes authorized.

**Current serving follow-up:** final checks exposed intermittent food+IL latency (2,936ms then102ms). A subsequent11-case run passed, but both writers remain stopped until this is understood. Updated pre-write guard tests state-filtered search too. Read the optimization plan and retained query-plan evidence before plan014. No more writes after this finding.

**Search reliability:** PR275 / `d577aef8`, merged as `eb7c7d83`, is applied: both search RPCs use custom plans with existing security/search path/three-second limits unchanged. User explicitly waived failed unrelated visual quality checks for this migration only. Exact SQL/history/settings verified; all11 anonymous canaries passed before and after resumed publication. See permanent `SEARCH-PERFORMANCE-20261007.json`. Do not reopen or reapply the completed fix.

**Priority: resume bounded missing-field publication from the saved cursor.** Both writers currently stopped; use the same permanent operator with `--max-new-chunks 4` after inspecting PID/state. Category writer stays at401,498 until equivalent pre-write/pacing controls are integrated. No automatic category handoff. All four retained filing archives and May reconciliation are complete; do not restart them.

 `enrich-irs-archive.py` now advances through every selected filing in bounded, resumable batches; do not repeat the old 1,000-member prefix. Run locators and commands live in `<state>/FILING-ENRICHMENT.json`; per-archive progress is `filing-enrichment-national-20261007/<batch>/batch-NNNNN/{extraction,completed}.json`. `complete.json` proves an archive's selected members are finished. Read those files before starting another worker.

First 1,000 January members: 977 newly ingested supported filings, three already imported, 20 unsupported returns retained as parse errors. 958 organizations gained their first non-address filing evidence; previously absent website/phone/description fields added for 485/894/846 organizations respectively. These overlap and are private source-reported candidates, not newly public contacts or provider-confirmed services. New evidence does not silently modify immutable publication plans.

Resume an archive with the same exact arguments/output and `--all --write`; saved input hashes, population membership, batch size, member cursor and ingestion receipts prevent regression. The old standalone extractor remains supported, now with `--after <saved-last-member>`. No new dependencies/network are required for retained archives. Next after ingestion: select latest supported filing fields only for affected EINs, publish eligible deltas through existing ownership/suppression gates, and crawl those official-domain leads. Program extraction, new archive acquisition and current-provider checks remain unfinished.


All 1,957,340 unique IRS identities have now passed the retained-source audit. Do not repeat imports or audits. The remaining 39 immutable partitions are complete in `audit-national-remaining-v3-20261007`; `result.json` confirms 1,907,340 eligible after the first 50K, zero identity holds and final EIN `999009356`.

All 39 partitions in `production-remaining-20261007` completed at 07:46:44 UTC. Final live census at 12:56:51 UTC: **1,957,327 public identities**, 971 phones, 536 websites and 897 descriptions. Completed remaining-batch outcomes: 1,897,659 inserted, 9,668 unchanged, zero updated/held; 1,907,327 accepted rows read back. Thirteen of the 1,957,340 corpus identities were excluded during preflight before chunk publication. The earlier audit's zero identity holds is source eligibility, not current database ownership. Search/detail canaries returned 200. Immutable proof: `production-remaining-20261007/census-final-1791377811873.json`; current pointer: `PUBLICATION.json`. Preserve all existing plans and receipts. Do not restart the completed publisher.

The private `PUBLICATION-OPERATOR-20261007.json` stores the exact repeatable operator. It uses one worker, 250-row chunks, routine existing GIN pending-list cleanup every 2,500 rows, and anonymous search checks. Failed checks pause writes for 10/30-second recovery attempts; persistent failure stops after saved receipts. The operator verifies accepted canonical fields and public canaries before marking a batch complete. No heavy full-table progress census runs during writes. Check process ownership before starting another operator.
### End-to-end execution order (seven steps)

1. **Validate a 50,000-record batch (complete locally, October 7).** Add bounded EIN cursor selection to the existing audit, retain evidence/field rules, create an immutable public projection, and load it through the existing chunk RPC into disposable local PostgreSQL. Verify exact counts, forbidden-field exclusion, anonymous access, pagination, replay after lost acknowledgment, write throughput, storage and query latency. This ordered operational batch is not a representative precision study or proof of national capacity. Save commands, hashes and measurements.
2. **Publish eligible national identities (complete: 1,957,327 publicly searchable).** Confirm live target storage/headroom and hosting allowance; validate queries with national-size local/staging data before full rollout. Audit/project bounded partitions tied to immutable inputs. Reuse the existing target-bound publisher and atomic receipts, preserving current public fields, owner changes and suppressions. Verify the first chunk, then continue every eligible chunk. Stop on mismatched hashes/counts, unavailable capacity or failed access/performance gates. Report inserted/updated/unchanged/held separately. Missing coordinates or contacts do not block identities.
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

Public category release: [PR #273](https://github.com/Hamernick/coach-house-lms/pull/273), review fixes `c7c0d3d5`, followed by main refresh `b4859d37`. Permanent `CATEGORY-RELEASE.json` identifies the release checkout and first saved plan. 149 focused acceptance checks pass (92 search/taxonomy + 57 resource/route); PostgreSQL and browser checks pass. Hosted quality/review remains pending; zero category writes. Refresh live PR status before deploying. Global raw tsc still reports unrelated test/generated-Next errors; do not call that check passed.


### October 7 review and worker recovery

PR #273 fixes obsolete Community aliases and promotion normalization for Arts, Faith, Recreation and Philanthropy. Forty-eight focused classifier/promotion tests pass, including preserving Food Pantries in the faith example, canonical keys/confidence, stable leaf IDs and parent-filter matching. Pre-push checks pass. Prior-head quality failed three unrelated Workspace Tools visual cases; required review remains outstanding. Latest-main merge resolved only an append-only runlog conflict. Refresh `CATEGORY-RELEASE.json` and live PR checks before release; zero categories published.

The filing operator stopped in 05B after SQLite could not open the database. A read-only open succeeded; retried the same saved operator/output without resetting receipts. PID and progress are in `FILING-ENRICHMENT.json`; 05B resumed and advanced beyond batch 16. Do not start another worker while it runs. After 05B completion, reconcile the May split-index union and quarantined/unsupported returns, then publish latest eligible missing-field deltas.

## Live category rollout — October 7, 2026

PR #273 merged as `072b34d7`; PR #274 merged as `9f8e2341`. Both #274 production deployments subsequently succeeded; see `find-detail-deployment-status-20261007.json`. Exact Housing Forward click could not be reproduced because that listing was not visible in the current default search results. Category migration `20261007070000` was already applied; applied the two remaining merged migrations `20261007070100` and `20261007070200` with migration-history receipts. First 5,000 category sets and assignments read back exactly; live category, text/state/EIN and service-leaf exclusion checks pass.

Permanent operator: `<state>/category-rollout-20261007.mjs`; status: `CATEGORY-PUBLICATION.json`; log: `category-rollout-20261007.log`. One detached worker continues the existing 50K plan, then creates subsequent 50K plans strictly after the previous last EIN. It verifies accepted sets and assignments per 250-row transaction, checks anonymous search, saves atomic receipts, preserves pending/held outcomes, and stops on errors. Check saved PID ownership before resume. Resume command, only if no worker is alive:

```bash
/Users/calebhamernick/.nvm/versions/node/v22.13.0/bin/node /Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/category-rollout-20261007.mjs --all
```

`committedThisRun` is a run delta, not the full public count; first 5,000 predate the detached run. Completed-plan reports and a final live census establish totals. `completed` means all mapped plans processed, not that pending/held rows were force-published. Preserve the 619,573 unmapped organizations in search. These are organizational topics, not verified services or new map pins. After category completion, reconcile the May filing union and publish supported contact/description deltas. No repeated identity audit or import.

### Verified rollout checkpoint, October 7 17:07 UTC

First two 50K plans completed: **100,000 inserted, 100,000 verified; zero pending/held in those plans**. Remaining worker continues. Live browser Food filter returned 20 organizations and expanded the first identity without page errors. Seven category pagination/cursor-binding checks, category/EIN/state queries and service-leaf exclusions pass. Full-public-view progress census timed out; did not repeat it during writes. Counts use complete receipt/readback reports until final bounded census. `CATEGORY-RELEASE.json` stores the dated verified total; `CATEGORY-PUBLICATION.json` stores current worker deltas and paths.

At 141,000 categorized rows a read-only preflight hit its existing three-second SQL deadline. The operator stopped without losing receipts. Added at most two preflight-only retries (3/10-second backoff and anonymous health probes), retaining all SQL and health deadlines, then resumed the exact plan. New worker passed that boundary. Status and PID always come from `CATEGORY-PUBLICATION.json`, not dated prose. Run `python3 <state>/category-status-20261007.py` for cumulative unique canonical-readback counts across restarts; `verifiedThisRun` is only the current invocation.

At 150,000 verified category sets, a public search health probe returned 503 and stopped publication before the next plan. All five probes subsequently returned 200. The same operator now paces writes by 500 ms per 250-row chunk and allows at most two health cooldown retries (10/30 seconds) with no writes during cooldown. Existing SQL deadlines, per-chunk checks, exact manifests and receipts remain unchanged. Permanent status reports current worker ownership; do not infer liveness from this log.

## Missing-field publication — October 7, 2026

The May archives reconcile to 164,228 members with zero overlap or missing siblings. Three XMLs exceed the existing 16 MB bound and their EINs remain excluded from field publication. No repeat identity audit/import. Source evidence is checked only for affected EINs using existing filing-date/amendment/conflict rules.

Implemented `prepare-filing-updates.mjs` and `filing-update-plan.mjs`: 5K affected-EIN pages, exact XML hash/provenance and retained assertion checks, independent fields, immutable plans, canonical-content merge and expected-digest binding. Existing public values, identities/addresses and owner/staff/suppression protections remain. New source-reported website/phone/description fills reuse the existing atomic publisher and rollback receipts. Malformed URLs (`https://./`, malformed `www.//...`) are held independently; later guarded retry plans salvage other fields from original held records. No invalid URLs passed the deployed validation in the affected completed chunks.

First 5K selected: 4,982 eligible field records; 4,938 planned updates, 4,935 updated/read back, three held by URL validation. Added 2,845 websites, 4,736 phones and 4,185 descriptions before salvage retries. Live anonymous detail checks match all fields; browser shows website, phone, description and filing date with zero page errors. The worker continues the full retained filing population; do not cap it at the first sample.

Read `FILING-PUBLICATION.json`, `filing-publication-status-20261007.py`, and `filing-publication-20261007.log`. `filing-updates-20261007/` retains assessments, plans, receipts, verification chunks, completed batches and separate retry plans. Existing incomplete artifacts require inspection, never deletion. One writer at a time: the field operator gracefully stops the exact category PID, checks public search and cleans the existing GIN pending list; it resumes categories only on successful field completion. A health/error stop preserves committed receipts. Category status remains a separate 401,498-row checkpoint until resumed.

Validation: 23 targeted Node tests passed across field updates, publication policy and publisher (including current periods/amendments, forged/stale evidence, lost acknowledgment, hash/target errors, ownership races, bad-URL field isolation and source quarantine). Scoped ESLint and structure checks passed. Private harness changes stay in this research branch; no app migration, new paid service or mixed-history push.

### October 8 search release checkpoint

PR278 implements the state-filtered optimization in a separate release checkout, with7,830 exact equivalence cases per RPC passing. Required hosted quality/review/merge/application/canaries remain; both writers stay stopped at field plan014. Read permanent `FILTERED-SEARCH-RELEASE.json` and the latest recovery-optimization plan. Category controls are implemented/tested locally, not started; the old `--all` command is rejected. Resume only with explicit bounded `--max-new-chunks` after dependencies pass. Original worktree, permanent ledger and immutable plans/receipts remain authoritative.

### October 8 applied-migration checkpoint

PR278 migration is applied under the user's explicit exact-release exception; security/config/history verified. Filing014 remains paused because food+IN's unchanged stop-word fallback exceeded the two-second canary twice. Shared pre-write guard now checks IN (12 tests pass). Read permanent FILTERED-SEARCH-RELEASE.json and the latest recovery plan. No new field/category publication or pins. Next resolve stop-word-state latency through separate validated work, then resume saved bounded plans.

### October8 stop-word-state release checkpoint

PR [279](https://github.com/Hamernick/coach-house-lms/pull/279), head8e5f2611, adds the narrow IN/OR/ME/AS text index without changing queries/results. See [deployment plan](2026-10-08-nonprofit-stopword-state-search.md) and permanent STOPWORD-SEARCH-RELEASE.json. All7,830 equivalence cases per RPC, prepared-plan/access/mutation tests and pre-push pass. Local100K synthetic query times4.7–8.6ms become1.0–1.8ms; production proof is pending. Both writers stay stopped before014 until current quality/review/merge, bounded deployment and live checks pass. Earlier PR278 exception does not carry forward.

## October 8 21:04 UTC: PR279 applied; public latency hold

User confirmed PR279 merged and instructed application; GitHub was not rechecked. Migration `20261008210000` applied to `vswzhuwjtgzrkxknrmxu` in21.69seconds with saved2s lock/45s statement/16MiB/no-parallel limits. Exact migration history and valid/ready5,414,912-byte partial GIN index with `fastupdate=off` verified. All four IN/OR/ME/AS direct plans use the new index, executing2.017–5.847ms. Receipt: `stopword-search-applied-20261008.json`; plans: `stopword-index-live-plans-20261008.json`.

Public validation is NOT cleared: first OR request4309.8ms; one bounded diagnostic pass had19/21 checks pass, but unfiltered food+food-category returned57014 and repeated OR took2603.7ms. Preserve first failure and diagnostic artifacts; passing IN164.4ms/OR538.5ms samples do not establish sustained performance. Both publishers remain stopped before filing014; field/category counts unchanged64,325/401,498. No restart, category/field writes, or new pins. Next diagnose actual public RPC latency versus fast direct plans, retaining existing guards/timeouts, before resuming the SAME filing operator with `--max-new-chunks 4`.


## October 8 category-search continuation

PR279 is applied; do not recheck its user-confirmed merge or reapply the index. `CATEGORY-SEARCH-RELEASE.json` now owns the next dependency. Unfiltered food+food-category repeatedly timed out while broad plans visited national matches. The separate `fix/nonprofit-category-search-20261008` release adds a128-identity category-first probe only for text+category without state. Full pages/exhausted categories return; sparse cases use the original query and cursor.7,830 equivalence cases per RPC plus2,520 boundary cases and existing SQL access/publication protections pass. Live bounded probe2.240ms; exact21-row page equality verified. Sparse housing comparison required fallback. These limited samples do not prove sustained API performance.

Private shared guard now checks OR and unfiltered food+food before every possible write;14 focused tests pass. Both publishers remain stopped before014; counts64,325 fields/401,498 categories unchanged. Current-head quality/protection/merge, exact bounded application and all live canaries remain; OR intermittent public latency is still open. Preserve all prior failures, plans and receipts. Resume same filing operator with `--max-new-chunks 4` only after checks clear. No new public fields/categories/pins, restart, paid service or grid work.


### October8 PR280 applied and bounded filing014 resumed

User confirmed PR280 merged and said keep going after disclosure of four unrelated visual failures. Accepted that confirmation without rechecking GitHub. Applied migration20261008220000 to vswzhuwjtgzrkxknrmxu under2s lock/15s statement limits, exact-body precondition and atomic migration history. Verified exact SQL history, v2 body, unchanged v1 and both functions' security/grants/ownership/custom-plan/deadline settings. Receipt: permanent category-search-applied-20261008.json. All21 public canaries passed; food+food-category119.7ms, first OR724.4ms and repeat57.6ms. These checks permit a controlled run, not a claim of unlimited throughput or permanent elimination of intermittent latency.

Resumed the SAME filing operator at014 with --max-new-chunks4; resource and six-query guards remain before each possible write. Read FILING-PUBLICATION.json and actual process state for current progress; category009 remains stopped.

User requested no Supabase preview deployments. Permanent NO-SUPABASE-PREVIEWS.json records that policy. Existing Supabase checks originate from the GitHub integration. Read-only branch inventory found a pre-existing Calendar preview, which was preserved. Browser access to integration settings was denied by security policy because permission was declined; no workaround or integration setting mutation was attempted. Production migration/enrichment continued through its existing authorized API path. No restart, paid service, preview creation/retry/deletion, or grid work.


## October8 filing014 checkpoint:997 newly verified organizations

Migration20261008220000 is applied and verified. Initial21 public checks passed. Same saved filing operator completed four new chunks0..3 in plan014, adding997 organizations:224 websites,964 phones,561 descriptions. Cumulative unique readbacks:65,322 organizations,29,188 websites,61,715 phones,49,485 descriptions. Category assignments unchanged401,498; no new pins. These are receipt totals, not a fresh national census.

An added sparse-query canary (`housing` within Food) returned21 rows in3270.966ms. Graceful stop preserved the final in-flight chunk; both publishers are stopped, plan014 next uncommitted chunk4. Do not replace/reprepare the plan or repeat completed chunks. Shared pre-write guard now includes this seventh query;15 focused tests pass (private local commitf6628f78). Read `PUBLICATION-CHECKPOINT-20261008.json`, `FILING-PUBLICATION.json`, and actual processes before continuation.

Post-stop database/rest/auth health and memory pass. Read-only category-first alternative also timed out; a candidate-ID path took2404.788ms and a materialized alternative timed out, so no unproven additional migration was applied. One management502 is retained; resource checks subsequently passed. Further diagnosis receipts remain separate in permanent state. Publication stays held until sparse-query latency is addressed; retain existing deadlines and limits.

No Supabase preview actions are authorized for this workstream. `NO-SUPABASE-PREVIEWS.json` records the user's request and browser permission denial. Integration settings and the existing Calendar preview were preserved. No restart, paid service, preview retry/creation/deletion or canceled grid work.

## October 8 provider progress and targeted queue fix

Completed two new bounded provider batches, `published-websites-20261008-002` and `-003`: 24 organizations processed, 18 gained private provider evidence, nine gained verified website/phone pairs. 101 crawler requests, 18 cache hits, 239,417 retained provider bytes; two additional free Census requests. No active claims, paid/model calls, public service additions, field-complete organizations or new pins. Do not rerun these completed batches. `PROVIDER-ENRICHMENT.json` preserves exact batch and session totals.

Two provider-reported service-site addresses (PDI Surgery Center, EIN342012430; Wayne Center for the Arts, EIN342016097) yielded unique Census matches with city/state/ZIP agreement. Sources/hashes and responses are retained under batch003/location-review and submitted as candidate ledger evidence. Coordinates are street-range interpolations, not verified entrances/rooftops. Service/precision/publication gates remain; no filing address was promoted. Read `LOCATION-PROGRESS-20261008.json`.

Fixed private targeted queue selection in local commit `be198203`: the nullable EIN predicate caused a national jobs scan and temporary sort. A parameterized exact-EIN branch uses the primary key while preserving source, retry, lease and status gates. Read-only identical-record comparison:6015.60ms versus1.08ms; next real12-organization claim phase81.95ms total.22 focused ledger/claim/import tests and scoped ESLint pass; Graphify update completed. `TARGETED-CLAIM-OPTIMIZATION.json` preserves evidence. This research branch remains local; no production deployment or mixed-history push.

Bulk production remains at65,322 canonical field readbacks and401,498 category assignments, plan014 nextchunk4. Both publishers stopped. Read-only capacity samples showed65,620 pages swapped in and78,397 out over5m11s despite passing free-memory checks. A512-category-record query had shared-buffer hits but variable1023/417ms execution; an intervening ID-only query84ms. This supports resource investigation, not a proven sole cause or validated SQL fix. `SEARCH-CAPACITY-20261008.json` retains raw samples. Do not retry bulk publication simply because a warmed query passes, remove the sparse-query guard, raise deadlines, restart, add paid services, or deploy Supabase previews.

Next: continue new pending provider domains and review the two location candidates; address the sparse category/text serving path and paging before resuming the same saved filing plan. Keep all worktrees, state, receipts and prior release evidence.

## October 8 sparse category index release

PR281: https://github.com/Hamernick/coach-house-lms/pull/281. Read permanent `CATEGORY-INDEX-RELEASE.json` for exact head/SQL and current gates. The isolated release is `/Users/calebhamernick/Development/coach-house-platform-nonprofit-category-search-index-20261008`, branch `fix/nonprofit-category-search-index-20261008`. Nullable canonical text plus combined category/text GIN allows sparse matches before directory reads; triggers preserve canonical updates and NULL fallback preserves partial-rollout results. Bounded target-bound service RPC fills at most100 EINs with3s/500ms deadlines. Migration performs no bulk rewrite.

Local SQL equivalence, synchronization, permissions, concurrency, old-receipt and schema rollback tests pass.100K synthetic sparse query20.4ms to7.3ms; these are not production results. Hosted checks/review/merge, exact migration application, bounded Food repair and all existing anonymous canaries remain. A read-only manifest contains4,696 Food EINs in47 chunks; use only the current manifest pointer/hash in CATEGORY-INDEX-RELEASE.json. No production write, restart, paid service or Supabase preview deployment. Both publishers stopped; field014 nextchunk4,65,322 canonical fieldreadbacks/401,498categoryassignments unchanged. Keep prior provider/location progress and all receipts.


## October 8 PR281 final hosted checkpoint

PR281 head4bebc1cf: hosted static, acceptance, RLS and build passed. Visual:145 passed, four failures in Marketplace desktop and Workspace Drive error/connected/mobile screenshots, matching previously recorded failures outside this SQL/test-only patch. Aggregate quality failed; review remains required. CI: https://github.com/Hamernick/coach-house-lms/actions/runs/37854386677 . Supabase Preview skipped; no preview deployed/retried. Production unchanged; both publishers remain stopped, filing014 nextchunk4. Release gate remains unresolved; no exception inferred from earlier PR approvals. Exact CI/log evidence saved in CATEGORY-INDEX-RELEASE.json and category-index-ci-failures-20261008.log.


## 2026-10-08 20:22 EDT - category index applied; bounded repair active

User explicitly requested applying PR281 after disclosure of its four existing visual failures and required review. Applied exact migration20261008230000 (SHA256337df118b3cc24f870a79586c2f1de2dfded2ee77885d80da1b06faeaa27969c) to vswzhuwjtgzrkxknrmxu with500ms lock/5s statement/16MiB/no-parallel bounds in4.73seconds. Exact history, all function bodies/configuration, unchanged v1, valid ready indexes, enabled triggers and service-only repair ACL verified. No merge attestation inferred or GitHub status changed. Receipt: category-index-applied-20261008.json. Bounded Food repair started from saved manifest2d883d7d:47chunks/4696identities, at most100 per RPC, canonical readbacks and durable per-chunk receipts, paced/resource-checked with10minute deadline and no automatic retry. Initial sparse anonymous query still timed out; this remains recorded as the repair target, not passing. Other six public checks pass. Ordinary publishers remain stopped until all seven checks pass; preserve filing014 nextchunk4.


## 2026-10-08 20:34 EDT - partial index repair preserved at search guard

PR281 migration20261008230000 is applied and verified after direct user instruction. Bounded repair completed and canonically verified4100 Food identities/4806 category text projections across chunks0..40. Live Food coverage4696 total/596 NULL confirms six remaining chunks41..46; no public category assignments added. Repair stopped before chunk41 on a non-sparse search guard; no failed write or automatic retry. Separate read-only diagnostic: nationwide food21 results3731.6ms, housing+Food21 results2522.5ms; five other canaries96–453ms. Services/memory pass but public latency does not. Keep ordinary publishers stopped at filing014 nextchunk4;65322 field readbacks/401498 category assignments unchanged. Exact repair receipts: category-index-repair-20261008/chunk-*.json; status CATEGORY-INDEX-REPAIR.json, diagnostic category-index-repair-diagnostic-20261008.json, coverage category-index-partial-verification-20261008.json. Do not replay verified chunks. A future separately bounded repair run must reconcile existing receipts, start only at41, save every rejected canary and satisfy current resource/search guards; do not blindly rerun the original non-resuming operator. All seven anonymous checks must pass before filing publication. No preview/restart/paid-service changes.


## 2026-10-08 23:30 EDT - index repaired and live validation passed

Completed the user-requested bounded resume of repairchunks41..46. All4696 Food identities/5521 total category text projections now have canonical readbacks; current Food coverage4696 total/zero NULL. Three rounds of seven anonymous canaries all pass (57–323ms); housing+Food323/85/69ms. Four public identity/cursor comparisons exactly match SQL reference (55–237ms). Combined index712704bytes. Reports CATEGORY-INDEX-REPAIR.json and category-index-production-verification-20261008.json. Publishers remained stopped during repair; starting one bounded filing run with16-new-chunk budget to finish saved plan014 chunks4..19, preserving earlier receipts and existing seven-query/resource/ten-minute guards. No category publisher, preview, restart or paid service.


## 2026-10-08 23:33 EDT - filing014 completed

Food index repair complete and live checked. Filing plan014 now complete:16 new chunks4..19 added3962 organizations with1840 websites,3768 phones and3171 descriptions, all canonical readbacks verified. Cumulative69284 organizations; next filing plan015 chunk0. Filing publisher stopped cleanly. Beginning a four-new-chunk category run under existing controls; one publisher only. PUBLICATION-CHECKPOINT-20261009.json owns latest totals.


## 2026-10-08 23:35 EDT - filing and category bounded runs verified

Index repair and live correctness complete; ordinary publication resumed successfully. Filing014 completed16 new chunks4..19:3962 additional organizations,1840 websites,3768 phones,3171 descriptions; cumulative69284 organizations/31028 websites/65483 phones/52656 descriptions verified by canonical receipts. Next filing015 chunk0 (not prepared yet). Category009 chunks6..9 added1000 category sets containing1009 assignments; content/digests/assignments and all1009 synchronized search projections verified. Cumulative402498 organizations have verified category sets; earlier401498 checkpoints called this assignments, but the operator counter is organizations, not individual category rows. Next category009 chunk10. Both workers stopped cleanly at budgets, no errors. All seven final public searches pass53–117ms. Receipts: PUBLICATION-CHECKPOINT-20261009.json, category-publication-projection-verification-20261009.json, publication-post-run-canaries-20261009.json. Continue bounded publication one writer at a time, then pending provider enrichment and supported location review. Do not rerun completed filing014, repair0..46, or category009 chunks0..9. No new public services/pins, previews, restarts or paid services; preserve all worktrees/state.


## 2026-10-08 23:48 EDT - filing015 partial progress; provider batch active

Filing015 chunks0..9 added2492 organizations (1055 websites,2344 phones,1803 descriptions), all canonical readbacks verified. Chunk10 was stopped before write by the public-search latency guard; both publishers stopped and category009 nextchunk10 remains unchanged. A separate post-stop diagnostic passed all seven probes93–683ms; this is a recovery sample, not proof that sustained throughput is safe. Diagnostic publication-guard-stop-20261009T034518Z.json. Continuing private provider batch published-websites-20261009-001:12 previously pending distinct domains selected from newly verified filing015 chunks0..9; saved claims and signed homepage plan. No completed provider batch replay. Resume the current batch from its artifacts if interrupted.


## 2026-10-08 23:49 EDT - filing015 and provider research checkpoint

Filing015 chunks0..9 added2492 organizations (1055 websites,2344 phones,1803 descriptions), all readbacks verified; cumulative71776 organizations/32083 websites/67827 phones/54459 descriptions. The public-search guard stopped before chunk10; no failed write, no automatic retry. A subsequent seven-probe recovery sample passed93–683ms, but sustained latency remains intermittent. Category publication was not started;402498 verified category-set organizations unchanged, category009 nextchunk10. Both publishers stopped. Private provider batch published-websites-20261009-001 completed12 new claims:10 organizations gained provider evidence, four verified website/phone pairs;25 fetched pages,52 requests,10 cache hits,127928 retained bytes,zero paid/model calls. All claims closed;zero newly field-complete organizations/public services/pins. Current receipts PROVIDER-ENRICHMENT.json and publication-guard-stop-20261009T034518Z.json. Next filing015 chunk10, category009 chunk10; continue existing pacing/guards, new pending provider evidence and supported location review. Preserve completed batches and all worktrees/state.


## 2026-10-09 11:36 EDT - diagnose local sleep and instrument latency

Investigated recurring search stops. macOS sleep log shows134seconds asleep at Oct8 23:42:30 EDT, wake23:44:44, followed by the last filing guard failure; local interruption is strongly supported for that incident, not every historical SQL spike. Added per-probe function/args/chunk/outcome/elapsed/wall/event-loop/code telemetry and optional paging deltas. Both existing permanent publishers now acquire process-scoped caffeinate assertions, block if the helper dies, and release on exit; no permanent power settings. Keep laptop open and preferably on AC; forced/lid sleep cannot be guaranteed away. Existing2second search and10minute/single-writer limits preserved.19 focused tests, ESLint, structure pass; local runtime commit 30e1411c, not pushed. Six read-only rounds42 probes64–768ms; historical DB statement maxima2.68–2.92s and host paging remain separate evidence. Four real filing015 chunks10..13 added997 organizations (319 websites,962 phones,652 descriptions), all canonical readbacks;28 probes pass, slowest1165ms, helper released. Cumulative72773 field-enriched organizations; next filing015 chunk14. Category402498 verified-set organizations unchanged; next category009 chunk10. Both publishers stopped cleanly. LATENCY-INVESTIGATION-20261009.json owns diagnosis, PUBLICATION-CHECKPOINT-20261009.json totals. No new migration/preview/restart/paid service; preserve receipts and worktrees.


## 2026-10-09 - plan alignment and live examples

Plan check at 2026-10-10T01:30:11.990761+00:00: 75489 organizations have canonical filing-field readbacks (33589 websites, 71349 phones, 57264 descriptions); snapshot during active bounded filing run PID 10211, observed alive=True. Plan015 complete; plan016 underway. Category402498 unchanged; category009 nextchunk10, not started. Historical national identity census1957327 from Oct7, not refreshed. Five live examples and exact field evidence saved in PLAN-REVIEW-20261010.json. Reliability work has delayed coverage; prioritize bulk publication, broader provider enrichment, and supported labeled pins. Important plan distinction: sections3/6 of national implementation plan permit eligible IRS-reported address pins without verified services; address/confidentiality/geocoder precision and release gates still apply. No new public pins/services. Reconcile process and latest receipts before continuing; this is an in-progress snapshot, not final run totals.


## 2026-10-09 - data inventory and priority clarification

User clarified priority: richer collected data; current public website display is secondary. Exact read-only ledger audit of five example EINs saved to ENRICHED-EXAMPLES-20261010.json. Unique social URLs/image candidates: Wayne4/0, PDI3/0, Kellermann3/1, SecondHarvest3/1, ChicagoRetiredTeachers0/3. Socials remain candidate provider-linked evidence; images have unknown rights, some are generic Open Graph photos, not logos. Private schema supports these fields; national directory projection/API/UI currently omit them. Preserve source words/spelling/sentences and originals; later formatting may improve paragraphs/existing lists, with careful separate capitalization display. Prioritize richer provider extraction and verification over display work; do not infer service truth from noisy candidate snippets. Publication reconciled: +4705 organizations, cumulative77478; filing015 complete, filing016 nextchunk13. Operator stopped at ten-minute budget before next write; last probes passed, PID gone. Category402498 unchanged, category009 nextchunk10. Canonical checkpoint PUBLICATION-CHECKPOINT-20261010.json; both publishers stopped. Preserve all state/worktrees and existing release restrictions.


## 2026-10-09 - provider data batch20261010-001 complete

Data-first batch published-websites-20261010-001 complete:24 new claims,22 organizations with provider evidence;60 unique social URLs across17 organizations,38 image candidates across19,provider descriptions across16;14 verified website/phone pairs.69 fetched responses,161 network requests,22 cache hits,370180 retained bytes,zero paid/model calls. All24 claims closed;zero fully field-complete organizations,new public services or pins. Candidate socials/images/descriptions remain private and unverified;image rights unknown. Exact data-export.json includes original evidence, verification and retained page signals/headings/text/hashes/timestamps;24-record equality readback passed. Two homepages blocked (HTTP403/robots), not bypassed; eight additional contact comparisons unverified, principally legal-name mismatch or missing matching phone. Full ledger checkpoint refreshed. Preserve user priority: richer collected data independent of changing UI;no UI changes. Next continue new provider domains and field-specific data quality work;filing016 nextchunk13/category009 nextchunk10 remain stopped,77478 filing-enriched and402498 category-set organizations. Preserve all state/worktrees and completed batches.


## 2026-10-09 - Chicago provider batch20261010-001 complete

Chicago focus persisted in RESEARCH-FOCUS.json. Batch chicago-20261010-001 complete:25 new Chicago-filing-locality organizations processed;20 gained useful provider evidence,101 unique social URLs across20 organizations,32 image candidates across14,provider descriptions across16,15 verified website/phone pairs.64 fetched responses,149 requests,21 cache hits,460085 retained bytes;zero paid/model calls. Four homepages not fetched;one successful response had empty evidence. All claims closed;zero fully field-complete organizations,new public services or pins. Exact25-record export readback passed, originals and source hashes/timestamps retained. Full ledger checkpoint refreshed. CHICAGO-QUEUE.json retains427 pending candidates from452 inspected source-backed Chicago organizations, not a full city census;recheck live claims before next batch. Continue Chicago provider data and field quality, independent of UI. Existing filing016 nextchunk13/category009 nextchunk10 remain stopped;77478 field-enriched/402498 category-set organizations. Preserve completed batches/state/worktrees;no previews/restarts/paid services/canceled grid.


## 2026-10-09 - Chicago provider batch20261010-002 complete

Chicago batch20261010-002 complete: 25 new claims, 20 organizations with provider evidence; 71 social URLs across 18, 26 image candidates across 14, provider descriptions across 12, 10 verified website/phone pairs. 63 fetched responses, 154 requests, 20 cache hits; zero paid/model calls. All claims closed; no fully field-complete records/new public services/pins. Source-linked candidates are not verified assets. Original wording and source hashes retained; exact identity/evidence/verification export readbacks passed. Full ledger checkpoint refreshed. Consolidated CHICAGO-DATA.json/CHICAGO-PROGRESS.json: 50 processed, 40 with evidence, 172 social URLs, 58 image candidates, 25 verified contact pairs across two disjoint batches. CHICAGO-QUEUE.json has402 pending of452 scoped candidates; not a full city census. RESEARCH-FOCUS.json keeps Chicago/data-first focus. Acquisition holds saved separately; no bypass/replay. Continue new Chicago domains and field quality, no UI changes. Existing filing016 nextchunk13/category009 nextchunk10 remain stopped;77478 field-enriched/402498 category-set organizations. Preserve state, receipts and worktrees.


## 2026-10-09 - Chicago provider batch20261010-003 complete

Chicago batch20261010-003 complete: 25 new claims, 19 organizations with provider evidence; 67 social URLs across 18, 30 image candidates across 15, provider descriptions across 14, 5 verified website/phone pairs. 53 fetched responses, 135 requests, 18 cache hits; zero paid/model calls. All claims closed; no fully field-complete records/new public services/pins. Source-linked candidates are not verified assets. Batch003 skipped malformed quote-encoded Neopolitan Lighthouse follow-up links; homepage evidence retained, original plan preserved unexecuted and reviewed replacement used. Inspect follow-up URLs before execution; use generic batch002 runner or explicitly select reviewed plan. Original wording and source hashes retained; exact identity/evidence/verification export readbacks passed. Full ledger checkpoint refreshed. Consolidated CHICAGO-DATA.json/CHICAGO-PROGRESS.json: 75 processed, 59 with evidence, 239 social URLs, 88 image candidates, 30 verified contact pairs across three disjoint batches. CHICAGO-QUEUE.json has377 pending of452 scoped candidates; not a full city census. RESEARCH-FOCUS.json keeps Chicago/data-first focus. Acquisition holds saved separately; no bypass/replay. Continue new Chicago domains and field quality, no UI changes. Existing filing016 nextchunk13/category009 nextchunk10 remain stopped;77478 field-enriched/402498 category-set organizations. Preserve state, receipts and worktrees.

Operational note: Batch003 full checkpoint completed successfully but was slow. A read-only alternative queue-query comparison failed with SQLite unable-to-open error before producing timing/equivalence evidence; no query optimization or repository code change was applied. Do not treat queue-plan diagnosis as established. Local df sample showed about15GiB available; preserve state/worktrees and recheck space before large new downloads. Collection/export/claims all completed and verified.


## 2026-10-09 - Chicago provider batch20261010-004 complete

Chicago batch20261010-004 complete: 25 new claims, 20 organizations with provider evidence; 80 social URLs across 18, 26 image candidates across 13, provider descriptions across 15, 10 verified website/phone pairs. 54 fetched responses, 133 requests, 20 cache hits; zero paid/model calls. All claims closed; no fully field-complete records/new public services/pins. Source-linked candidates are not verified assets. Follow-up URLs inspected before execution. Original wording and source hashes retained; exact identity/evidence/verification export readbacks passed. Full ledger checkpoint refreshed. Consolidated CHICAGO-DATA.json/CHICAGO-PROGRESS.json: 100 processed, 79 with evidence, 319 social URLs, 114 image candidates, 40 verified contact pairs across four disjoint batches. CHICAGO-QUEUE.json has352 pending of452 scoped candidates; not a full city census. RESEARCH-FOCUS.json keeps Chicago/data-first focus. Acquisition holds saved separately; no bypass/replay. Continue new Chicago domains and field quality, no UI changes. Existing filing016 nextchunk13/category009 nextchunk10 remain stopped;77478 field-enriched/402498 category-set organizations. Preserve state, receipts and worktrees.


## 2026-10-09 - Chicago provider batch20261010-005 complete

Chicago batch20261010-005 complete: 25 new claims, 21 organizations with provider evidence; 69 social URLs across 17, 38 image candidates across 14, provider descriptions across 14, 6 verified website/phone pairs. 67 fetched responses, 153 requests, 22 cache hits; zero paid/model calls. All claims closed; no fully field-complete records/new public services/pins. Source-linked candidates are not verified assets. Follow-up URLs inspected before execution. Original wording and source hashes retained; exact identity/evidence/verification export readbacks passed. Full ledger checkpoint refreshed. Consolidated CHICAGO-DATA.json/CHICAGO-PROGRESS.json: 125 processed, 100 with evidence, 388 social URLs, 152 image candidates, 46 verified contact pairs across five disjoint batches. CHICAGO-QUEUE.json has327 pending of452 scoped candidates; not a full city census. RESEARCH-FOCUS.json keeps Chicago/data-first focus. Acquisition holds saved separately; no bypass/replay. Continue new Chicago domains and field quality, no UI changes. Existing filing016 nextchunk13/category009 nextchunk10 remain stopped;77478 field-enriched/402498 category-set organizations. Preserve state, receipts and worktrees. Efficiency assessment saved in EFFICIENCY-ASSESSMENT-20261010.json: batch004 had12 of36 follow-up provider requests revisit already-fetched homepage final URLs;9 matching retained-content hashes. Source-URL-only cache keys explain this duplicate opportunity; no measured speedup or runtime fix yet. Prioritize redirect-aware cache reuse, bounded JSON-LD extraction, missing-field-aware followups, then bounded batch automation/checkpoint profiling. extruct and Scrapy AutoThrottle are reference options, not installed services. No paid tools, policy relaxation or crawler code changes.


## 2026-10-10 - Redirect cache local validation

Redirect-aware provider cache implemented locally in crawl-cache.mjs/crawl.mjs with28 focused tests and changed-file ESLint passing. Uses existing pages_final_url index; no migration, new dependency or duplicate cache rows. New signed plans pin source cache key and receipt-body hash; preflight rejects changed/expired evidence. Redirect reuse restricted to same-site HTTP(S), no HTTPS downgrade, same claimed EINs, successful fresh non-quarantined receipts. Cross-site redirects still fetched. Offline reconstruction of batch004/005 homepage caches avoids9/36 and11/46 follow-up provider requests (20/82 total); no elapsed-time speedup claimed. Immutable receipts unchanged. Private local research only, not hosted release. Patch, file hashes, tests and comparison saved under REDIRECT-CACHE-IMPLEMENTATION-20261010.json. Resume new Chicago cohort006; retain prior125 completed passes and327 pending queue.


## 2026-10-09 - Chicago provider batch20261010-006 complete

Chicago batch20261010-006 complete: 25 new claims, 20 organizations with provider evidence; 70 social URLs across 18, 20 image candidates across 13, provider descriptions across 11, 10 verified website/phone pairs. 49 fetched responses, 123 requests, 28 cache hits; zero paid/model calls. All claims closed; no fully field-complete records/new public services/pins. Source-linked candidates are not verified assets. Follow-up URLs inspected before execution. Original wording and source hashes retained; exact identity/evidence/verification export readbacks passed. Full ledger checkpoint refreshed. Consolidated CHICAGO-DATA.json/CHICAGO-PROGRESS.json: 150 processed, 120 with evidence, 458 social URLs, 172 image candidates, 56 verified contact pairs across six disjoint batches. CHICAGO-QUEUE.json has302 pending of452 scoped candidates; not a full city census. RESEARCH-FOCUS.json keeps Chicago/data-first focus. Acquisition holds saved separately; no bypass/replay. Continue new Chicago domains and field quality, no UI changes. Existing filing016 nextchunk13/category009 nextchunk10 remain stopped;77478 field-enriched/402498 category-set organizations. Preserve state, receipts and worktrees. Redirect-aware cache locally implemented/tested (29 focused tests, ESLint; no hosted release), used in this private research batch. See REDIRECT-CACHE-IMPLEMENTATION-20261010.json and batch006 cache-reuse-verification.json for exact savings and receipt checks. Same-site/EIN/freshness/hash restrictions retained; no duplicate cache rows or changed historical receipts. Next efficiency improvement: bounded JSON-LD extraction; checkpoint overhead remains separate. Preserve local code patch and research worktree; do not push mixed history.


## 2026-10-10 - Structured provider metadata local validation

Bounded provider JSON-LD extraction implemented locally;35 focused tests and changed-file ESLint passed. No extra fetches or dependencies. Successful HTML responses are parsed in memory; separate structured evidence retains source response SHA256, original receipt hash and timestamp without modifying signed crawler receipts. Candidate logos/images/socials/descriptions/phones are stored; business emails remain in source-linked structured evidence. Same-site organization types only; person/unrelated organization records, unsafe URLs, malformed/oversized data excluded. Additional metadata budget is explicit in signed plan:8KiB/page and8KiB/claim per phase, separately reported. No automatic verification, location inference, public writes or hosted release. Cumulative private code patch/hashes/tests saved in STRUCTURED-METADATA-IMPLEMENTATION-20261010.json. Continue new Chicago batch007; preserve150 completed passes,302 pending scoped candidates.


## 2026-10-10 - Chicago provider batch20261010-007 complete

Chicago batch20261010-007 complete: 25 new claims, 21 organizations with provider evidence; 61 social URLs across 17, 32 image candidates across 17, provider descriptions across 15, 9 verified website/phone pairs. 54 fetched responses, 130 requests, 30 cache hits; zero paid/model calls. All claims closed; no fully field-complete records/new public services/pins. Source-linked candidates are not verified assets. Follow-up URLs inspected before execution. Original wording and source hashes retained; exact identity/evidence/verification export readbacks passed. Full ledger checkpoint refreshed. Consolidated CHICAGO-DATA.json/CHICAGO-PROGRESS.json: 175 processed, 141 with evidence, 519 social URLs, 204 image candidates, 65 verified contact pairs across seven disjoint batches. CHICAGO-QUEUE.json has277 pending of452 scoped candidates; not a full city census. RESEARCH-FOCUS.json keeps Chicago/data-first focus. Acquisition holds saved separately; no bypass/replay. Continue new Chicago domains and field quality, no UI changes. Existing filing016 nextchunk13/category009 nextchunk10 remain stopped;77478 field-enriched/402498 category-set organizations. Preserve state, receipts and worktrees. Redirect-aware cache locally implemented/tested (35 focused tests, ESLint; no hosted release), used in this private research batch. See REDIRECT-CACHE-IMPLEMENTATION-20261010.json and batch007 cache-reuse-verification.json for exact savings and receipt checks. Same-site/EIN/freshness/hash restrictions retained; no duplicate cache rows or changed historical receipts. Bounded JSON-LD extraction is active in this private batch; see STRUCTURED-METADATA-IMPLEMENTATION-20261010.json and structured-coverage.json for measured incremental data. Candidate only; emails retained in source-linked structured pages. Original wording and signed receipts unchanged. No extra network fetches. Checkpoint overhead remains separate. Preserve local code patch and research worktree; do not push mixed history. Measured JSON-LD yield:6 organizations/15 pages with structured metadata;5 organizations gained9 additional candidate values (3 descriptions,3 social URLs,3 image URLs) versus same-cohort non-JSON-LD evidence.1 organization has a structured email.8652 extra retained bytes total, zero added requests; source hashes verified. STRUCTURED-METADATA-PROGRESS.json and combined CHICAGO-DATA.json include structured pages. Redirect cache avoided9 requests (33 vs42). Graphify refreshed.
