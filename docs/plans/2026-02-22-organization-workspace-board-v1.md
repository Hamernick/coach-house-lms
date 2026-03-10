# Organization Workspace Board v1 (Implementation Contract)

## Status

This v1 contract is implemented. Runtime storage has since been migrated to table-backed v2:

- `organization_workspace_boards`
- `organization_workspace_invites`

See `docs/plans/2026-02-22-organization-workspace-storage-v2.md`.

## Scope

Ship a new editable planning surface for organizations as an additive mode on the existing route:

- `GET /organization?view=workspace`

No existing route is removed or renamed.

## Integration Strategy (Non-breaking)

- Keep current modes unchanged:
  - `view=editor` -> existing editor experience
  - default -> existing dashboard bento experience
- Add a third mode:
  - `view=workspace` -> new board canvas
- Add entry links from current UI:
  - overview card action
  - editor header action

## File Tree (v1)

```text
src/app/(dashboard)/my-organization/
  page.tsx
  _components/
    index.ts
    my-organization-overview-card.tsx
    my-organization-editor-view.tsx
    workspace-board/
      index.ts
      my-organization-workspace-view.tsx
      workspace-board-canvas.tsx
      workspace-board-toolbar.tsx
      workspace-board-card-frame.tsx
      workspace-board-node.tsx
      workspace-board-calendar-card.tsx
      workspace-board-communications-card.tsx
      workspace-board-invite-sheet.tsx
      workspace-board-collaboration.tsx
      workspace-board-layout.ts
      workspace-board-copy.ts
      workspace-board-types.ts
  _lib/
    workspace-state.ts
    workspace-actions.ts

src/lib/supabase/client.ts
src/hooks/use-realtime-cursors.ts
tests/acceptance/workspace-board-layout.test.ts
```

## Data Contracts

Workspace state was initially persisted in organization profile JSON (v1):

- `organizations.profile.workspace_board_v1`
- `organizations.profile.workspace_collaboration_v1`

Rationale for v1 bootstrapping:

- no schema migration required for first release,
- can ship quickly without changing existing org/profile write patterns,
- preserves API and route contracts.

## Permissions

- View workspace: any org member with `/organization` access.
- Edit board layout/content: owner/admin/staff (`canEditOrganization`).
- Create/revoke temporary collaboration invites: owner/admin/staff/board.
- Collaboration invites are temporary windows (hours/days/months), scoped to users already in org membership.

## Card Graph (Intentional Wiring)

Edges implemented:

- `organization-overview -> formation-status`
- `organization-overview -> brand-kit`
- `formation-status -> economic-engine`
- `organization-overview -> calendar`
- `organization-overview -> communications`
- `communications -> economic-engine`

Explicitly avoided:

- `brand-kit -> formation-status` (semantically incorrect)

## Layout + UX Rules

- Presets: `balanced`, `calendar-focused`, `communications-focused`.
- Per-card size controls:
  - compact (`sm`)
  - expanded (`md`)
  - full page (route navigation)
- Auto-layout re-applies selected preset while preserving card size choices.
- Canvas controls are positioned to avoid overlap with bottom utility regions.

## Realtime + Collaboration

- Realtime cursors via Supabase broadcast channel.
- Presence avatar stack via Supabase presence channel.
- Current user avatar included in workspace toolbar.

## Design System Compliance

v1 uses existing primitives instead of raw controls:

- `Button`, `Card`, `Input`, `Textarea`, `Select`, `Tabs`, `Sheet`, `Avatar`, `Progress`
- React Flow for graph/canvas behavior

## Testing + Quality

- New acceptance tests for workspace layout normalization and auto-layout behavior.
- Full quality gate run:
  - lint
  - structure checks
  - import boundaries
  - raw button guard
  - snapshots
  - acceptance
  - RLS
  - build
  - visual
  - performance budgets

## Known v1 Limitations

- Resolved in v2: collaboration invites and board state are now persisted in dedicated relational tables with RLS.
- Communications card is a functional UI shell; channel API integrations (OAuth/post publishing) are deferred.
- Temporary invite window currently scopes collaboration behavior, not org membership mutation.

## v2 Path (Single Track)

1. Completed: moved workspace layout + collaboration invites to dedicated tables with strict RLS.
2. Add server-validated invite acceptance/revocation flows with audit events.
3. Wire communications card to provider integrations and scheduled dispatch jobs.
4. Add dedicated visual regression snapshots for `/organization?view=workspace` desktop + mobile.
