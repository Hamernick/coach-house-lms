# Onboarding implementation validation — 2026-10-01

## Current direction

Caleb selected **complete local checks first; defer real signup/payment tests**, then requested implementation according to specific specification/protocol/documentation with no extensive testing. This supersedes execution of the broad manual/provider matrix in the earlier handoff for this iteration. Repository-required merge gates still apply before shipping.

## Contract and evidence

The implementation contract and production audit are in [the audit](2026-10-01-organization-onboarding-audit.md). The local review's existing user feedback remains accepted. No broad Playwright journeys, new test infrastructure, account provisioning, customer edits or Stripe checkout operations were performed during this execution.

Focused checks cover changed risks:

| Behavior | Evidence |
| --- | --- |
| Required fields despite legacy completion, normal free/member/staff/invited behavior | `onboarding-requirements.test.ts` |
| Early/invalid stage does not skip access choice | Added cases within the same existing requirements suite |
| Authenticated user's claimed handle prefilled; lookup failure cannot silently replace it | Two cases in existing `onboarding-defaults.test.ts`; shared server-only defaults loader |
| Onboarding validates formation/name before writes, preserves data and enforces paid entitlement | Existing `onboarding-actions.test.ts`, with scoped name-boundary cases |
| Workspace rejects blank name before reading/writing; identity addition preserves MVV, docs, people and unknown fields | Two cases in existing `organization-profile-persistence-validation.test.ts` |
| Bounded profile-write retry retains latest profile | Existing `people-profile-write-concurrency.test.ts` |

First focused batch: **55/55 across five files**, 1.75 seconds. After aligning the onboarding name boundary, only its affected action suite was rerun: **14/14**, 1.66 seconds. These results do not imply real authentication, real durable database save, real checkout or deployment verification.

Changed-file lint passed. Structure and import boundaries passed; structure reported pre-existing approaching-budget warnings. Final required guardrail/hosted results belong to the release candidate revision and will be recorded separately. No full local `check:quality` suite was run.

## Provider/manual matrix disposition

Earlier cases T01–T06 (real email/Google/payment), T12–T13 real invitation/staff-account sessions, and T17–T18 real owner reload/second viewer are **DEFERRED by user instruction**. No isolated Coach House nonproduction project or local Docker runtime was available. Existing credentials were inspected only for capability/environment identification; no nonproduction provider was provisioned.

Local/source-contract portions of T07–T11, T14–T16 and T19–T22 are covered where stated above and by previously accepted local review. Unexecuted real mechanisms remain unverified; never label the entire 22-case matrix passed. Unknown-intent account disposition is a human review issue, not an inferred runtime change.

## Release limits

Candidate remains local; Caleb now authorizes deployment after required hosted checks and actual GitHub review/protection. No further shipping-permission question is required. Follow the [release executor](2026-10-01-onboarding-release-executor.md). No database migration or customer repair is required for the gate/name/handle fix. The simulator and private audit evidence remain separate from production runtime scope. Task-dialog/document-scrolling work is authorized to resume after onboarding production verification, in a separate change with focused user review.

Hosted build at e346dd16 found a removed tutorial-eligibility variable. Restored the original declaration in dashboard-layout-state.ts; changed-file ESLint and a single targeted production build (including TypeScript) passed. This build diagnosed the specific hosted failure; no full local quality suite or real provider test was added. New current-head hosted CI is required.

Automated-review correction: Workspace saves now trim provided names before persistence. Existing profile-preservation test strengthened at the 120-character padded boundary; its focused suite passes 13/13, with changed-file lint and diff whitespace passing. No broad test rerun.

Hosted onboarding-page cold-import timeout addressed by preloading the mocked page outside timed cases; focused onboarding page suite passes 6/6 and changed-file ESLint passes. Five-second timeout/assertions remain unchanged. Current-head hosted CI must validate the final correction.
