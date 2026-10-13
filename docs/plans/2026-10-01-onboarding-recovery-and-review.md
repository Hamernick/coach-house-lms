> Current execution: [rigid onboarding release executor](2026-10-01-onboarding-release-executor.md). Deployment authorized after required hosted CI/review; then resume the two original UI fixes. Earlier plans remain background.

# Onboarding recovery and manual review

Continuation: use the [detailed executor handoff](2026-10-01-organization-onboarding-executor-handoff.md) for the ordered audit, Workspace recovery verification, remaining implementation, dedicated-account testing and release gates. This shorter document preserves the initial plan and local review evidence.

## Approved scope

Fix the legacy completion gap first, then make every onboarding path repeatable for Caleb's manual review. Use existing onboarding forms. Preserve organization documents, profile fields, memberships, purchases, subscriptions and coaching credits. No customer-account reset, inferred organization name or new rename control.

## Implementation

1. Share a read-only completion decision between the dashboard and workspace: owner/build accounts require saved name, public URL and valid formation status even when legacy metadata says complete. Staff and invited-member exemptions remain.
2. Distinguish initial access/plan selection from organization setup so fresh signups see pricing and returning/paid builders go to the existing setup form without a redirect loop or another purchase.
3. Enforce the same required organization fields on submission. Continue merging setup into the latest profile with revision checking; never replace documents or write billing records.
4. Cover the legacy case, each missing field, fresh and returning free/paid builders, member intents, staff/invited users, incomplete submissions, concurrent document preservation and successful recovery.
5. Prepare resettable manual scenarios using the real onboarding components and decision logic. Clearly distinguish local interaction scenarios from authenticated signup, email/Google callback, Stripe test checkout and durable database verification. Supply direct routes and expected outcomes; do not present simulated payment as end-to-end billing evidence.

## Review matrix

| Scenario | Expected result |
| --- | --- |
| Fresh builder, free | Access selection, then required organization/account setup |
| Fresh builder, Organization or Operations Support | Checkout/return retains plan; setup required before completed workspace |
| Legacy completed paid owner, missing organization basics | Existing setup form; no repeat purchase; documents and subscription preserved |
| Completed owner, missing one required organization field | Setup prefilled with existing values; completion blocked until valid |
| Fully configured owner | Normal workspace without onboarding |
| Find / Fund / Support | Member/account flow; no organization requirement |
| Invited organization member | Existing organization access; no separate organization creation |
| Platform staff | Existing staff access |
| Invalid/duplicate/reserved URL, missing formation, save failure | Clear error and retained input; no completion flag before a successful save |
| Reload/back/reopen | Draft behavior and completed-state routing remain consistent |

## Release conditions

Focused behavior/persistence tests and changed-file lint first. Caleb reviews the supplied preview. Required current-head hosted quality, visual checks where affected, branch protection and deployment verification still apply. Karen's live record remains unchanged during preparation; after deployment she supplies her missing fields through setup.

## Current evidence — October 1

- Local completion checks and server-side formation validation implemented. No production account, subscription, document, or metadata mutations.
- Review: http://localhost:3014/dev/onboarding-review. Fourteen scenarios, per-scenario local storage and Reset. Launch instructions live in `src/features/onboarding-review/README.md`.
- Fixed two review harness defects encountered during review: the server-action re-export directive prevented compilation, and the simulated organization-count response was missing, blocking URL availability. Browser verification then reached account setup using `testingcaleb` and a selected formation status.
- Focused browser verification: legacy paid setup completes, reload retains completion and sample documents/plan, Reset returns to organization setup. This is local simulation evidence only.
- Caleb reported onboarding reviews are seeming fine. Preserve that review evidence; do not repeat broad visual journeys.
- Latest focused suite: 43/43 across requirements, actions, onboarding page, review scenarios, defaults and state helpers. Feature contract/scaffold checks and focused lint passed. Earlier route/boundary checks passed. No hosted release gate or deployment is claimed.

## Deferred: dedicated-account signup/payment checks

Subsequent user direction: complete local checks first; defer real signup/payment tests and extensive testing. Follow the [audit/implementation contract](2026-10-01-organization-onboarding-audit.md) and [focused validation evidence](2026-10-01-onboarding-validation.md). The list below is retained for future authorized work, not an active requirement for this iteration.

Use disposable accounts in an isolated provider test environment; never reset Karen or another customer. Provisioning/provider writes are a separate step after local review. Supply test inbox identities and the intended nonproduction authentication/Stripe environment before running it.

1. Test email signup/verification and Google signup/return with fresh accounts; verify the chosen intent and return route persist.
2. Test Individual, Organization and Operations Support. For paid plans use Stripe test mode: success, cancellation, delayed/repeated webhook and reload must preserve one purchase and the correct tier. Never enter real card details in the simulator.
3. Test Find, Fund, Support, invited membership and staff exemptions. Verify server authorization and existing-organization access.
4. Seed only a dedicated legacy test owner with completion metadata, missing basics and sample documents. Compare document/profile data and subscription identifiers before/after recovery. Include an already claimed personal username and unchanged organization URL; neither should require a replacement identity. Verify concurrent document writes survive.
5. Test failed save, invalid/reserved/taken URLs, account reload and successful return to the actual workspace. Confirm missing setup cannot pass via direct workspace navigation.
6. Record account identifiers, environment, revision and results without credentials. Only after this and current-head hosted gates should the fix be considered for deployment.
