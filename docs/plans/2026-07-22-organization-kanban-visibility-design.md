# Organization Kanban Visibility Design

## Goal

Let each internal platform staff member hide organizations from their own
`/organizations` Kanban without changing access, coach ownership, or anyone
else's view. Developers always retain access to every organization and remain
the only staff who can assign or reassign coaches.

## Architecture

Store one row per hidden organization in
`organization_staff_kanban_preferences`, keyed by staff user and organization.
Rows are presentation preferences only. Own-row RLS allows developer and coach
platform staff to read and change only their own rows. Organization deletion or
staff removal cascades obsolete preferences.

The Organizations server page loads preferences alongside project data. The
client filters the existing project models: My Kanban excludes a hidden
organization and its related projects; Hidden shows only canonical organization
cards so every preference remains easy to reverse. The `visibility=hidden` URL
parameter preserves the selected recovery view through refresh and browser
navigation.

## Interaction

Canonical organization cards receive an accessible icon action labeled “Hide
from my Kanban” or “Show on my Kanban.” Updates are optimistic, disable only the
affected organization while pending, roll back that organization on failure,
and refresh server state after success. A persistent My Kanban/Hidden selector
shows visible and hidden counts. Empty states cover no hidden organizations and
the case where every organization is hidden.

## Security And Failure Handling

The server action validates UUID input, authenticates the request, requires the
Organizations platform capability, and checks current coach organization scope
before writing through the authenticated Supabase client. RLS is the final
own-row boundary. Missing migrations disable the UI safely; write and load
errors return user-facing messages without changing authorization.

## Verification

Acceptance coverage verifies URL state, filtering, related-project hiding,
recovery, counts, developer all-organization access, and UI contracts. RLS
coverage proves coach/developer own-row writes, cross-staff isolation, and
regular-member denial. Release validation includes the repository quality gate,
an isolated PostgreSQL migration run, responsive UI checks, and post-deploy
developer/coach smoke tests.
