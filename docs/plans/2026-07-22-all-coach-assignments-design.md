# All-Coach Organization Assignments Design

## Goal

Assign every coach-level staff member to every current organization while
retaining reversible, developer-managed assignments for future changes. Caleb
keeps unconditional developer access and is never represented as a coach
assignment.

## Decision

Convert `organization_coach_assignments` from one row per organization to one
row per organization and coach. The composite primary key
`(organization_id, coach_user_id)` makes the relationship explicitly
many-to-many and preserves existing assignment rows.

Alternatives considered were keeping one primary coach plus secondary access
grants, or creating a second parallel assignment table. Both would create two
sources of truth and make “assigned” ambiguous. A single many-to-many table is
the smallest durable model.

## Data And Authorization

Developers remain the only actors who can change assignments. Coaches can read
the assignment set; regular members cannot. A database RPC atomically replaces
one organization's coach set after validating every target is coach-level
staff. A second RPC inserts the organization-by-coach cross product for the
bulk “assign every coach” operation.

Assigned-only activation counts distinct covered organizations rather than raw
assignment rows. While active, deleting one of several assignments is allowed,
but deleting an organization's final assignment is rejected by a trigger.
Developer access continues to bypass coach scope in server authorization.

## Interface

Organization cards and details show an assigned-coach count and avatar stack.
Developers open one accessible multi-select popover and toggle coaches without
leaving the page. Coaches see the same assignment set read-only.

The operations bar reports covered organizations separately from total coach
assignments, keeps All, Unassigned, and per-coach URL filters, and adds a
confirmed “Assign every coach” bulk action. Controls retain 44-pixel mobile
targets, visible focus, pending feedback, rollback, and clear error messages.

## Rollout

Ship code and migration with assigned-only scope unchanged. After production
checks pass, invoke the authenticated bulk-assignment RPC as Caleb, verify every
coach has every current organization, then invoke the audited scope RPC. Verify
linked RLS, production counts, developer all-access behavior, coach scoping,
and live routes before recording the rollout.
