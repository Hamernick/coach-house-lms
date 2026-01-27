# Brief: Roadmap Landing + Formation Track
Status: Draft  
Owner: Codex  
Priority: P0  
Target release: ASAP (launch blocker)

---

## Purpose
- Provide a proper Roadmap landing page (no auto-jump into first section) with a clear, timeline-style overview and entry points to each roadmap section.
- Introduce a **Formation** track (repurposed from Electives) for orgs that are pre-501c3, available to free users; keep other accelerator classes gated with upsell prompts.
- Align roadmap experience with org status: pre-501c3 users start with Formation; registered orgs start with Strategic Foundations.

## Scope
- Frontend: new roadmap landing UI (timeline inspired by provided design), link-out to roadmap sections and accelerator modules.
- Data: create/alias Formation class from existing Electives modules (Financial Handbook → Filing 1023) with sensible ordering; mark as free-access.
- Gating: free users see Formation unlocked; other classes locked with inline upsell; paid accelerator users see normal gating.
- Status-aware routing: if user marked “already registered 501c3”, default roadmap entry remains Strategic Foundations; if not, highlight Formation first.
- Keep RSC-first; reuse existing components where possible.

## Out of Scope
- Competitor onboarding analysis (tracked separately).
- New content authoring; we reuse existing module content for Formation.
- Payment wiring beyond adding the $349 / $499 SKUs (tracked elsewhere).

## Users & Roles
- Free user (not on accelerator): can open roadmap landing; sees Formation unlocked; other classes locked with upsell.
- Accelerator subscriber: sees all purchased classes per normal gating.
- Admin: bypass locks, can preview all.

## Data / Logic
- Formation class = existing Electives modules in order: Financial Handbook, Due Diligence, Retention and Security, Naming your NFP, NFP Registration, Filing 1023. Rename class to “Formation”; keep module titles as-is unless minor copy alignment needed.
- Persist module completion from DB; continue sessionStorage fallback for client-only navigation.
- Org status flag (registered vs pre-registered) — if available from profile/onboarding, drive default highlighted track on landing; otherwise default to Strategic Foundations.

## UX / UI
- Landing layout: centered title + subtitle; timeline row of cards with icon, label, date/status, short blurb; clickable into roadmap/section or module depending on item.
- Mobile: vertical stack with clear tappable targets.
- Icons: use shadcn/lucide minimal icons (no gradients).
- Keep dark/light theming; typography consistent with existing dashboard.
- Upsell: lightweight inline pill/button on locked cards (e.g., “Unlock with Accelerator”).

## Acceptance Criteria
- Visiting `/roadmap` (or roadmap entry point) shows the landing timeline instead of jumping into a section.
- Free user can open Formation modules; other classes show locked state + upsell; accelerator user unaffected.
- Formation class appears in sidebar/overview with correct ordering and “Formation” title.
- Roadmap landing cards navigate correctly to roadmap sections/modules.
- Tests: pnpm lint; pnpm test:snapshots (update if needed); pnpm test:acceptance (or document if skipped).
- RUNLOG updated.

## Risks / Notes
- Ensure gating doesn’t block admins.
- Avoid double-fetch: reuse existing sidebar/roadmap data loaders.
- Keep page fast; lazy-load heavy widgets (React Flow, TipTap) out of landing.

