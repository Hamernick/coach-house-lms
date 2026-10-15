# Run05E coordinate publication results

Production data checkpoint, verified 2026-10-15T02:10:44.884462+00:00. The user authorized publication of all supported coordinate-bearing places without duplicates. Application source and layout are unchanged.

| Measure | Verified count |
| --- | ---: |
| Original coordinate-bearing source rows | 4,904 |
| Source rows resolved to published map places | 4,413 |
| Source rows requiring current service/location evidence | 491 |
| Real published resource rows | 4,611 |
| Canonical resource places after source consolidation | 4,591 |
| Map-eligible canonical resource listings | 4,573 |
| Resource marker locations | 4,448 |
| Shared-address chooser markers | 111 |
| NYC-area eligible listings | 2,161 |

The anonymous production feed exactly matches all 4,573 expected IDs across ten bounded pages: nine pages of 500 and one of 73. No missing, unexpected or repeated IDs; revision `0db1a2fbb6c8ec0f24b0e9d5`. The actual production projection, fixture exclusion, place consolidation and GeoJSON builders also pass the private data audit; every eligible listing occurs exactly once in the marker membership set. This verifies data coverage, not the number of symbols visible at every zoom. Caleb owns appearance testing.

The original 4,904 rows resolve as 3,740 published entries, 673 canonical aliases and 491 evidence holds. Multiple source rows are not promises of separate pins. Distinct current provider/program choices remain selectable at shared addresses. Library name/locality variants and verified same-center aliases consolidate without deleting public service IDs. Separate physical sites within large parks remain separate points; park name alone no longer collapses them.

Current official directories and provider pages support ordinary place categories, with seasonal access kept separate. Unknown availability stays unknown. Phoenix pool listings preserve the provider’s closure through the 2027 season. A registered address lacking public visiting-location evidence retains a nonspatial resource rather than an unsupported pin. The two historical RLS fixtures remain excluded by the application boundary.

The remaining 491 rows include missing or unavailable provider contacts, unidentified or historical discovery entries, locations absent from current seasonal feeds, and missing ordinary service/public-location evidence. Absence from a seasonal feed does not prove a building closed. Continue from the per-ID ledger; do not replay completed imports or expose the raw queue. The full all-coordinate goal remains open for these rows. Calendar remains a separate subsequent run.

Recoverable private evidence is in `~/Desktop/Coach House Map Audit/2026-10-14-run05e/`: start with `README.md` and `LATEST.json`. It contains the checksum-verified original input, all 4,904 dispositions, readable coverage CSVs, current source/provider snapshots, before states, curation/promotion receipts, operator scripts and the exact anonymous feed comparison. This is a local private archive; it is not a claimed remote backup. Preserve it and the implementation worktree.

Branch: `feat/map-place-coverage-20261014`, base `dc95147a`. No Supabase preview, frontend deployment, new map layout, visual fixture or baseline changes. Publication used the existing atomic RPC and explicit administrator authorization. Scoped planner-statistics refresh and transaction-local operator deadlines did not change RLS, schema or global timeout settings. Required code-release gates are not asserted by data publication. The canonical SHIP owner-host blocker and separate four-row Run05C coordinate hold remain preserved.
