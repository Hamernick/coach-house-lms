# Workspace access drawer consolidation

## Decision

Make the existing Workspace `Invite` sheet the primary place to manage access. In
the team-access hover card, rename the sheet action to `Manage access` and remove
the separate `Manage members` link. Keep `/admin` as a supported fallback; do not
restore the removed Organization tab in Account Settings.

## User experience

The drawer keeps its Team and Temporary access choices. Team access adds an
accepted-members section below the invite form and pending invitations. Authorized
owners and administrators can change non-owner roles or remove members. Owners can
also control whether organization admins may invite and whether staff may manage
the roadmap calendar. Read-only users see roles without mutation controls. Loading,
empty, and failure states remain explicit, and destructive removal requires
confirmation.

## Architecture

Continue using `listOrganizationAccessAction` as the single server-authorized read
path. Extend the workspace organization-access snapshot to retain the members,
settings, and capability flags already returned by that action. Reuse the existing
member-list presentation and secured organization-access mutations rather than
creating a second permission model. Keep temporary collaboration invitations
separate from durable organization membership.

## Validation

Add acceptance coverage for the expanded snapshot, accepted-member controls,
permission toggles, destructive confirmation, and removal of the redundant People
link. Run focused Workspace and organization-access tests, structural/UI guardrails,
the full quality gate, and authenticated desktop/mobile browser checks in light and
dark modes.
