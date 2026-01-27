# Accelerator Roadmap Strip
Status: In Progress
Owner: Caleb
Priority: P1
Target release: Next UI polish batch

---

## Purpose
- Make the Strategic Roadmap summary feel integrated and full-width on `/accelerator`.
- Preserve navigation affordances while reducing visual weight.

## Current State
- Roadmap summary renders as a card in the right column and feels boxed-in.
- The overview column spacing is tall, limiting horizontal layout breathing room.
- The roadmap heading style feels off from the original list treatment.

## Scope
In scope:
- Convert the roadmap summary into a full-width horizontal strip with pagination.
- Keep navigation CTA to `/roadmap` and next/prev controls when needed.
- Tighten overview spacing to reduce vertical height.

Out of scope:
- Changing roadmap content or section ordering.
- New data sources or roadmap editing UX.

## UX Flow
- Entry points: `/accelerator`
- Primary user path: See welcome → review progress → scan roadmap strip → open roadmap.
- Secondary paths: Page arrows to view more sections.
- Empty / loading / error states: none (static data).

## UI Requirements
- Screens or components affected: Accelerator overview, Roadmap outline strip.
- Design patterns to follow: original roadmap list (dot + label), shadcn buttons.
- Copy updates: none.

## Data & Architecture
- Tables / fields touched: none.
- RLS / permissions: none.
- Server actions / routes: none.
- Caching / ISR / no-store: no change.

## Integrations
- Stripe / Supabase / external APIs: none.
- Webhooks or background jobs: none.

## Security & Privacy
- Sensitive data handling: none.
- Sanitization / validation: none.
- Logging and audit notes: none.

## Performance
- LCP or heavy components: none.
- Lazy loading needs: none.

## Accessibility
- Key checks: button labels for pagination, keyboard navigation, reduced motion.

## Analytics & Tracking
- Events to track: none.
- KPIs impacted: none.

## Edge Cases
- Fewer sections than a page.
- Long section titles.

## Migration / Backfill
- Required data updates: none.

## Acceptance Criteria
- Roadmap strip spans the full width of the overview section.
- Pagination arrows appear only when needed.
- Roadmap CTA remains available.
- Overview spacing is tighter without breaking layout.

## Test Plan
- Unit tests: none.
- Integration tests: none.
- RLS tests: none.
- Manual QA path: `/accelerator` at desktop + mobile widths.

## Rollout Plan
- Feature flags: none.
- Deploy steps: standard deploy.
- Rollback plan: revert component/page changes.

## Dependencies
- None.

## Open Questions
- Final page size per breakpoint (2 on mobile, 4 on desktop).

## Moonshot
- Animated progress indicator tied to roadmap completion.
