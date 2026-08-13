# Resource Map Count Refresh

Measured: 2026-08-13 15:56 EDT

Status: read-only Wave 6 evidence. No source was fetched, imported, reviewed,
promoted, unpublished, or otherwise changed.

## Exact Counts

Local artifacts and production are separate snapshots. They are not added
together or treated as one conversion funnel.

| Scope                   | Stage                                              | Count | Evidence                                                             |
| ----------------------- | -------------------------------------------------- | ----: | -------------------------------------------------------------------- |
| Local intake            | Primary discovered candidates                      | 4,249 | `candidate-records.jsonl` line count                                 |
| Local curated expansion | Candidates including the Brooklyn directory cohort | 5,046 | `source-family-plus-brooklyn-preview.jsonl` line count               |
| Local curated expansion | Contract-complete                                  |   741 | Deterministic enrichment coverage audit                              |
| Local curated expansion | Independently verified                             |   741 | Approved verification, two comparisons, no blocking gaps             |
| Local curated expansion | Publishable                                        |   741 | Deterministic publication contract audit                             |
| Production              | Staged import records                              | 2,184 | Exact aggregate read                                                 |
| Production              | Contract-verified                                  |   853 | Approved verification fields and completed clean verification ledger |
| Production              | Administrator-approved                             |   853 | Identified reviewer and review time                                  |
| Production              | Publishable                                        |   853 | Verification and approval gates combined                             |
| Production              | Promoted                                           |   853 | Promoted state and canonical organization/service IDs                |
| Production              | Public                                             |   853 | Complete pagination through the anonymous sanitized RPC              |

The expanded local snapshot has `4,305` records that are not currently
publishable. Production has `1,331` staged records that have not crossed the
verified publication contract. Production parity is exact at
verified = approved = publishable = promoted = public = `853`.

## Definitions

- `Contract-complete` requires title, named service, summary, category,
  location or service area, contact or actionable provider link, eligibility,
  access instructions, source, two comparison passes, and approved independent
  verification.
- `Contract-verified` additionally requires a real verification timestamp and
  a completed approved verification-ledger entry with no issues, unsupported
  claims, or contradictions.
- `Publishable` requires the verification contract plus an identified
  administrator and review timestamp.
- `Promoted` requires the promoted import state and both canonical IDs.
- `Public` counts every row returned through the paginated anonymous sanitized
  projection, not raw import records or local preview rows.

## Snapshot Identity

| Artifact                                    |       Bytes | Modified             | SHA-256                                                            |
| ------------------------------------------- | ----------: | -------------------- | ------------------------------------------------------------------ |
| `candidate-records.jsonl`                   | 146,262,663 | 2026-07-02 14:57 EDT | `17489e22dfb7fd2c20d4158f0f5bacaab3fff5536327317d0a455845b0e9eab9` |
| `source-family-plus-brooklyn-preview.jsonl` | 236,550,259 | 2026-08-02 23:20 EDT | `5220520505c1f06668591e7be7b17c15679b26c179c9ef34247d94051c677051` |

## Reproduction

Local counts are reproducible without network or writes:

```bash
wc -l data/resource-map/.engine/candidate-records.jsonl
node scripts/resource-map/audit-enrichment-coverage.mjs \
  --input data/resource-map/.engine/source-family-plus-brooklyn-preview.jsonl
```

Production values came from exact aggregate reads over staged records and a
complete 500-row pagination of `get_resource_map_public_items_page`. Only the
counts above were retained; no production row contents or credentials were
written to this report.
