# Global Search Overhaul
Status: Draft
Owner:
Priority: P0
Target release: Launch

---

## Purpose
- Make search robust and reliable so users can reach the right place fast.
- Ensure results are correctly gated by role and publication status.

## Current State
- `src/components/global-search.tsx` provides a Command dialog with a static list of pages.
- Accelerator context adds classes/modules from sidebar data.
- Limited gating (published flag only) and no DB-driven content search.
- No coverage for assignment questions, org/profile content, roadmap, marketplace, or map items.
- No analytics on queries or click-through.

## Scope
In scope:
- Search across: navigation pages, accelerator classes/modules, module assignment questions/prompts, org profile sections, programs, roadmap sections, marketplace items, public org/map listings.
- Return results with type, label, optional subtitle, and destination route.
- Gate results by role (admin, org admin, board member, supporter) and publish status.
- Keep the command palette UI but improve grouping and routing accuracy.
- Add analytics for query + click.

Out of scope:
- Full document content search (PDF OCR, private file contents).
- AI/semantic search (reserved for Moonshot).

## UX Flow
- Entry points: Command button in header; Cmd/Ctrl+K shortcut.
- Primary path: type → grouped results → select → route to detail.
- Secondary: no results → helpful empty state.
- States: loading, empty, error, and gated (gated results should be hidden, not shown).

## UI Requirements
- Preserve current command palette styling.
- Group results by type (Pages, Classes, Modules, Programs, Roadmap, Marketplace, Orgs/Map).
- Include subtitle/context line where helpful (class name, org name).
- Ensure keyboard navigation and clear focus styling.

## Data & Architecture
- Add a server search endpoint (route handler or server action).
- Use a search index view/table with: id, type, label, subtitle, href, keywords, visibility, org_id, class_id.
- Use Postgres FTS for titles + keywords; fallback to basic ILIKE for MVP.
- Cache results for short TTL; debounce client queries.

## Integrations
- Supabase (RLS-aware search view or filtered query).

## Security & Privacy
- Do not leak private content in results.
- Enforce role-based visibility server-side.
- Avoid including sensitive org data in labels/subtitles.

## Performance
- Debounced input; limit results (e.g., top 20).
- Avoid multiple queries per keystroke; use a single search view when possible.

## Accessibility
- Cmdk dialog must be keyboard-first, with ARIA labels and focus trapping.

## Analytics & Tracking
- Track: search_open, search_query, search_result_click.
- Log query length and result count (no raw sensitive content).

## Edge Cases
- Duplicate titles across classes/programs.
- Stale slugs (redirect or handle 404 gracefully).
- Users with no org or no enrollment.
- Mixed publish states (draft modules/classes for non-admins).

## Migration / Backfill
- If using a search index table, backfill with existing classes/modules/orgs/programs.

## Acceptance Criteria
- Searching finds titles and question prompts across core objects.
- Clicking results navigates to correct route.
- Gated content never appears for unauthorized users.
- Command palette remains responsive on mobile and desktop.

## Test Plan
- Unit: search endpoint filtering + visibility rules.
- Integration: results for admin vs student vs board member.
- Manual QA: Cmd/Ctrl+K, empty states, routing, mobile keyboard.

## Rollout Plan
- Feature flag behind `search_v2`.
- Soft launch to admins only; expand to users after verification.

## Dependencies
- Finalize roles (board member vs supporter).
- Confirm public map/org visibility rules.

## Open Questions
- Should documents be searchable by metadata?
- Should supporter users exist and see public org/map items?
- Do we need org-scoped search vs global search toggle?

## Moonshot
- Semantic search + AI assistant: natural language queries that return ranked results, suggested next steps, and “continue where you left off” prompts, using embeddings + per-org context (without leaking private data).
