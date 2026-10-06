# Nonprofit directory release continuation

## Purpose and state

Release the audited IRS organization directory separately from the private research harness. An identity can be searchable without contacts, services or coordinates. This release adds no map pins and does not relax approved-service rules.

Research code: `/Users/calebhamernick/Development/coach-house-platform-map-data-scale-20261003`, branch `feat/map-data-scale-20261003`, implementation `e2cdcbde`. Private state: `/Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment`. Read its `START-HERE.md` and `CURRENT.json`, then the located checkout's `docs/plans/nonprofit-enrichment-continuation.md`; never restart from this dated snapshot. That checkout holds the private publisher CLI. This scoped release deliberately excludes its research history and raw data.

Release checkout: `/Users/calebhamernick/Development/coach-house-platform-nonprofit-directory-release-20261006`, branch `feat/nonprofit-directory-release-20261006`, based on main `dbdec6c1`. User publication authorization persists. Current-head hosted quality, required code-owner approval and branch protection still apply. No preview deployments are authorized. Public UI interaction/appearance review remains outstanding.

## Existing artifacts

Under permanent private state:

- `audit-20261006-retained-final`: completed eligibility audit for all 10,001 identities; 1,047 have eligible contact/mission fields. Audit as of `2026-10-06T19:15:45.330Z`.
- `directory-projection-20261006`: 10,001 allowlisted records; `records.jsonl` SHA256 `40c0e19121b318dd8681526aa50f058d942165df05d6255c83aa1fd7af866d81`.
- `directory-benchmark-20261006-indexed.json`: all 10,001 inserted in isolated PostgreSQL; approximately 10 MB table/index storage and 39 ms local warm search p95. Not a production/national benchmark.

Live read-only preflight on October 6 found zero exact-EIN overlaps with existing platform/curated organizations and no directory table. Repeat publication preflight at execution time. No production writes or new public records have occurred at this checkpoint.

## Release and activation

Follow [the publication contract](../agent/nonprofit-directory-publication.md).

1. Complete scoped hosted checks/review/merge. Do not ship the entire research branch. Do not bypass branch protection or unrelated failing checks.
2. Inspect live migration history and install only `20261006193000_nonprofit_directory.sql` and `20261006193100_nonprofit_directory_publication.sql`, recording those exact versions through the approved migration mechanism. Avoid broad push of other pending migrations.
3. Configure the singleton settings with target `vswzhuwjtgzrkxknrmxu`, policy `nonprofit-directory-retained-audit-v1` and publication disabled. Verify production deployment and anonymous `/api/public/nonprofits/search` and `/api/public/nonprofits/<ein>` behavior.
4. From the located research checkout using Node 22.13+, run `pnpm resource-map:enrich-organizations plan-publish --input /Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/directory-projection-20261006 --output <new-private-plan-directory> --target vswzhuwjtgzrkxknrmxu --authorization <reference-to-Caleb-publication-instruction> --network --write`. Existing configured Supabase credentials are required; never copy them into artifacts/docs. This preflight does not publish.
5. Review immutable manifest totals/holds/target/hash, activate that target/policy, then run `pnpm resource-map:enrich-organizations publish --input <plan-directory> --target vswzhuwjtgzrkxknrmxu --confirm-plan <manifestHash> --network --write`. First-chunk canary is followed by every eligible chunk, not a ten-record cap. Resume this same plan after interruptions; database receipts determine what committed.
6. Save outcome receipts, actual row counts and public API canaries; distinguish inserted/updated/unchanged/held/replayed. Update the stable checklist/runlog and permanent checkpoint. Continue full-corpus versioned import and geocoding afterward.

Audit age is limited to seven days. If expired, rerun the audit against retained evidence and create a new immutable projection/plan; do not reuse stale authorization hashes or re-research every record unnecessarily. Rollback is revision-aware and preserves later changes; see the contract.
