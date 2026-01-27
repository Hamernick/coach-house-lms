# Frameworks (Roadmap Suggestions)
Status: Draft
Owner: Caleb
Priority: P1
Target release:

---

## Purpose
- Reduce blank-page friction by offering context-aware draft suggestions for roadmap sections.
- Keep outputs consistent and funder-ready while preserving the founder's voice.

## Current State
- Roadmap editor shows static prompt text and an empty editor body.
- No suggestion workflows, inline actions, or popover for reusable drafts.

## Scope
In scope:
- Add a "Framework" button in the word/character count bar (dot-separated).
- Provide a suggestion placeholder that can be inserted via inline "Keep" and the button.
- Popover with suggestion text; actions: insert, copy, edit, reset.
- Suggestions derived from org profile + section metadata, with static fallbacks.
- No AI labeling in UI copy.

Out of scope:
- AI provider selection, credits, and billing UX.
- Multi-suggestion browsing, ranking, or cross-section recommendation feeds.

## UX Flow
- Entry points: Roadmap editor word/character count bar; inline "Keep" in placeholder.
- Primary user path: Click Framework -> review suggestion -> insert -> edit.
- Secondary paths: Copy to clipboard; reset to default; edit suggestion before inserting.
- Empty / loading / error states: loading text while generating; fallback to static example on failure.

## UI Requirements
- Screens or components affected: roadmap editor, rich-text editor footer, framework popover.
- Design patterns to follow: app shell card styles, dot-separated metadata, shadcn popover.
- Copy updates: "Framework" button label; inline "Keep" action; neutral copy (no AI mention).

- Framework examples (2-3 paragraphs max):
  Origin Story: "We started after seeing families wait months for services they could not access. The moment that made the need clear was when a parent asked us for help we could not provide. This is the story we now carry into every program." Need: "Our community lacks reliable after-school care for middle school students, especially in neighborhoods where families work late shifts. This gap creates safety risks and widens learning loss. We are closing that gap with consistent, neighborhood-based programs."
  Fundraising: "Our fundraising focus this year is building recurring support from local foundations and small-dollar donors. We are prioritizing relationships with three partners aligned to youth development and asking for multi-year commitments. We will measure success by renewals, conversion rates, and time-to-close." Board Strategy: "We are recruiting board members with finance, legal, and community organizing experience to strengthen governance and fundraising capacity. New members will receive a clear onboarding packet and a 90-day activation plan. Board meetings will follow a quarterly cadence with defined committee goals."

## Data & Architecture
- Tables / fields touched: organizations profile fields + roadmap section metadata; optional cached suggestions table.
- RLS / permissions: only org members can request suggestions; no public access.
- Server actions / routes: server action to generate suggestion per section.
- Caching / ISR / no-store: no-store for auth; short cache for suggestions.

## Integrations
- Stripe / Supabase / external APIs: AI provider (TBD), Supabase for org data.
- Webhooks or background jobs: none in v1.

## Security & Privacy
- Sensitive data handling: use only allowed org fields; exclude PII.
- Sanitization / validation: sanitize suggestion text before inserting.
- Logging and audit notes: log generation events without storing raw text by default.

## Performance
- LCP or heavy components: do not block editor render; keep popover lazy.
- Lazy loading needs: lazy load generation client and popover logic.

## Accessibility
- Key checks (labels, focus, keyboard, reduced motion): accessible button, focus management in popover, keyboard actions, reduced-motion friendly.

## Analytics & Tracking
- Events to track: framework_opened, framework_inserted, framework_copied, framework_reset.
- KPIs impacted: adoption rate, insert rate, time-to-first-text.

## Edge Cases
- Existing content: decide insert behavior (append vs replace).
- Missing org data: fallback to static example.
- Offline: show cached suggestion or disable actions.

## Migration / Backfill
- Required data updates: none for v1.

## Acceptance Criteria
- Roadmap editor shows a dot-separated "Framework" button in the count bar.
- Clicking "Framework" opens a popover with a suggestion and actions (insert/copy/edit/reset).
- Inline "Keep" action inserts the suggestion and supports undo (Cmd+Z).
- Placeholder suggestion shows when the editor is empty and does not mention AI.

## Test Plan
- Unit tests: suggestion builder; insertion behavior.
- Integration tests: popover actions update editor content and counts.
- RLS tests: only org members can request suggestions.
- Manual QA path: empty editor, existing content, undo/redo, keyboard navigation.

## Rollout Plan
- Feature flags: frameworks_enabled per org.
- Deploy steps: server action, UI toggle, optional config.
- Rollback plan: hide button and popover.

## Dependencies
- AI provider selection; org data access API.

## Open Questions
- Should insert replace empty content only or always append?
- Where is the suggestion stored (local only vs persisted)?
- How should multiple suggestions be selected in v2?

## Moonshot
- Personalized frameworks library that improves with usage and outputs grant-ready narratives.
