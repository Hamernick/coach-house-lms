# Nonprofit stop-word-state search

## Problem and change

PR278 is applied. Its indexed state lexemes accelerate ordinary states, but English removes IN, OR, ME and AS. The unchanged fallback fetched6,402 national food index candidates and discarded6,005 heap rows by state; anonymous food+IN probes took2,707ms and2,809ms. Both publishers remain stopped before filing plan014.

Add one partial GIN index on the existing search document, covering only unsuppressed rows in those four states. No query/function, data, ordering, cursor, visibility, grant or deadline changes. Existing function-local custom plans expose the actual state predicate so PostgreSQL can select this index. The narrow index uses `fastupdate=off` to avoid accumulating pending entries during description fills; the national index keeps its existing settings. This trades some write cost in the covered states for predictable read access. PostgreSQL documents [partial-index predicate matching](https://www.postgresql.org/docs/14/indexes-partial.html) and [GIN storage/build options](https://www.postgresql.org/docs/current/sql-createindex.html).

Live catalog statistics estimate IN/OR/ME together at3.77% of identities; AS is below the most-common-values list. This is an estimate, not an exact eligible count. The directory heap is1,391,747,072 bytes and the current text index89,726,976 bytes. A proposed live count returned HTTP400; its body was not retained, so no cause or count is claimed. It was not repeated. No production index or data changed during this investigation.

## Validation

- Disposable PostgreSQL:7,830 exact before/after JSON cases per RPC, including all states/territories, phrases, OR/NOT, stop words, category filters, cursors, EINs, suppression and curated/platform exclusions.
- Prepared custom plans choose the partial index for IN/OR/ME/AS and do not use it for CA. Later inserts, state corrections and suppression preserve public behavior. Index validity and direct-write storage option checked.
- Local synthetic100,000-row benchmark: targeted queries4.652–8.638ms before,0.987–1.814ms after. The planner uses the proposed index for all four states. Cache-sensitive sequential local measurements are not production latency or throughput promises.
- Initial high-match-density synthetic benchmark correctly preferred existing state indexes; it does not establish the target workload improvement. Both artifacts are preserved.
- Local nonprofit SQL access/publisher/search suite and scoped ESLint pass. Required hosted quality, code-owner review and protected merge remain release gates. Prior PR278 exception does not extend here.

## Bounded deployment

1. Verify the exact merged migration and current-head quality/review. Confirm both publisher processes are stopped; preserve plans/receipts and no concurrent directory administration writes.
2. Check existing database/REST/auth health and memory telemetry. No restart, paid change or deadline increase is authorized.
3. Use one transaction with a2-second lock timeout,45-second statement timeout,16MB maintenance memory and zero parallel maintenance workers. Apply the exact migration and history entry atomically. The ordinary index build scans the existing heap and blocks directory writes until completion; reads remain allowed. Production duration and resource impact are unproved. If it times out or health declines, stop and inspect; do not automatically repeat or create a replacement index. A lost response requires read-only history/index reconciliation first.
4. Verify `pg_index.indisvalid/indisready`, exact index definition/storage options and migration history. No partial/invalid index or history-only state counts as success. After a successful build, prove actual live plan selection and run the12 anonymous cases, including food+IN, before considering publication.
5. Resume the SAME filing operator with `--max-new-chunks 4`; preserve per-write IN/IL/text/category checks, memory sampling, pacing, complete readbacks and the ten-minute limit. Check results before further bounded runs. Category publishing remains separate and stopped.

Rollback drops only `public.nonprofit_directory_stopword_state_search_idx`; it restores the existing access-path choice without altering records or the applied PR278 functions. Rollback itself requires the same controlled deployment process.

Permanent state: `/Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/STOPWORD-SEARCH-RELEASE.json`. Preserve the research checkout and this isolated release checkout.
