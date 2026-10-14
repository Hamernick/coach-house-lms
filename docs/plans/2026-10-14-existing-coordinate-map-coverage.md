# Run 05C — Existing-coordinate coverage

## Scope and decision

Continue LIVE03/B036 and the original private packet05/05c. User started this run October14 and explicitly requested individual pins revealed progressively as users zoom in, with **no numbered geographic clusters**. Preserve existing pin artwork, same-address choices, deduplication aliases and unframed Resources layout. No new geocoding, address display, IRS bulk publication, Supabase preview branch or Calendar work.

Isolated branch `fix/existing-coordinate-map-coverage-20261014`, base `af110563`, worktree `coach-house-platform-map-coverage-20261014`, localhost3123. The base contains the previous shared-frame/mobile repair. No new application changes remain: the rejected local numbered-cluster experiment was fully removed.

## Source-to-map evidence — October14

Read-only source audit and live world-map API comparison:

| Stage | Count |
| --- | ---: |
| Published external resource rows / corresponding location rows | 877 / 877 |
| Excluded synthetic fixture rows | 2 |
| Legitimate service records | 875 |
| Distinct curated places after four known duplicate pairs | 871 |
| Curated places with usable coordinates | 854 |
| Live world API pages | 500 + 354 |
| Public platform organizations / with usable coordinates | 23 / 16 |
| Combined coordinate-eligible listings | 870 |
| Combined marker features / shared-location markers | 826 / 33 |

All854 expected curated IDs equal the live paginated API IDs exactly. The actual local GeoJSON source held826 features. Existing relevance logic keeps all source features and progressively admits11/12/96/826 features at zoom1.5/7/10/15 for this snapshot. Those are relevance-eligible counts across the entire snapshot, **not simultaneous onscreen counts**; viewport, globe occlusion and symbol collision still apply. Geographic numbered clusters are not introduced. Exact-address shared-location selection remains separate and opens choices first.

Seventeen curated places lack usable coordinates: four prepared contact-location corrections; two confidential shelter/admin-office cases; six online/service-area/no-street cases; four zero-coordinate placeholders; one multiple-location record. Seven platform organizations without coordinates explicitly declare online locations. IRS directory records remain search-only because their adapter has no coordinates. This is coordinate coverage, not a new claim that all catalog fields or service evidence have been reverified.

## Four bounded data corrections

The existing October13 coordinate evidence targets Casa Esperanza Project, MYSI Corporation, La Casa Norte and Fellowship Housing. Revalidated exact location/service IDs, public status, physical/primary flags, unchanged street addresses, null coordinates/city and unknown accuracy. Current provider contact sources:

- <https://casaesperanzachicago.org/contact/> (search-index confirmation; direct fetch timed out).
- <https://www.myschicago.org/programs/>
- <https://www.lacasanorte.org/contact>
- <https://www.fhcmoms.org/how-it-works>

These are public contact locations, not assertions of walk-in or residential availability. Reused previously recorded coordinates; no fresh geocoding.

[Forward SQL](../shipping/data-repairs/2026-10-14-existing-coordinate-coverage.sql) and [exact rollback](../shipping/data-repairs/2026-10-14-existing-coordinate-coverage-rollback.sql) both end in ROLLBACK by default. Exact four-row guards abort partial/stale matches. Rollback requires unchanged repaired values. Forward and reverse were rehearsed within one transaction and returned all four original null-coordinate rows before final rollback. **No production changes committed.** Applying the four corrections would raise eligible curated listings from854 to858 if the source remains unchanged; recount grouped markers after application.

## Validation and evidence

- 58 focused pagination, bounds, deduplication and shared-location tests passed.
- 26 existing pin/relevance/fallback tests passed; the snapshot comparison additionally checks all826 features remain eligible at detail zoom with unchanged coordinates.
- Live source/API audit passed again at2026-10-14T15:23:46Z.
- Four-row forward/rollback rehearsal passed with exact before-state recovery.
- Full typecheck was interrupted after disk exhaustion; no typecheck pass is claimed. Removed only this run's generated webpack cache to recover space.
- Private receipts and checksums: `~/Desktop/Coach House Map Audit/2026-10-14-run05c/`. Full organization profile exports are not committed.

## Remaining gates and stop

User reviews progressive pins at `/resources` on localhost3123. No appearance redesign or visual-baseline update occurred. Review the exact data SQL and authorize its production application before switching the final statement to COMMIT; preserve returned rows, then verify858 eligible curated IDs after public cache refresh. Required current-head quality/code-owner gates remain separate from local checks.

Canonical SHIP revision40 remains blocked by recorded-host ownership; do not bypass ownership, alter the released head or claim this run is canonically released. Desktop packets and this lane carry the continuation evidence. Stop after the bounded data release and user map check, or report the remaining gate. No next workstream starts automatically.

Local preview checkpoint: localhost3123 is stopped after repeated ENOSPC during rebuild. Removed only task-local generated `.next`. Restore sufficient disk capacity before restarting and validating the route; no working preview is currently asserted.
