# Module Right Rail Tool Tray
Status: In Progress
Owner: Caleb
Priority: P1
Target release: ASAP

---

## Purpose
- Add a dedicated right-rail tool tray on module pages to surface notes, resources, coaching, and AI tools.
- Slightly widen the right rail on module pages to fit the tray and content comfortably.

## Current State
- Right rail exists but is page-specific and not used on module pages.
- Module pages render content inline only; no rail tools for notes/resources/coaching.

## Scope
In scope:
- Module right-rail panel with view switching and a fixed tool tray.
- Notes scratchpad (user-scoped, stored in module_progress.notes).
- Resources view using existing module resources data.
- Coaching CTA using existing schedule flow.
- AI chat placeholder.
- Return-home shortcut.
- Slightly wider right-rail on module routes.

Out of scope:
- Persisting notes server-side or syncing across devices.
- Full AI chat experience.
- Notifications integration.

## UX Flow
- Entry: user opens a module.
- Rail shows active tool view with tray at the bottom.
- Buttons switch the view (Notes, Resources, Coach, AI) and Return Home.
- Coaching button opens the scheduling link and surfaces remaining credits when available.

## UI Requirements
- Keep shadcn dashboard patterns; minimal, clean tray styling.
- Tray is always reachable (sticky or bottom-aligned).
- Preserve keyboard accessibility and focus states.

## Data & Architecture
- Use module data already available in `ModuleDetail`.
- Notes stored in `module_progress.notes` as markdown payload.
- No new backend data or RLS changes.

## Performance
- Lightweight client state; no extra fetches on load.

## Accessibility
- Buttons use `aria-pressed` for active view.
- Visible focus rings on tray buttons and inputs.

## Acceptance Criteria
- Module pages show a right-rail tool tray with Notes, Resources, Coach, AI, and Return Home.
- Right rail is slightly wider on module routes only.
- Notes persist locally per module.
- Resources display in a compact, readable layout in the rail.
- Coaching CTA opens the scheduling link.

## Test Plan
- Manual QA: open module, switch tabs, type notes, click coaching, verify rail width.
