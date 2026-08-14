# Release Security, Support, And Monitoring Runbook

Status: active release baseline; automated paging and named backup ownership are
not yet verified.

## Scope

Use this runbook for the shipped signup and legal-consent flow, public Find and
resource APIs, My Map persistence, Finance reporting and sharing, and their
Supabase policies. It does not authorize fiscal custody, payment creation, or
other Finance capabilities that are not released.

## Current Truth

- Support intake uses the application-wide `SUPPORT_EMAIL` configured in
  `src/components/app-shell/constants.ts`.
- `/status` has no measured component feed. It must say that public status is
  unavailable and must never infer health from a page render.
- The internal page-health monitor is available only through the admin
  Prototype Lab. It shows bounded client error and slow-load evidence; it is not
  an alerting service or a public status source.
- GitHub Actions, Vercel deployment state, Supabase migration parity, connected
  RLS proof when database policy changes, and focused production route probes
  are separate release evidence sources.
- OpenTelemetry initializes on Vercel or when an OTLP exporter is configured.
  Exporter delivery, retention, and paging are not proven by initialization.

## Current Security Review

The standard source review of merged commit `6dcabc1b` completed on 2026-08-14
with ten validated findings: three high, six medium, and one low. PR #187
contains fixes for all three high findings and three lower-severity findings:

- public service-role tester provisioning is unavailable;
- every legacy class API operation requires platform administration;
- caller-selected server-side link preview fetching is unavailable;
- Stripe install completion verifies the intended organization and current
  Finance authority in the same database transaction;
- post-authentication redirects remain on the application origin; and
- `/status` makes no unmeasured health claim.

The roadmap rich-HTML follow-up now uses a parsed tag, attribute, style, and URL
allowlist with encoded-protocol regression coverage. Public roadmap analytics
now accepts only validated events for public organizations and real sections,
with atomic caps of 120 events per organization per minute and 5,000 per rolling
day. Signup now rolls back account creation unless the database receives the
current document evidence; only service-role-controlled app metadata can mark
an account as explicitly provisioned without creating false consent evidence.
PR #193 is the release candidate for the final medium finding. It routes
page-health writes through one service-role-only database function, revokes
direct service-role inserts, applies atomic global, anonymous, and per-user
caps, and removes telemetry older than 30 days in bounded batches. Local quality,
Supabase Preview, and rollback-only connected database proof pass. The finding
remains open until merge, production deployment, migration parity, and focused
production proof. Wave 7 also remains open for the ownership, alert, monitoring,
and rollback evidence below.

## Ownership

The release record must name one primary and one backup for each role. A role
name alone is not sufficient release evidence.

| Responsibility             | Primary                          | Backup     | Current evidence                                      |
| -------------------------- | -------------------------------- | ---------- | ----------------------------------------------------- |
| Member support intake      | Configured support mailbox owner | Unassigned | In-app and public status links use `SUPPORT_EMAIL`    |
| Release and rollback       | Unassigned                       | Unassigned | Must be recorded before an integrated canary          |
| Engineering and monitoring | Unassigned                       | Unassigned | Must acknowledge the release artifact and alert route |
| Security and privacy       | Unassigned                       | Unassigned | Must accept or close scan findings and privacy risks  |
| Finance operations         | Unassigned                       | Unassigned | Required only for enabled Finance operations          |

Unassigned ownership blocks Wave 7 security/support completion. Do not invent a
person from a Git author, repository path, or account email.

## Support Intake

Ask the reporter for:

1. affected page and action;
2. approximate time and time zone;
3. visible error text or screenshot with private information removed;
4. account or organization identifier only when necessary; and
5. whether retrying changed the result.

Never request passwords, authentication codes, full payment details, raw Stripe
payloads, private documents, exact coordinates, or secrets by email. Keep names
and emails out of GitHub issues and alert payloads. Use opaque internal IDs in
the incident record.

## Release Monitoring Check

For the exact candidate commit:

1. confirm the full `quality` job and required hosted checks passed;
2. confirm both intended Vercel deployments point to the candidate commit;
3. run only the focused public and authenticated smoke paths required by the
   changed wave;
4. run `supabase migration list --linked` when migrations are in scope and
   require connected RLS proof when policies changed;
5. review the admin page-health monitor for new critical errors, while treating
   client-submitted events as diagnostic signals rather than trusted alerts;
6. record the monitoring window, deployment IDs, result, and reviewer in UTC;
   and
7. stop release advancement when evidence is missing or contradictory.

Automated alert delivery is not currently verified. Until a primary and backup
receive a tested alert, monitoring is manual and the integrated release gate
remains open.

## Incident Response

Use the severity and containment rules in
`docs/plans/2026-08-06-finance-operations-cutover-contract.md`.

1. Record the first observed UTC time, candidate commit, deployment,
   environment, affected route, and opaque affected IDs.
2. Preserve evidence and stop only the narrow affected capability. Keep
   read-only access and required ingestion available when safe.
3. Notify the named incident, engineering, support, and security/privacy owners.
4. Confirm the customer-impact boundary before communicating externally.
5. Reconcile affected state and verify recovery with the same focused checks
   that detected the problem.
6. Record follow-up ownership and due dates before closing the incident.

## Rollback

- Revert the smallest merged application commit or disable the narrow released
  capability.
- Never reverse an applied migration or delete production evidence. Use a
  forward repair migration.
- Preserve accounts, consent evidence, Finance history, resource verification
  evidence, and saved collections.
- Record the rollback actor, reason, UTC time, commit or flag, checks, and final
  state.

## Wave 7 Completion Evidence

Wave 7 security/support completion requires all of the following:

- a completed current-commit security scan with no unresolved P0/P1 finding;
- fixes or explicit dated acceptance for every reportable lower-severity risk;
- named primary and backup owners for release, engineering, support, and
  security/privacy;
- one delivered test alert to the primary and backup;
- a verified monitoring and retention source for production errors;
- the truthful public status behavior; and
- an attached support and rollback record for the release candidate.
