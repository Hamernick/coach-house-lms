# Workspace Presentation Runbook

Operational checklist for live board sessions in Organization Workspace.

## Canonical Routes

- Interactive board: `/workspace`
- Board presentation mode (read-only): `/workspace/present`
- Backward-compatible aliases:
- `/organization/workspace`
- `/organization/workspace/present`

## Role Capabilities

- `owner/admin/staff`: edit board layout, save layout, manage collaboration invites, present board.
- `board`: present board, manage collaboration invites, no layout editing.
- `member`: view/present only.

## Pre-Session Checklist

- Verify board content in `/workspace`.
- Save layout after final card arrangement.
- Confirm invite list only includes expected attendees.
- Confirm calendar card shows next meeting/cadence.
- Confirm communications card reflects current channel plan.

## Running A Live Session

- Start in `/workspace/present`.
- Keep presentation mode read-only to avoid accidental drag/resize edits.
- Use temporary invites (hours/days/months) for collaborators who need live access.
- Watch collaboration indicator:
- `Live`: normal operations.
- `Connecting`: waiting for realtime sync.
- `Realtime degraded`: proceed in read-only mode; avoid collaborative editing.

## Invite Governance

- Use temporary invites only; no permanent workspace collaborator grants.
- Revoke invites immediately when temporary access is no longer required.
- Review invite history (expired/revoked) to confirm cleanup.

## Failure Handling

- If realtime degrades:
- Continue presentation using read-only route.
- Ask collaborators to refresh if live cursors or avatars stall.
- If degradation persists, continue async with saved board state and follow-up notes.

## Post-Session Cleanup

- Revoke temporary invites not needed after session.
- Return to `/workspace` only if edits are required.
- Save layout after any post-session adjustments.
- Record meaningful behavior or UX regressions in `docs/RUNLOG.md`.
