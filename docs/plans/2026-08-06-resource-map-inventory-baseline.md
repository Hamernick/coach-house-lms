# Resource Map Inventory Baseline

Measured: 2026-08-06 03:58 EDT

Status: read-only Research 4 evidence. No source was fetched, imported, reviewed,
promoted, unpublished, or otherwise changed.

## Exact Funnel

The local data engine and production database are different snapshots, so their
counts are reported separately instead of being combined into a false funnel.

| Scope             | Stage                                               | Count | Evidence                                               |
| ----------------- | --------------------------------------------------- | ----: | ------------------------------------------------------ |
| Local engine      | Discovered intake records                           | 4,249 | `candidate-records.jsonl`                              |
| Local engine      | Enriched records measured                           | 4,249 | `source-family-enriched.jsonl`                         |
| Local engine      | Contract-complete                                   |   741 | Deterministic enrichment coverage audit                |
| Local engine      | Independently verified and locally publishable      |   741 | Verification status, two comparisons, no blocking gaps |
| Production        | Staged import records                               | 2,184 | Aggregate read-only database count                     |
| Production        | Contract-verified with approved verification ledger |   853 | Aggregate read-only database audit                     |
| Production        | Administrator-approved                              |   853 | Aggregate read-only database count                     |
| Production        | Promoted                                            |   853 | Aggregate read-only database count                     |
| Production        | Public RPC rows                                     |   853 | Paginated anonymous-read contract                      |
| Local review only | Explicit curated-preview records                    |   942 | `public-resource-map-preview.jsonl`                    |
| Local review only | Independently verified or publishable               |     0 | Deterministic enrichment audit                         |

`Contract-complete` requires title, named service, source-grounded summary,
category, location or service area, contact or actionable provider link,
eligibility, access instructions, source, two comparison passes, and approved
independent verification.

The production verified count additionally requires a real verification time
and a completed approved verification-ledger entry with no unresolved issues,
unsupported claims, or contradictions.

## Production Parity

Current production is internally reconciled:

- verified = approved = promoted = public = `853`;
- `1,331` of `2,184` staged rows have not crossed the verified publication
  contract; and
- published organizations, published services, and public RPC rows each equal
  `853`.

This proves current publication parity. It does not prove that the local
4,249-record discovery artifact and production staging contain the same source
records. Source-record reconciliation remains required before using either as a
denominator for the other.

## Local Provider Gap

Only eight of 30 local engine sources currently produce contract-complete,
verified records:

| Source                            | Discovered | Complete and verified |
| --------------------------------- | ---------: | --------------------: |
| Maricopa heat-relief network      |        266 |                   235 |
| Chicago cooling centers           |        287 |                   214 |
| Chicago public libraries          |         81 |                    81 |
| Palm Springs cooling centers      |         71 |                    70 |
| St. Louis warming/cooling centers |         76 |                    64 |
| Cook County cooling centers       |         35 |                    34 |
| Baltimore cooling centers         |         29 |                    29 |
| Broward cooling centers           |         31 |                    14 |
| Other 22 sources                  |      3,373 |                     0 |
| Total                             |      4,249 |                   741 |

The verified local artifact is heavily concentrated in cooling resources plus
one library cohort. It is not yet the balanced food, shelter, health, benefits,
legal, workforce, education, family, and community-service inventory required
by the publication contract.

The separate 942-record food, housing, and immigrant/refugee preview has strong
draft field coverage but zero approved independent verifications. It remains a
review artifact, not public inventory.

## Duplicate And Freshness Sample

Local enriched artifact:

- `4,246/4,249` records have a normalized fingerprint;
- `168` fingerprints repeat across `431` records;
- `47` repeated fingerprints cross sources and cover `94` records;
- dedupe classified `532` rows as candidates and `84` as duplicates;
- `3,836` rows still require review;
- reason codes include `539` uncertain duplicate matches, `105` unresolved
  duplicate matches, and `222` unresolved field conflicts.

Local source registry:

- all `30/30` sources are current under the 90-day source-fetch threshold;
- latest successful fetches are 34 to 37 days old; and
- one source has one prior failed fetch but a current successful fetch.

Source-fetch freshness does not replace provider-page verification or a real
record verification timestamp.

## Next Research

1. Reconcile source-record membership between the local enriched artifact and
   production staging without changing either system.
2. Prioritize balanced authoritative cohorts, not more cooling-center volume.
3. Measure public payload bytes, database latency, search latency, marker
   rendering, bbox queries, cursor pagination, and selected/saved overrides.
4. Set the measured threshold for bbox loading, clustering, and later vector
   tiles before Batch 4 implementation begins.

## Reproduction

Local-only commands:

```bash
node scripts/resource-map/audit-enrichment-coverage.mjs --input data/resource-map/.engine/candidate-records.jsonl
node scripts/resource-map/audit-enrichment-coverage.mjs --input data/resource-map/.engine/source-family-enriched.jsonl
node scripts/resource-map/audit-enrichment-coverage.mjs --input data/resource-map/.engine/public-resource-map-preview.jsonl
pnpm data:source-freshness -- --stale-days 90 --json
```

Production values were measured through aggregate read-only selects and the
paginated public RPC. No row contents or credentials were persisted in this
artifact.
