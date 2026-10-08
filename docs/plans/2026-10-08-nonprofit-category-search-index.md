# Incremental category text index

Sparse text/category search remains over the two-second publication guard. Query-only alternatives already exceeded the deadline. Current diagnostics also show substantial host paging; this is a measured constraint, not a proven sole cause.

Use the existing category assignment table as a compact search projection: add nullable canonical search text, a native multicolumn GIN index over text and the one-element category array, and a partial index for unfilled rows. This avoids a separate serving table and its extra synchronization state. A larger category-first probe was rejected because it still loads many directory pages and already failed the deadline.

Copy directory text on category insert/update; propagate generated text changes after directory updates. Parent-row locks serialize copies with field edits. Keep existing RLS, permissions, public visibility, ownership, cursor, text semantics and RPC timeouts. The public query unions populated matches with exact legacy lookups for NULL rows. No partial backfill can omit results. The dense128 probe uses copied text before directory lookup when present; selective state queries remain.

Deployment adds the nullable column and builds two indexes over the category table; no directory scan or bulk text rewrite. The ALTER lock remains held during index creation, so the application transaction must use500ms lock/5s statement limits,16MiB maintenance memory and no parallel maintenance. Failure rolls back; do not raise limits or automatically retry. A schema-cache notification exposes the repair RPC after commit. A service-only, target-bound RPC accepts at most100 explicit EINs and fills NULL assignments under3s statement/500ms lock deadlines. Rollout must use one writer, existing resource/search guards, paced chunks, canonical text readbacks and saved receipts. Backfill Food first only after release gates; no automatic maintenance, restart, paid service or Supabase preview.

Validation must cover before/partial/complete JSON equivalence, negation/phrases/empty/EIN/cursor/state cases, public exclusions, copied text updates, category changes/deletes, old receipt rollback, malformed/unauthorized backfill, idempotency and concurrent writes. Benchmark sparse/no-match cases with realistic decoy volume; local timings are not production proof.

Rollback restores the PR280 v2 body first, then drops the two triggers, three helper functions, two indexes and added column. Canonical directory/category records and publication receipts remain unchanged. Required current-head quality/review/merge and live validation remain gates.


## Evidence and rollout constraints

The initial 100K synthetic benchmark (50K assignments,2K Food rows backfilled) reduced housing+Food from20.418ms to7.255ms and no-match text from9.196ms to7.331ms, including fresh-session function planning. Dense Food remained8.156/8.323ms. The combined index is selected and48KiB for this narrow backfill. These are local PostgreSQL14 samples, not production17 latency or full-index size estimates. Reports are retained in permanent `category-index-local-benchmark-20261008-v2.json`.

Exact result checks cover2,520 category/query/state/cursor/limit combinations in each of three backfill states, plus7,830 combinations per RPC. Tests also cover canonical updates, suppression/platform/curated exclusions, category insert/update/delete, privileged forged-text overwrite, idempotency, bounded target/role validation, transaction rollback, a receipt created before the migration, concurrent directory edit/category insertion and explicit schema rollback.

Backfill is a separately bounded repair phase: production publishers stay stopped. Existing public search failures must remain recorded; they cannot be relabeled as passing to start repair. Prepare an explicit EIN manifest from NULL Food assignments, require healthy services/memory and no competing writer, use at most100 EINs per transaction and preserve canonical comparison receipts. Do not automatically restart failed repair batches. After the repair, all existing anonymous latency canaries must pass before ordinary filing/category publication resumes. Migration/backfill release approval and current-head gates are still required.

References: [PostgreSQL multicolumn GIN indexes](https://www.postgresql.org/docs/17/indexes-multicolumn.html), [generated-column trigger timing](https://www.postgresql.org/docs/17/trigger-definition.html). Exact rollback: [SQL](2026-10-08-nonprofit-category-search-index-rollback.sql).
