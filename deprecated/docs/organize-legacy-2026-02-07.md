# Launch Sprint Organizer — Coach House LMS
Last updated: 2026-02-07

Purpose: turn all launch notes into a clean, deduped, step-by-step checklist so we can say “go” and execute fast.

---

## NOW (Next 3)
When starting a Codex session, do these in order (brief → implement → run 4 tests → RUNLOG).

- [x] `docs/briefs/coaching-booking.md` — Standardize booking cards + 3 calendar links (free x4 → discounted; plus full-price).
- [x] `docs/briefs/budget-table-ux.md` — Redesign budget table UX + CSV template download + 3-step mini guide.
- [ ] `docs/briefs/notifications.md` — Update/expand notifications to cover key platform events (accelerator, coaching, roadmap/docs).
- [ ] `docs/briefs/roadmap-formation.md` — Roadmap landing + Formation free track + gating.

## Active Top 5 (Current Execution Queue)
Use this as the operational queue for incremental Codex passes.

1. End-to-end demo journey seed completeness:
   - Ensure one deterministic “tour account” covers settings, org profile, team, programs, roadmap, calendar, notifications, module progress, and notes.
   - Keep dry-run fixture validation strict and CI-safe.
2. Accelerator progression UX unification:
   - Finish card alignment/system consistency across deliverables + modules.
   - Keep ordering deterministic (Formation first; electives after core formation path).
3. Readiness criteria operationalization:
   - Keep `Fundable`/`Verified` evidence-based with explicit missing criteria links.
   - Tie funding goal + document evidence + formation completion to real persisted data.
4. Calendar and shell behavior parity:
   - Align accelerator-facing calendar/layout tokens with `/my-organization`.
   - Keep home-canvas section handoff/scroll behavior deterministic at panel boundaries.
5. Launch QA hardening + documentation:
   - Continue acceptance coverage for onboarding/entitlement/billing transitions.
   - Keep `docs/briefs/*`, `docs/organize.md`, and `docs/RUNLOG.md` current each session.

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
- For Codex: start with `docs/GO.md` and keep `docs/briefs/INDEX.md` current.

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
- docs/GO.md
- docs/OVERVIEW.md
- docs/TODO_PRIORITIZED.md
- docs/RUNLOG.md
- docs/briefs/INDEX.md
- deprecated/docs/runlog-legacy-2025-02.md (legacy archive; historical context only)
- docs/CODEX_RUNBOOK.md
- src/app/(public)/home2/page.tsx

---

## Done (Since 2026-01-14)
- [x] Removed `/dashboard` from user-facing navigation + command palette; default “home” is `/my-organization`.
- [x] Global search: added loading indicator + icons + thumbnails where available (Marketplace logos, org logos).
- [x] Tutorial system: fixed render-phase setState warning; stabilized first-run welcome modal + highlight tour.
- [x] Tutorial: added Accelerator Welcome + Return home tour step; made welcome + tour tooltip theme-aware (light/dark).
- [x] Pricing: fixed the “white bar” gap above the sticky header on `/pricing` (background now consistent).
- [x] UI: improved light-mode CircularProgress track contrast (kept progress stroke green).
- [x] Launch planning: added Electives add-ons workstream + P0 brief; deferred Stripe setup as “TODO last” with a concrete checklist.
- [x] Tooling: added `pnpm promote:admin` to promote an existing Supabase user for testing.
- [x] Supabase: pushed security scan fixes + `student`→`member` role rename migrations; RLS tests pass again.
- [x] Supabase: prepared RLS lints cleanup migrations (`auth_rls_initplan` + `multiple_permissive_policies`) for the remaining Supabase lints CSV warnings (apply to target env and re-export lints).
- [x] Admin: restore Platform + Resources sidebar items (admins can now navigate beyond Accelerator).
- [x] Org access: membership-aware org pages (staff/board) + invite gating + active-org resolver (RLS + app updates).
- [x] UI: matched `/accelerator` overview card surfaces to the `/pricing` light-mode surface token (`--surface`).

---

## Open Questions / Decisions (Must Answer Before “Go”)
All decisions live here. When resolved, move to “Locked” and update the relevant brief + checklist items.

### Locked (2026-01-16)
- Accelerator pricing: Pro $499 one-time or $49.90/mo for 10 months; Base $349 one-time or $34.90/mo for 10 months (bundles Accelerator + Organization; auto switches to $20/mo afterward).
- Accelerator access: single-user license (only the purchaser; not transferable to other org members).
- Coaching scheduling: 3 Google Calendar links (free x4 → discounted paid; plus full-price paid link).
- Doc sharing: EIN/990/W9/wire info via signed links.

### BLOCKS IMPLEMENTATION (resolve before building that feature)
- Pricing tiers: finalize Platform + Organization features + AI credits policy.
- Electives vs Formation: decide whether “Electives 1–3” become the free 501(c)(3) formation flow for all users (vs paid add-ons).
- AI provider + credits packaging: Gemini vs OpenAI, token packs/subscription, buy-more UX, usage limits.
- Donation processing: Stripe Connect as primary? second option?
- Board portal: exact permissions + meeting minutes/docs + “schedule a meeting” surfaces.
- “Verified org profile”: definition + who gets it + how it shows up (badge + visibility).
- Onboarding variants: what questions for free vs org vs accelerator?

### Not blocking / can defer (ship ops-first)
- Accelerator installment cancel behavior: handle manually (ops-first) for launch.
- Fundraise naming: not “campaign” or “round” — pick a new term (metric? drive? goal?).
- Community access: exact unlock rules for Discord/WhatsApp + events.
- Map + marketplace: scope for launch (map only? map + minimal profiles?).
- “LINK” mention: clarify what payment processor/link service this refers to.

---

## Step-by-Step Launch Checklist (P0 “Go” Path)
Use this sequence when you say “go”.

1) Define scope & decisions (blockers)
- [ ] Confirm pricing tiers + features + AI credits policy.
- [ ] Confirm Accelerator installment cancel behavior (ops-first at launch).
- [ ] Decide “Electives 1–3” placement (free formation flow vs paid add-ons).
- [ ] Decide AI provider + monetization stance.
- [ ] Name the fundraise feature + define its UX entry point.
- [ ] Decide donation payment processor(s).
- [ ] Define board member role + invite flow.
- [ ] Decide what is publicly visible at launch (org page, roadmap, map) + “verified profile” rules.

DB readiness (P0/P1)
- [ ] Apply latest Supabase migrations (including lints cleanup + FK indexes) and re-run Supabase scan export.
- [ ] Defer INFO “unused index” + auth connection setting until post-launch unless perf issues appear.

2) Payments & access gating
- [ ] Stripe products/prices finalized for Platform Free / Organization / Accelerator (one-time + installment). (TODO last)
- [ ] Installment plan behavior: Pro $49.90/mo x10 and Base $34.90/mo x10, includes Accelerator + Organization, then reverts to $20/mo.
- [ ] Stripe products/prices finalized for Electives add-ons (standard + Accelerator-discounted prices).
- [ ] Webhook + subscription sync verified end-to-end.
- [ ] Access gating enforced for paid features (accelerator, coaching, AI credits).
- [ ] Billing portal flows: upgrade/downgrade/cancel/resubscribe. (TODO last)
- [ ] Electives entitlements enforced (routes, sidebar, search) and purchasable/manageable in-app (lifetime access).
- [ ] Stripe Connect for donations (orgs can accept donations on public profile).

Stripe setup (manual) — TODO last:
- [ ] Create Stripe prices: Organization (recurring), Accelerator (one-time), Electives (standard + discounted).
- [ ] Enable Stripe Customer Portal configuration (plan changes, cancel/resume, payment methods).
- [ ] Create webhook endpoint to `/api/stripe/webhook` and subscribe to required events.
- [ ] Set Vercel env vars (prod): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_ORGANIZATION_PRICE_ID`, `STRIPE_ACCELERATOR_PRICE_ID`, plus elective price IDs.
- [ ] Smoke test: org checkout → roadmap publish unlock; accelerator checkout → accelerator unlock + org trial; portal cancel → roadmap publish disables; lifetime entitlements remain.

3) Onboarding + profiles (fast, personal, minimal)
- [ ] Simplify onboarding: free vs organization vs accelerator.
- [ ] Entity formation status flow (pre‑501c3 / in progress / approved).
- [ ] Formation flow: make “Electives 1–3” the default starting path for all accounts (prompt upgrade; no dead ends).
- [ ] Add a formation tracker outside `/accelerator` (platform-first; tied to 501c3 status + docs + roadmap).
- [ ] Founder profile + org profile creation.
- [ ] Minimalist in‑app tutorials/tooltips where needed (short, fast).
- [ ] Add quick guidance tags/cards with counts when highlighting UI flows.
- [ ] Permissions + visibility controls (public vs private).

4) Public org page + map
- [ ] Public organization page (profile, programs/projects, donation link, updates).
- [ ] Resource/community map (public, searchable, filters by location/cause/type).
- [ ] Map UI: full‑screen, clickable pins (circle image + thin white border), open profile as card/drawer.
- [ ] On org cards, show progress bar tied to funding goals.
- [ ] Documents sharing: EIN/990/W9/wire info share page/link (ultra-minimal; text/email a link).

5) Accelerator integration (paid)
- [ ] Ensure 9‑week, 42‑module structure aligns to build‑as‑you‑go logic.
- [ ] Progress tracking across profiles/accelerator/database/notifications.
- [ ] Integrate program creation wizard into modules at the right points.
- [ ] Auto‑populate org profile + first program + fundraising artifacts from module completion.
- [ ] System map: document user journeys + data mapping (accelerator → roadmap → org profile → public surfaces), with gaps + easy wins.
- [ ] Roadmap v2: internal doc templates (Origin → Need → Mission/Vision/Values → Theory of Change → Program → Evaluation → People → Budget → Fundraising → Communications → Board Strategy → Next Actions).
- [ ] Budget module: redesign the budget table for usability (responsive) + CSV template download + 3-step mini guide.
- [ ] Module UX: fix end-of-module “Continue”, TipTap focus/cursor quirks, and “Take a break” routing.
- [ ] Module notes: toggleable notes during lessons + surface notes later on the overview page.
- [ ] Board members can view budget/financial artifacts.
- [ ] Electives add-ons promoted on Accelerator overview + available for purchase during/after Accelerator (discounted pricing for Accelerator owners).

6) Coaching & meetings (paid)
- [ ] Meeting booking via Google Calendar (no custom calendar build).
- [ ] Standardize booking cards across the app (minimal; consistent CTA + pricing context).
- [ ] Integrate coaching entitlements into scheduling flow (free x4 per Accelerator purchaser → discounted link; plus full-price link; cancellations/no-shows handled manually).
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
- [ ] Create an admin test account for verification (either `pnpm create:admin` or `TARGET_EMAIL=<your email> pnpm promote:admin`).
- [ ] Supabase Auth settings: add `/auth/callback` to allowed redirect URLs (email signup/reset links now use it).
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
- System map: user journeys + data mapping (accelerator → roadmap/org profile/public) with gaps + obvious wins.
- Roadmap v2 (Accelerator-first): richer default templates + tighter linkage to accelerator progress + public org profile.
- Budget table UX: responsive layout, lightweight editing, CSV template download, 3-step mini guide.
- Module UX: end-of-module continue; “take a break” goes back to accelerator overview; fix module re-entry/progression bugs.
- Notes: toggleable per-module notes + overview index/search (needs layout decision first).
- Completing modules auto‑populates:
  - Org profile (placeholders chosen based on lesson context).
  - First program.
  - Fundraising readiness artifacts.
  - Funder‑readiness outputs.
  - Pitch narrative.
  - Program description.
  - Budget + financial artifacts (visible to board members).
  - Compliance checklist.

Roadmap v2 template subtitles (draft)
- Origin Story — The roots of the work: what happened, what you saw, and why this mission matters now.
- Need — The problem and who it impacts, grounded in lived experience + evidence.
- Mission, Vision, Values — The change you exist to create and the principles guiding decisions.
- Theory of Change — Your If → Then → So logic chain from activities to outcomes (and key assumptions).
- Program — What you deliver, how it works, and what participants experience.
- Evaluation — How you measure outcomes, learn quickly, and improve.
- People — Team structure, roles, governance, and the capacity you need next.
- Budget — The financial model: costs, runway, and what funding unlocks.
- Fundraising — The plan to secure support: goals, targets, timeline, and asks.
  - Strategy — Target funders + relationship plan + cadence.
  - Presentation — Pitch narrative + deck + proof.
  - Treasure Map + CRM plan — Prospect list + tracking + follow-ups.
- Communications — Messaging + channels + cadence for staying visible.
- Board Strategy — How you recruit, manage, and activate the board to support governance + fundraising.
  - Calendar — Meeting cadence + milestones.
  - Handbook — Roles, expectations, onboarding, and norms.
- Next Actions — The next 30–90 days: priorities, owners, and specific support asks.

### C) Coaching & Human Support (Paid)
- 1:1 coaching system.
- Coach directory (People page? preloaded? “Network” category).
- Meeting booking with Google Calendar (avoid building full calendar).
- Standardize booking cards (same component everywhere) + 3 calendar links (free x4 → discounted; plus full-price).
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
- Quick win: add Marketplace categories “Economic Engines” + “Community Platforms” and seed Substack + a few starters.
- Consistent way to populate all pictures on marketplace cards.
- Add a library tab (book links needed).
- Public development docs site / open knowledge base (formation, compliance, fundraising, ops), linked contextually from the platform.
- Public, searchable map of nonprofits (location/cause/program type filters).
- Link map to org pages + donation flow.
- Supporter-friendly map view: full-screen map, circle image pins, and minimalist card/drawer profile.

### F) Electives Add-Ons (Paid)
- Sell Electives modules as lifetime add-ons (per-elective purchases) with two price points:
  - $100 each (no Accelerator purchase).
  - $25 each (Accelerator purchasers).
- Decision: make Electives 1–3 the free formation flow for all users (changes this workstream).
- Promote Electives during Accelerator checkout (select add-ons before redirecting to Stripe) and on the Accelerator overview page.
- Enforce server-side gating for elective modules:
  - Locked modules don’t render paid content.
  - Locked modules are hidden/marked in the sidebar and excluded from search results.
- Add minimal “Add-ons” management in Billing/Settings:
  - Show purchased Electives + Accelerator status.
  - “Buy more electives” flow (during/after Accelerator).
- Lifetime access: Electives + Accelerator remain accessible even if Organization subscription is canceled.
- Brief: `docs/briefs/electives-addons.md`

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
- Rebuild notifications (system-wide): define events, delivery rules, and a single UX pattern for inbox/archive + unread counts.
- Cover accelerator events (progress, next steps), coaching bookings, roadmap/document changes, and admin/testing seeds.

### J) AI (Paid Option)
- AI writing assist: use org context (excluding sensitive data) to draft answers.
- Each AI response should include a “note” on what could be stronger (e.g., “It would be good to add xyz; do you have xyz?”).
- Make it explicit: AI output is a template; user tells their story.
- Allow opt‑out of AI.
- Monetization: decide pass‑through vs margin; rate limiting; monthly credits; unused credits donation idea (evaluate).
- “AI recommendations” panel: 2 recommendations at a time; optional save to mini kanban.
- Frameworks tool: context-aware roadmap suggestions from org data with inline “Keep” + word-count button, popover actions (insert/copy/edit/reset), and short template examples (no AI label).
- Phase 2 AI: grant discovery, funding opportunity matching, donor/partner identification, funder readiness scoring, gap analysis.

### K) Admin / Ops
- Analytics: org progress, accelerator completion, funder‑readiness milestones.
- Admin tools: user management, content management, coach management.
- Super admin dashboard for internal staff (meetings, edits, reviews, flywheel proposals).
- Make orgs shareable like Substack/Stripe.

---

## Pricing Page Requirements (Must Match)
NOTE: Accelerator has two payment options per tier ($499 once or $49.90/mo for 10 months; $349 once or $34.90/mo for 10 months, then $20/mo). Update this section once the Stripe implementation details are finalized.
Card 1: The Platform (Free)
- Title: Formation
- Price: $0 / month
- Subtitle: For founders forming their entity.
- Features:
  - 1 Admin Seat (Founder only)
  - 501(c)(3) Formation Flow (Guided)
  - Private Roadmap (Internal planning)
  - Public organization profile (you control what’s public)
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
- Price: $499 (one‑time) or $49.90 / month for 10 months; $349 (one-time) or $34.90 / month for 10 months (includes Organization; then $20/mo)
- Subtitle: The 9‑week playbook to funder‑readiness.
- Features:
  - 42‑Module Curriculum (Lifetime access)
  - Strategic Templates (Budgets, Narratives)
  - Single-user license (locked to the purchaser)
  - 4 coaching sessions included
  - Discounted coaching after included sessions
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

## UI Backlog (Batchable)

Accelerator
- [ ] Remove the “Published Class” card block from the Accelerator overview flow (shown in the Overview page list).
- [ ] Fix module “Continue” at the end of lessons (reported at end of Module 4).
- [ ] Fix TipTap focus/cursor behavior (line jumps when clicking into the editor).
- [ ] “Take a break” returns to the Accelerator overview (not `/my-organization`).
- [ ] Fix module re-entry/progression issues when navigating across modules.
- [ ] Update session gradients (unique gradient per session).
- [ ] Add per-module notes (toggleable) + surface notes on the Accelerator overview (ask Caleb for layout first).

UI polish
- [ ] Don’t truncate Item secondary text; allow wrapping (`src/components/ui/item.tsx`).

Legacy admin cleanup
- [ ] Remove legacy “manual module/session creation wizard” UI surfaces (draft modules + edit buttons on class/module pages).
- [ ] Ensure admin editing flows live in the main app shell (not legacy accelerator-only pages).

## Inbox (New Notes)
(Add new raw notes here before organizing.)
- LMS data refresh: update classes/modules in DB to match current accelerator content (all/published), and ensure sidebar/module lists reflect the latest curriculum.
- Frameworks feature: placeholder text becomes a suggestion generated from org data; inline “Keep” action and a word-count button (dot-separated) open a popover with insert/copy/edit/reset; do not mention AI; supports undo.
- Onboarding simplification: admin-only toggles + test entry points in the account menu (SidebarFooter) for replaying onboarding/tutorials (must be invisible to non-admins).
- Onboarding dialog UI polish: radio option text layout (avoid squished text), avatar upload needs an optional “remove” before continuing, input placeholders should ellipsize, and dialog max-width needs a final pass.
- Clarify/confirm onboarding vs billing: where plan selection + Stripe checkout live, and why onboarding submit no longer triggers checkout.
- Public header wordmark: use regular Inter bold for “Coach House” and align wordmark height to the logo height on pricing/public header.
- Reduce top gap above left rail group content and top gap above page content in shell (notably in News).
- Remove “PLATFORM” subtitle from the brand lockup (platform + accelerator).
- Brand logo click should route to `/my-organization` (not `/dashboard`).
- Page tutorial button: swap icon to a more tutorial-related icon.
- Global search button: make it longer + centered on large screens, shift right as space tightens, and collapse to icon-only on small screens.
- Increase the gap below the app shell (double current).
- Left nav labels should remain single-line (fix “My Organization” wrapping).
- Accelerator “Roadmap” link should include a right-side icon; remove the duplicate accelerator roadmap item and keep the `/my-organization/roadmap` nav item as primary for now.
- Strategic roadmap framework card (framework list) should move into the right rail.
- Accelerator right rail should not show the track + module list block in the main content area (confirm removal or relocation).
- Ensure left/right rail toggles work on mobile.
- App shell should support card-like header/footer structure inside the main content container (verify or add).
- App shell gutter should apply only when rails are closed, not when rails are open.
- My Organization hero background block should be taller.
- Add separators between My Organization sections (Identity, Contact, Address, etc.).
- ProgramCard sizes: standardize into three fixed variants (list item, medium, full) with consistent height/width.
- Admin page should be for org admins managing members/roles/invites (not internal staff admin dashboard).
- My Organization Documents page should always be centered single-column layout.
- Sidebar progress indicator: make the CircularProgress circle smaller.
- Mobile header breadcrumbs: align left so the current page label doesn't overlap the search icon; ensure header/top-rail layout is correct across all pages.
- People page: remove the "SEARCH" and "CATEGORY" rail labels above the search and category inputs.
- Accelerator overview: add proper top/bottom padding around the main content section.
- Accelerator: merge the duplicate TRACK dropdowns into one control that drives the module list shown on the overview grid (do not edit until planned; prior attempt needs correction).
- Accelerator overview: remove extra left/right padding in the coaching/guidance card section.
- Accelerator overview: add more space above the “Next up” callout block.
- Accelerator: use the track dropdown variant with icons (not the plain one), but preserve full functionality so it controls both the overview grid and module page contents.
- Accelerator StartBuildingCard: reduce the top margin and tighten spacing between the CTA/title/description text blocks.
- Fix console error: flushSync called inside lifecycle from `src/components/rich-text-editor.tsx:275` when `setContent` runs; needs scheduler/microtask-safe update.
- Tiptap editor: Cmd/Ctrl+A should select only editor content (not the whole page) in Strategic Roadmap editor.
- Roadmap calendar: replace TipTap editor with shadcn-based calendar UI for creating recurring/categorized events (titles, start/end, assign to admin/staff/board). Include quick-add presets (Board meetings, reporting, key dates) with create/update/delete, and notify only accepted board/admin members. Plan to surface on dashboard later.
- Roadmap board section: replace TipTap editor with document upload for board roles, policies, and onboarding materials.
- Communication tools map: redesign into an interactive drag-and-drop, grid-based inventory UI with tool library, custom tool creation, channels/messaging, copy/images placement, and audience dropdowns (preset + CRUD). Right rail should host draggable options beneath main nav; main canvas shows flow layout.
- Accelerator inputs → roadmap sync: identify accelerator steps/questions that should update roadmap sections; when submitted, trigger notifications + nav badge/dot on Roadmap item(s) that clears on open.
- Roadmap “Treasure Map / CRM Plan” section: replace plain editor with interactive treasure map/CRM planning UI.
- Roadmap “Budget” section: add the interactive accelerator budget table/template UI and re-layout into a dashboard-like budgeting workspace.
- Roadmap “People” section: replace editor with the same UI as `/people` so roadmap and people experience stay in sync.
- Sidebar nav order: move “Roadmap” to sit directly below “Accelerator.”
- Roadmap “Mission, Vision, Values”: split into three separate editors with one shared toolbar; update layout to fit all three and stay responsive.
- Roadmap “Theory of Change”: split into three editors for If / Then / So framing, with responsive layout (not a single column).
- Roadmap “Program” section: make it interactive like the program builder wizard and show program cards.
- Admin invite form: fix layout so the Invite button never overlaps the role dropdown.
- People page layout: move the main table block into a row layout positioned to the left of the “People” heading (needs layout clarification).
- People page: remove “Show map details” toggle button and make the map details section always visible.
- Header buttons: make the right-rail toggle button use the same container style as the left sidebar trigger.
- Fix People page runtime error: Label is not defined in pagination controls.
- In collapsed left-rail state, keep the logo mark container visible while hiding the text.
- Strategic roadmap template: add new prebuilt sections (ordered) + new right-rail TOC design with animated indicator (per screenshots). Add as a separate route for the template.
- Internal admin (staff-only) should move to a separate route (new path TBD), keep org admin at `/admin`.
- Roadmap landing page (non-module entry). Use provided design. Variable roadmap experience depending on org status (registered 501c3 vs pre-status).
- Create **Formation** class from current Electives modules (Financial Handbook → Filing 1023), reordered as needed; free-access for all. Gate other classes unless paid accelerator. Add clear upsell UI but keep layout clean.
- Embed roadmap checkpoints directly into module steps (Option 1). Sync wording/DB for roadmap homework links; checkpoint dialog already live.
- Ensure module completion persists from DB into sidebar; lock/unlock consistent after refresh (follow-up verification).
- Onboarding competitor screenshots: analyze vs ours and adjust onboarding flow accordingly.
- People page React Flow: fix dragging/reposition; remove helper overlay; clear canvas pills/labels; display people-only nodes; rebuild hierarchy using best-practice React Flow patterns.
- Homepage tweaks: hero wordmark “Coach House” in Inter Bold; change hero line to “Tools to build, Coaches to train.” Hide video section for now. Redesign core-offering cards into a bento grid with inline icons/snippets (programmatic UI highlights/case snippets, no gradients).
- Pricing: add accelerator tiers — $349 (no coaching) and $499 (includes 4 coaching sessions); update gating/checkout.

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
