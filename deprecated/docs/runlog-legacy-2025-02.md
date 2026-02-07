# Run Log — Large File Optimization Initiative

## 2025-02-14 — Planning Outline

- **Inventory Validation**  
  - Reconfirm line counts for listed files; tag each as source, generated artifact, or dependency lockfile.  
  - Ensure `.next/**` and `.tmp/supabase-cli/**` outputs remain build artifacts only; update `.gitignore` or clean workspace so app logic stays in a single source of truth under `src/**`, `supabase/**`, and `docs/**`.
  - 2025-02-14 audit: Source files exceeding 500 LOC — `src/app/(admin)/admin/classes/actions.ts`, `src/components/{account-settings/account-settings-dialog.tsx, app-sidebar.tsx, data-table.tsx, training/class-overview.tsx, training/module-detail.tsx, programs/program-wizard.tsx, organization/org-profile-card/tabs/company-tab.tsx, ui/{data-table-2.tsx, sidebar.tsx}}`, `src/lib/{modules.ts, supabase/types.ts}`, and `src/app/(dashboard)/dashboard/data.json`. Generated artifacts (`.next/**`, `.tmp/**`) and lockfile (`package-lock.json`) flagged for cleanup rather than optimization.  

- **Docs Consolidation (`docs/Async`, `docs/Asyc`)**  
  - Diff both files to detect duplication; merge authoritative content into one canonical async reference; remove or redirect the mismatched filename.  
  - Extract reusable diagrams/text into smaller referenced partials under `docs/**` to keep guidance DRY across runbooks.
  - 2025-02-14 action: renamed legacy PDF assets to `docs/async-session-01.pdf` and `docs/async-session-09-overview.pdf` to eliminate conflicting `Async/Asyc` naming and keep a single canonical reference.

- **Dependency Lockfile Alignment (`package-lock.json`)**  
  - Confirm npm is the canonical package manager; retire any stray pnpm references so `package-lock.json` remains the single source of truth.  
  - Audit scripts and CI to eliminate pnpm commands and ensure npm workflows cover lint/test/build steps.

- **Static Data Restructuring (`src/app/(dashboard)/dashboard/data.json`)**  
  - Replace mega JSON blob with typed fetchers from Supabase views; leverage incremental data loaders to keep RSC boundaries thin and logic centralized in `src/lib/**`.  
  - Add schema guards so downstream components can rely on shared validators instead of duplicating shape checks.
  - 2025-02-14 action: replaced static JSON with generator utility `src/lib/dashboard/mock-table-data.ts` and updated API route to consume typed rows.

- **Admin/Class Component Suite (`src/app/(admin)/admin/classes/actions.ts`, `src/components/**`)**  
  - Identify repeated class/module helpers; extract to shared hooks (`src/hooks/**`) or services (`src/lib/**`) to enforce DRY actions.  
  - Split oversized components into presentational + container layers; reuse shadcn primitives; ensure sequential module logic lives in a single orchestrator.  
  - Introduce unit stories/tests covering reused atoms to lock in optimized logic.
  - 2025-02-14 actions: introduced `revalidateClassViews` helper to collapse repeated cache invalidation calls and normalized admin/class wizard server actions; removed unused duplicate `src/components/ui/data-table-2.tsx` to keep a single table implementation source.
  - 2025-02-14 actions: extracted dashboard table presentation into `src/components/dashboard/data-table/{columns.tsx,sortable-row.tsx}` and trimmed `src/components/data-table.tsx` to 357 lines while keeping shared column renderers DRY.
  - 2025-02-14 actions: broke the 960-line account settings dialog into modular pieces (`account-settings-dialog-shell.tsx`, `sections/**`, `account-settings-dialog-state.ts`), shrinking the main entry to 333 lines while centralizing state handling in a dedicated hook and reusing sections across desktop/mobile.
  - 2025-02-14 actions: refactored `src/components/training/module-detail.tsx` to 406 lines by moving assignment form + utilities into `module-detail/assignment-form.tsx` and `module-detail/utils.ts`, preserving functionality with cleaner boundaries.
  - 2025-02-14 actions: split `src/components/training/class-overview.tsx` into a 395-line container plus `class-overview/module-card.tsx` and `class-overview/video-preview.tsx`, centralizing publish/edit handlers and keeping module/hero renderers modular.
  - 2025-02-14 actions: refactored the organization company tab into a 96-line wrapper plus `tabs/company-tab/{edit-sections.tsx,display-sections.tsx,types.ts}` to separate edit and view sections while preserving original props.
  - 2025-02-14 actions: decomposed `src/components/programs/program-wizard.tsx` into a 184-line orchestrator with step modules (`steps/{basics,schedule,funding}-step.tsx`) and shared schema/tag inputs for reuse.
  - 2025-02-14 actions: decomposed `src/components/app-sidebar.tsx` into a 101-line container plus `app-sidebar/{classes-section.tsx,constants.ts,nav-data.ts,hooks.ts}`, isolating nav data, accordion animation, and open-state persistence.
  - 2025-02-14 actions: decomposed the 726-line sidebar primitives into `src/components/ui/sidebar/{context.tsx,layout.tsx,menu.tsx,constants.ts,index.ts}`, preserving exports via the barrel while moving provider/menu/layout logic into focused modules.

- **Domain Libraries (`src/lib/modules.ts`, `src/lib/supabase/types.ts`)**  
  - Normalize module progression logic into centralized services with exhaustive typing; generate Zod schemas from Supabase types to maintain one truth for validation.  
  - Document invariants in `/docs` so future policies follow the same optimized pathways.

- **Performance & Bundle Targets (`.next/**` bundles)**  
  - Analyze build stats once sources are refactored; enforce dynamic imports for dashboard/admin heavy widgets, reducing bundle line counts.  
  - Add perf budget checks (`pnpm check:perf`) to CI to prevent regression and keep optimized tree-shaking effective.

- **Verification**  
  - After refactors, run `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, and `pnpm test:rls` to ensure optimized logic stays compliant with the canonical contract.  
  - Capture before/after metrics (bundle size, component LOC) in `/docs/changelog`.

### Refactored Files (to date)
- Dashboard data pipeline: `src/lib/dashboard/mock-table-data.ts`, `src/app/api/dashboard/table/route.ts`
- Admin class orchestration: `src/app/(admin)/admin/classes/actions.ts`
- Dashboard data table UI: `src/components/data-table.tsx`, `src/components/dashboard/data-table/{columns.tsx,sortable-row.tsx}`
- Account settings suite: `src/components/account-settings/*` (dialog shell/state, desktop & mobile sections)
- Training experience: `src/components/training/module-detail.tsx`, `module-detail/{assignment-form.tsx,utils.ts}`, `src/components/training/class-overview.tsx`, `class-overview/{module-card.tsx,video-preview.tsx}`
- Organization company tab: wrapper + `tabs/company-tab/{edit-sections.tsx,display-sections.tsx,types.ts,constants.ts}`
- Program wizard: `src/components/programs/program-wizard.tsx`, `program-wizard/{schema.ts,tag-input.tsx,steps/*}`
- Global chrome: `src/components/app-sidebar.tsx`, `app-sidebar/{classes-section.tsx,constants.ts,nav-data.ts,hooks.ts}`
- Sidebar primitives: `src/components/ui/sidebar/{context.tsx,layout.tsx,menu.tsx,constants.ts,index.ts}`

### Pending Refactors
- `src/components/account-settings/sections/desktop-sections.tsx` (~490 LOC) – split identity/contact/address blocks into reusable form subcomponents.
- `src/components/kibo-ui/dialog-stack/index.tsx` (~480 LOC) – extract stack context + animated shell into smaller modules.
- `src/components/organization/org-profile-card/tabs/company-tab/edit-sections.tsx` (~470 LOC) – further break out grouped sections (contact, socials) now that wrapper exists.
- `src/lib/modules.ts`, `src/lib/supabase/types.ts` – outstanding from original inventory, still above target line count.
