# UI Rapid-Fire Batch — Session 2026-01-22
Status: Draft
Owner: Codex
Priority: P1
Target release: TBD

---

## Purpose
- Capture and execute the rapid-fire UI fixes for nav/header, accelerator, people, and roadmap sections.
- Restore visual alignment and functional parity between accelerator inputs and roadmap outputs.

## Current State
- Multiple UI inconsistencies across accelerator, marketplace, people, and roadmap.
- Some sections rely on TipTap editors where structured UI is needed.
- Mobile header/breadcrumb layout can overlap search.

## Scope
In scope:
- Sidebar progress indicator size.
- Mobile header breadcrumb alignment (avoid overlap with search).
- People page: remove SEARCH/CATEGORY rail labels.
- Accelerator overview spacing adjustments and dropdown consolidation (use icon variant).
- Fix RichTextEditor flushSync warning and Cmd/Ctrl+A behavior.
- Roadmap sections: calendar, board docs, treasure map/CRM, budget, people, mission/vision/values, theory of change, program section.
- Roadmap nav notification dot behavior for accelerator → roadmap sync.
- Admin invite form layout overlap fix.
- Sidebar order: move Roadmap under Accelerator.

Out of scope:
- Major new backend systems unless required by roadmap replacements.
- Full notifications system rebuild (only roadmap nav dot behavior for now).

## UX Flow
- Entry points: sidebar navigation, accelerator module completions, roadmap editor pages.
- Primary user path: complete accelerator input → roadmap section updates → notification dot clears on open.
- Secondary paths: create/edit roadmap calendar events; upload board docs; manage budget and people.
- Empty / loading / error states: existing patterns; add empties for new structured UI where needed.

## UI Requirements
- Screens or components affected: AppShell header, sidebar, accelerator overview, people page, roadmap editor, admin invite form.
- Design patterns to follow: existing column layout, shadcn components, current dashboard shell.
- Copy updates: none unless needed for clarity.

## Data & Architecture
- Tables / fields touched: TBD after inspecting roadmap data model and accelerator inputs.
- RLS / permissions: ensure board/admin-only notifications for events where specified.
- Server actions / routes: may be needed for calendar/events and document uploads.
- Caching / ISR / no-store: follow existing authed no-store pattern.

## Integrations
- Supabase storage (likely for board docs uploads).
- No new third-party APIs planned.

## Security & Privacy
- Restrict board/admin-only notifications and visibility for calendar/documents.
- Validate uploads; restrict to allowed file types.

## Performance
- Avoid heavy client components where unnecessary.
- Prefer minimal re-renders in editor-heavy sections.

## Accessibility
- Focus handling in editors; keyboard shortcuts for Cmd/Ctrl+A.
- Labels for form controls; avoid overlap in mobile header.

## Analytics & Tracking
- Potential event: roadmap section updated from accelerator input.

## Edge Cases
- Accelerator inputs not mapped to roadmap sections.
- Missing board/admin members for calendar notifications.
- Empty data states for new roadmap sections.

## Migration / Backfill
- None planned initially; may require mapping existing TipTap content into structured data.

## Acceptance Criteria
- All listed UI adjustments applied and verified visually.
- Mobile header breadcrumb no longer overlaps search.
- Roadmap section replacements functional and responsive.
- Accelerator inputs update roadmap and show/clear nav dots.
- Admin invite button never overlaps role dropdown.

## Test Plan
- Manual QA across affected pages.
- No new tests unless the new features add logic requiring coverage.

## Rollout Plan
- No feature flags; ship sequentially after each change is verified.

## Dependencies
- Need to inspect roadmap/accelerator data models for sync mapping.

## Open Questions
- Which accelerator inputs map to which roadmap sections? (needs list)
- Final UI patterns for calendar and treasure map section.

## Moonshot
- Unified “roadmap dashboard” with all structured tools and notifications in one view.
