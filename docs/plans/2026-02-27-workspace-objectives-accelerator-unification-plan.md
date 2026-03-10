# Workspace Objectives + Accelerator Unification Plan

Date: 2026-02-27
Status: Draft (Planning pass 7 complete)
Owner: Product + Platform

## 1) Problem Statement

We need to replace the current compact "Objectives" tracker card with a truly usable, minimal, high-power objective system that can:

1. Surface accelerator progression and user-created objectives in one coherent model.
2. Let users work directly in the workspace canvas ("pocket workflow") without forcing full-page context switches for every task.
3. Preserve performance and smooth interaction under React Flow constraints.
4. Keep design minimal, consistent, and scalable as objective volume grows.
5. Connect objective steps to relevant domain cards (Calendar, Economic Engine, Communications, etc.) and eventually enable node-linked workflow routing.

The current implementation works as an MVP, but it is structurally a mixed UI/state surface (accelerator list + ad-hoc tickets) and not yet a real objective operating system.

## 2) Primary Product Objectives (North Star)

1. **Single Objective Engine**: unify accelerator tasks + custom team tasks + roadmap checkpoints.
2. **Pocket-sized, not shallow**: ultra-minimal card shell with deep actions on demand.
3. **Actionability first**: assignees, due dates, status, dependencies, and "next step" are first-class.
4. **Context linkage**: each objective can link to an owning workspace card/tool and open directly to the right editor/state.
5. **Progress correctness**: completion/progression must be derived from real source-of-truth state, not display-only counters.
6. **Performance ceiling**: maintain smooth pan/zoom/drag and interaction despite richer objective data.

## 3) Current-State Architecture Map (What Exists Today)

### 3.1 Accelerator + Module delivery stack

- Module route composition: `src/app/(accelerator)/accelerator/class/[slug]/module/[index]/page.tsx` delegates to dashboard route logic.
- Shared module page loader: `src/app/(dashboard)/class/[slug]/module/[index]/_lib/module-page.tsx`.
- Module UI shell: `src/components/training/module-detail.tsx`.
- Step orchestration: `src/components/training/module-detail/module-stepper.tsx`.
- Step content rendering (video, notes, resources, assignment, complete): `src/components/training/module-detail/module-stepper-active-step-content.tsx`.
- Assignment and budget tooling:
  - `src/components/training/module-detail/assignment-form.tsx`
  - `src/components/training/module-detail/assignment-form/assignment-budget-table-field.tsx`
  - `src/components/training/module-detail/budget-table.tsx`
- Right rail notes/resources/coach/AI: `src/components/training/module-right-rail.tsx`.

### 3.2 Roadmap and accelerator linkage

- Roadmap section definitions: `src/lib/roadmap/definitions.ts`.
- Homework linkage from roadmap section -> module: `src/lib/roadmap/homework.ts`.
- Accelerator overview composition: `src/app/(accelerator)/accelerator/page.tsx`.
- Roadmap shell/editor:
  - `src/components/roadmap/roadmap-shell.tsx`
  - `src/components/roadmap/roadmap-editor.tsx`

### 3.3 Workspace objectives tracker today

- Card container: `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-formation-tracker-card.tsx`.
- Accelerator/objectives tab panels: `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-formation-tracker-card-panels.tsx`.
- UI micro-controls (chevron + circular status ring): `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-formation-tracker-card-ui.tsx`.
- Tracker state shape (JSON in workspace board state):
  - types: `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types.ts`
  - normalization/defaults: `src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-layout-tracker-state.ts`
- Persistence location: `organization_workspace_boards.state` JSONB (`supabase/migrations/20260222183000_add_workspace_board_tables.sql`).

### 3.4 Why the current behavior feels wrong

1. Mixed semantics: accelerator progression and team ticketing share one compressed surface without clear hierarchy.
2. Action affordance mismatch: chevron action currently behaves like status-advance trigger, which is not semantically obvious.
3. Weak assignment model: no native assignee/owner model in tracker state.
4. No objective dependency graph: no explicit link between objective item and owning workspace card/tool.
5. Bounded UI model: card currently behaves like a "panel" rather than a composable objective OS.

## 4) Feasibility / Difficulty Assessment

Short answer: **hard, but very feasible** with phased delivery.

### 4.1 Complexity class

- **Product complexity**: High
- **Frontend architecture complexity**: High
- **Data model complexity**: Medium-High
- **Migration complexity**: Medium
- **Operational risk**: Medium (if phased)

### 4.2 Estimated delivery envelope

- **Phase 0-1 (foundation + objective model + minimal UI rewrite)**: 1.5-2.5 weeks
- **Phase 2 (accelerator step embedding in workspace objective shell)**: 2-3.5 weeks
- **Phase 3 (node linkage + card-context routing + assignment/notification polish)**: 1.5-2.5 weeks
- **Phase 4 (hardening, QA sweep, perf + access controls + rollout)**: 1-2 weeks

Total realistic range for production-grade v1: **6-10 weeks** (single senior IC pace), faster with parallel execution.

## 5) Non-Negotiable Constraints (Engineering)

1. Keep App Router + RSC-first composition; interactive heavy surfaces remain client islands.
2. Preserve RLS-first posture for any new objective/assignment tables.
3. Preserve role-based authz for objective edits/assignment changes.
4. Preserve workspace responsiveness (drag/zoom/pan).
5. Keep card surfaces content-adaptive (avoid fixed-height clipping anti-patterns).

## 6) External Best-Practice References (for upcoming passes)

These references will be explicitly applied in the implementation plan sections in subsequent passes.

- React Flow performance guidance: memoize components/functions, avoid broad node access in components.
  - https://reactflow.dev/learn/advanced-use/performance
- React Flow warning and nodeTypes stability context:
  - https://reactflow.dev/learn/troubleshooting/common-errors
- ELK layout options (layered + radial):
  - https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html
  - https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-radial.html
- Next.js App Router server/client composition and lazy loading:
  - https://nextjs.org/docs/app/building-your-application/rendering/server-components
  - https://nextjs.org/docs/app/guides/lazy-loading
- Virtualization pattern for large objective lists:
  - https://tanstack.com/virtual/latest/docs/framework/react/examples
- Accessibility baseline and keyboard model references:
  - https://www.w3.org/WAI/WCAG22/quickref/
  - https://www.radix-ui.com/primitives/docs/components/tabs#keyboard-interactions

## 7) Immediate UX Polish Backlog Captured (from latest feedback)

Planning only in this pass; execution deferred until implementation phase starts.

1. Redesign Objectives card to be minimal + fully usable (not a compressed mixed list).
2. Remove overloaded chevron-as-complete interaction semantics.
3. Dock polish:
   - increase room beneath dock labels,
   - align bottom dock light-mode color treatment with left dock.
4. React Flow Controls polish:
   - smaller zoom controls,
   - corner roundness aligned with dock style language.

## 8) Planning Pass 2/6 (Decision A): Normalized Objective Data Model

Decision accepted: **A. Normalized objective tables now**.

### 8.1 Why normalized now

1. We need first-class assignment, status history, dependencies, and card-linking. JSON-only state in `organization_workspace_boards.state` is not sufficient for scalable filtering, auditing, and permissions.
2. Accelerator + roadmap + custom objectives require explicit source tracking and deterministic sync behavior.
3. We can keep the board layout JSON where it belongs (canvas geometry), while moving objective operations to queryable tables.

### 8.2 Proposed database model (public schema)

Use text columns + `CHECK` constraints for status/type domains (faster iteration than enum migrations, while preserving strong constraints).

1. `organization_workspace_objective_groups`
   - Purpose: reusable objective buckets (ex: `Accelerator`, `Team`, `Fundraising`).
   - Core columns:
     - `id uuid pk`
     - `org_id uuid not null references organizations(user_id)`
     - `title text not null`
     - `kind text not null check (kind in ('system','custom'))`
     - `source_type text null check (source_type in ('accelerator','roadmap','calendar','communications','economic_engine','none'))`
     - `archived_at timestamptz null`
     - `created_by uuid not null references profiles(id)`
     - `created_at/updated_at timestamptz`
   - Unique:
     - unique partial on `(org_id, title)` where `archived_at is null`.

2. `organization_workspace_objectives`
   - Purpose: primary objective/ticket records.
   - Core columns:
     - `id uuid pk`
     - `org_id uuid not null`
     - `group_id uuid null references organization_workspace_objective_groups(id)`
     - `title text not null`
     - `description text null`
     - `status text not null check (status in ('todo','in_progress','blocked','done','archived'))`
     - `priority text not null default 'normal' check (priority in ('low','normal','high','critical'))`
     - `kind text not null check (kind in ('system','custom'))`
     - `source_type text not null check (source_type in ('accelerator_module','accelerator_step','roadmap_section','calendar_event','custom'))`
     - `source_key text null` (deterministic id for system objective mapping)
     - `due_at timestamptz null`
     - `completed_at timestamptz null`
     - `position_rank numeric(12,6) not null default 0`
     - `created_by uuid not null`
     - `updated_by uuid null`
     - `created_at/updated_at timestamptz`
   - Unique:
     - unique partial on `(org_id, source_type, source_key)` where `kind = 'system'` and `source_key is not null`.

3. `organization_workspace_objective_steps`
   - Purpose: sub-steps for objectives; supports embedded accelerator lesson flow in compact mode.
   - Core columns:
     - `id uuid pk`
     - `objective_id uuid not null references organization_workspace_objectives(id) on delete cascade`
     - `org_id uuid not null`
     - `step_order integer not null`
     - `step_type text not null check (step_type in ('video','notes','resources','assignment','budget','roadmap_checkpoint','custom'))`
     - `title text not null`
     - `status text not null check (status in ('todo','in_progress','blocked','done'))`
     - `payload jsonb not null default '{}'::jsonb` (minimal typed payload pointers only)
     - `started_at/completed_at timestamptz null`
     - `created_at/updated_at timestamptz`
   - Unique:
     - unique `(objective_id, step_order)`.

4. `organization_workspace_objective_assignees`
   - Purpose: many-to-many assignment and watchers.
   - Core columns:
     - `objective_id uuid not null references organization_workspace_objectives(id) on delete cascade`
     - `org_id uuid not null`
     - `user_id uuid not null references profiles(id)`
     - `role text not null check (role in ('owner','assignee','watcher'))`
     - `created_by uuid not null`
     - `created_at timestamptz`
   - Unique:
     - unique `(objective_id, user_id)`.

5. `organization_workspace_objective_links`
   - Purpose: connect objective to workspace cards/entities (calendar, engine, comms, etc.).
   - Core columns:
     - `id uuid pk`
     - `objective_id uuid not null`
     - `org_id uuid not null`
     - `card_id text not null check (card_id in ('organization-overview','formation-status','brand-kit','economic-engine','calendar','communications','deck','vault','atlas'))`
     - `entity_type text null check (entity_type in ('roadmap_section','calendar_event','module','assignment','none'))`
     - `entity_id text null`
     - `link_kind text not null check (link_kind in ('primary','secondary','dependency'))`
     - `created_by uuid not null`
     - `created_at timestamptz`

6. `organization_workspace_objective_activity`
   - Purpose: immutable audit/activity stream.
   - Core columns:
     - `id uuid pk`
     - `objective_id uuid not null`
     - `org_id uuid not null`
     - `actor_id uuid not null`
     - `event_type text not null` (status_changed, assigned, unassigned, due_changed, step_completed, comment_added)
     - `payload jsonb not null default '{}'::jsonb`
     - `created_at timestamptz`

### 8.3 Index strategy

1. `organization_workspace_objectives (org_id, status, updated_at desc)` for active board lists.
2. Partial index for open objective feeds:
   - `(org_id, updated_at desc) where status in ('todo','in_progress','blocked')`.
3. `organization_workspace_objective_steps (objective_id, step_order)` for deterministic stepper render.
4. `organization_workspace_objective_assignees (org_id, user_id, objective_id)` for “my objectives” filtering.
5. `organization_workspace_objective_links (org_id, card_id, objective_id)` for card-level objective panels.
6. `organization_workspace_objective_activity (objective_id, created_at desc)` for timeline rendering.

### 8.4 RLS policy model (required)

Follow current workspace table policy shape (`organization_workspace_communications`, `organization_workspace_invites`):

1. `SELECT`: owner, org members, admin.
2. `INSERT`/`UPDATE`/`DELETE`: owner/admin/staff by default; board role allowed for assignment and comment operations if needed.
3. Always use `to authenticated` and `(select auth.uid())` style predicates.
4. Add `WITH CHECK` on all write policies so inserted/updated rows cannot escape org ownership constraints.

### 8.5 Migration strategy from existing JSON tracker

1. Migration M1:
   - Create objective tables, indexes, triggers, RLS policies.
2. Migration M2:
   - Backfill from `organization_workspace_boards.state->tracker`:
     - categories -> `objective_groups(kind='custom')`
     - tickets -> `objectives(kind='custom', source_type='custom')`
3. Runtime phase R1 (dual-read):
   - Read normalized tables first; fallback to JSON tracker when empty.
4. Runtime phase R2 (dual-write temporary):
   - New objective writes go to normalized tables; keep JSON tracker synced for rollback window.
5. Runtime phase R3:
   - Disable JSON writes; keep read fallback for one release.
6. Runtime phase R4:
   - Remove tracker JSON read path, keep one-time migration guard.

### 8.6 Source-of-truth rules

1. `kind='system'` objectives are derived from canonical sources:
   - Accelerator modules/steps: `module_progress`, `assignment_submissions`, and module metadata.
   - Roadmap sections: organization roadmap status + homework links.
2. `kind='custom'` objectives are user-owned and fully editable.
3. System objective status write precedence:
   - source-derived status wins by default,
   - user can add assignees, due dates, notes, links, watchers,
   - optional manual override can be introduced later with explicit `override_status` fields.
4. Progress card percentages must derive from normalized status aggregates + source sync, not local client-only counters.

### 8.7 Feature/file scaffolding plan (repo-compliant)

1. Create feature slice:
   - `src/features/workspace-objectives/`
   - Required structure per contract:
     - `README.md`
     - `index.ts`
     - `types.ts`
     - `components/index.ts`
     - `lib/index.ts`
     - `server/actions.ts`
     - `tests/acceptance/workspace-objectives.test.ts`
2. Supabase schema typing files:
   - `src/lib/supabase/schema/tables/organization_workspace_objective_groups.ts`
   - `src/lib/supabase/schema/tables/organization_workspace_objectives.ts`
   - `src/lib/supabase/schema/tables/organization_workspace_objective_steps.ts`
   - `src/lib/supabase/schema/tables/organization_workspace_objective_assignees.ts`
   - `src/lib/supabase/schema/tables/organization_workspace_objective_links.ts`
   - `src/lib/supabase/schema/tables/organization_workspace_objective_activity.ts`
3. Migrations:
   - `supabase/migrations/<ts>_add_workspace_objective_tables.sql`
   - `supabase/migrations/<ts>_backfill_workspace_objectives_from_tracker_json.sql`

### 8.8 External references applied in this pass

1. React Flow performance guidance (memoization and state access constraints):
   - https://reactflow.dev/learn/advanced-use/performance
2. Supabase RLS model and policy performance notes:
   - https://supabase.com/docs/guides/database/postgres/row-level-security
3. PostgreSQL constraints and partial index semantics:
   - https://www.postgresql.org/docs/current/ddl-constraints.html
   - https://www.postgresql.org/docs/current/indexes-partial.html
4. Next.js server/client composition boundaries:
   - https://nextjs.org/docs/app/getting-started/server-and-client-components

## 9) Planning Pass 3/6: Objectives UX System + Interaction Contract

This pass defines the UI/UX operating model for the new "pocket" objective system in the workspace card.

### 9.1 Product-facing rename + positioning

1. Card title: `Objectives` (single-word naming rule).
2. Internal modes:
   - `Accelerator` (system-derived objectives).
   - `Team` (custom objectives/tickets).
3. Replace ambiguous chevron-complete behavior:
   - completion is explicit (`checkbox` / status action),
   - chevron means `open details` or `advance to next step`, never implicit completion.

### 9.2 Information architecture in-card (minimal shell)

1. Header row (always visible):
   - title (`Objectives`),
   - compact completion chip (`X/Y open`),
   - overflow menu (filters/sort/view density).
2. Mode switcher (Tabs):
   - `Accelerator`
   - `Team`
3. List region (single scroll region within card; card itself remains layout-adaptive in canvas):
   - objective rows with status, owner(s), due date, and optional link icon.
4. Footer utility row:
   - `+ Objective` (Team mode),
   - `Open full editor` (same underlying objective engine, fullscreen workspace mode).

### 9.3 Objective row design system (row anatomy)

Each row should follow a consistent pattern to prevent layout drift:

1. Left: status control (`checkbox` or status pill icon).
2. Middle:
   - line 1: objective title (truncate),
   - line 2: metadata chips (assignee, due date, source).
3. Right:
   - linkage chip (e.g., `Calendar`, `Engine`) when linked,
   - action chevron button for details pane.

Interaction rules:

1. Clicking row body opens details side pane (or inline expander in compact mode).
2. Clicking status control toggles state only.
3. Clicking chevron opens detail context; does not modify status.

### 9.4 Expand/collapse behavior and animation contract

1. Default state: list open (user request).
2. Collapse affects list region only; header and tabs remain fixed.
3. Animate list container with `height + opacity` using Framer Motion.
4. Parent card must animate height in sync with content:
   - avoid absolute positioning for core list content,
   - avoid fixed height child stacks that cause clipping.
5. Respect reduced-motion:
   - if `prefers-reduced-motion`, transition duration set to near-zero.

### 9.5 Card sizing model to prevent clipping/dead space

1. Use content-first min heights:
   - compact objective card min-height baseline only,
   - no hardcoded interior fixed heights for list blocks.
2. Card content layout contract:
   - `display: flex; flex-direction: column; min-height: 0;`
   - scroll area only on dedicated list region (`overflow-y-auto`), not outer card.
3. Vertical rhythm rule:
   - top inset and bottom inset must match (same spacing token),
   - footer actions pinned only when content overflow is active.

### 9.6 Assignment and team workflow model (Asana-style, compact)

1. Assignees use stacked avatars + quick assign popover.
2. Status options:
   - `Todo`, `In progress`, `Blocked`, `Done`.
3. Quick add objective flow:
   - title required,
   - optional assignee + due date + linked card.
4. Team mode supports:
   - group creation,
   - group archive,
   - group reorder (phase 2 after base launch).

### 9.7 Accelerator mode behavior

1. Show only open system objectives by default.
2. Completed system objectives hidden behind `Show completed` toggle.
3. Each row can open:
   - compact objective detail,
   - full accelerator lesson view in fullscreen editor mode.
4. Progress aggregate derives from normalized objective rows + source sync state (no synthetic counters).

### 9.8 Node-linking behavior to canvas cards

1. Objective can hold `primary card` link (`calendar`, `economic-engine`, etc.).
2. Clicking link chip focuses corresponding workspace card (fit/center behavior).
3. In fullscreen editor mode, link chip switches active section directly.
4. If linked card is hidden by dock toggle:
   - prompt to reveal card,
   - then focus card.

### 9.9 Accessibility and keyboard model

1. Tabs use Radix keyboard contract (arrow navigation).
2. Objective rows are roving-tabindex list items:
   - `Enter`: open detail,
   - `Space`: toggle status (when status control focused),
   - `Cmd/Ctrl+K` within card: quick add objective.
3. All status and link controls require `aria-label` with objective title context.
4. Contrast minimum:
   - ensure state chips and icons meet WCAG 2.2 AA against light and dark backgrounds.

### 9.10 Performance contract (React Flow constraints)

1. Objective card state selectors must be narrow and memoized.
2. No per-frame expensive computations in row render.
3. Virtualize long lists in fullscreen mode; compact card renders capped visible rows.
4. Keep `nodeTypes` and card component references stable and outside render scope.

### 9.11 Implementation boundaries (to avoid regressions)

1. Canvas geometry and objective content are separated concerns:
   - geometry in workspace board state/tables,
   - objective data in normalized objective tables.
2. Fullscreen editor is a mode over same data model, not a separate persistence path.
3. Do not introduce additional nested card wrappers inside objective content.

## 10) Planning Pass 4/6: Accelerator Embedding + Fullscreen Unification

This pass defines how objective details can run accelerator workflows inside the workspace stack without duplicating business logic.

### 10.1 Unification principle

1. One objective engine, two surfaces:
   - compact workspace card (`Objectives`),
   - fullscreen workspace editor mode.
2. Fullscreen mode is not a separate product path; it is a UI mode over the same objective/session data.
3. When fullscreen opens, React Flow canvas UI can be visually hidden and interaction-disabled to reduce render pressure.

### 10.2 Reuse map from existing accelerator stack

Reuse existing training modules as the canonical content runtime:

1. Keep data fetch + entitlement logic from:
   - `src/app/(dashboard)/class/[slug]/module/[index]/_lib/module-page.tsx` (server composition logic, adapted into feature server layer where needed).
2. Reuse UI primitives from:
   - `src/components/training/module-detail.tsx`
   - `src/components/training/module-detail/module-stepper.tsx`
   - `src/components/training/module-detail/module-stepper-active-step-content.tsx`
   - `src/components/training/module-detail/assignment-form.tsx`
   - `src/components/training/module-detail/budget-table.tsx`
3. Reuse right-rail patterns from:
   - `src/components/training/module-right-rail.tsx` (notes/resources hooks, with workspace-specific tabs/labels where needed).

No "new accelerator in parallel." We embed/adapt existing runtime components so completion logic and submissions stay canonical.

### 10.3 Fullscreen editor architecture (workspace-native)

1. Create/extend a single fullscreen shell for workspace cards:
   - host objective details, organization editor, and card-specific tools.
2. Required behavior:
   - opening fullscreen preserves objective context (selected objective, selected step),
   - closing fullscreen returns to same canvas zoom/position and selected card,
   - URL state captures fullscreen context for refresh recovery.
3. Suggested URL model:
   - `/organization?view=workspace&fullscreen=objectives&objective=<id>&step=<id>`
4. Render policy:
   - Fullscreen content uses lazy-loaded client islands for heavy modules.
   - Server components load metadata/state upfront; client step panels mount on demand.

### 10.4 File-tree and naming plan (contract-aligned)

All new logic remains in feature slices and shared components, not route pages.

1. Feature slice: `src/features/workspace-objectives/`
   - `README.md`
   - `index.ts`
   - `types.ts`
   - `components/objectives-card.tsx`
   - `components/objective-row.tsx`
   - `components/objective-detail-sheet.tsx`
   - `components/objective-fullscreen-shell.tsx`
   - `components/objective-accelerator-step-view.tsx`
   - `components/objective-team-task-view.tsx`
   - `components/index.ts`
   - `lib/objective-queries.ts`
   - `lib/objective-progress.ts`
   - `lib/objective-links.ts`
   - `lib/index.ts`
   - `server/actions.ts`
   - `server/sync-system-objectives.ts`
   - `tests/acceptance/workspace-objectives.test.ts`
2. Keep route files composition-only:
   - `src/app/(dashboard)/my-organization/page.tsx` imports feature entrypoints and passes server-fetched data only.
3. Naming conventions:
   - kebab-case filenames,
   - semantic names (no `new-*`, `v2`, `copy`),
   - one-word card labels in UI where requested.

### 10.5 CRUD contract (objective + steps + assignment)

Server actions (authz/RLS enforced) should expose:

1. `createObjective` (team objective).
2. `updateObjective` (title, description, due date, priority, group).
3. `setObjectiveStatus` (explicit state transition).
4. `assignObjectiveUser` / `unassignObjectiveUser`.
5. `createObjectiveStep` / `reorderObjectiveSteps` / `setObjectiveStepStatus`.
6. `linkObjectiveToCard` / `unlinkObjectiveFromCard`.
7. `archiveObjective` / `restoreObjective`.

System objectives:

1. Not hard-deletable by users.
2. Source-owned fields (title/source/status for strict modes) update from sync pipeline.
3. User-owned fields (assignees, due date, notes, links) remain editable.

### 10.6 Sync pipeline architecture (idempotent)

1. Source domains:
   - accelerator modules/steps,
   - roadmap sections + homework links,
   - selected calendar events (phase-gated).
2. Sync strategy:
   - deterministic `source_key`,
   - upsert by `(org_id, source_type, source_key)`,
   - never duplicate system objective rows.
3. Trigger points:
   - on module completion/submission events,
   - on roadmap status mutation,
   - scheduled reconciliation job (low frequency safety sweep).
4. Idempotency:
   - event-driven sync stores processed event ids (or deterministic update hash) to avoid repeat writes.

### 10.7 User journey contract (end-to-end)

1. Accelerator journey:
   - open `Objectives` card -> `Accelerator` tab -> select objective -> open fullscreen -> complete step (video/notes/assignment) -> progress and roadmap update -> return to same canvas context.
2. Team journey:
   - open `Objectives` card -> `Team` tab -> add objective -> assign teammate -> link to `Calendar` or `Engine` card -> track updates in activity stream.
3. Mixed journey:
   - user sees accelerator next action and team objective in same surface, with clear source labels and no semantic collision.

### 10.8 Layout and design-token contract

Use existing theme tokens from `src/app/globals.css` and avoid one-off colors.

1. Surfaces use semantic tokens (`bg-card`, `bg-popover`, `text-foreground`, `text-muted-foreground`, `border-border`).
2. Spacing uses a fixed rhythm scale in objective surfaces:
   - card inset and bottom inset use identical token value.
3. Radii:
   - concentric radii only; child radius <= parent radius.
4. Controls:
   - dock/control corner radius and icon sizing standardized across workspace.
5. Dark/light parity:
   - no hardcoded pure white pills in dark mode,
   - ensure AA contrast for status chips and tracker visuals.

### 10.9 Failure and recovery states

1. Loading/skeleton state for objective lists and details.
2. Empty state:
   - accelerator: `All modules complete`,
   - team: `No objectives yet` + add CTA.
3. Sync conflict state:
   - show last source sync timestamp and non-blocking conflict note.
4. Error recovery:
   - inline retry on row/action failures,
   - no full-page dead-end.

### 10.10 QA acceptance for this phase

1. Opening/closing fullscreen must preserve selected objective and return canvas context.
2. Objective CRUD succeeds under RLS constraints for owner/member roles.
3. System objective status changes reflect module/roadmap truth after sync.
4. No clipping/dead-space regressions on compact card content at common card sizes.
5. Keyboard-only operation works for tabs, row selection, and status updates.

## 11) Planning Pass 5/6: Delivery Roadmap, Observability, and Rollout

This pass converts the architecture into an execution and release plan.

### 11.1 Milestone roadmap (single-team baseline)

Week 1: data + foundation

1. Add normalized objective tables, indexes, triggers, and RLS.
2. Add Supabase type bindings and feature slice scaffolding.
3. Implement core queries + server actions for objective CRUD.
4. Ship dual-read fallback from JSON tracker to normalized data.

Week 2: compact Objectives card v1

1. Implement new card shell + tabs (`Accelerator`, `Team`) + objective rows.
2. Implement explicit status control, assignee chips, due-date metadata.
3. Replace ambiguous chevron behavior with clear details/open behavior.
4. Enforce clipping-safe layout and equal top/bottom insets.

Week 3: fullscreen objective editor unification

1. Add objective fullscreen shell with URL-backed state.
2. Wire compact card -> fullscreen transitions with state return.
3. Reuse accelerator step content components inside fullscreen objective context.
4. Add first pass of card-link navigation (objective -> workspace card focus).

Week 4: sync + progression correctness

1. Implement idempotent sync for accelerator and roadmap source objectives.
2. Enforce source-of-truth precedence rules and override-safe behavior.
3. Add activity stream and assignment history events.
4. Run migration backfill and compare counts versus tracker JSON.

Week 5: hardening + rollout prep

1. Performance profiling and memoization/decomposition passes.
2. Accessibility audits (keyboard, focus, labels, contrast).
3. Acceptance/snapshot/RLS/guardrail runs + fixes.
4. Prepare feature flag rollout and operational playbook.

### 11.2 Dependency graph (critical path)

1. DB schema + RLS must land before UI can fully switch reads.
2. CRUD server actions must exist before compact card interactions stabilize.
3. Fullscreen shell depends on objective detail contract and URL state model.
4. Sync pipeline depends on canonical source-key mapping design.
5. Rollout gate depends on migration parity checks and error-rate thresholds.

### 11.3 Risk register + controls

1. Risk: progression mismatches between source systems and objective rows.
   - Control: deterministic source keys + reconciliation job + parity dashboards.
2. Risk: React Flow performance regression from richer objective UI.
   - Control: capped row render in compact mode, memoized selectors, lazy fullscreen mounts.
3. Risk: policy regressions in multi-user orgs.
   - Control: RLS tests for owner/member/non-member + write-path checks.
4. Risk: migration drift from legacy tracker JSON.
   - Control: dual-read/dual-write window + org-level row-count validation report.

### 11.4 Observability plan

Product telemetry:

1. `objective_created`, `objective_completed`, `objective_assigned`, `objective_opened_fullscreen`.
2. `system_objective_synced`, `system_objective_sync_conflict`.
3. `objective_link_opened_card` (calendar/engine/comms/etc).

Performance telemetry:

1. Objective card mount time (compact).
2. Fullscreen objective initial interactive time.
3. React Flow FPS proxy and interaction latency sample points during drag/pan/zoom.

Operational telemetry:

1. Sync job run status and duration.
2. Per-org sync delta counts (created/updated/no-op/conflict).
3. Action failure rates by operation (`create`, `setStatus`, `assign`, `link`).

### 11.5 QA matrix and automated checks

Required gates before rollout:

1. `pnpm lint`
2. `pnpm test:snapshots`
3. `pnpm test:acceptance`
4. `pnpm test:rls`
5. `pnpm check:structure`
6. `pnpm check:routes`
7. `pnpm check:features`
8. `pnpm check:feature-scaffold`
9. `pnpm check:thresholds`
10. `pnpm check:boundaries`
11. `pnpm check:workspace-storage`
12. `pnpm check:raw-buttons`
13. `pnpm check:quality`

Manual QA scenarios:

1. owner and member each complete objective workflows in compact and fullscreen modes.
2. high-volume objective list in fullscreen validates virtualization and keyboard behavior.
3. objective-to-card linking with hidden cards verifies reveal-and-focus UX.
4. migration parity report confirms expected counts and status mapping.

### 11.6 Rollout strategy

1. Feature flag: `workspace_objectives_v2`.
2. Stage 1: internal orgs only (1-3 orgs), 48-72 hour observation.
3. Stage 2: 10-20% of orgs, observe error/latency and support signals.
4. Stage 3: 100% rollout after parity and support health checks.
5. Keep fallback:
   - read fallback to legacy JSON for one release window,
   - one-command rollback to disable `workspace_objectives_v2`.

### 11.7 Backout + incident response

1. Disable feature flag globally.
2. Re-enable legacy tracker rendering path.
3. Freeze sync job execution if conflict/error threshold exceeded.
4. Preserve objective write audit trail for postmortem reconciliation.

## 12) Planning Pass 6/6: PR Slices, Card-by-Card UX QA, Launch Checklist

This pass finalizes execution order and release criteria so implementation can begin without ambiguity.

### 12.1 Small-PR implementation sequence (ownership + files)

PR-01: Objective schema foundation

1. Files:
   - `supabase/migrations/<ts>_add_workspace_objective_tables.sql`
   - `src/lib/supabase/schema/tables/organization_workspace_objective_*.ts`
2. Output:
   - tables/indexes/RLS created and linted.
3. Owner:
   - platform/backend.

PR-02: Backfill + dual-read adapter

1. Files:
   - `supabase/migrations/<ts>_backfill_workspace_objectives_from_tracker_json.sql`
   - `src/features/workspace-objectives/lib/objective-queries.ts`
2. Output:
   - normalized reads with JSON fallback.
3. Owner:
   - platform/backend.

PR-03: Feature slice scaffold + server actions

1. Files:
   - `src/features/workspace-objectives/**` (contract baseline)
2. Output:
   - CRUD server actions and typed domain models.
3. Owner:
   - full-stack.

PR-04: Objectives card shell replacement

1. Files:
   - `src/features/workspace-objectives/components/objectives-card.tsx`
   - integration points in `src/app/(dashboard)/my-organization/_components/workspace-board/**`
2. Output:
   - new `Objectives` shell + tabs + row list.
3. Owner:
   - frontend/product.

PR-05: Objective row semantics + assignment controls

1. Files:
   - `src/features/workspace-objectives/components/objective-row.tsx`
   - `src/features/workspace-objectives/components/objective-detail-sheet.tsx`
2. Output:
   - explicit status controls, assignee management, due-date editing.
3. Owner:
   - frontend/product.

PR-06: Fullscreen objective editor mode

1. Files:
   - `src/features/workspace-objectives/components/objective-fullscreen-shell.tsx`
   - route composition wiring in `src/app/(dashboard)/my-organization/page.tsx`
2. Output:
   - unified fullscreen mode with URL state and return-to-canvas context.
3. Owner:
   - frontend/platform.

PR-07: Accelerator content embedding

1. Files:
   - `src/features/workspace-objectives/components/objective-accelerator-step-view.tsx`
   - shared adapters around `src/components/training/**`
2. Output:
   - accelerator step flow rendered inside objective fullscreen details.
3. Owner:
   - frontend/training.

PR-08: System objective sync pipeline

1. Files:
   - `src/features/workspace-objectives/server/sync-system-objectives.ts`
   - related event hooks/actions in accelerator/roadmap write paths.
2. Output:
   - idempotent objective reconciliation from source systems.
3. Owner:
   - backend/platform.

PR-09: Node-link routing + dock integration

1. Files:
   - objective link logic + workspace focus handlers under workspace board feature files.
2. Output:
   - objective chip -> reveal/focus linked card behavior.
3. Owner:
   - frontend/product.

PR-10: Observability + QA harness

1. Files:
   - telemetry emitters + acceptance tests + RLS tests.
2. Output:
   - measurable objective and sync health.
3. Owner:
   - platform/QA.

PR-11: Flagged rollout + fallback controls

1. Files:
   - feature flag gates and fallback branch wiring.
2. Output:
   - staged enablement with one-switch rollback.
3. Owner:
   - platform/release.

PR-12: Final cleanup and legacy-path sunset prep

1. Files:
   - removal/deprecation markers for tracker JSON read/write paths (guarded until full rollout signoff).
2. Output:
   - clean steady-state architecture.
3. Owner:
   - full-stack.

### 12.2 Card-by-card UX acceptance checklist (workspace)

Global rules for every canvas card:

1. Equal top and bottom content inset.
2. No clipped content at compact size baseline.
3. No dead interior whitespace caused by fixed heights.
4. One-word labels in docks.
5. Light/dark contrast meets AA for actionable UI.

Card-specific checks:

1. `Organization`:
   - banner renders high quality, correct aspect behavior, no unnecessary overlay when image exists.
2. `Objectives`:
   - tabs (`Accelerator`, `Team`) stable,
   - explicit status actions,
   - no completed items shown by default in accelerator mode.
3. `Brand`:
   - no extra bottom dead space; content anchors correctly.
4. `Engine`:
   - minimal locked state UI (pill/hover info) without verbose filler text.
5. `Calendar`:
   - day strip with square-like active day shape and correct spacing,
   - events/objectives tabs do not overflow or clip,
   - today indicator and return-to-today behavior.
6. `Comms`:
   - tabs-based structure replaces ad-hoc chip strip where specified.
7. `Deck`:
   - dropzone and file preview respect card bounds and scale.
8. `Vault`:
   - no bottom clipping; list/table fills available card space cleanly.
9. `Atlas`:
   - map pane full-bleed to card bottom; location actions in menu, not placeholder-only state.

Workspace chrome checks:

1. Docks:
   - left and bottom docks color-parity in light mode,
   - labels have enough room below icons,
   - icon sizes and hover growth are consistent.
2. Controls/minimap:
   - rounded corners match dock language,
   - zoom controls smaller and consistent with system controls.
3. Right rail:
   - no redundant containers/subtitles,
   - no clipping/overflow in action rows.

### 12.3 Production go/no-go checklist

Go criteria (all required):

1. Objective CRUD and assignment flows pass acceptance tests.
2. RLS policy tests pass for owner/member/non-member scenarios.
3. Sync parity report within tolerance:
   - system objective counts and completion states match source truth.
4. Performance guard:
   - no measurable regression in drag/zoom interaction quality versus baseline.
5. UI QA:
   - no critical clipping/overflow issues across light/dark and mobile/desktop breakpoints.
6. Error budget:
   - objective action failure rate under agreed threshold in staging.

No-go triggers:

1. Source-sync drift unresolved.
2. RLS leak or authorization bypass.
3. Interaction latency regression that degrades canvas usability.
4. Blocking clipping/layout regressions on core cards.

### 12.4 Post-launch verification script (first 72 hours)

1. Hour 0:
   - enable feature for internal cohort only,
   - verify create/update/assign/complete/link in production org.
2. Hour 6:
   - inspect sync job success/failure and conflict rates.
3. Hour 24:
   - compare objective aggregates with module progress and roadmap statuses.
4. Hour 48:
   - expand rollout cohort if metrics hold.
5. Hour 72:
   - decision checkpoint for broader rollout or rollback.

### 12.5 Definition of done for this initiative

1. Users can complete accelerator and team objective workflows from workspace with minimal context switching.
2. Progress is correct, source-aligned, and auditable.
3. UI is stable, unclipped, and visually consistent across cards and themes.
4. Architecture conforms to AGENTS contracts (feature slices, boundaries, route composition, QA gates).
5. Rollout is safe, measurable, and reversible.

## 13) UI/UX Addendum: Organization Operating Board (Apple-level minimalism)

This section tightens the product experience target from "good dashboard" to "minimal operating system."

### 13.1 Core product metaphor

1. The workspace is an `operating board`, not a feed and not a settings page.
2. Every visible element must answer one of three questions:
   - What matters now?
   - What changed?
   - What is next?
3. If an element does not improve those answers, remove it.

### 13.2 Interaction model

1. Primary interactions:
   - `Focus` (open detail),
   - `Advance` (complete next action),
   - `Connect` (jump to linked card/tool),
   - `Capture` (add objective/note/document/event).
2. Avoid mode confusion:
   - compact mode for triage,
   - fullscreen mode for execution.
3. Keep command vocabulary stable across cards (`Open`, `Assign`, `Link`, `Complete`, `Return`).

### 13.3 Visual language constraints

1. Surfaces are quiet; emphasis belongs to data state, not decoration.
2. One active accent at a time per card (status, selection, or progress).
3. Information density by layer:
   - layer 1: title + state chip,
   - layer 2: immediate next actions,
   - layer 3: metadata/details on demand.
4. Docks and controls should feel system-native and consistent:
   - shared radii, icon sizing, and hover motion curves.

### 13.4 Progress semantics (board-wide)

1. Show progress in three levels:
   - Organization level (overall readiness),
   - Stream level (Accelerator, Team, Finance, Comms),
   - Objective level (status and next step).
2. Always pair `%` with counts (`4/39`) to avoid false certainty.
3. Completed items are hidden by default but always retrievable.

### 13.5 Findability and retrieval

1. Universal retrieval entrypoint in fullscreen:
   - search objectives, notes, docs, forms, and modules from one field.
2. Every item should carry context breadcrumbs:
   - source, owner, timestamp, linked card.
3. No orphan content:
   - all notes/documents/forms must map to a module/objective/location.

### 13.6 Connection clarity ("what connects to what")

1. Objective rows show source and destination chips.
2. Linked cards visually acknowledge inbound objectives.
3. Keyboard shortcut to reveal connected graph path in canvas (phase-gated, lightweight).

## 14) Three Specific AI Integration Use Cases (novel + practical)

1. Objective Copilot with Evidence Lock
   - Input: objective + linked artifacts (notes, submissions, events, docs).
   - Output: next best action, draft completion notes, risk flags.
   - Guardrail: AI must cite source snippets from your org data before suggesting status changes.

2. Scenario Engine for Board Decisions
   - Input: budget table, calendar load, fundraising pipeline, team capacity.
   - Output: 2-3 scenario projections (`conservative`, `base`, `aggressive`) with tradeoffs.
   - Guardrail: no automatic writes; user approves a scenario to create objectives/tasks.

3. Auto-Brief Generator for External AI Tools
   - Input: normalized org context graph (mission, programs, current goals, constraints, recent progress).
   - Output: compact `ORG_CONTEXT.md` + task-specific prompt packs (`grant`, `board update`, `partnership outreach`).
   - Guardrail: policy filter strips sensitive PII/financial secrets by default before export.

## 15) ORG_CONTEXT.md Strategy (later-phase, lightweight now)

1. Build from normalized tables, not ad-hoc text blobs.
2. Keep sections bounded with token budgets per section (mission, active objectives, key metrics, recent changes).
3. Generate two variants:
   - `ORG_CONTEXT_PUBLIC.md` (safe for external tools),
   - `ORG_CONTEXT_INTERNAL.md` (full internal context; access-controlled).
4. Refresh policy:
   - event-driven on key changes + scheduled daily compaction.
5. Include machine-readable frontmatter:
   - `generated_at`, `org_id`, `version`, `source_ranges`, `redaction_profile`.

## 16) Planning Pass 7: Gap Audit (What Was Missing)

### 16.1 DB gaps to add

1. Concurrency control:
   - add `version` (or `updated_at` match checks) on objective writes to prevent silent overwrite.
2. Universal search support:
   - add weighted `tsvector` index across objective title/description/step text for fast board-wide retrieval.
3. Retention model:
   - define archive retention + purge windows for activity/events.
4. Attachment/link normalization:
   - objective-to-document junction table for first-class resource mapping.
5. Sync run ledger:
   - `objective_sync_runs` + `objective_sync_events` for auditability and replay.

### 16.2 Engineering gaps to add

1. Cache/invalidation contract:
   - explicit cache tags and invalidation points for objective queries and fullscreen shells.
2. Conflict resolution policy:
   - optimistic update with server reconciliation + inline conflict diff.
3. Perf SLOs:
   - set numeric budgets (e.g., action p95, fullscreen interactive p95, drag latency threshold).
4. Load profile:
   - test at large org scale (high objective counts, multi-user edits, heavy notes/docs).
5. Real-time scope:
   - define phase for presence + collaborative edits in objectives (not ad-hoc).

### 16.3 Design gaps to add

1. Token spec:
   - freeze objective-specific spacing/radius/type/motion tokens.
2. Breakpoint behavior:
   - define compact/desktop/ultra-wide card and fullscreen layouts explicitly.
3. Motion system:
   - one transition grammar for expand/collapse, focus, and card-link navigation.
4. Copy system:
   - one-word card labels + concise action verbs + empty/error microcopy templates.
5. Information hierarchy testing:
   - task-based usability checks for “find, decide, act” loops.

### 16.4 Scaffolding/build gaps to add

1. API contract docs:
   - typed action/request/response contracts for objective CRUD and sync.
2. Seed fixtures:
   - deterministic test fixtures for objective states, card links, and source sync.
3. Feature flags:
   - sub-flags per capability (`objectives_core`, `objectives_fullscreen`, `objectives_sync`, `objectives_ai_exports`).
4. Migration tooling:
   - parity checker script (`json tracker` vs `normalized`) per org.
5. Guardrail CI:
   - add targeted perf and layout regression checks for workspace cards.

### 16.5 Final phase map (build in phases: yes)

1. Phase A: Foundations
   - schema, RLS, CRUD, dual-read.
2. Phase B: UX core
   - new Objectives card, row semantics, assignment, clipping-safe layout.
3. Phase C: Execution layer
   - fullscreen unification + accelerator step embedding.
4. Phase D: Source truth
   - sync pipelines, parity checks, activity stream.
5. Phase E: Hardening
   - SLO tuning, accessibility/perf/load validation.
6. Phase F: Rollout
   - staged flags, monitoring, fallback sunset.

### 16.6 One-line product pitch

Coach House Workspace is a minimal operating board where every objective, module, document, and decision is connected, actionable, and measurable in one place.
