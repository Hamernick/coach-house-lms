# Budget Table Engine (TanStack rebuild + spreadsheet-grade UX)

Status: Draft
Owner: Caleb
Priority: P0
Target release: ASAP (launch-critical UX)

---

## Purpose
- Fix reliability issues in the current budget table (auto-resize, row height, column sizing, persistence).
- Deliver a spreadsheet-grade experience so users can build budgets without exporting to another tool.

## Current State
- Custom table layout with manual column sizing and inline inputs.
- Textarea auto-resize does not shrink properly and can leave extra row height.
- Unit input UX is inconsistent and confused with duplicated controls.
- Column resizing is bespoke and not aligned with TanStack Table APIs.

## Scope
In scope:
- Rebuild budget table using TanStack Table v8 (`@tanstack/react-table`).
- Column sizing + resizing with TanStack APIs (`enableColumnResizing`, `columnResizeMode`).
- Editable cells with controlled inputs and debounced autosave.
- Stable row identity for reorder/delete/add.
- Resizable columns, uniform cell sizing, consistent backgrounds.
- Preserve existing data shape (assignment submissions) and current CSV template.

Out of scope:
- CSV import, multi-year budgeting, or advanced formulas.
- Spreadsheet-like selection range or bulk paste v2.

## UX Flow
- Entry points:
  - Any module assignment using `budget_table`.
- Primary user path:
  1. Open module and view budget table.
  2. Add line items, edit cells, resize columns.
  3. Autosave updates with visible feedback.
- Secondary paths:
  - Reorder rows via drag handle.
  - Remove line items.
- Empty / loading / error states:
  - Always show at least one blank row.
  - Autosave error banner + retry.

## UI Requirements
- Screens or components affected:
  - `src/components/training/module-detail/assignment-form.tsx`
  - Shared table UI components if needed.
- Design patterns to follow:
  - Shadcn dashboard style, dark/light parity, minimal borders.
  - Column resize handles consistent with TanStack Table guidance.
- Copy updates:
  - Maintain existing labels; add a subtle autosave status line if needed.

## Data & Architecture
- Tables / fields touched:
  - `assignment_submissions.answers` only (no schema changes).
- RLS / permissions:
  - Same as current assignment submissions.
- Server actions / routes:
  - Existing `/api/modules/[id]/assignment-submission`.
- Caching / ISR / no-store:
  - Authed data remains `no-store`.

## Integrations
- Supabase for autosave; no additional services.

## Security & Privacy
- Sanitize any user-generated markdown as currently done.
- Avoid storing UI-only state in submissions.

## Performance
- Memoize column definitions and cell renderers.
- Use `columnResizeMode: 'onChange'` or `'onEnd'` depending on perf.
- Optional: virtualize rows if row count grows significantly.

## Accessibility
- Keyboard focus for cell inputs.
- Resize handles should be focusable and usable with keyboard where possible.
- Respect reduced motion.

## Analytics & Tracking
- Autosave success/failure (optional).

## Edge Cases
- Delete a line and ensure column widths and row heights reflow.
- Resize columns, then refresh and confirm widths persist (if stored locally).
- Custom units and large text wrapping.
- Concurrent autosave edits and navigation away.

## Migration / Backfill
- None.

## Acceptance Criteria
- Textarea rows shrink/expand correctly as text changes.
- Unit column uses a single control with preset suggestions + custom input.
- Column resizing uses TanStack Table APIs and is stable.
- Autosave is reliable and does not drop edits.
- Table layout is uniform in light/dark modes.

## Test Plan
- Unit tests:
  - Formatting helpers (money, totals).
- Integration tests:
  - Budget table autosave flow.
- RLS tests:
  - None needed.
- Manual QA path:
  - Add/edit/delete rows, resize columns, refresh page.

## Rollout Plan
- Feature flags:
  - Optional if swapping table engine.
- Deploy steps:
  - Ship with standard release.
- Rollback plan:
  - Keep current table behind a flag if needed.

## Dependencies
- TanStack Table v8 already in repo.

## Open Questions
- Persist column sizing per user (localStorage) or keep per session only?
- Should we allow paste of multi-cell data (CSV-like) in v1?

## Moonshot
- Spreadsheet-style selection, multi-cell paste, and formulas.
