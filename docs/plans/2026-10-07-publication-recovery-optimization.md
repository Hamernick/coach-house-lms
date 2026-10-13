# Publication recovery and optimization — October 7, 2026

## Decision and scope

Continue the existing data workstream and immutable publication receipts. The user explicitly approved applying only PR275's two search-function settings despite the unrelated visual quality failures. The migration was applied at 22:23:32 UTC; all 11 saved anonymous search checks passed (53–1,275 ms). This exception does not authorize future quality bypasses, restarts or paid changes.

Use targeted search planning and bounded local publishing controls first. A capacity upgrade remains deferred pending workload measurements; the earlier outage cause is unproven. No new service, queue, dependency or paid provider is required.

## Implemented controls

- The two search functions use custom query plans. Search path, security mode and three-second deadlines are preserved; migration history and exact merged SQL hash are saved.
- Previously saved chunks use a read-only remote receipt lookup, validating hash/outcomes and rejecting rollbacks. They no longer invoke the write RPC merely to resume. Lost acknowledgments still recover through the atomic server receipt.
- Every possible new write, including retries, passes a serving check outside the write-retry catch. Text, state-filtered text and category searches must each complete within two seconds. Any failure stops the run.
- Writes start at least five seconds apart. A search exceeding 500 ms doubles the gap, up to 30 seconds; a run never speeds back up automatically. The run has a ten-minute deadline.
- Every 30 seconds, require healthy database/REST/auth and available RAM of at least the greater of 64 MiB or 15% of reported total. Missing/ambiguous/failed telemetry stops new writes. These are conservative operating limits, not a proved capacity model.
- Routine health checks do not perform GIN cleanup or change database settings. Category publishing does not automatically start after a field run.
- Permanent field operator defaults to four new chunks, with an explicit limit of 1–20 per run. Existing chunk payloads and receipts remain immutable. Partial reports are marked paused, not completed; completed-plan markers require the full plan.

## Validation

Twenty-one focused publisher, load-control and filing-update tests pass, including lost-response recovery, remote receipt changes/rollback, bounded resume, failed serving checks, stop during pacing and insufficient/unavailable resource telemetry. Scoped ESLint and structure checks pass. Local operator syntax check passes. Private harness work is local; no mixed research branch is pushed or application UI deployed.

Live proof first resumes at most four new chunks in plan013, then finishes that interrupted plan in one further bounded run. See permanent FILING-PUBLICATION.json and the status helper for final counts. Each accepted chunk is read back and its complete content hash checked. No identity reimport or new pins.

## Continuation order

1. Complete remaining filing field publication through the same operator, in bounded runs. Review serving latency and resource samples between runs. Resume from saved plans; never recreate them.
2. Apply the same pre-write/pacing controls to the category operator before resuming its preserved 401,498 assignments. Do not run two writers.
3. Continue bounded provider enrichment for useful missing fields; avoid repeating terminal missing/robots-denied homepage requests. Preserve evidence and current-source verification separately from dated IRS fields.
4. Publish supported service/location data and pins through their existing gates. Filing or PO-box addresses remain ineligible for automatic pins.

Operational command, after reading current status and confirming no live writer:

```bash
/Users/calebhamernick/.nvm/versions/node/v22.13.0/bin/node /Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/filing-publication-20261007.mjs --max-new-chunks 4
```

A successful bounded run deliberately stops. Increase only the explicit per-run chunk budget after observed healthy runs; preserve deadlines and memory/latency limits. A stopped health guard is a diagnosis point, not permission for repeated automatic retries or restarts.

## Live result — 22:29 UTC

Both controlled runs completed successfully and stopped at the configured budget:996 then3,627 newly updated/read-back organizations. Plan013 complete; cumulative64,325 organizations,28,964 websites,60,751 phones,48,924 descriptions. New fields this continuation:1,773 websites,4,109 phones,3,822 descriptions across4,623 organizations. Categories remain401,498; no new pins. All11 post-publication canaries pass. Next field plan014; no live publisher remains. Source dates remain explicit and provider/service verification is separate. Permanent `OPTIMIZATION-20261007.json` records controls, operator hash and evidence.

## Final check finding: intermittent filtered latency remains open

The first full post-publication verification stopped at `food` + `IL` above two seconds. Direct repeats measured2,936ms then102ms. A later complete11-case check passed (68–611ms), but cannot prove sustained filtered performance. **Both writers remain stopped; diagnose this before plan014.** The pre-write guard now includes the state-filtered query, with a regression proving a slow filtered read blocks writes even when broad search passes. No further publication followed this finding. Verification now saves each attempt, including failures, so old success artifacts cannot survive as the apparent current result.

Read-only EXPLAIN shows the existing GIN text index first estimates4,793 food matches, then filters to184 Illinois matches in the heap. No execution/rewrite was performed for EXPLAIN. Next investigate whether state can be included in the existing full-text index predicate (state is already indexed in search_document), retaining the exact SQL state check and falling back for English stop-word state abbreviations such as IN/OR/ME. This is a proposed optimization requiring equivalence tests and measured plans before a scoped release; not applied or claimed fixed. Current guarded publisher changes are locally tested; category operator controls remain next after remaining fields.
