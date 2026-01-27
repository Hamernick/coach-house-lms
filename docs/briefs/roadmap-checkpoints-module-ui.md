# Roadmap Checkpoints in Module UI
Status: In Progress
Owner: Caleb
Priority: P1
Target release:

---

## Purpose
- Make roadmap-linked prompts inside modules look and feel like the Roadmap editor.
- Mark roadmap-linked prompts explicitly so stepper icons and UI can key off them.
- Keep copy aligned to the roadmap prompts.

## Current State
- Module assignments render long-text prompts with a plain label + editor.
- Stepper marks "roadmap" steps only when `org_key` is present, which is now incorrect for roadmap checkpoints.
- No explicit field-level flag for roadmap sections in module assignments.

## Scope
In scope:
- Add a `roadmap_section` flag to the mapped assignment fields in `module_assignments.schema`.
- Parse the flag into `ModuleAssignmentField`.
- Render a Roadmap-style checkpoint layout for flagged prompts.
- Stepper uses the flag for the Waypoints icon, including green waypoint for completed roadmap steps.

Out of scope:
- Adding new modules or videos.
- Changing Roadmap editor behavior or public roadmap UX.
- Rewriting existing module prompt copy beyond the roadmap alignment work.

## UX Flow
- Entry points: accelerator module pages.
- Primary path: open module prompt -> see Roadmap-style header, status, and editor.
- Empty / loading / error states: use existing editor skeletons and autosave behavior.

## UI Requirements
- Use the Roadmap section title + subtitle above the prompt.
- Use Roadmap prompt + placeholder copy for the editor header and placeholder.
- Show editable status pill (Not started / In progress / Complete) and Saved/Saving state.
- Keep keyboard and focus behavior consistent with current module prompts.

## Data & Architecture
- Tables / fields touched: `module_assignments.schema` JSON only.
- RLS / permissions: unchanged.
- Server actions / routes: unchanged.
- Caching / ISR / no-store: unchanged.

## Integrations
- None.

## Security & Privacy
- No new sensitive data handling.
- Continue to sanitize user input in existing pipeline.

## Performance
- No new heavy components; reuse existing RichText editor.

## Accessibility
- Preserve headings, focus styles, and visible status cues.
- Keep labels accessible for the editor.

## Analytics & Tracking
- None.

## Edge Cases
- Modules without roadmap flags should render the existing layout.
- Missing roadmap definitions should fall back to standard prompt layout.

## Migration / Backfill
- Update `module_assignments.schema` fields to include `roadmap_section` for mapped prompts.

## Acceptance Criteria
- Roadmap-linked prompts render Roadmap-style headers and editor chrome.
- Stepper shows Waypoints icon for roadmap steps (including green waypoint on completed roadmap steps).
- Non-roadmap prompts and steps remain unchanged.

## Test Plan
- Manual QA: open each mapped module prompt; verify title/subtitle/prompt/placeholder match the Roadmap section and the editor renders correctly.
- Run: `pnpm lint`.

## Rollout Plan
- Ship migration.
- Deploy UI changes.

## Dependencies
- Roadmap section definitions in `src/lib/roadmap.ts`.

## Open Questions
- None.

## Moonshot
- Auto-summarize multiple module answers into roadmap content (future).
