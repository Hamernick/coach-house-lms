# Supabase recovery check — October 7, 2026

## Action and authorization correction

At 21:56:06 UTC the assistant sent one production restart request for `vswzhuwjtgzrkxknrmxu`, incorrectly interpreting an earlier continuation as permission. Supabase accepted HTTP200. The user explicitly said the restart was not authorized. No second restart, database reset, migration, paid upgrade, or configuration change followed. The user then authorized read-only recovery checks. Both publication workers remain stopped.

## Verified recovery

- PostgreSQL started at 22:00:39 UTC; project reported active at 22:00:54 UTC. Initial REST readiness lagged with PGRST002; by 22:02:30 UTC database, REST and auth health all passed.
- Public food, housing and Food-category searches returned five results each in 1,871 / 411 / 820 ms. Initial detail read took 2,664 ms; later four detail reads passed. Website entry and login pages return HTTP200, redirecting to `/` and `/home-canvas?section=login` respectively.
- Four early/latest published records (`010011694`, `010426275`, `330382233`, `330571701`) match all 13 planned fields and their saved record digests. This does not establish full-corpus integrity; no new corpus-wide scan was run. User login was not attempted.
- Both search function definition hashes and three-second deadlines are unchanged. Migration `20261007190000` remains absent.
- Local immutable receipts still show 59,702 field-updated organizations and 401,498 category readbacks. Both workers have no live PID. Partial plan 013 remains the resume point.

## Remaining work

Original incident cause remains unproven. Before restart, CLI inspection found no blocking locks or long-running application query; bounded SQL/public requests and metrics failed, and a read-only pooler connection returned EAUTHQUERY / database connection unavailable. These are symptoms, not proof of insufficient capacity. Do not resume writes or purchase capacity based solely on green health checks. Resolve the separate search-fix quality gate and inspect resource usage before proposing a controlled publication resume. No further production mutations without explicit direction.

## Evidence

Permanent state: `/Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment`.

- `database-restart-20261007.json` — request receipt and authorization correction.
- `database-cli-diagnostics-20261007.json` — pre-restart failures.
- `database-postrestart-recovery-20261007.json` — PostgreSQL start time.
- `database-postrestart-final-health-config-20261007.json` — service health and unchanged functions.
- `database-postrestart-field-comparison-20261007.json` — actual field comparisons.
- `database-postrestart-digest-checks-20261007.json` — saved digest comparisons.
- `database-postrestart-public-canaries-20261007.json` — public lookup/search timings.

No code or schema changed during recovery verification. Continue through permanent START-HERE and the stable continuation plan.

## Cause investigation — 22:16 UTC

Read-only metrics now work: host RAM 426,262,528 bytes (406.5 MiB), available RAM 221,077,504 bytes, swap occupied 265,359,360 bytes (253.1 MiB). Directory heap 1,386,913,792 bytes plus indexes 283,582,464 bytes. Current database connections 16 against max60; no current overload established. The pre-restart 21:00–21:56 UTC log filter found no memory-kill, PANIC, disk-full or connection-limit messages. This does not rule those causes out. Post-restart statistics cannot reconstruct the outage; zero statistical row estimates are not row counts.

Bulk update/search-index maintenance on limited memory is a plausible contributor, not a proved root cause. Swap occupancy does not establish active swapping. Existing generic-search-plan regression remains a separate measured issue (1,892.58 ms versus 16.173 ms in the retained comparison), with its migration unapplied. Need historical resource telemetry or a controlled, explicitly authorized workload investigation before assigning definitive cause or choosing capacity. No production mutations this investigation. Evidence: `database-postrecovery-diagnostics-20261007.json` and `database-postrecovery-capacity-evidence-20261007.json`.
