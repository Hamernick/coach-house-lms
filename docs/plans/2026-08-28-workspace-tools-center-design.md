# Workspace Tools Center

Date: 2026-08-28
Status: Approved first slice

## Goal

Add an organization-scoped `Tools` tab to the existing workspace overlay drawer.
The tab should feel like a compact integration catalog: searchable, status-aware,
and consistent with the drawer's existing Geist layout.

## First Slice

- Add `tools` to the canonical workspace drawer tab and URL contracts.
- Place `Tools` after `Documents` in the visible drawer tab row.
- Persist the selected tab through the existing organization/viewer-scoped UI
  preferences.
- Add a `workspace-tools` feature with a searchable provider catalog.
- Surface the existing organization Finance Stripe connection as the real
  installed/available integration. Keep its existing server authorization,
  setup dialog, sync behavior, and read-only transaction contract.
- Show Google Drive as `Setup required`, with copy that makes clear no Drive data
  is shared yet.

## Layout

The panel uses one scroll owner with overscroll containment. Its centered content
column contains:

1. A compact heading and description.
2. A labeled search field.
3. `Installed` when Stripe is connected.
4. `Available` for disconnected Stripe and Google Drive.
5. A no-results state that tells the user how to recover.

Provider rows use a restrained bordered surface, a fixed non-shrinking brand
tile, primary/secondary text, redundant text status, and the existing provider
action control. Mobile rows stack without clipping; desktop rows remain compact.

## Ownership And Data Flow

- Drawer tab routing and persistence remain owned by the existing workspace
  drawer modules.
- Catalog presentation belongs to `src/features/workspace-tools/**`.
- Stripe connection state continues to come from `WorkspaceFinanceInput` and
  `organization_finance_stripe_connections`.
- Stripe mutations continue through the existing Finance routes. The Tools
  feature does not create a parallel credential or sync system.
- Google Drive has no action, token storage, scope, credential, or provider
  configuration in this slice.

## States

- Stripe connected: `Installed`, account suffix, freshness, and `Sync`.
- Stripe disconnected: `Available` with the existing `Connect` flow.
- Stripe configuration absent/error: clear `Setup needed` or `Unavailable`
  status from the existing connection owner.
- Google Drive: `Setup required` and explicit no-data-sharing copy.
- Search with no matches: explanatory empty state and a clear-search action.

## Accessibility And Responsive Behavior

- Use native tabs, headings, label/input, sections, and buttons.
- Preserve focus-visible behavior and the drawer's focus/portal ownership.
- Keep touch targets at least 44px on mobile.
- Use explicit image dimensions and non-shrinking icon containers.
- Preserve the drawer safe-left variable and avoid changes to shared Drawer,
  Tabs, Input, or Button primitives.

## Validation

- Acceptance coverage for canonical `tools` URLs, tab order, persistence, feature
  ownership, provider states, search, and reuse of the Stripe connection owner.
- Focused lint, structure, boundaries, routes, features, React Grab, interaction
  locks, and diff checks.
- Authenticated browser QA at mobile and desktop widths in light and dark modes.
- `graphify update .` and `pnpm check:quality` before handoff.

## Deferred

- Google Drive OAuth, encrypted refresh-token storage, reconnect/revoke, folder
  selection, sync jobs, and audit events.
- A generalized provider connection table.
- Additional providers, categories, featured rankings, or marketplace billing.
