# 2026-02-19 Structure Clarity Refactor Design

## Objective
Improve codebase clarity, naming consistency, and component-tree ownership with low-risk refactors that preserve behavior and routes.

## Baseline Findings
- Surface area is large: `src/components` has ~300 files; `src/app` has ~159 files.
- Naming drift existed in active runtime paths:
  - Mixed-case file paths in `src/components` (`GradualBlur.jsx`, `GradualBlur.css`, `ScrollReveal.css`).
  - PascalCase filenames in admin module-builder subtree.
- Component ownership drift existed:
  - `src/components/admin/module-builder/**` was only consumed by one route-local editor (`src/app/(admin)/admin/modules/[id]/_components/content-builder.tsx`) and was not shared.
- Monolith hotspots remain for future phases:
  - `src/components/organization/org-profile-card/tabs/documents-tab.tsx` (~2248 LOC)
  - `src/components/onboarding/onboarding-dialog.tsx` (~1492 LOC)
  - `src/components/programs/program-wizard.tsx` (~1374 LOC)

## Principles Used
- Keep URL behavior and server contracts unchanged.
- Move route-private UI into route-local `_components`.
- Use kebab-case filenames for component modules and CSS assets.
- Reduce repeated inline logic in large client components before introducing new abstractions.

## Implemented In This Pass
1. Route-localized admin module-builder components
- Moved from:
  - `src/components/admin/module-builder/*`
- To:
  - `src/app/(admin)/admin/modules/[id]/_components/module-builder/*`
- Added local barrel:
  - `src/app/(admin)/admin/modules/[id]/_components/module-builder/index.ts`

2. Naming normalization (kebab-case)
- Renamed:
  - `src/components/GradualBlur.jsx` -> `src/components/gradual-blur.jsx`
  - `src/components/GradualBlur.css` -> `src/components/gradual-blur.css`
  - `src/components/ScrollReveal.css` -> `src/components/scroll-reveal.css`
- Updated imports in:
  - `src/app/globals.css`
  - `src/components/roadmap/public-roadmap-presentation.tsx`

3. `content-builder` readability + DRY refactor
- Updated imports to route-local module-builder barrel.
- Added explicit interaction types and draft shape.
- Extracted repeated interaction config logic into `buildInteractionConfig`.
- Extracted repeated reorder logic into `reorderItems` + `createDragEndHandler`.
- Replaced repeated object-spread state updates with `patchInteractionDraft`.
- Preserved submit payload shape and section behavior.

## Next Recommended Refactor Slices
1. Split `documents-tab.tsx` into domain modules
- `constants.ts`, `types.ts`, `formatters.ts`, `row-actions.tsx`, `policy-editor-dialog.tsx`, `documents-tab.tsx`.

2. Establish a lightweight naming guard
- Add a CI-safe script to detect new non-kebab component filenames in `src/components/**` and route-local `_components/**`.

3. Standardize route-domain folder ownership
- Keep globally reusable UI in `src/components/**`.
- Keep single-route feature components inside route `_components/**`.

4. Monolith decomposition budget
- Set target: no client component over ~800 LOC without a decomposition plan.

## Validation Gates
- `pnpm lint`
- `pnpm test:snapshots`
- `pnpm test:acceptance`
- `pnpm test:rls`

## Status Update (2026-02-19 Follow-Up)
- Acceptance baseline was restored to green after compatibility hardening and stale expectation updates.
- Legacy checkout mode compatibility (`accelerator`/`elective` -> organization flow) is now preserved in pricing actions.
- Added structural guardrail command:
  - `pnpm check:structure` (`scripts/check-structure-conventions.mjs`)
- Added agent contract doc for structure rules:
  - `docs/agent/code-structure.md`
- Completed `documents-tab` decomposition phase 1:
  - extracted domain types to `src/components/organization/org-profile-card/tabs/documents-tab/types.ts`
  - extracted static constants/config to `src/components/organization/org-profile-card/tabs/documents-tab/constants.ts`
  - preserved public type exports from `src/components/organization/org-profile-card/tabs/documents-tab.tsx`
- Completed `documents-tab` decomposition phase 2:
  - extracted row action components to `src/components/organization/org-profile-card/tabs/documents-tab/components/*-row-actions.tsx`
  - extracted policy dialog to `src/components/organization/org-profile-card/tabs/documents-tab/components/policy-editor-dialog.tsx`
  - extracted row meta UI (`StatusBadge`, `CategoryBadges`, `SortIndicator`) to `src/components/organization/org-profile-card/tabs/documents-tab/components/document-row-meta.tsx`
  - extracted shared helpers into `src/components/organization/org-profile-card/tabs/documents-tab/helpers.ts`
- Completed `documents-tab` decomposition phase 3:
  - extracted index/filter/sort/search state and row derivation into `src/components/organization/org-profile-card/tabs/documents-tab/hooks/use-documents-index.ts`
  - split results rendering into `documents-results-table.tsx` + `documents-results-mobile.tsx` with shared `document-row-actions.tsx`
  - reduced `src/components/organization/org-profile-card/tabs/documents-tab.tsx` from ~778 LOC to ~544 LOC in this phase (~2248 LOC to ~544 LOC from original baseline)
  - removed `documents-tab.tsx` from structure line-budget allowlist after budget compliance
- Completed `documents-tab` decomposition phase 4:
  - split `policy-editor-dialog.tsx` into focused subcomponents:
    - `policy-categories-field.tsx`
    - `policy-file-field.tsx`
    - `policy-people-field.tsx`
  - preserved existing draft mutation callbacks and dialog save/cancel semantics
  - reduced `policy-editor-dialog.tsx` from ~448 LOC to ~191 LOC
- Completed `documents-tab` decomposition phase 5:
  - extracted request/response logic to `src/components/organization/org-profile-card/tabs/documents-tab/api.ts`
  - replaced inline fetch blocks in `documents-tab.tsx` with typed API helpers
  - preserved existing endpoints and fallback error semantics
  - reduced `src/components/organization/org-profile-card/tabs/documents-tab.tsx` from ~544 LOC to ~457 LOC
- Completed `home2-sections` decomposition phase 1:
  - extracted accelerator preview implementation to `src/components/public/home2-accelerator-overview-section.tsx`
  - preserved `Home2AcceleratorOverviewSection` export contract via wrapper in `home2-sections.tsx`
  - passed heading/body font class names through wrapper to preserve typography behavior
  - reduced `src/components/public/home2-sections.tsx` from ~1147 LOC to ~597 LOC
- Completed `home2 accelerator` decomposition phase 2:
  - split `home2-accelerator-overview-section.tsx` into local feature modules under `src/components/public/home2-accelerator-overview/`
  - extracted constants/types/helpers and four focused render components (header, dots, left panel, right panel)
  - preserved `Home2AcceleratorOverviewSectionBlock` behavior while reducing it to orchestration-only state and prop wiring
  - reduced `src/components/public/home2-accelerator-overview-section.tsx` from ~628 LOC to ~105 LOC
- Completed `assignment-form` decomposition phase 1:
  - extracted embedded `TabStepBadge` to `src/components/training/module-detail/assignment-form/tab-step-badge.tsx`
  - extracted embedded `RoadmapCheckpointField` to `src/components/training/module-detail/assignment-form/roadmap-checkpoint-field.tsx`
  - preserved roadmap section status save workflow and assignment field rendering behavior
  - reduced `src/components/training/module-detail/assignment-form.tsx` from ~974 LOC to ~845 LOC
- Completed `assignment-form` decomposition phase 2:
  - extracted progress sidebar to `src/components/training/module-detail/assignment-form/assignment-progress-panel.tsx`
  - preserved tab progress indicator motion and completion status rendering
  - reduced `src/components/training/module-detail/assignment-form.tsx` from ~845 LOC to ~788 LOC
- Completed `onboarding-dialog` decomposition phase 1:
  - extracted domain contracts to `src/components/onboarding/onboarding-dialog/types.ts`
  - extracted options/constants to `src/components/onboarding/onboarding-dialog/constants.ts`
  - extracted shared helpers to `src/components/onboarding/onboarding-dialog/helpers.ts`
  - extracted step/presentation sections to `src/components/onboarding/onboarding-dialog/components/*.tsx`
  - reduced `src/components/onboarding/onboarding-dialog.tsx` from ~1492 LOC to ~876 LOC
  - removed onboarding dialog from structure allowlist after budget compliance
- Completed `program-wizard` decomposition phase 1:
  - extracted domain contracts to `src/components/programs/program-wizard/types.ts`
  - extracted step metadata/constants to `src/components/programs/program-wizard/constants.ts`
  - extracted hydration/serialization/validation/feasibility logic to `src/components/programs/program-wizard/helpers.ts`
  - reduced `src/components/programs/program-wizard.tsx` from ~1374 LOC to ~923 LOC
  - removed program wizard from structure allowlist after budget compliance
- Archived unreferenced modules into deprecated:
  - `deprecated/src/unused-2026-02-19/src/**`
  - archived set chosen from zero-inbound static import-graph candidates
  - kept files recoverable while removing them from active code paths
- Current structural watch item:
  - no active file-level warnings from `pnpm check:structure`

## Status Update (2026-02-20 Continuation)

- Completed `documents-tab` decomposition phase 6:
  - extracted stateful controller logic to `src/components/organization/org-profile-card/tabs/documents-tab/hooks/use-documents-tab-controller.ts`
  - reduced `src/components/organization/org-profile-card/tabs/documents-tab.tsx` to composition-only rendering (~162 LOC)
  - preserved upload/policy CRUD/banner persistence behavior through hook API
- Completed `case-study-autofill-fab` decomposition phase 2:
  - split helper monolith into focused modules under `src/components/dev/case-study-autofill-fab/`
  - kept compatibility through `helpers.ts` re-export surface
  - reduced helper entrypoint from ~635 LOC to ~10 LOC
- Completed deprecated sweep phase 2:
  - moved seven additional unreferenced modules to `deprecated/src/unused-2026-02-20/src/**` after import-graph + grep verification
  - restored `src/components/tiptap/extensions/image-placeholder.tsx` after build surfaced required TipTap command typing augmentation
- Completed deprecated sweep phase 3:
  - follow-up pass identified orphan `dialog-stack` internals and unused TipTap toolbar/placeholder stack after `editor-toolbar` archival
  - moved those orphan clusters plus `src/components/ui/toggle-group.tsx` to `deprecated/src/unused-2026-02-20/src/**`
  - full contract checks remained green after archival
- Completed deprecated sweep phase 4:
  - archived final zero-inbound leftovers:
    - `src/components/kibo-ui/dialog-stack/context.tsx`
    - `src/components/tiptap/extensions/search-and-replace.tsx`
    - `src/components/tiptap/toolbars/mobile-toolbar-group.tsx`
    - `src/components/tiptap/toolbars/toolbar-provider.tsx`
    - `src/components/ui/toggle.tsx`
  - updated deprecated inventory README for full 2026-02-20 archive set
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Naming Normalization)

- Completed semantic rename for temporary `home2` module names:
  - `src/components/public/home2-sections.tsx` -> `src/components/public/legacy-home-sections.tsx`
  - `src/components/public/home2-photo-strip.tsx` -> `src/components/public/legacy-home-photo-strip.tsx`
  - `src/components/public/home2-accelerator-overview-section.tsx` -> `src/components/public/legacy-home-accelerator-overview-section.tsx`
  - `src/components/public/home2-accelerator-overview/*` -> `src/components/public/legacy-home-accelerator-overview/*`
- Updated symbol naming in affected modules and consumers:
  - `Home2*` -> `LegacyHome*`
  - `HOME2_*` -> `LEGACY_HOME_*`
- Route semantics cleanup:
  - moved implementation route files to `src/app/(public)/legacy-home/*`
  - preserved `/home2` as a compatibility alias route with redirect to `/legacy-home`
- Contract update:
  - added naming guidance in `docs/agent/code-structure.md` to avoid numeric iteration suffixes in long-lived modules/routes.
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Program Wizard Phase 2)

- Completed `program-wizard` decomposition phase 2:
  - extracted all step rendering into dedicated components under `src/components/programs/program-wizard/components/`
  - extracted shared display/field primitives (`number-field`, `metric-row`, `summary-block`)
  - extracted wizard header/footer composition components
  - added typed patch/error contracts in `types.ts` (`ProgramWizardUpdate`, `ProgramWizardFieldErrors`)
  - preserved wizard lifecycle logic (draft hydration, autosave, validation, submit) in `program-wizard.tsx`
  - reduced `src/components/programs/program-wizard.tsx` from ~923 LOC to ~307 LOC
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Roadmap Editor Phase 1)

- Completed `roadmap-editor` decomposition phase 1:
  - extracted local contracts to `src/components/roadmap/roadmap-editor/types.ts`
  - extracted constants to `src/components/roadmap/roadmap-editor/constants.ts`
  - extracted helper logic to `src/components/roadmap/roadmap-editor/helpers.ts`
  - extracted TOC rendering to `src/components/roadmap/roadmap-editor/components/roadmap-editor-toc.tsx`
  - reduced `src/components/roadmap/roadmap-editor.tsx` from ~902 LOC to ~644 LOC
  - preserved section select/toggle, autosave, and status mutation behavior by callback wiring
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Onboarding Dialog Phase 2)

- Completed `onboarding-dialog` decomposition phase 2:
  - extracted draft persistence/hydration logic to `src/components/onboarding/onboarding-dialog/draft.ts`
  - extracted slug availability/network status lifecycle to `src/components/onboarding/onboarding-dialog/hooks/use-slug-availability.ts`
  - extracted form shell rendering to `src/components/onboarding/onboarding-dialog/components/onboarding-dialog-content.tsx`
  - added shared draft and slug contracts in `types.ts` plus typed guards in `helpers.ts`
  - reduced `src/components/onboarding/onboarding-dialog.tsx` from ~876 LOC to ~650 LOC
  - preserved dialog/inline presentation behavior, draft restore, slug validation, and avatar crop flow
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Assignment Form Phase 3)

- Completed `assignment-form` decomposition phase 3:
  - extracted field rendering switch to `src/components/training/module-detail/assignment-form/assignment-field.tsx`
  - centralized assignment field-type UI handling (short/long text, roadmap checkpoints, select/multi-select, slider, budget table, custom program) behind a dedicated component boundary
  - kept `assignment-form.tsx` focused on state orchestration, autosave, section/tab flow, and progress presentation
  - reduced `src/components/training/module-detail/assignment-form.tsx` from ~788 LOC to ~435 LOC
  - preserved stepper/tab rendering behavior and existing autosave semantics
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Roadmap Editor Phase 2)

- Completed `roadmap-editor` decomposition phase 2:
  - extracted shell/panel render composition to `src/components/roadmap/roadmap-editor/components/roadmap-editor-shell.tsx`
  - extracted repeated roadmap-draft concerns into `src/components/roadmap/roadmap-editor/helpers.ts`:
    - draft map initialization
    - TOC derivation
    - baseline + dirty checks
    - localStorage hydration/persistence
    - status fallback resolver
  - simplified `src/components/roadmap/roadmap-editor.tsx` to focus on interaction/state orchestration
  - reduced `src/components/roadmap/roadmap-editor.tsx` from ~644 LOC to ~465 LOC
  - fixed strict TypeScript contracts during extraction to keep build compatibility
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Rich Text Editor Phase 1)

- Completed `rich-text-editor` decomposition phase 1:
  - extracted editor prop contracts to `src/components/rich-text-editor/types.ts`
  - extracted reusable utilities to `src/components/rich-text-editor/helpers.ts` (placeholder sync + link extraction)
  - extracted async link preview metadata logic to `src/components/rich-text-editor/hooks/use-link-previews.ts`
  - extracted full toolbar UI/interaction surface to `src/components/rich-text-editor/components/rich-text-toolbar.tsx`
  - extracted link card preview UI to `src/components/rich-text-editor/components/link-preview-card.tsx`
  - kept public `RichTextEditor` props unchanged while reducing `src/components/rich-text-editor.tsx` from ~775 LOC to ~404 LOC
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Roadmap Calendar Phase 1)

- Completed `roadmap-calendar` decomposition phase 1:
  - extracted calendar draft type to `src/components/roadmap/roadmap-calendar/types.ts`
  - extracted constants to `src/components/roadmap/roadmap-calendar/constants.ts`
  - extracted date/time + draft builder helpers to `src/components/roadmap/roadmap-calendar/helpers.ts`
  - extracted calendar day rendering to `src/components/roadmap/roadmap-calendar/components/calendar-day-with-dot.tsx`
  - extracted the entire create/edit drawer form to `src/components/roadmap/roadmap-calendar/components/roadmap-calendar-event-drawer.tsx`
  - reduced `src/components/roadmap/roadmap-calendar.tsx` from ~769 LOC to ~472 LOC while preserving data flow and behavior
  - fixed recurrence seeding type reference after extraction (`RoadmapCalendarRecurrence`)
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Org Chart Canvas Phase 1)

- Completed `org-chart-canvas` decomposition phase 1:
  - extracted contracts to `src/components/people/org-chart-canvas/types.ts`
  - extracted constants to `src/components/people/org-chart-canvas/constants.ts`
  - extracted layout + snapshot + extent helper logic to `src/components/people/org-chart-canvas/helpers.ts`
  - extracted person node renderer to `src/components/people/org-chart-canvas/components/person-node.tsx`
  - reduced `src/components/people/org-chart-canvas.tsx` from ~745 LOC to ~303 LOC
  - preserved chart interaction behavior (drag, undo/redo history, reset layout, debounced persistence)
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Deck Viewer Phase 1)

- Completed `deck-viewer` decomposition phase 1:
  - extracted constants to `src/components/training/module-detail/deck-viewer/constants.ts`
  - extracted pdf.js runtime loader to `src/components/training/module-detail/deck-viewer/helpers.ts`
  - extracted page state/navigation behavior to `src/components/training/module-detail/deck-viewer/hooks/use-deck-page-navigation.ts`
  - extracted touch/wheel gesture behavior to `src/components/training/module-detail/deck-viewer/hooks/use-deck-gestures.ts`
  - extracted unavailable/trigger/preview UI blocks to:
    - `src/components/training/module-detail/deck-viewer/components/deck-unavailable-state.tsx`
    - `src/components/training/module-detail/deck-viewer/components/deck-preview-trigger.tsx`
    - `src/components/training/module-detail/deck-viewer/components/deck-preview-canvas.tsx`
  - reduced `src/components/training/module-detail/deck-viewer.tsx` from ~719 LOC to ~541 LOC
  - preserved dialog/inline deck rendering, preview, download, and navigation behavior
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 My Organization Page Decomposition Phase 1)

- Completed `my-organization page` decomposition phase 1:
  - extracted route-private dashboard/editor view composition to:
    - `src/app/(dashboard)/my-organization/_components/my-organization-dashboard-view.tsx`
    - `src/app/(dashboard)/my-organization/_components/my-organization-editor-view.tsx`
  - extracted dashboard card surfaces into dedicated modules:
    - `src/app/(dashboard)/my-organization/_components/my-organization-overview-card.tsx`
    - `src/app/(dashboard)/my-organization/_components/my-organization-calendar-card.tsx`
    - `src/app/(dashboard)/my-organization/_components/my-organization-formation-card.tsx`
    - `src/app/(dashboard)/my-organization/_components/my-organization-team-card.tsx`
  - extracted route-local helpers/contracts to:
    - `src/app/(dashboard)/my-organization/_lib/helpers.ts`
    - `src/app/(dashboard)/my-organization/_lib/calendar.ts`
    - `src/app/(dashboard)/my-organization/_lib/constants.ts`
    - `src/app/(dashboard)/my-organization/_lib/types.ts`
  - reduced `src/app/(dashboard)/my-organization/page.tsx` from ~717 LOC to ~205 LOC, keeping the page focused on auth/data orchestration and moving presentation logic into typed, domain-named modules.
  - preserved `/organization` compatibility route behavior (`src/app/(dashboard)/organization/page.tsx` re-export unchanged).
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Documents Tab Controller Phase 2)

- Completed `documents-tab controller` decomposition phase 2:
  - extracted policy draft mapping/payload helpers to `src/components/organization/org-profile-card/tabs/documents-tab/hooks/policy-draft-helpers.ts`
  - extracted policy draft/dialog/document selection state machine to `src/components/organization/org-profile-card/tabs/documents-tab/hooks/use-policy-draft-state.ts`
  - simplified `src/components/organization/org-profile-card/tabs/documents-tab/hooks/use-documents-tab-controller.ts` to focus on index orchestration + persistence actions while preserving the existing return API consumed by `documents-tab.tsx`
  - reduced `use-documents-tab-controller.ts` from ~415 LOC to ~313 LOC
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Onboarding Dialog Phase 2)

- Completed `onboarding-dialog` decomposition phase 2:
  - extracted default value derivation + step validation logic to `src/components/onboarding/onboarding-dialog/state-helpers.ts`
  - extracted animated progress state/effects to `src/components/onboarding/onboarding-dialog/hooks/use-onboarding-progress.ts`
  - extracted avatar crop/remove state + file input synchronization to `src/components/onboarding/onboarding-dialog/hooks/use-onboarding-avatar.ts`
  - simplified `src/components/onboarding/onboarding-dialog.tsx` orchestration and reduced it from ~650 LOC to ~533 LOC while preserving dialog/inline behavior and draft restore semantics
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 App Shell Phase 1)

- Completed `app-shell` decomposition phase 1:
  - extracted route-shell presentation blocks to feature modules under `src/components/app-shell/components/`:
    - `app-shell-header.tsx`
    - `app-shell-mobile-nav.tsx`
    - `shell-right-rail.tsx`
    - `sidebar-auto-collapse.tsx`
    - `sidebar-brand.tsx`
  - added `src/components/app-shell/constants.ts` for shared shell constants
  - reduced `src/components/app-shell.tsx` by removing embedded component definitions and keeping top-level shell orchestration in one place
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅

## Status Update (2026-02-20 Module Stepper Phase 1)

- Completed `module-stepper` decomposition phase 1:
  - extracted stepper domain contracts to `src/components/training/module-detail/module-stepper-types.ts`
  - extracted step derivation/rail/completion helpers to `src/components/training/module-detail/module-stepper-helpers.ts`
  - extracted shared step frame + celebration icon to `src/components/training/module-detail/module-stepper-frame.tsx`
  - extracted complete-state panel to `src/components/training/module-detail/module-stepper-complete-step.tsx`
  - extracted resources-state panel to `src/components/training/module-detail/module-stepper-resources-step.tsx`
  - reduced `src/components/training/module-detail/module-stepper.tsx` from ~602 LOC to ~394 LOC while preserving progression, session persistence, completion marking, and coaching booking behavior
- Validation:
  - `pnpm check:structure` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅
  - `pnpm test:rls` ✅
  - `pnpm build` ✅
