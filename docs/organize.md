# Launch Sprint Organizer — Coach House LMS
Last updated: 2026-01-12

Purpose: turn all launch notes into a clean, deduped, step-by-step checklist so we can say “go” and execute fast.

---

## How to Use This Doc (Passes)
1. Pass 1 (Capture): add new notes into “Inbox” at the bottom; keep wording intact.
2. Pass 2 (Organize): move items into the right section; dedupe only when absolutely certain.
3. Pass 3 (Schedule): place into the step-by-step checklist (P0/P1/P2).
4. Pass 4 (Execute): check off items, add outcomes + blockers, then update RUNLOG.

---

## Goals (Launch ASAP)
- Get paying users onto the platform (platform plan + accelerator add-on).
- Deliver a minimal but high-quality end-to-end experience: signup → onboarding → build → publish/share → payments.
- Keep the UI ultra-minimal, fast, and aligned with existing shadcn/dashboard patterns.

---

## Product Context (Messaging Anchor)
- Core pain point: fundraising is the #1 nonprofit challenge.
- Origin: platform extends existing coaching/classes/consulting work into a scalable product.

---

## Master Process (End-to-End)
Intake → Clarify → Brief → Plan → Build → Validate → Release → Log

Required outputs per task:
- Intake: capture raw notes in Inbox.
- Clarify: list open questions + decisions needed.
- Brief: create a task brief in docs/briefs with scope, UX, data, security, and acceptance criteria.
- Plan: break into steps; identify file touch list and dependencies.
- Build: implement in small changes; follow AGENTS.md.
- Validate: run required checks/tests or record why not.
- Release: deploy + verify key flows.
- Log: add entry to docs/RUNLOG.md.

Definition of Done (minimum):
- Requirements met (scope + acceptance criteria).
- No regressions in critical flows.
- Tests run or explicitly deferred with reason.
- RUNLOG updated.

---

## Docs Structure & Naming Standards
Master:
- `docs/organize.md` is the master execution document.

Task briefs:
- Create one brief per medium/large task in `docs/briefs/`.
- Naming: `docs/briefs/<slug>.md` (kebab-case). Example: `docs/briefs/onboarding.md`.
- Use the template in `docs/briefs/BRIEF_TEMPLATE.md`.

Decision tracking:
- Keep unresolved decisions in “Open Questions / Decisions.”
- When resolved, record the answer in the relevant task brief and update the master list.

---

## Design System & UX Rules (Strict)
- Minimal, fast, and clear; avoid dense text.
- Use existing shadcn dashboard patterns; no new UI language without a brief.
- Large rounded containers, centered layouts, clean spacing.
- Mobile-first; screenshotable cards and layouts.
- Accessibility baseline: proper headings, button targets, and reduced-motion support.

---

## Separation of Concerns (Architecture)
- Keep RSC by default; only use client components when needed.
- Keep data access in lib or route handlers; UI components stay presentation-focused.
- Avoid adding new global state unless a task brief justifies it.
- Prefer existing components and utilities before creating new ones.

---

## Global Search Requirements (High Priority)
Goals:
- Robust search across orgs, programs, classes/modules, questions, and accelerator items.
- Correct routing when a result is clicked.
- Respect access control (published vs private, role-based visibility).

Scope:
- Searchable fields: titles, headings, question text, accelerator modules, and key descriptions.
- Results must include type + destination route.
- Gated results should not appear for unauthorized users.

Performance:
- Fast lookup; avoid full-table scans on every keystroke.
- Debounced queries and cached results where possible.

---

## Task Brief Template (Required for Large Tasks)
Use `docs/briefs/BRIEF_TEMPLATE.md` and fill all sections before building.

---

## AI Handoff Summary (Current Status Snapshot)
Product:
- Coach House is a nonprofit accelerator + LMS (Next.js App Router, RSC-first, Supabase, Stripe, shadcn/ui).

Core flows:
- Auth, pricing/checkout/webhook, class → module progression, assignments, org profile, admin CRUD.

Public surfaces:
- Landing, pricing, community map, public org pages, public roadmap.

Design:
- Shadcn dashboard shell, dark/light/system, mobile-first, RSC by default.

Process:
- Follow AGENTS.md + docs/CODEX_RUNBOOK.md; keep PRs small; run tests.

Current status (built):
- Runbook steps S00–S32 checked off; admin CRUD, sequential unlocks, assignments, programs, org profile, public pages, community map, and roadmap exist.
- Landing routes to `src/app/(public)/home2/page.tsx` (scroll prototype); pricing exists; billing portal placeholder when Stripe not configured.
- Dashboard uses Supabase data for org profile, roadmap, programs, subscriptions; some “Next actions” and cards still heuristic/placeholder.
- Onboarding flow exists but needs simplification (free vs accelerator; remove individual vs org).
- Test suite and CI expectations are wired (pnpm lint, pnpm test:snapshots, pnpm test:acceptance, pnpm test:rls).

Security status:
- RLS on all tables; admin role via profiles.role + public.is_admin(); admin actions use service-role fallback server-side when RLS blocks.
- Stripe webhook verifies signature and stores idempotent events; subscriptions upserted.
- HTML sanitization/strip for markdown and org profile fields; assignment submissions sanitized; org documents restricted to PDF.
- Storage buckets: decks|resources|submissions private with signed URLs; org-media and avatars public but scoped by per-user RLS; org-documents private.
- Gaps: no CSP/security headers in next.config.ts; full security sweep still TODO; sanitization is regex-based (not full sanitizer).

Database and data linking:
- Supabase tables cover profiles/classes/modules/enrollments/module_progress/subscriptions plus organizations, module_assignments, assignment_submissions, attachments, enrollment_invites, programs.
- Homework schema (module_assignments.schema) drives AssignmentForm and saves to assignment_submissions.
- Submissions with org_key sync into organizations.profile, so coursework builds the org profile.
- RPCs next_unlocked_module and progress_for_class power dashboard progression.
- Public pages use organizations.public_slug + is_public + is_public_roadmap; community map uses location_lat/lng.
- Doc gap: docs/DB_SCHEMA.md is empty and needs to be written from migrations.

Launch-critical gaps:
- Stripe billing: access gating + upgrade/downgrade/cancel/resubscribe to move past placeholders.
- Security sweep: CSP/security headers, validation audit, rate-limit auth/webhooks, review public buckets.
- Curriculum polish: finalize module copy + homework schemas; ensure org profile sync is complete.
- Onboarding simplification: align to free vs accelerator and remove extra questions.
- Marketing clarity: landing + pricing redesign with clear core offerings and outcomes.

Cleanup/refactor load:
- Pending large-file refactors: `src/components/account-settings/sections/desktop-sections.tsx`, `src/components/kibo-ui/dialog-stack/index.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections.tsx`.
- Library cleanup still pending: `src/lib/modules.ts` and `src/lib/supabase/types.ts` remain large.
- Package manager alignment unresolved (package-lock.json exists while README/AGENTS expect pnpm).
- Full refactor is explicitly on backlog (docs/TODO_PRIORITIZED.md #34); defer unless blocking launch.
- Performance follow-ups: continue lazy-loading heavy widgets (TipTap/React Flow) per runlog.

Homepage improvements (GSAP/modern + clear offerings):
- Reframe to 3 core pillars (Accelerator, Platform, Community) and surface them above the fold; push docs/map into secondary sections.
- Add GSAP-style motion: pinned hero + scroll-scrubbed video, parallax photo strip, staggered reveals; honor prefers-reduced-motion.
- Add “What you get” timeline (deliverables, artifacts, outcomes) + a plain-language 1-sentence value prop.
- Refresh typography: pick a more distinctive display/body pair and define CSS variables for stronger brand feel.
- Add proof: cohort stats, case studies, mentor logos, short testimonials.
- Split CTA: “Apply to Accelerator” (paid/coached) and “Start free platform” (self-serve), with clear pricing hint.

SWOT:
- Strengths: robust RSC architecture; deep LMS + org-profile integration; admin tooling + public pages already built; test harness exists.
- Weaknesses: marketing clarity and pricing positioning; CSP/security sweep missing; DB schema docs empty; JSON profile makes reporting harder.
- Challenges: real Stripe gating; content quality alignment with accelerator; performance on heavy client widgets.
- Opportunities: unique “homework → public story” pipeline; community map + shareable roadmaps; AI assist for homework; funder-ready outputs as differentiator.

Sources to read:
- AGENTS.md
- docs/OVERVIEW.md
- docs/TODO_PRIORITIZED.md
- docs/RUNLOG.md
- runlog.md
- docs/CODEX_RUNBOOK.md
- src/app/(public)/home2/page.tsx

---

## Open Questions / Decisions (Must Answer Before “Go”)
- Pricing + tiers: confirm Free vs Organization ($20/mo) + Accelerator add-on ($499 one-time) and included features.
- AI provider: Gemini vs OpenAI; pricing model (pass-through vs margin); monthly credits; rate limiting.
- Fundraise naming: not “campaign” or “round” — pick a new term (metric? drive? goal?).
- Donation processing: Stripe Connect as primary? second option?
- Board member role: exact permissions (document-only, view-only dashboard) and invite flow.
- Onboarding variants: what questions for free vs org vs accelerator?
- Public roadmap visibility: default off/on? gating?
- Community access: exact unlock rules for Discord/WhatsApp + events.
- Map + marketplace: scope for launch (map only? map + minimal profiles?).
- “LINK” mention: clarify what payment processor/link service this refers to.

---

## Step-by-Step Launch Checklist (P0 “Go” Path)
Use this sequence when you say “go”.

1) Define scope & decisions (blockers)
- [ ] Confirm pricing tiers + features + AI credits policy.
- [ ] Decide AI provider + monetization stance.
- [ ] Name the fundraise feature + define its UX entry point.
- [ ] Decide donation payment processor(s).
- [ ] Define board member role + invite flow.
- [ ] Decide what is publicly visible at launch (org page, roadmap, map).

2) Payments & access gating
- [ ] Stripe products/prices finalized for Platform Free / Organization / Accelerator.
- [ ] Webhook + subscription sync verified end-to-end.
- [ ] Access gating enforced for paid features (accelerator, coaching, AI credits).
- [ ] Billing portal flows: upgrade/downgrade/cancel/resubscribe.
- [ ] Stripe Connect for donations (orgs can accept donations on public profile).

3) Onboarding + profiles (fast, personal, minimal)
- [ ] Simplify onboarding: free vs organization vs accelerator.
- [ ] Entity formation status flow (pre‑501c3 / in progress / approved).
- [ ] Founder profile + org profile creation.
- [ ] Minimalist in‑app tutorials/tooltips where needed (short, fast).
- [ ] Add quick guidance tags/cards with counts when highlighting UI flows.
- [ ] Permissions + visibility controls (public vs private).

4) Public org page + map
- [ ] Public organization page (profile, programs/projects, donation link, updates).
- [ ] Resource/community map (public, searchable, filters by location/cause/type).
- [ ] Map UI: full‑screen, clickable pins (circle image + thin white border), open profile as card/drawer.
- [ ] On org cards, show progress bar tied to funding goals.

5) Accelerator integration (paid)
- [ ] Ensure 9‑week, 42‑module structure aligns to build‑as‑you‑go logic.
- [ ] Progress tracking across profiles/accelerator/database/notifications.
- [ ] Integrate program creation wizard into modules at the right points.
- [ ] Auto‑populate org profile + first program + fundraising artifacts from module completion.
- [ ] Board members can view budget/financial artifacts.

6) Coaching & meetings (paid)
- [ ] Meeting booking via Google Calendar (no custom calendar build).
- [ ] Guardrails: link usage limits / guidelines for free calls.
- [ ] Coach directory placement (People page? “Network” category?).
- [ ] Calendar + notifications sync (later priority) with ability to add events.

7) Security + performance sweep (minimum viable)
- [ ] CSP/security headers.
- [ ] Validation audit + rate‑limit auth/webhooks.
- [ ] Review public buckets and doc access.
- [ ] Org file security hardening + 2FA option (email or free provider).
- [ ] Skeletons/preload/caching at key touchpoints.

8) Marketing & pricing
- [ ] Pricing page updated to spec (see below).
- [ ] Homepage messaging aligned to core offerings + clear CTAs.
- [ ] Add map to header nav + add “resource map” card to core offerings.

9) QA + launch
- [ ] Run pnpm lint + test:snapshots + test:acceptance + test:rls.
- [ ] Smoke test: auth, onboarding, paid signup, accelerator unlock, map, public org page, donation link.

---

## Workstreams (Deduped + Full Coverage)

### A) Core Platform Foundations (Must‑Have)
- Nonprofit onboarding flow.
- Entity formation status: pre‑501c3 / in progress / approved.
- Onboarding for different tiers; personal, minimal, fast; slight animations; path of least resistance.
- Minimal tutorials for navigating the platform; explain purpose/how to do certain things.
- Founder profile + organization profile creation.
- Organization dashboard as single source of truth.
- Secure document storage (governing docs, policies, financials); move out of my‑organization page to its own nav item (left sidebar).
- Org chart / team management:
  - Dot grid background on canvas.
  - Canvas taller; open by default (no open button).
  - Center element that does not move (org profile picture node).
  - Node patterns: circular waves around center OR hierarchy tree/pyramid.
  - Editable by org admin.
  - Staff/supporters/board overlay sections should not appear unless auto‑created and neatly laid out (centered at top of tree).
- Connected tools: Stripe for subscriptions and Stripe Connect for donations.
- Permissions + visibility controls (public vs private).
- Board member role: nav item + dashboard view with document access only.
- Public org page: profile, programs/projects, fundraising goals + donation links, updates/announcements.
- Optional roadmap display on org profile (if enabled).
- Admin control over what is public.

### B) Accelerator Integration (Paid)
- Accelerator curriculum engine.
- 9‑week structure, 42 modules.
- Progress tracking across profiles/accelerator/database/progression/notifications.
- Build‑as‑you‑go logic: integrate program creation wizard into modules at the right points.
- Completing modules auto‑populates:
  - Org profile (placeholders chosen based on lesson context).
  - First program.
  - Fundraising readiness artifacts.
  - Funder‑readiness outputs.
  - Pitch narrative.
  - Program description.
  - Budget + financial artifacts (visible to board members).
  - Compliance checklist.

### C) Coaching & Human Support (Paid)
- 1:1 coaching system.
- Coach directory (People page? preloaded? “Network” category).
- Meeting booking with Google Calendar (avoid building full calendar).
- Guidelines/limits on link usage (avoid uncharged scheduling).
- Later priority: scheduling/availability, session notes (private), dashboard integration, group coaching/office hours, calendar, registration, replay archive.

### D) Community Layer (Discord + WhatsApp for now)
- Member community access.
- Discussion spaces, peer learning, founder networking.
- Finish setting up Discord/WhatsApp; add events if possible.

### E) Resource Map + Marketplace (Mostly Free)
- Marketplace/resources page partially public; unlock all after signup.
- Populate marketplace with free + discounted tools/resources/books/people.
- Partnerships/coupon codes so we get credit.
- Clear tagging + categories + search.
- Consistent way to populate all pictures on marketplace cards.
- Add a library tab (book links needed).
- Public development docs site / open knowledge base (formation, compliance, fundraising, ops), linked contextually from the platform.
- Public, searchable map of nonprofits (location/cause/program type filters).
- Link map to org pages + donation flow.
- Supporter-friendly map view: full-screen map, circle image pins, and minimalist card/drawer profile.

### F) Payments & Subscriptions
- Subscription management.
- Clear Free vs Organization tiers:
  - Free: anyone; org profile + map listing after 501c3 confirmation.
  - Organization: $20/mo; includes everything in free + roadmap + AI credits? (decide).
- Accelerator access gating.
- Coaching add‑ons.
- Stripe integration: platform payments + donations.
- Revenue/data tracking/storing.
- Prompt to connect payment services if not connected.

### G) Fundraising Tools & Public Share
- Fundraising goal display (program creation flow + org page + roadmap).
- Live tracker progress bar for money raised.
- Fundraise page: minimalist Apple Watch‑style UI; centered graph/title; card‑based layout aligned with empty component patterns.
- Naming: avoid “campaign” / “round”; find alternative.
- Design: always-visible or toast‑style support CTA (bottom‑right?) — decide placement.
- Roadmap as pitch deck: allow donations/payments from public roadmap (top 2 processors).

### H) UX/Design System + Patterns
- Build /design‑pattern page showcasing:
  - User profiles, org profile cards, program pages, program cards.
  - Search/list items (shadcn style): external/internal, full/medium/mobile.
  - Notes on patterns that don’t exist yet or aren’t used.
- Consistency: large rounded cards centered on screen, clean spacing, minimal info for max value.
- Fix tables and org chart for mobile/screenshot‑ready UI.
- Mobile UI framework should be screenshotable (clean spacing, isolated assets).
- Reinstate social media assets.

### I) Notifications
- Build a notifications component (minimalist).

### J) AI (Paid Option)
- AI writing assist: use org context (excluding sensitive data) to draft answers.
- Each AI response should include a “note” on what could be stronger (e.g., “It would be good to add xyz; do you have xyz?”).
- Make it explicit: AI output is a template; user tells their story.
- Allow opt‑out of AI.
- Monetization: decide pass‑through vs margin; rate limiting; monthly credits; unused credits donation idea (evaluate).
- “AI recommendations” panel: 2 recommendations at a time; optional save to mini kanban.
- Phase 2 AI: grant discovery, funding opportunity matching, donor/partner identification, funder readiness scoring, gap analysis.

### K) Admin / Ops
- Analytics: org progress, accelerator completion, funder‑readiness milestones.
- Admin tools: user management, content management, coach management.
- Super admin dashboard for internal staff (meetings, edits, reviews, flywheel proposals).
- Make orgs shareable like Substack/Stripe.

---

## Pricing Page Requirements (Must Match)
Card 1: The Platform (Free)
- Title: Formation
- Price: $0 / month
- Subtitle: For founders forming their entity.
- Features:
  - 1 Admin Seat (Founder only)
  - 501(c)(3) Formation Flow (Guided)
  - Private Roadmap (Internal planning)
  - Resource Map Listing (Get discovered)
  - Community Access (Discord & WhatsApp)
  - Stripe Connect (Accept donations)
  - Secure Document Storage
- CTA: “Start Free”

Card 2: The Platform (Growth)
- Title: Organization
- Price: $20 / month
- Subtitle: For teams building momentum and funding.
- Features:
  - Everything in Free
  - Unlimited Admin & Staff Seats
  - Board Member Portal (Manage and update your board)
  - Public Shareable Roadmap (Your live pitch deck)
  - Community Access (Discord & WhatsApp)
  - AI Consultant (50 Credits / month)
  - Fundraising Campaign Tools (rename once fundraise term decided)
- CTA: “Upgrade Organization”

Card 3: The Accelerator (Add‑On)
- Title: The Accelerator
- Price: $499 (One‑time)
- Subtitle: The 9‑week playbook to funder‑readiness.
- Features:
  - 42‑Module Curriculum (Lifetime access)
  - Strategic Templates (Budgets, Narratives)
  - Single User License (Locked to one founder)
  - Expert Coaching Sessions (Discounted access)
  - Priority Support
  - Can be added to Free or Organization plans
- CTA: “Enroll in Accelerator”

Note: screenshots available for reference when building pricing page.
Note: Community Access and map listing are included in Formation.

---

## Homepage Improvements (GSAP / Modern Designer Feel + Clear Offerings)
- Hero: “There’s a playbook. Most leaders never receive it.”
- Replace “resilient” → “effective”.
- Product positioning: “The nonprofit platform from formation to funder readiness.”
- Remove conflicting language (system / studio / commons).
- Emphasis on access, funding, credibility.
- Add map link in header on `/` and a core offering card for the resource map.
- Motion: pinned hero + scroll‑scrubbed video, parallax photo strip, staggered reveals (respect prefers‑reduced‑motion).
- Proof: cohort stats, case studies, mentor logos, short testimonials.

---

## Refactor Plan (Sequential, Low‑Risk)
Goal: “perfect file tree/structure; up‑to‑date docs; clean naming; DRY; optimal; no breaking changes.”

Phase 1 — Documentation & hygiene
- [ ] Align package manager (remove package‑lock or switch to npm).
- [ ] Update README + FAQ + docs/OVERVIEW.md to match current architecture.
- [ ] Write docs/DB_SCHEMA.md from migrations.
- [ ] Add/confirm security doc (CSP headers, RLS, storage).

Phase 2 — Large file refactors (in isolation)
- [ ] `src/components/account-settings/sections/desktop-sections.tsx`
- [ ] `src/components/kibo-ui/dialog-stack/index.tsx`
- [ ] `src/components/organization/org-profile-card/tabs/company-tab/edit-sections.tsx`
- [ ] `src/lib/modules.ts` + `src/lib/supabase/types.ts`

Phase 3 — Performance + consistency
- [ ] Lazy-load heavy widgets (TipTap/React Flow) everywhere.
- [ ] Add skeletons/preload/caching where needed.
- [ ] Audit infinite loops/edge cases/old code/broken code.
- [ ] Standardize UI patterns via /design‑pattern page.

Phase 4 — Admin tooling + analytics
- [ ] Add internal admin dashboard (meetings, user admin, reviews).
- [ ] Add analytics for org progress + accelerator completion.
- [ ] Add admin search analytics view (top queries, zero-result terms, query→clicks).

---

## Questions to Answer (Parking Lot)
- AI: provider choice, credits policy, opt‑out defaults, privacy copy.
- AI monetization stance: pass‑through only vs margin.
- Fundraise naming + UI placement.
- Board member role + permissions + invite UX.
- Map: depth of profile view at launch.
- Supporter user type: can anyone sign up just to browse/support orgs?
- Community + map access: should they be free (note: you said don’t charge for community/map)?
- Onboarding: exact steps per tier.
- Donation processor and Connect experience.
- 2FA provider choice (email or free service).
- What “LINK” refers to (payment processor?).

---

## Suggested Codex Skills (Top 5 to Add)
1) Skill: create-launch-plan
   - Purpose: turn notes into launch‑ready execution plan (P0/P1/P2).
2) Skill: pricing-and-gating
   - Purpose: Stripe products, gating, subscription flows, portal checks.
3) Skill: onboarding-and-profiles
   - Purpose: simplify onboarding, entity status, profile creation flows.
4) Skill: public-surfaces
   - Purpose: public org pages, community map, roadmap visibility.
5) Skill: design-system-audit
   - Purpose: build /design‑pattern page, standardize UI, spot drift.

---

## Inbox (New Notes)
(Add new raw notes here before organizing.)

## Raw Notes Delta (Captured Items)
These were either missing or needed clearer placement; they are now folded into the sections above.
- 2FA option (email or free provider) + org file security hardening.
- Public development docs site / open knowledge base linked from the platform.
- Community + map access should be free (conflicts with pricing spec; decision needed).
- Supporter user type / map-first experience details (full-screen map, profile drawer).
- Roadmap as pitch deck with donations/payments integration.
- Quick guidance tags/cards with counts for UI walkthroughs.
- Calendar/notifications sync and ability to add events (later priority).
- Phase 2 AI: grant discovery, funding matching, donor/partner identification, funder readiness scoring, gap analysis.
