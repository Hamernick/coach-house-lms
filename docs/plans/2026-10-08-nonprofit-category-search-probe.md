# Bounded category text search

Production `food` plus the `food` category repeatedly exceeded the existing three-second SQL deadline after PR279. Its plan reads thousands of national text-match heap pages and then joins category assignments. The state partial index is valid and used; it cannot help searches without a state.

Migration `20261008220000` changes only `search_nonprofit_directory_v2`. For nonempty text with a category and no state, it probes the first 128 category EINs after the cursor through parameterized primary-key lookups against the existing public view. It returns only when that bounded prefix supplies a full page or exhausts the category. Otherwise, the original query runs with the original cursor. Sparse matches beyond the probe are preserved. State-filtered, browse, EIN, uncategorized and empty-tsquery paths remain unchanged.

The bound limits added work for rare terms to 128 identities before the original fallback. It does not prove every cold request will meet the latency guard. No new index, data rewrite, timeout extension, grant or security change is included. Rollback restores the v2 body from `20261008030000`.

Validation:

- Exact JSON equivalence: 7,830 combinations per RPC, plus 2,520 category/state/cursor/limit cases on a 600-row fixture.
- Dense, exhausted and exactly-128 categories; sparse matches beyond the prefix; limits 1/21/101; suppression/platform/curated exclusions; phrases, negation, no matches and authenticated access.
- Existing directory access, atomic replay, owner precedence, revision-safe rollback and function configuration/grant/ownership tests pass on disposable PostgreSQL14.
- Production17 read-only bounded probe: 2.240ms execution, 4.265ms planning. The 21-item page exactly matches an unbounded category-first control. Original broad-plan attempts exceeded3seconds. These are limited samples, not sustained API latency proof. A housing query found no matches in the prefix but21 in the full result, demonstrating why fallback is required.

Private receipts remain in `~/.local/share/coach-house/nonprofit-enrichment/`, especially `rpc-latency-diagnostic-20261008T211503Z.json` and `rpc-latency-diagnostic-20261008T211607Z.json`. Both publishers remain stopped before filing014; canonical receipt totals are64,325 field-enriched organizations and401,498 category assignments. Existing OR public requests also showed intermittent latency; this patch does not claim that separate symptom resolved. The private operator now checks OR and unfiltered text+category before every possible write.

Release: required current-head quality and protection/review/merge, then an exact-SQL transactional application with2s lock/15s statement limits, publisher exclusion and resource checks. Verify migration history and unchanged function security/configuration; run all anonymous cases including OR and unfiltered food+food. Only then resume the same filing operator with `--max-new-chunks 4`. Retain every prior failure and receipt. No restart, paid service, automatic index maintenance or canceled grid work.
