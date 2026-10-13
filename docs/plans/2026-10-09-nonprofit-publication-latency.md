# Publication latency: distinguish the database from the local worker

Continue the existing private worktree and immutable publication receipts. No database migration, restart, paid service, Supabase preview, or permanent power-setting change is part of this fix.

## Findings

The most recent filing015 stop coincides with local system sleep. macOS recorded Low Power Sleep at2026-10-08 23:42:30 EDT, lasting134seconds, and wake from standby due to LidOpen/UserActivity at23:44:44. The last successful publication guard was23:42:31.695; the next resource sample was23:44:45.519 followed by the search guard failure. This is strong evidence of local interruption for that incident. It does not prove that every previous slow query was local, and the old guard did not retain the rejected probe.

There is separate evidence of real database variability. Historical pg_stat_statements maxima for public search statement shapes reach2.68–2.92seconds. During six new read-only rounds (42 probes), all requests passed at64–768ms. Their statement-call deltas total42 with zero shared blocks read and mean execution times24–122ms by statement shape. OS counters nevertheless advanced18,697 swap-in and20,813 swap-out pages during the sampled window. These are host-wide counters; they do not isolate a backend or prove the cause of a specific request. The database reports about406.5MiB total RAM and224MiB shared buffers. Fourteen client connections were idle in the session snapshot; no lock wait was observed there. A point-in-time snapshot cannot exclude transient contention.

I/O timing and nested statement tracking are disabled. Do not present zero I/O-time counters as proof of no disk I/O, attribute a grouped statement's maximum to one parameter value, or change monitoring settings without an explicit scoped decision. Statistics are cumulative and may include other callers.

## Implemented controls

- Every anonymous guard probe records function, fixed query parameters, chunk/attempt, outcome, duration, wall-clock duration, local event-loop delay, result count and safe PostgreSQL error code. Response records and arbitrary error text are excluded. Failed and invalid responses are logged before the unchanged stop rule applies.
- Resource samples retain optional swap counters and interval deltas alongside existing health/memory checks. Counter reset and unavailable optional metrics produce null deltas. No invented swap threshold relaxes or replaces the search guard.
- Both permanent publishers acquire a process-scoped macOS caffeinate assertion and release it on exit. Loss of that helper blocks the next write. Idle-sleep prevention works during the run; system-sleep prevention applies on AC power. Lid closure, forced sleep and power loss remain limitations. Keep the Mac open and preferably connected to power for local publication.
- Existing two-second public-search limit, ten-minute run limit, single writer, adaptive pacing, immutable manifests and canonical readbacks remain intact. No failed batch is automatically restarted.

## Durable approach

First remove avoidable local interruptions and collect failure-specific evidence. If spikes persist while the worker stays awake, correlate per-probe timestamps with swap deltas, statement statistics and wait events. Reduce write duty cycle or chunk size when measured pressure correlates with writes; validate the improvement with repeated guarded runs. A consistently costly SQL shape warrants a focused plan/index change with equivalence and release checks. A warm isolated success does not prove sustained throughput.

If sustained capacity remains insufficient after query and workload changes, an always-on execution host and additional database capacity are options to review separately. Neither is provisioned or purchased here. Do not repeatedly add migrations or increase the latency limit without evidence.

## Evidence

Permanent state: `/Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/`.

- `latency-local-sleep-20261008.log`
- `latency-investigation-initial-20261009.json` and `.prom`
- `latency-query-stats-before-20261009.json`, `latency-query-stats-after-20261009.json`
- `latency-baseline-20261009.jsonl`, `latency-baseline-summary-20261009.json`
- `latency-telemetry-tests-20261009.log`

References: [Supabase memory and swap](https://supabase.com/docs/guides/troubleshooting/memory-and-swap-usage-explained-aPNgm0), [PostgreSQL statement statistics](https://www.postgresql.org/docs/17/pgstatstatements.html), local `man caffeinate`.
