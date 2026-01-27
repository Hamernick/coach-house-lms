# Roadmap-to-Module Prompt Mapping
Status: In Progress
Owner: Caleb
Priority: P1
Target release:

---

## Purpose
- Map every roadmap section to a module prompt so roadmap content is built through coursework.
- Align module prompt copy (label/placeholder) to the roadmap prompt language.
- Add new prompts only when existing questions are not truly synonymous.
- Remove the origin-story boilerplate org_key sync.

## Current State
- Roadmap sections are defined in `src/lib/roadmap.ts`, but only six non-section keys are wired to homework links in `src/lib/roadmap/homework.ts`.
- Several roadmap sections (people, fundraising strategy, board strategy, etc.) have no prompt mapping.
- The origin story draft currently syncs to `org_key: boilerplate`, which should be removed.
- Boards modules exist but have no assignment prompts.

## Scope
In scope:
- A definitive mapping table (roadmap section -> class/module -> prompt) ordered by accelerator class/module.
- Update module assignment schemas to align prompt copy with roadmap prompt/placeholder.
- Add new prompts inside existing modules where gaps exist.
- Update `docs/progression-system-map.md` to reflect the mapping.
- Update `src/lib/roadmap/homework.ts` to use roadmap section IDs once mapping is final.
- Remove `org_key` from origin story draft prompt.

Out of scope:
- Adding new modules or videos.
- UI redesigns beyond copy alignment.
- Changing roadmap layout or public roadmap behavior beyond mapping.

## UX Flow
- Entry points: assignment forms inside modules; roadmap editor shows homework links per section.
- Primary user path: complete module prompt -> roadmap section shows linked homework.
- Empty / loading / error states: unchanged.

## UI Requirements
- Screens or components affected: module assignment forms; roadmap editor/homework links.
- Design patterns to follow: existing shadcn assignment form patterns.
- Copy updates: align mapped prompt label + placeholder to the roadmap prompt language.

## Data & Architecture
- Tables / fields touched: `module_assignments.schema`, `assignment_submissions`, `organizations.profile` (via org_key mappings).
- RLS / permissions: unchanged.
- Server actions / routes: none beyond existing assignment submission flow.
- Caching / ISR / no-store: unchanged.

## Integrations
- Supabase only (module assignments + org profile sync).

## Security & Privacy
- Remove `org_key` for origin story draft to stop syncing boilerplate.
- Continue sanitization of user content (existing behavior).

## Performance
- No new heavy components.

## Accessibility
- Existing form semantics remain; ensure any new prompt labels are descriptive.

## Analytics & Tracking
- No new events required.

## Edge Cases
- Existing submissions should remain readable after schema updates.
- New prompts should not block completion unless required.

## Migration / Backfill
- Add migration(s) to update `module_assignments.schema` JSON for copy alignment + new prompts.
- No backfill required; new prompts start empty.

## Mapping Table (ordered by accelerator class/module)

Legend: Existing = reuse existing prompt with copy alignment; New = add prompt to module schema.

### Strategic Foundations
- Module: Start with your why
  - Roadmap section: Origin Story
  - Mapping: Existing prompt (origin story draft)
  - Copy alignment: Use roadmap prompt + placeholder.
  - Note: Remove `org_key: boilerplate` from this field.
- Module: What is the Need?
  - Roadmap section: Need
  - Mapping: Existing prompt (need statement draft)
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: AI The Need
  - Roadmap section: Need (refinement)
  - Mapping: Existing prompt (AI-supported need statement)
  - Copy alignment: Optional minor updates; keep org_key `need`.

### Mission, Vision & Values
- Module: Values (end of class)
  - Roadmap section: Mission, Vision, Values
  - Mapping: New prompt (summary)
  - Copy alignment: Use roadmap prompt + placeholder.
  - Note: Keep existing mission/vision/values prompts as-is.

### Theory of Change & Systems Thinking
- Module: Theory of Change
  - Roadmap section: Theory of Change
  - Mapping: New prompt (plain-language summary)
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Systems Thinking
  - Roadmap section: none (no mapping required)

### Piloting Programs
- Module: Designing your Pilot
  - Roadmap section: Program
  - Mapping: Existing prompt (pilot program summary)
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Designing your Pilot
  - Roadmap section: People
  - Mapping: Existing prompt (staff/volunteers needed)
  - Copy alignment: Update label/placeholder to match roadmap prompt; add mention of gaps/roles.
  - Note: This section appears earlier than the roadmap order but is the closest fit.
- Module: Evaluation
  - Roadmap section: Evaluation
  - Mapping: Existing prompt if present; otherwise add new prompt.
  - Copy alignment: Use roadmap prompt + placeholder.

### Budgets
- Module: Budgeting for a Program
  - Roadmap section: Budget
  - Mapping: New prompt (narrative summary after budget table)
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Multi-year Budgeting
  - Roadmap section: none (no mapping required)

### Fundraising
- Module: Channels
  - Roadmap section: Fundraising
  - Mapping: New prompt (fundraising overview)
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Treasure Mapping
  - Roadmap section: Treasure Map / CRM Plan
  - Mapping: New summary prompt (in addition to existing CRM prompts)
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Donor Journey
  - Roadmap section: Fundraising Strategy
  - Mapping: New prompt (targets, asks, timeline, proof points)
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Storytelling & the Ask
  - Roadmap section: Fundraising Presentation
  - Mapping: New prompt (pitch narrative/assets)
  - Copy alignment: Use roadmap prompt + placeholder.

### Communications
- Module: Comprehensive Plan
  - Roadmap section: Communications
  - Mapping: New summary prompt
  - Copy alignment: Use roadmap prompt + placeholder.

### Boards that make a difference
- Module: Intro to Boards
  - Roadmap section: Board Strategy
  - Mapping: New prompt
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Annual Calendar
  - Roadmap section: Board Calendar
  - Mapping: New prompt
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Policy 4: Board Self Governance
  - Roadmap section: Board Handbook
  - Mapping: New prompt
  - Copy alignment: Use roadmap prompt + placeholder.
- Module: Agendas, Minutes, Resolutions
  - Roadmap section: Next Actions
  - Mapping: New prompt
  - Copy alignment: Use roadmap prompt + placeholder.

## Acceptance Criteria
- Every roadmap section maps to a module prompt.
- Module prompts mapped to roadmap sections use the roadmap prompt + placeholder copy.
- No new modules are introduced.
- Origin story draft no longer syncs to `org_key: boilerplate`.
- `docs/progression-system-map.md` reflects the final mapping.

## Test Plan
- Manual QA: open mapped modules and confirm prompt copy; submit responses; verify roadmap shows homework link per section.
- Run: `pnpm lint && pnpm test:snapshots && pnpm test:acceptance && pnpm test:rls` (if scope touches DB/migrations).

## Rollout Plan
- Ship migration(s) updating `module_assignments.schema`.
- Update mapping docs.

## Dependencies
- Verify evaluation module assignment schema presence in DB.

## Open Questions
- If any fundraising prompts should live in a different module than proposed, confirm module placement.

## Moonshot
- Auto-summarize multiple prompt answers into a single roadmap section draft (optional; not in current scope).
