# ArcGIS Live Verification Design

## Goal

Verify a small, exact set of staged records against its current official ArcGIS
feature layer without reviewing, approving, or publishing any record.

## Guardrails

- Require one supported official source slug and one to five exact import IDs.
- Read only unapproved, unpromoted staging rows from that source.
- Accept only HTTPS ArcGIS feature-layer query URLs from `*.arcgis.com`.
- Query live rows by the layer's declared global-ID field; never download the
  whole layer.
- Bound requests by timeout, response size, redirects, and record count.
- Dry-run by default. Persisting verification requires `--apply` and an exact
  `--confirm-source` match.
- Write only deterministic verification-ledger rows. Review, approval,
  promotion, and public visibility remain separate operations.

## Comparison

Each supported source has an explicit profile for its live field names. The
first profile covers the Maricopa Heat Relief Network and compares facility
name, address, hours, phone, coordinates, and active status. A missing global
ID is treated as removal. Changed, inactive, removed, or malformed records are
stored as `needs_review`; exact matches are stored as completed verification.

## Verification

Acceptance tests cover exact-ID matching, changed and removed rows, inactive
rows, the five-record limit, official-source enforcement, ArcGIS URL limits,
and the prohibition on review or publication writes. Full repository quality
must pass before the verifier can merge. Production use begins only after that
merge.
