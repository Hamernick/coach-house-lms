# Personal coaching credits — bundled internal tools release

## Approved behavior

- Compact Coaching credits panel above organization Billing: choose a person, view available balance/history, issue quantity/source/reason/optional expiration. Staff access follows existing organization scope.
- Ten credits per Accelerator participant. Caleb explicitly approved topping existing participants up to ten available credits (preserve any larger balance and all historical records).
- One 45-minute booking reserves one credit. Completion/no-show retain the debit. Participant cancellation at least four hours before restores it; later cancellation forfeits it. Coach cancellation restores it regardless of notice.
- Early reschedule transfers the existing credit. Caleb explicitly chose another credit for late reschedules; the previous debit remains used.
- Google organizer-calendar cancellation/deletion reconciles to cancellation and one restoration. Provider failures must never be interpreted as deletion.
- Credits belong to people, independent of active organization. Source examples: Accelerator, Alumni Services, Courtesy/Bonus, Purchased Coaching. Expiration belongs to the grant; history remains after expiration.

## Implementation and stopping points

1. Extend existing coaching-booking feature and credit ledger with grants, actor/reason provenance, idempotent service-only transactional commands and personal balances. Preserve old rows and carry forward balances before the one-time Accelerator top-up. Add staff panel using shared controls and immediate feedback.
2. Apply four-hour policy at the database boundary, integrate booking/Stripe/actions and clear member-facing messages; retain server authorization and scoped staff access. Separate provider work from durable credit decisions and reconcile retries.
3. Add bounded, authenticated Calendar reconciliation and broker support. Verify existing focused acceptance/RLS checks and a temporary local SQL rehearsal (no new tracked tests), review UI, then include in the current bundled PR. Stop after concrete review-ready changes; deployment, broker rollout, migration/top-up, scheduler and live canary require explicit release evidence.

## Scope and verification

- Branch: fix/internal-tools-updates-20260930. Includes Resources visibility and medium-width Documentation header fix. No Documentation routing/shell change (request withdrawn).
- Actual recipients must come from Accelerator purchase/subscription records, never every member of their organization. Audit migration counts and identities before production apply.
- Preserve original ledger as history; new grants prevent expired credit debits from reducing unrelated active grants. Serialize issuance/consumption per user and state transitions per booking. Retry keys prevent duplicate grants/restorations.
- Calendar: use organizer event status, not attendee declines, 404, network errors or revoked access. Relevant Google documentation: https://developers.google.com/workspace/calendar/api/v3/reference/events and https://developers.google.com/workspace/calendar/api/guides/create-events.

## Local completion and release gate

Implemented the staff balance/issuance/history panel, personal grant ledger, enrollment trigger, transition top-up, participant rescheduling, four-hour cancellation rules, staff outcomes/cancellation, durable Calendar retries, authenticated reconciliation endpoint, and paid-checkout credit preservation. Existing legacy schedule links now enter /coaching so bookings cannot bypass the ledger. Resources visibility and Documentation sizing stay in this bundle.

Validation: 40 existing coaching/billing/Stripe checks pass; no new tracked test cases. Isolated PostgreSQL rehearsal applies all three migrations and verifies ten-credit enrollment once, transition top-up, larger balances (15 remains 15), preserved history, person isolation, exactly-four-hour refund, late forfeiture, late-reschedule extra debit, retry idempotency, coach refund of only the latest debit, expiration, insufficient-credit rollback and no-show consumption. Existing local RLS suites pass; destructive remote RLS deliberately skips the shared production project. Focused lint and structure/route/feature/boundary/ownership checks pass. Full TypeScript still reports existing test-fixture errors; no application-source errors in the prior diagnostic.

Read-only production preflight: two distinct active Accelerator purchasers, eight ledger rows, zero legacy expiring rows, 25 bookings (three confirmed). No write or credit issuance has occurred. Private recipient/ledger evidence remains outside Git.

Release sequence (do not mark live from code checks alone):
1. Obtain current-head hosted quality and required review. Review /organizations/[id] credit panel and /coaching reschedule/error states; signed-in end-to-end verification is outstanding because localhost uses production data and these migrations are unapplied. Review affected canonical visual output after human appearance review.
2. Deploy the backward-compatible coaching Calendar broker getEvent/deterministic-create support. Preserve its previous revision for rollback. Do not conflate this with the separate personal Google Calendar integration.
3. Briefly pause coaching booking/checkout traffic during the coordinated app/schema cutover. Old application code computes an implicit four-credit allowance and cannot safely serve new grant-ledger data. Capture private before-images and re-audit participant identities, balances, and pending payments; apply only 20260930120000, 20260930121000, 20260930122000 in order, then activate the reviewed application. Confirm the migration list contains no unrelated pending migration.
4. Configure one scheduler for authenticated GET /api/internal/cron/coaching-calendar using GOOGLE_CALENDAR_CRON_SECRET (minimum 32 characters), approximately every minute. Reuse existing scheduling infrastructure after checking for duplicates. Each invocation handles at most 40 rows and about 40 seconds; monitor returned failed count and pending actions. Provider failures retry and do not refund credits.
5. Verify one authorized staff issuance, participant booking, early/late cancellation, late reschedule and organizer Calendar deletion with before/after ledger evidence; verify balances survive refresh. Restore any canary credits through explicit ledger adjustments, preserving history.

Rollback: retain the new schema/history; stop the scheduler and coaching traffic if policy verification fails. Roll back the broker independently if necessary. Do not blindly redeploy the old implicit-balance application against migrated data; ship a corrective change or audit a data-aware rollback first. No new paid service is introduced; the scheduler adds small recurring HTTP/database/provider usage. Live provider costs and current scheduler capacity require verification at activation.

Known operational limits: Google restoration requires explicit organizer-event cancellation status. Deleting an attendee's own copy, losing calendar access, or receiving a 404 is not treated as coach cancellation; staff can use Coach cancel. Calendar sync is periodic, not instantaneous. Paid credits remain available if their original booking can no longer confirm; unresolved paid-slot conflicts remain visible as webhook/checkout failures for staff follow-up. Receipt-based Accelerator issuance is once per person; future cohorts require explicit staff grants until cohort enrollment is modeled.
