# Budget Table UX (Redesign + CSV template + mini guide)

Status: Done
Owner: Caleb
Priority: P0
Target release: ASAP (launch support)

---

## Purpose

- Make the budget table easier to scan and complete on both mobile and desktop.
- Provide a CSV template download so teams can draft budgets offline.
- Add a clear 3-step mini guide to reduce confusion about the workflow.

## Current State

- Budget table lives inside assignment forms (`budget_table` field type) with a desktop table and mobile card layout.
- Quick-add categories exist, but guidance and actions are scattered.
- No CSV template download is available.

## Scope

In scope:

- Redesign the budget table header and helper area for clearer guidance + actions.
- Add a 3-step mini guide in the budget table UI.
- Add a CSV template download link (static file in `public/`).

Out of scope:

- CSV import or parsing.
- Multi-year budgeting or rollups beyond the current subtotal.
- New data storage or schema changes.

## UX Flow

- Entry points:
  - Any module assignment using `budget_table`.
- Primary user path:
  1. Read the 3-step mini guide.
  2. Add line items (manual or quick add).
  3. Review subtotal and adjust details.
  4. Download CSV template if needed.
- Empty / loading / error states:
  - No new async states; use existing component states.

## UI Requirements

- Present the mini guide and quick add buttons in a unified “budget toolkit” surface.
- Keep subtotal and primary actions (add line item, CSV download) easy to find.
- Preserve mobile card layout; keep desktop table for power users.

## Data & Architecture

- No new tables or data changes.
- Add static CSV template under `public/`.

## Integrations

- None (static download).

## Security & Privacy

- CSV template is a static public file without sensitive data.

## Performance

- No heavy components; keep layout changes lightweight.

## Accessibility

- Buttons and download link must be keyboard accessible and properly labeled.

## Analytics & Tracking

- None required.

## Edge Cases

- Empty rows should still show one blank line item.
- CSV link should still work if a user is unauthenticated (static file).

## Migration / Backfill

- None.

## Acceptance Criteria

- Budget table UI includes a 3-step mini guide and a CSV template download.
- The subtotal and primary actions are easy to find.
- Mobile and desktop layouts remain usable and visually consistent.

## Test Plan

- Manual QA:
  - View a module with `budget_table` on mobile and desktop.
  - Verify quick add, add/remove, subtotal updates.
  - Download CSV template and confirm headers.

## Rollout Plan

- No flags required; ship with the next deploy.

## Dependencies

- CSV template file content approval.

## Open Questions

- Should the CSV template include example rows or only headers?

## Moonshot

- Add CSV import with column mapping and validation.
