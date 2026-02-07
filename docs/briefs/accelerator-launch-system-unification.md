# Accelerator Launch System Unification
Status: Draft
Owner: Caleb + Codex
Priority: P0
Target release: Earliest evaluator launch

---

## Purpose
- Launch the Accelerator with a stable, role-aware, system-driven UI.
- Convert the current "99% right" shell into explicit engineering rules so spacing, collapse behavior, focus states, and animation are deterministic.
- Bring signup + onboarding into the canvas experience and align regular + accelerator paths.
- Redesign `/my-organization` into an operational command surface (bento layout + tools), not a full-screen profile editor.

## Why This Matters Now
- Evaluators judge quality quickly through interaction polish and information clarity.
- Current UI is close but still has hidden overlap/squish/focus defects and inconsistent layout rules.
- A phased system pass is lower risk than a one-shot redesign.

## Canonical Product Context (Stored)

### Coach House Messaging (MPF)
Core message:
- Find -> build -> fund nonprofits

Value promise:
- Turn intent -> operational org
- Remove friction from formation -> funding
- One system for nonprofit execution

Audience messages:
- Founders: start correctly, faster; clear path from idea -> funded pilot
- Operators: structure, compliance, execution tools; replace scattered workflows
- Funders: discover vetted, execution-ready orgs; transparent readiness + impact signals

Tone:
- Practical
- Institutional trust
- Builder-focused
- Outcome-driven

Positioning:
- Category: nonprofit infrastructure platform + accelerator
- Position: operating backbone for nonprofit creation + scale
- Differentiation:
  - formation -> readiness -> funding pipeline in one flow
  - program design + operational scaffolding
  - marketplace signal layer for funders
  - built for execution, not networking

Lifecycle model:
1. Discover
2. Structure
3. Build
4. Readiness
5. Fund
6. Operate

System pillars:
- Foundation
- Programs
- Finance
- Funding
- Operations
- Network layer

Outcome model:
- Faster nonprofit launch
- Higher funding readiness
- Operational clarity
- Scalable program delivery
- Reduced failure friction

## Evaluator Launch Definition Of Done
- Shell interactions are stable under keyboard, collapse, zoom, and responsive transitions.
- Signup + onboarding complete inside the canvas flow (no mandatory modal dependency).
- `/my-organization` is operational (bento tools) and role-safe.
- Coaching entitlement UX is explicit: 4 included sessions for eligible users, then discounted booking.
- Home-canvas content is production-safe (Team hidden, News linked to real content).
- Module progression and roadmap progression are visibly connected.
- Role-based permissions are enforced and validated by RLS tests.
- Launch path passes lint/snapshot/acceptance/RLS gates.

## Current State Snapshot
- Unified shell exists (`src/components/app-shell.tsx`) with left rail + canvas + optional right rail.
- Public shell prototype exists (`src/components/public/home-canvas-preview.tsx`).
- Notifications stack exists end-to-end (`notifications` table + actions + UI), but event coverage and role targeting need final audit.
- Coaching brief is marked done and defines 4-free-then-discounted entitlement logic.
- Onboarding is still modal-first in authenticated app paths.
- `/my-organization` remains profile-editor centric.
- Org chart uses React Flow (`src/components/people/org-chart-canvas.tsx`) but needs stronger large-graph/runtime policies.
- Community map exists (`src/components/community/community-map.tsx`) but "Find" product surface is not yet built as a full search/filter/save canvas.

## System Naming Contract
Use these names consistently in docs/code/UI labels:
- `Shell`: full app frame (`data-shell-root`)
- `Left Rail`: global/context navigation rail
- `Canvas`: centered viewport card
- `Canvas Header`: top control row for current context
- `Canvas Body`: scrollable primary content region
- `Right Rail`: contextual tools/metadata/actions
- `Panel`: content section within the canvas body
- `Tool Card`: utility panel (notifications, calendar, docs, tasks)

## Visual System Maps

### A) Entry + Onboarding
```text
Public Canvas -> Sign in / Sign up -> Canvas Onboarding Panels -> Role/Stage Landing
```

### B) Coaching Entitlement
```text
Click "Book coaching" -> /api/meetings/schedule ->
if accelerator active and sessions_used < 4 -> free link
if accelerator active and sessions_used >= 4 -> discounted link
else -> full-price link
```

### C) Execution Spine
```text
Module Step Completion -> Roadmap Section Status Update -> Notification -> Next Action Surface
```

## Scope
In scope:
- Design-system engineering pass for shell geometry, spacing, radii, and motion contract.
- Overlap/focus/collapse bug elimination for shell/rails/canvas controls.
- Canvas-native signup and onboarding.
- Role/stage-aware surfaces for owner/admin/staff/board/member.
- `/my-organization` bento redesign with operational tool cards.
- Notifications completion for launch-critical events.
- Coaching booking entitlement UX and instrumentation.
- Home-canvas content hardening (hide Team; real News links/copy).
- "Find" MVP surface (map + search/filter/save).
- React Flow org chart v2 runtime/perf architecture.
- Security + Next.js conformance hardening.

Out of scope:
- Full rebrand.
- New pricing model changes.
- Non-launch moonshots that do not affect evaluator readiness.

## Workstreams

### WS1: Shell Geometry + Interaction Contract
Goals:
- Eliminate overlap in focus states and collapse transitions.
- Normalize rail and canvas geometry.

Deliverables:
- Shared shell tokens in `src/app/globals.css`:
  - `--shell-frame-max-w`
  - `--shell-frame-radius`
  - `--shell-rail-width-open`
  - `--shell-rail-width-collapsed`
  - `--shell-gap`
  - `--shell-header-h`
  - `--shell-content-pad`
- Collapse animation policy (transform/opacity only, no layout animation).
- Focus ring policy for all shell controls.

Acceptance:
- No clipping/squish when rails collapse.
- No hidden focus targets.
- No unexpected layout jump during rail toggles.

### WS2: Design-System Implementation
Goals:
- Move from approximate consistency to explicit, enforceable rules.

Deliverables:
- Radius scale policy for shell/panel/control layers.
- Internal spacing cadence for panel content.
- Removal of shell-level one-off spacing/radius values.

Acceptance:
- New shell/panel code uses tokens, not ad-hoc values.

### WS3: Canvas Signup + Onboarding
Goals:
- Make onboarding launch flow canvas-native.

Deliverables:
- Signed-out canvas states (sign in / sign up).
- Signed-in incomplete setup state (panel-based onboarding flow).
- Signed-in complete state routing by role/stage.

Acceptance:
- User can complete signup and onboarding without modal dependency.
- Resume behavior works after interruption.

### WS4: Role + Stage UX Matrix
Goals:
- Make visibility and permissions explicit by role and lifecycle stage.

Deliverables:
- Role matrix for owner/admin/staff/board/member.
- Sidebar + tool-card visibility rules by stage (formation/readiness/funding/operate).
- Read-only vs editable UI states with explicit copy.

Acceptance:
- Board has required read access without edit leakage.
- Staff/admin edit powers match org settings.

### WS5: `/my-organization` Bento Redesign
Goals:
- Replace full-page profile editor focus with operational command center.

Deliverables:
- 12-column bento canvas layout.
- Minified org profile panel + tool cards:
  - Notifications
  - Calendar (roadmap-style)
  - Documents + permissions
  - Team/board access
  - Next actions and readiness signals
  - Recent activity

Acceptance:
- Layout aligns with shell geometry.
- Card internals follow token/radius/spacing rules.
- Mobile/tablet variants preserve usability.

### WS6: Notifications Completion
Goals:
- Ensure all launch-critical events notify the right users.

Deliverables:
- Event matrix audit and closure for:
  - module and class progression
  - assignment outcomes
  - coaching scheduling
  - roadmap updates
  - document/public-share updates
  - admin/member relevant events
- Role-targeting policy for owner/admin/staff/board/member.

Acceptance:
- Expected notifications fire for all critical actions.
- No cross-role leakage.

### WS7: Module <-> Roadmap UI Bridge
Goals:
- Make roadmap visibly feel like the strategic progression layer of module work.

Deliverables:
- Shared status model and visual component in module + roadmap contexts.
- Clear completion semantics and "next best step" guidance.

Acceptance:
- Users can orient themselves across curriculum and strategic execution at a glance.

### WS8: Coaching UX + Entitlement Flow
Goals:
- Make coaching behavior obvious and reliable.

Policy:
- Accelerator entitlement: 4 included sessions, then discounted paid link.
- Non-entitled users: full-price link.

Deliverables:
- Unified booking CTA language and cards across app surfaces.
- Session-usage visibility (`X of 4 used`, then "discounted booking unlocked").
- API and env audit for free/discounted/full links.
- Failure handling and fallback copy when links are unavailable.

Acceptance:
- Correct link resolution for entitled/non-entitled users.
- No ambiguity in coaching state.

### WS9: Home-Canvas Content Hardening
Goals:
- Make public-facing canvas content launch-safe.

Deliverables:
- Hide Team section in home-canvas navigation and panel rendering for now.
- Replace placeholder/duplicate News items with real destinations.
- News copy and cards reflect actual publication source (Substack + hosted internal article).

Acceptance:
- No placeholder content in launch-facing home-canvas/news cards.
- Team section is not visible on home-canvas until re-enabled.

### WS10: "Find" MVP Surface (Map/Search/Filter/Save)
Goals:
- Ship the discovery layer: find nonprofits around you.

Deliverables:
- New canvas surface for find workflow with:
  - satellite-style minimalist map
  - search input
  - filter controls
  - saved profiles list
- Profile preview cards on map interaction.
- Similar interaction density to `/people`, adapted for discovery.

Acceptance:
- User can search/filter and save organizations without leaving surface.
- Map remains responsive under realistic dataset size.

### WS11: React Flow Org Chart V2
Goals:
- Stabilize org chart behavior, layout quality, and runtime performance.

Core spec:
- Inputs: `people[]` with reporting relationships.
- Outputs: typed `nodes[]` + `edges[]`.
- Layout engine: ELK.js preferred, Dagre fallback.
- Direction: top-to-bottom.
- Fixed node dimensions.
- `node.data.manual` supports manual placement overrides.
- Re-layout keeps manual nodes fixed.

React Flow implementation details:
- Use memoized node components (`React.memo`).
- Memoize `nodeTypes` and handlers (`useMemo`, `useCallback`).
- Keep canonical data separate from viewport state.
- Use `onlyRenderVisibleElements` selectively.
- Use viewport phase hooks (`useOnViewportChange` or `onMove`/`onMoveEnd`) to split interaction vs idle work.
- Do heavy recomputation on move end, not every move frame.
- Run layout in a Web Worker for larger graphs.

Performance/runtime modes:
- `interaction`: minimize work while panning/zooming/dragging.
- `idle`: edge restoration, visibility recalculation, optional LOD recovery.
- `structural-change`: debounced worker layout commit.

Acceptance:
- Smooth interaction at evaluator-scale datasets.
- No main-thread lockups from layout recompute.

### WS12: Security + Next.js Conformance + Release Gates
Goals:
- Ship with confidence and reproducible launch checks.

Deliverables:
- Runtime/cache audit for public vs authed routes.
- Permission and RLS validation for changed flows.
- Security hardening checklist on launch path:
  - server authz on mutations
  - signed URL handling
  - webhook verification/idempotency
  - sanitization coverage
  - CSP/header review
- Release gate checklist and rollback notes.

Acceptance:
- No known critical security gaps in launch path.
- Conformance and rollback steps are documented.

## Immediate Quick Wins (Do First)
1. Hide `team` in home-canvas UI.
2. Replace home-canvas/news placeholder cards with real Substack/internal links.
3. Validate coaching booking links and entitlement counters end-to-end.

## Data + Architecture
Tables/components likely touched:
- `profiles`
- `organizations` (including profile JSON fields)
- `organization_memberships`
- `organization_access_settings`
- `notifications`
- roadmap/module progress tables
- `accelerator_purchases`
- coaching usage counter source (currently org profile `meeting_requests`)

Authz and RLS:
- Respect owner/admin/staff/board/member model.
- Add/adjust tests for any role-visibility or mutation path changes.

Server actions/routes likely touched:
- onboarding actions and shell entry logic
- notifications actions and event emitters
- roadmap/module completion actions
- document routes
- `/api/meetings/schedule`

Caching:
- Marketing/public: revalidate/static where possible.
- Authenticated app: `no-store` semantics.

## Dependencies
Align with existing briefs:
- `docs/briefs/app-shell-unification.md`
- `docs/briefs/app-shell-header-stability.md`
- `docs/briefs/onboarding-simplification.md`
- `docs/briefs/coaching-booking.md`
- `docs/briefs/notifications.md`
- `docs/briefs/roadmap-calendar.md`
- `docs/briefs/roadmap-module-mapping.md`
- `docs/briefs/multi-account-org-access.md`
- `docs/briefs/supabase-security-scan.md`

## What Was Missing (Gap List)
- Explicit shell naming contract used across teams/docs/components.
- Runtime interaction modes for heavy canvases (interaction vs idle vs structural updates).
- Clear coaching entitlement UX state model (not only routing logic).
- Content governance for home-canvas/news launch surfaces.
- Feature-level release gates and rollback criteria.
- A single sprint queue that sequences high-risk dependencies first.

## Open Questions
- Canvas-only onboarding for all launch routes, or modal fallback for edge cases?
- Signed-out left-rail nav scope in home-canvas mode.
- Final right-rail default cards for `/my-organization`.
- Exact org-wide vs user-targeted notification policy.
- Board calendar detail level by default.
- Dataset thresholds for map/org-chart progressive disclosure.

## Immediate Next Step
- Execute the companion sprint queue in `docs/briefs/accelerator-launch-mvp-sprint.md` step-by-step.
