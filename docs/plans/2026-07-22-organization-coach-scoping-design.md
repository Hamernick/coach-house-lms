# Organization coach scoping design

## Goal

Restrict coach-level platform staff to their assigned organizations only after
developers finish the production assignment map. Developers retain complete
organization access. Regular customer and organization-member access is
unchanged.

## Rollout contract

- Scoping is disabled by default, including during the application-first
  deployment window.
- A developer must explicitly enable it after every current organization has
  one coach assignment.
- The database performs the readiness count and rejects early activation.
- Developers can disable scoping immediately as a rollback; disabling does not
  change assignments.
- While scoping is active, assignment changes may reassign an organization but
  may not intentionally leave it unassigned. New organizations remain visible
  to developers and hidden from coaches until assigned.
- Missing rollout tables fail open to the existing all-organization coach view
  so application deployment can safely precede migration application.

## Data and audit model

Add a singleton `organization_coach_scope_settings` row with the enabled state,
UTC activation/update timestamps, and developer actor IDs. Add append-only
`organization_coach_scope_events` rows for each enable or disable action,
including the organization and assignment counts observed by the database.

Both tables use forced RLS. Platform staff can read the setting, developers can
read events, and authenticated users cannot write either table directly. A
security-definer RPC is the only state-change path. It verifies developer
access, locks the readiness inputs for the transaction, rejects enablement when
any current organization is unassigned, updates the singleton, and appends the
audit event.

## Application authorization

The member-workspace actor context loads one organization scope:

- developer or disabled rollout: unrestricted;
- coach and enabled rollout: the set of organization IDs assigned to that
  coach;
- regular user: existing active-organization rules.

The scope is enforced before returning organization lists or details and before
project, task, note, link, asset, workstream, and assignment mutations. Direct
detail URLs for unassigned organizations resolve as not found. The application
continues using the service-role client for internal operations, so these
server-side checks are mandatory and tested.

## Developer interface

The existing assignment operations bar shows whether coach visibility is
`All organizations` or `Assigned only`. While unassigned organizations remain,
it gives the exact blocking count and disables activation. Enable and rollback
use a confirmation dialog, keep 44-pixel mobile targets, preserve the existing
URL-backed filters, and surface server errors through the established toast
system. Active scoping removes the `Unassigned` assignment choice; coaches
continue to see assignment state read-only.

## Verification

- Pure scope decisions: developer, disabled coach, enabled assigned coach, and
  enabled unassigned coach.
- Migration/RPC contract and RLS tests for early-enable rejection,
  developer-only activation, coach read-only state, event audit, and rollback.
- Acceptance coverage for list filtering, direct-detail denial, and mutation
  denial.
- Full repository quality gate, followed by deployment with the setting still
  disabled. Production activation is a separate explicit action after coverage
  reaches zero.
