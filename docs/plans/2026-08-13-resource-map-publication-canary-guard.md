# Resource publication canary guard

Date: 2026-08-13

Status: read-only Wave 6 canary preparation. No review, verification,
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
