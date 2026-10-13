# Retained nonprofit audit: October 6, 2026

Implemented step A of the [national implementation plan](2026-10-06-national-nonprofit-implementation-plan.md). Resume through the [stable continuation checklist](nonprofit-enrichment-continuation.md), not this dated result.

## Results

| Outcome | Organizations |
| --- | ---: |
| Audited identities | 10,001 |
| Exact EIN/name matched to original local IRS BMF files | 10,001 |
| Previously candidate-enriched, all included in the audit | 1,049 |
| With eligible non-address enrichment | 1,047 |
| Website: IRS-reported / provider-confirmed | 526 / 10 |
| Phone: IRS-reported / provider-confirmed | 961 / 10 |
| IRS-reported mission/description | 897 |
| IRS-reported filing address | 10,000 |
| Address candidates for geocoding and location review | 2,462 |
| Map pins established / services approved / public writes | 0 / 0 / 0 |

All identities qualify under the planned organization-directory evidence rule. This is not a claim of live availability: the directory publisher and serving path, production suppression/owner/duplicate preflight, and release validation remain unimplemented or unperformed. The existing approved-service catalog has stricter requirements, which this audit does not bypass.

The 1,049 candidate-enriched count is distinct from 1,047 with eligible non-address fields. Fields overlap. Ten current provider-confirmed website/phone pairs are a subset of the contact totals, not a publication ceiling. Reported filing values must be dated and labeled; they are not freshly confirmed contacts.

Address outcomes: 2,343 mailbox/mail-drop exclusions; 5,059 care-of/agent holds; 52 incomplete; seven format holds; 77 outside initial geocoder coverage; one conflicting latest-filing address; 2,462 potential geocoding candidates. Address candidates still need geocoder matches and residential/confidentiality review. No filing address was promoted to a service location.

## Saved evidence

Final artifact directory: `/Users/calebhamernick/.local/share/coach-house/nonprofit-enrichment/audit-20261006-retained-final`.

- `REPORT.md`: readable results.
- `report.json`: counts, reasons, source/output hashes, code revision and timings; written last to mark completion.
- `eligibility.jsonl`: one row per organization, field decisions, source IDs, retained evidence IDs and holds.
- `sources.json`: hashes and integrity for every ledger source plus six local BMF inputs and row accounting.
- `filings.json`: exact-EIN XML reparse/provenance checks.

The initial development run is preserved separately at `audit-20261006-retained-v1`; its code revision names the parent commit because it ran with uncommitted implementation. Use the final committed-code run above for continuation.

The six BMF files contain 1,962,246 input rows. This audit joins the retained 10,001-EIN population; it does not recompute the full-corpus distinct-EIN denominator. All 2,199 ledger source records matched their expected file hashes; duplicate source/scan entries do not represent independent corroboration. Local BMF origin is operator-supplied IRS-format data, with no invented official download receipt or release date. Filesystem modification times are explicitly not snapshot publication dates.

## Working commands

Requires Node 22.13+, the existing ledger, and downloaded BMF CSV files. No model key, network access or production credentials. Run from the checkout located by permanent CURRENT.json. Use new output paths; existing outputs are never overwritten.

```sh
pnpm resource-map:enrich-organizations inventory --output /absolute/new-source-inventory.json --write
pnpm resource-map:enrich-organizations audit-publication --input /absolute/eo1.csv,/absolute/eo2.csv,/absolute/eo3.csv,/absolute/eo4.csv,/absolute/eo_xx.csv,/absolute/eo_pr.csv --output /absolute/new-audit-directory --write
```

`--write` permits private artifacts only for these commands. Both open the ledger read-only. The audit reads one SQLite snapshot, checks file integrity, streams original BMF rows, reparses each retained filing once, then exports bounded pages of decisions. A missing/changed source cannot be trusted silently. Failed audits have no completion report; resume by rerunning into a new directory. It does not claim leases, mark research jobs complete, alter evidence, or publish anything.

Reported fields require exact-EIN parsed filing values and matching retained assertions. Latest filing periods and explicit amendments take precedence; unresolved ties are held. Descriptions are excerpted only after comparing complete values. Website and phone decisions are independent. Existing provider verification is recomputed against retained receipts and filings; stale/quarantined sites cannot inherit verification. NTEE remains organizational classification, not proof of services. Logos, socials and inferred service/category assertions remain held pending their own evidence policies.

## Validation and next work

Seven new runtime tests cover field independence, source tampering, conflicting periods/amendments, mailbox/privacy holds, deterministic replay, unchanged ledger bytes, private output permissions, failed-run markers and CLI dry-run/missing-ledger behavior. Existing runtime/Python acceptance wrapper, focused ESLint and structure/feature/import-boundary checks passed. No hosted quality, deployment or production checks were performed.

Continue with slice B's versioned identities/source snapshots and bulk import, and slice C's directory schema/publisher/search contract. Publish the eligible retained cohort through that validated path without waiting for a national crawl. Existing source downloads and audit evidence are reusable. Do not rerun this audit merely because a new chat starts; rerun only for changed ledger/source/policy inputs or explicit validation needs.
