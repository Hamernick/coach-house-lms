# Resource publication canary guard

Date: 2026-08-13

Status: read-only Wave 6 staging-refresh preparation. No review, verification,
visibility, publication, database, or production state changed.

## Guard repair

The prior source publication command could assign approved verification,
administrator review, and publication in one execution. That collapsed three
required gates and could expose contacts and links automatically.

The guarded command now:

- consumes only review and verification evidence already stored in production;
- requires a completed clean approved verification-ledger entry;
- limits a canary to five explicit import-record IDs;
- requires `--publish`, `--apply`, and an exact `--confirm-source` match;
- uses the atomic promotion RPC without changing review evidence; and
- leaves contact and link visibility unchanged.

The separate review command now requires an existing administrator actor for
every applied decision. Dry runs remain read-only.

## Cook County dry run

The first candidate is the official Cook County cooling-center source because
it is local, actionable during August heat, bounded, and already supported by
the deterministic source-family enrichment contract.

| Gate                                                   | Count |
| ------------------------------------------------------ | ----: |
| Current local source records                           |    35 |
| Pass local publication contract                        |    34 |
| Explicitly held locally                                |     1 |
| Publishable local records matching staging             |    25 |
| Publishable local records not yet staged               |     9 |
| Staged records retaining final review and verification |     0 |

The command selected five exact staged refresh candidates but correctly
selected zero publication candidates. All 25 matched staging rows remain held
because they contain older incomplete fields and no final administrator review
or approved verification ledger.

## Required next gate

Refresh only the 25 matching unapproved staging rows from the current retained
local evidence. Then independently verify and present at most five exact IDs to
an administrator for review. Promotion remains a separate approved production
operation with count parity and reversible unpublish proof.

## Existing-only refresh plan

The staging importer now has an `--existing-only` refresh mode for this gate.
It selects only publishable records belonging to the confirmed local source,
reads rather than upserts the existing official source, caps the refresh at 25,
skips unstaged rows, refuses approved, ready, or promoted matches, and requires
`--apply` plus an exact source confirmation before any write. A second
preflight prevents missing records from being inserted if staging changes.

The connected dry run selected the expected 25 existing unapproved staging
rows, reported nine unstaged publishable rows and zero protected matches, and
made no write. The subsequent production execution is recorded below.

## Production refresh and live-source correction

After PR #174 merged with quality and both deployments green, the confirmed
existing-only operation refreshed 25 unapproved staging rows, inserted zero new
import records, preserved 25 raw payloads, and added 803 field-evidence rows.
It did not review, promote, or publish any record. The public API remained at
853 resources with zero Cook County cooling centers.

The independent live-source check then found that Cook County's official
Socrata dataset now contains 33 rows rather than the retained 35. Markham,
Maywood, and Skokie courthouses were removed; LaGrange Park Public Library was
added. Three of the first five canary records still match the current source,
while Markham and Maywood must remain held.

The next guard therefore consumes only the latest verification result, so a
newer removal or contradiction supersedes any historical approval. The bounded
Cook County verifier checks at most five exact staging IDs against current
official fields and writes only a deterministic verification ledger after
explicit source confirmation. Administrator review and publication remain
separate operations.
