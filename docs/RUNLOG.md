# RUNLOG — Ad‑hoc Work History

Purpose: Track changes we’re making outside the formal PR stepper.

## 2025-12-03

- Sidebar nav alignment: Ensured module sub-items span the full width of the class row and balanced padding (`px-2`) so hover/active pills align with the class entry edge while keeping the left indent (`src/components/ui/sidebar.tsx`, `src/components/app-sidebar/classes-section.tsx`).
- DRY fix: Removed the unused duplicate sidebar primitives file (`src/components/ui/sidebar/menu.tsx`) so future tweaks hit the single canonical source.

## 2025-11-20

- Fix: pdf.js vendor bundle referenced `import.meta`, which threw `Cannot use 'import.meta' outside a module` under Turbopack. Load the script as `type="module"` so the browser treats it as ESM and pdfjsLib initializes without errors (`src/components/training/module-detail.tsx`).
- Deck viewer polish: tightened the slide canvas to cover + crop inside the rounded container, removed transitions for fastest render, anchored sizing to the visible viewport to avoid blank loads, added a loader overlay whenever a slide is loading, and kept swipe/keyboard/button controls with a single-slide, non-scrollable card (`src/components/training/module-detail.tsx`).

## 2025-11-19

- Curriculum data: Added migration `20251119123000_seed_systems_thinking_structured_homework.sql` to locate the Theory of Change → Systems Thinking module, clear legacy lesson notes, wipe the old one-line homework stub, and upsert the full twelve-section Systems Thinking worksheet schema so assignments mirror the published questions doc.
- Follow-up: Budgeting/piloting/elective modules still use placeholder deck metadata—need real deck assets + updated titles after the admin uploads are ready.
- UI: Slide deck viewer now inlines `docs/Week 08.pdf` for every module, renders each slide onto a locally vendored PDF.js canvas (slightly zoomed/cropped), shows the `current/total` pill in the bottom-right, anchors prev/next controls bottom-left with fade-out hover behavior, and places download/fullscreen icons in the top-right (`src/components/training/module-detail.tsx`, `public/week-08.pdf`, `public/vendor/pdfjs/*`).

## 2025-10-03

- Context: Building Admin UI to create/edit/update/delete classes and modules.
- UI: Replaced text label with a generic “Create” plus icon on `admin/academy` page header. Hover/focus states handled via design system.
- UI: Plus button now opens a popover with two options: “Add class” (opens wizard) and “Add module” (scrollable list to pick class). Button size reduced for better visual weight.
- Bug: Creating a new class threw `new row violates row-level security policy for table "classes"`.
- Mitigation: For admin-only mutations, added a server-side fallback to use the Supabase service-role client when RLS blocks inserts/updates (still requires admin session on the app side). This unblocks admin operations without relaxing RLS for normal users.
- DB: Ran `supabase db push` and fixed migrations to be idempotent and robust:
  - Patched `20251003174500_seed_orgkey_interactions.sql` to avoid cross-statement CTE references.
  - Patched `20251003180500_seed_foundations_orgkeys.sql` to insert via join (no null module_id).
  - Patched `20251003193000_seed_elective_content_stubs.sql` to add `content_md` column before updating stubs.
- Follow-ups:
  - Ensure latest DB migrations (classes/modules policies using `public.is_admin()`) are applied in the target Supabase project (`supabase db push`).
  - Verify that the current user has a `profiles.role = 'admin'` row; otherwise `public.is_admin()` will return false and RLS will deny inserts.

## 2025-10-04

- Sidebar: Removed duplicate items for admin view by deduping classes (by slug) and modules (by index) in `fetchSidebarTree`. Keys switched to module `id` to avoid collisions.
- UI: Added `CreateEntityPopover` with a smaller icon button and a two-step flow to add a class or select a class to add a module.
- Docs: Reviewed `docs/AGENTS.md`, `docs/CODEX_RUNBOOK.md`, `docs/DB_SCHEMA.md`, `docs/user-journeys.md`, and `docs/user-journeys-proposal.md`. Aligned on MVP scope, data model, RLS policies (`public.is_admin()`), canonical routes (module index), RSC/CSR boundaries, caching, signed deck URLs, and acceptance criteria. Will use `docs/RUNLOG.md` for ad‑hoc work notes going forward.
- UI polish: Sidebar nav buttons made slightly shorter (`h-7` default), dropdown/action icon container made square and vertically aligned; long nav labels now wrap to a second line instead of truncating. Touched `src/components/ui/sidebar.tsx`, `src/components/nav-main.tsx`, `src/components/app-sidebar.tsx`.
  - Follow-up tweak: Increased right padding when a row has an action menu to force earlier wrapping and keep text away from the right-side icon. Touched `src/components/ui/sidebar.tsx`.
- Fix: Prevented "Cannot call startTransition while rendering" and Router update warning by moving `startTransition(reorderModulesAction)` out of `setState` updater in `ModuleListManager`. Now compute `next` first, `setItems(next)`, then start transition. Files: `src/app/(admin)/admin/classes/[id]/_components/module-list-manager.tsx`.

## 2025-10-05

- Feature: Swapped the legacy class wizard dialog for a new lesson creation wizard in the admin popover. The wizard now drives class creation with multi-step lesson/module authoring (`src/components/admin/create-entity-popover.tsx`, `src/components/admin/lesson-creation-wizard.tsx`).
- Infra: Added a shared TipTap-powered rich text editor used across the wizard for landing page and module content (`src/components/rich-text-editor.tsx`).
- Backend: Enhanced `createClassWizardAction` to accept wizard payloads, create classes, seed modules/content, and upsert module assignments with RLS fallbacks (`src/app/(admin)/admin/classes/actions.ts`).
- Fix: Installed missing TipTap extensions so the new editor bundles cleanly (`@tiptap/extension-text-align`, `@tiptap/extension-underline`, `@tiptap/extension-link`).
- Fix: Disabled TipTap's SSR immediate render to suppress hydration warnings when the wizard mounts (`src/components/rich-text-editor.tsx`).
- Feature: Replaced class landing admin shortcuts with inline edit tooling powered by the wizard, refreshed module cards with view/edit controls and a three-dot actions menu, and added section-level edit buttons on module detail pages for quick admin tweaks (`src/components/training/class-overview.tsx`, `src/app/(dashboard)/class/[slug]/page.tsx`, `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`).
- Backend: Added update support for the lesson wizard (server action + API payload fetch) so admins can edit existing classes/modules via the same flow (`src/app/(admin)/admin/classes/actions.ts`, `src/app/api/admin/classes/[id]/wizard/route.ts`).
- Polish: Increased the lesson wizard dialog width (base + `sm` breakpoints) for better content fit (`src/components/admin/lesson-creation-wizard.tsx`).
- Navigation cleanup: Hid legacy "My Organization", "People", and Support entries, removed the billing shortcut from the user menu, and retired the corresponding dashboard pages (`src/components/app-sidebar.tsx`, `src/components/site-header.tsx`, `src/components/nav-user.tsx`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/(dashboard)/people/page.tsx`, `src/middleware.ts`).
- UX: Wizard flow now enforces titles before advancing (class + per-module) and the create popover hides “Add module” when no classes exist (`src/components/admin/lesson-creation-wizard.tsx`, `src/components/admin/create-entity-popover.tsx`).
- Meta: Reviewed `docs/AGENTS.md` and `docs/CODEX_RUNBOOK.md` per new session kickoff to confirm scope and workflow; logging ongoing work here.
- UI: Let Academy sidebar items wrap to two lines without ellipses while keeping single-line entries vertically balanced (`src/components/app-sidebar.tsx`).
- UI: Refined the class landing header with title, auto-generated subtitle metadata (no "total" suffix), constrained description copy, and placeholder blurb fallback for missing content (`src/components/training/class-overview.tsx`, `src/app/(dashboard)/class/[slug]/page.tsx`, `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`, `src/app/(dashboard)/training/page.tsx`).
- UI: Reworked module cards for consistent layout—icon sizing fixed, status badge/button anchored, progress cluster pinned to the footer, text truncated for long titles/subtitles, and extraneous lesson/duration metadata removed (`src/components/training/class-overview.tsx`).

## 2025-10-10

- People: Added new `/people` page with an org chart builder and lists.
  - React Flow canvas renders a simple org chart grouped by category at the top within a Card (`src/components/people/org-chart-canvas.tsx`).
  - Create button opens a stepped dialog to add/edit a person with profile picture upload preview, name, title, email, LinkedIn, and category (Staff, Board, Supporters). Uses shadcn Field and InputGroup patterns (`src/components/people/create-person-dialog.tsx`, `src/components/ui/field.tsx`, `src/components/ui/input-group.tsx`).
  - People stored under `organizations.profile.org_people` via server actions (`src/app/(dashboard)/people/actions.ts`).
  - Sections for Staff, Board, Supporters list entries in responsive grids with item thumbnails, three‑dot menu for edit/delete, and click‑to‑edit (`src/components/people/person-item.tsx`).
  - Route added at `src/app/(dashboard)/people/page.tsx`; breadcrumbs and sidebar link already existed.
  - UI primitive: introduced `Item` layout component used by person list items (`src/components/ui/item.tsx`).
  - Dependency: installed `reactflow` for the org chart canvas.
- Follow-up: Added draggable node positions with persistence and legend; dark-mode reactive controls/minimap.
  - Drag a node to reposition; on release, its x/y is saved into `organizations.profile.org_people[*].pos` via `/api/people/position`.
  - Canvas shows a legend panel and a category color strip on each node; nodes styled horizontally to match list items.

## 2025-10-12

- Planning: Next admin/content improvements will land in the following sequence:
  1. Rename the wizard “Additional links” block to “Additional resources”, switch it to link-only entries (no upload button), and auto-detect provider icons when possible.
  2. Expand the homework builder with richer field types (textarea vs. input, subtitles, selects, sliders, custom tool builder, etc.).
  3. Enforce character limits on class/module titles and subtitles in both creation and edit flows.
  4. Fix spacing for the resources dropdown icon in the module creator so the caret isn’t flush against the edge.
  5. Ensure new classes/modules fully wire into navigation and persisted lists (API + sidebar) end-to-end.
  6. Update learner-facing gating so admin-created content is unlocked (no “not started/locked” states for admins reviewing).
  7. Provide reordering controls for classes/modules that drive display order (including nav ordering).
- Progress: Step 1 complete. “Additional Resources” are link-only with provider icons in both the lesson overview and per-module editors; payloads, wizard GET route, and server actions updated accordingly. Org “People” tab now mirrors the `/people` layout, and structured address editing/rendering is in place.
- Pending next (Step 2): Finish the richer homework form builder UI—new field types render in the wizard, but downstream learner views still need to consume the expanded schema. Steps 3–7 remain untouched.
- Context note: Session paused at ~10% context remaining. Resume with Step 2 (homework builder UI + learner rendering) and verify schema propagation before moving to remaining tasks.

## 2025-10-16

- Step 2 complete: learner module page now renders dynamic assignment forms driven by `module_assignments.schema`, covering short/long text, select, multi-select, slider, subtitle, and custom program blocks with legacy homework fallback.
- Data layer now hydrates module content/resources + assignment schema via `getClassModulesForUser`; adds provider inference, legacy homework normalization, and keeps RLS-friendly fallbacks for missing tables.
- Learner UI refresh: module detail shows embedded video (YouTube/Vimeo/Loom support), resource list with provider icons, and the new assignment form. Components/types updated to pass resources + assignment data through the RSC boundary.
- Step 3 complete: added shared limits (`src/lib/lessons/limits.ts`), clamped lesson/module titles and subtitles in the wizard with inline counters, and mirrored those caps through admin edit actions + forms (class + module detail pages, wizard server actions). Front-end inputs now use `maxLength`; server actions clamp payloads before persistence.
- Remaining backlog for this track: adjust resource dropdown spacing, ensure admin content unlocks as expected, and add ordering controls.
- Step 4 complete: learner assignment submissions persist via `/api/modules/[id]/assignment-submission` (upserts `assignment_submissions`, honors `complete_on_submit`, reuses shared schema parsing) and mark progress with `markModuleCompleted`. Module detail now preloads prior answers/status, handles resubmits, surfaces review states, and nudges learners to the next module once saved.

## 2025-10-17 — Lessons Refactor Plan (checklist)

- [x] Extract shared lesson types/constants/providers/fields/schemas; move wizard state to a reducer + zod; add unit tests.
- [x] Refactor wizard API route and modules library to use shared helpers; add simple markdown/id/options utils.
- [ ] Deduplicate in admin actions: replace local field type/number utils with shared; keep behavior identical.
- [x] Validate wizard payloads server-side using shared zod schema before DB writes.
- [x] Extract assignment/resource builders to `src/lib/lessons/builders.ts` and use in actions.
- [x] Promote provider icon map to `src/components/shared/provider-icons.ts`; reuse in training UI.
- [x] Decompose content builder into subcomponents under `src/components/admin/module-builder/**`.
- [x] Add unit tests for providers/fields/builders. (Added a skipped placeholder for route GET payload tests.)
- [x] Investigate acceptance test redirect mismatch in `admin-crud.test.ts` and align code/tests.

## 2025-10-19

- Init: Reviewed `AGENTS.md` and `docs/RUNLOG.md`; confirmed RUNLOG will track our ongoing changes. Ready for next task.
- My Organization → Brand page: Renamed the "Branding" tab to "Brand" and expanded it into a comprehensive brand hub. Added quick access links (Website, Newsletter, Twitter/X, Facebook, LinkedIn, Instagram, YouTube, TikTok, GitHub) and a Brand Kit section (logo URL, boilerplate text, primary color, and editable color palette). Sections auto-hide when empty in view mode. Implemented a palette editor with color inputs and swatch preview.
- Edit layout: Brand edit UI now uses a shadcn "form-layout-02"-inspired two-column layout with left-hand section titles/descriptions and right-hand card content for fields.
 - Follow-up tweaks: Removed inner Card containers for a lighter form look and inserted horizontal separators between sections. Removed primary color/palette fields entirely (edit + view) — Brand Kit now includes only Logo URL and Boilerplate. Also applied the same two-column form layout to view mode for the Brand tab.
- Data model: Continued to use `organizations.profile` JSON for brand fields (`brandPrimary`, `brandColors`, `boilerplate`, `newsletter`, `instagram`, `youtube`, `tiktok`, `github`). Added migration `20251019170500_org_brand_profile.sql` to document keys via a column comment and broaden `org-media` bucket allowed MIME types to include SVG.
- API: Updated `/api/account/org-media` to accept `image/svg+xml` for logo uploads.
 - Layout parity: Applied the same Brand Overview/Settings layout pattern to About, People, Programs, Reports, and Supporters tabs. Replaced legacy Section blocks with two-column FormRows, added separators, and removed duplicate labels in view mode (e.g., no repeated "Reports").
 - Brand Overview polish: In the Brand tab view, hide the "Brand Assets & Links" row entirely when all links are empty, and hide the "Brand Kit" row when both logo and boilerplate are empty. Individual field labels in view are now suppressed correctly even with JSX whitespace (ProfileField trims whitespace-only children). Added a subtle empty-state message prompting users to add items in Brand Settings when everything is blank.
- Public Brand Page: Added settings to publish a public brand overview at `/{publicSlug}` with a toggle and slug input + availability checker.
  - UI: New "Public Page" row in Brand Settings using a switch and slug input with client-side slugify; includes a "Check availability" button and preview link when enabled.
  - API: `GET /api/public/organizations/slug-available?slug=...` returns `{ available, slug }` (excludes current user's own slug).
  - DB: Migration `20251019183500_organizations_public_page.sql` adds `organizations.public_slug` (unique, case-insensitive), `organizations.is_public` (default false), a slug format check, and a public read policy for published rows.
  - Public route: `src/app/[org]/page.tsx` renders a minimal, shareable overview (logo, name/tagline, links, boilerplate) for external audiences; 404s when not published or missing.
- Share: Added `ShareButton` with Web Share API + clipboard fallback. Rendered on the public page header and next to the "View public page" action in settings.
- Glimpse links: Installed `@kibo-ui/glimpse` via shadcn and now render links using Glimpse hovers.
  - In-app Brand Overview: links render with provider icons + Glimpse hover.
  - Public page: prefetches OG metadata server-side and shows title/desc/image in Glimpse card.
  - Brand Settings: inputs now have leading provider icons for quick recognition.
 - Tabs: Reordered My Organization tabs to About, Programs, Reports, People, Supporters; Brand tab hidden from the tab list (content remains implemented).
 - Brand fields rendering: Brand Overview now conditionally renders each field (Website, Newsletter, Twitter/X, etc.) only when a value exists. This prevents labels from showing without data when only one link is set.
 - Reserved slug and icons: Added inline reserved/format validation in Brand Settings and provider icons on the public page links. Also added provider icons to the in‑app Brand Overview links. Hiding logic now applies across all tabs' overview views — sections only render when they have data (including People/Supporters counts).
 - Data loss prevention: Removed destructive key deletions in org profile server action to avoid dropping legacy fields on save. Future edits will not clear unrelated profile keys.
- Programs: Added `programs` table with RLS (owner manage, public read), a ProgramCard component matching the provided prototype, and a Program creation wizard using Kibo Dialog Stack. Wired Programs tab to list cards and launch the wizard.
- Program wizard UI: Upgraded to shadcn block-style layout with:
  - Cover image picker (upload/drag-drop to new program-media bucket) with live title/subtitle overlay
  - Start/End date pickers (shadcn Calendar in Popover)
  - Address fields (street, city, state, postal, country)
  - Status dropdown (shadcn Select)
  - Removed image URL text field
- DB: Added start_date, end_date, and address_* columns; created `program-media` storage bucket with public read and per-user write policies.
- Placeholders + duration chip: Added helpful placeholders to all wizard inputs and compute a date-range summary chip (X Weeks) for program cards based on start/end dates.
- Dialog flow: Split program creation into 3 steps (Cover & identity → Schedule & Location → Funding & Features) and normalized dialog heights for consistent UX on web/mobile.
- Fixes: Ensured address inputs use safe onChange handlers to avoid pooled event null errors; added consistent min-height across all three dialog steps; added visible Upload button + drag/drop for the cover image.
- Funding step polish: Pinned Back/Create buttons at the bottom via flex layout, switched goals from cents to USD (with `$` leading adornment and conversion to cents on submit), and replaced comma-separated chips with a proper TagInput component.
 - CTA controls: Added “Button text” and “Button URL” fields to the Program wizard; added `cta_label` and `cta_url` to DB + select mappings, and render CTA links on ProgramCard when provided.
- Tags visual: Switched chips to shadcn `Badge` with a smaller size (`rounded-full px-2 py-0.5 text-xs`) in ProgramCard and the wizard TagInput, per prototype.
 - ProgramCard shadow: Reduced drop shadow from `shadow-xl` to a subtle `shadow-sm` for a lighter look.
- Stack visuals: Updated DialogStackContent so non-active steps are fully hidden (opacity 0, absolute positioning), eliminating the “first step extends down behind” artifact.
 - Removed Mapbox Places: Simplified to plain structured address inputs and a free-text location summary; removed the `/api/mapbox/geocode` route and token requirement.
 - Empty states: Added shadcn-styled empty states to Programs (view + edit) and Reports (view). Programs view now shows a dashed card with message when no public programs; edit shows an empty state with a New program action. Reports view shows a dashed card when no text is set.
- Bugfix: Prevented pooled event null errors in ProgramWizard by capturing input values before setState. This resolves "Cannot read properties of null (reading 'value')" on React 18 event pooling.

## 2025-10-20

- Refactor: Broke the oversized `OrgProfileCard` into a dedicated `src/components/organization/org-profile-card/` directory with modular tabs (`company`, `programs`, `reports`, `people`, `supporters`), a reusable header, shared helpers, and validation schema. This keeps the profile experience behavior-identical while making the codebase maintainable.
- Feature: Wired `/[org]` public pages to reuse the new `OrgProfileCard` in read-only mode, fetch published programs, and surface the dot-grid background that mirrors the org chart aesthetic. Added an automatic “View public page” link on the dashboard card when publishing is enabled.
- Refactor: Split the organization profile into an editor (`OrgProfileCard`/`OrgProfileEditor`) and a purpose-built public display component (`OrgProfilePublicCard`), enabling the public page to evolve its layout/background without carrying admin editing logic. Public route now consumes the dedicated component and features the shared header grid plus a top-level share toggle row.

## 2025-10-21

- Plan: Build `/community` as a public-first showcase for participating nonprofits with a global Mapbox view.
  1. Data foundation – add lat/long fields for organizations, wire geocoding on profile updates, and expose a typed fetch helper for published orgs (name, tagline, logo, coordinates).
  2. Map module – create a reusable `CommunityGlobeMap` client component that loads Mapbox with custom styling, renders avatar markers, and handles loading/error states.
  3. Community page layout – scaffold `src/app/(public)/community/page.tsx` with server data loading, suspense boundaries, skeletons, and empty states.
  4. Organization list UI – build shadcn-based list components (with logo chip + subtitle) that reuse shared formatting and remain DRY across dashboard/public contexts.
- Progress: Completed Step 1 by extending the schema (`location_lat/lng`), env plumbing, and profile update geocoding; finished Steps 2–4 with a satellite Mapbox globe, shared marker styling, responsive skeletons, and a Kibo-styled organization list driven by Supabase data.
- Notebook: Added Section 25 to `docs/NEXTJS_RUNBOOK.md` capturing recurring legacy edge-case fixes (Supabase typing, server action wiring, program wizard hydration, component API drift, media/editor adjustments, schema imports). Future refactors will append new cases here and in the run log.
- Notebook: Added Section 25 to `docs/NEXTJS_RUNBOOK.md` capturing recurring legacy edge-case fixes (Supabase typing, server action wiring, program wizard hydration, component API drift, media/editor adjustments, schema imports). Future refactors will append new cases here and in the run log.
- Per runbook Section 12, logged `npm run build` + `npm run check:perf` after the refactor sweep. Budgets: `/dashboard` 342.7 KB, `/admin` 342.7 KB (both under limits). Skeleton loaders now exist for class and module routes (`src/app/(dashboard)/class/[slug]/loading.tsx`, `/module/[index]/loading.tsx`). Migrated remaining `<img>` tags in onboarding, account settings, program cards/wizard, and organization cards to `next/image` with proper sizing/unoptimized flags.
- Runtime audit: Documented runtime choices in `docs/NEXTJS_RUNBOOK.md` + this log. Marketing `/community` stays Edge with server-side Supabase fetch helper; admin/Supabase-auth routes and Stripe/webhook handlers remain Node. Future runtime changes must log justification + file comment for traceability.
- Perf telemetry: Added `src/app/reportWebVitals.ts` to stream metrics to the Vercel vitals endpoint (or console in dev) so we can pair Web Vitals with build budgets. Remember to set `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` in env when wiring RUM.
- Static-first sweep: Converted public org profile route (`src/app/[org]/page.tsx`) to ISR by removing `dynamic = "force-dynamic"` and setting `revalidate = 300`. Landing (`/`, `revalidate 86400`), pricing (`revalidate 3600`), community (`revalidate 120`), and public org pages now share documented intervals in the runbook + this log.
- Revalidation audit: Updated class detail, module create/delete/publish, enrollment mutations (`src/app/(admin)/admin/classes/[id]/actions.ts`), and module detail actions (`src/app/(admin)/admin/modules/[id]/actions.ts`) to use the shared `revalidateClassViews` helper via a new module-aware wrapper so admin dashboards, training pages, and class detail routes stay in sync. Old slugs and module routes flow through `additionalTargets`.
- Streaming coverage: Added `src/app/(admin)/admin/classes/[id]/loading.tsx` with skeleton cards for class metadata, module list, and enrollments so the admin detail page streams instantly while data loads. Checklist section 26 (Streaming UX) noted as partially complete.
- Bundle audit: Ran `npm run build -- --profile` to capture first-load JS. Biggest offenders remain `/class/[slug]/module/[index]` (~246 kB, TipTap + assignment client bundle), `/my-organization` (~246 kB, org profile editor + program wizard), and `/people` (~193 kB, React Flow canvas). Next steps: lazy-load program wizard/editor panes in `OrgProfileCard`, split `ModuleDetail` client-only widgets (assignment form, completion chart) with `dynamic()`, and consider deferring React Flow extras (MiniMap/Background) behind a toggle.
- Lazy-load program wizard: Added `ProgramWizardLazy` dynamic wrapper so `/my-organization` only ships the program creation dialog when needed (`src/components/programs/program-wizard-lazy.tsx`). Org profile editor and programs tab now import the lazy variant, keeping trigger buttons responsive while trimming initial JS.
- Lazy-load module editor & assignment form: Swapped module detail to dynamic-load the admin lesson creation wizard and homework form (`src/components/training/module-detail.tsx`). Initial pass shaved `/my-organization` to ~221 kB (from ~246 kB) and `/class/[slug]/module/[index]` to ~216 kB (from ~246 kB) per `npm run build -- --profile`. Next steps: dynamically load React Flow extras on `/people` and audit shared chunk (57 kB) for further pruning.
- Lazy-load module editor & assignment form: Swapped module detail to dynamic-load the admin lesson creation wizard and homework form (`src/components/training/module-detail.tsx`). Initial pass shaved `/my-organization` to ~221 kB (from ~246 kB) and `/class/[slug]/module/[index]` to ~216 kB (from ~246 kB) per `npm run build -- --profile`.
- People route optimization: Introduced `OrgChartCanvasLite` client wrapper with internal dynamic import and wired `/people` to consume it via Suspense (`src/components/people/org-chart-canvas-lite.tsx`, `src/app/(dashboard)/people/page.tsx`). First-load JS remains ~193 kB but the canvas bundle no longer blocks server render; next iteration will defer React Flow extras (MiniMap/Background) based on user toggles.
- People route optimization: Introduced `OrgChartCanvasLite` client wrapper with internal dynamic import and wired `/people` to consume it via Suspense (`src/components/people/org-chart-canvas-lite.tsx`, `src/app/(dashboard)/people/page.tsx`). First-load JS remains ~193 kB but the canvas bundle no longer blocks server render. Added an explicit “Open organization map” button so the React Flow chunk and extras only download on demand.
- React Flow extras toggle: Added optional toggle in `OrgChartCanvasLite` and made `OrgChartCanvas` accept an `extras` flag so MiniMap/Background only mount on demand. Initial bundle for `/people` stays ~193 kB, but map details are now opt-in without shipping extra UI by default.
- Runtime assignments: Set `/` to Edge runtime and marked `/pricing` + `/community` as Node (`runtime = "nodejs"`) because they rely on Stripe and Supabase service-role clients. Build warnings about Node APIs in Edge runtime no longer appear; noted in checklist section 26 (Runtime assignment).
- Shared chunk audit: Reviewed `.next/static/chunks/33f0899a-653f3c8a333f737c.js` (≈57 kB) and confirmed it’s primarily React DOM internals. No actionable code-splitting needed; focus shifted to route-level lazy loading instead.
- Observability instrumentation: Added `src/instrumentation.ts` to register OpenTelemetry only when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured. We log whether instrumentation is enabled/disabled through the existing structured logger. Requires new dependency `@vercel/otel` (package.json / lockfile updated).
- Bundle analyzer tooling: Added `webpack-bundle-analyzer` dev dependency and wired `ANALYZE=1 npm run build` support in `next.config.ts`. Generated static reports under `.next/analyze-client.html` and `.next/server/analyze-server.html` for future deep dives.
- Lucide tree-shaking: Swapped all `lucide-react` named imports to point at `lucide-react/dist/esm/icons/*` (with wildcard types in `types/lucide-react-icons.d.ts`). Shared chunk size is unchanged (~57 kB React core), but route chunks now exclude unused icons and future icon additions won’t bloat the client bundle.

## 2025-10-22

- Turbopack readiness: Added `turbopack: {}` to `next.config.ts` so Next.js 16 (Turbopack builds) accepts our analyzer/webpack fallback without erroring. Builds now succeed with the default bundler while retaining `ANALYZE` support.
- Edge-safe instrumentation: Reworked `instrumentation.ts` to detect the Node `process` object via `globalThis`, avoiding direct `process.on` references that Turbopack treated as Edge-incompatible. Declared the file as Node runtime and guarded listener registration.
- Performance budget tooling: Updated `scripts/check-performance-budgets.mjs` to support both legacy Webpack (`app-build-manifest.json`) and the new Turbopack client manifests. The script now parses per-route client reference manifests for `/dashboard` and `/admin`, adds shared runtime/polyfill chunks, and reports bundle sizes even under Turbopack.
- Build snapshot: `npm run build` (Turbopack) + `npm run check:perf` now run cleanly; the budget report shows `/dashboard` 1472.9 KB and `/admin` 641.8 KB, exceeding current caps (750 KB / 400 KB). Logged overages for follow-up optimization in the Next.js runbook checklist.
- Icon diet pass: replaced every remaining `@tabler/icons-react` usage with tree-shaken `lucide-react/dist/esm/icons/*` imports and removed the Tabler dependency. Sidebar/nav/table bundles now rely on the existing lucide tree-shake helper.
- Sidebar lazy loads: moved class wizard popover, account settings dialog, onboarding flow, and class navigation section behind dynamic imports to defer the heaviest client bundles (zod, TipTap, framer-motion, wizard reducers) until interaction. `/dashboard` first-load JS dropped from 1472.9 KB → 1187.8 KB; `/admin` unchanged at 641.8 KB pending further work.
- Sidebar animation cleanup: removed `framer-motion` from the classes navigation tree and replaced it with CSS-based toggles to keep the expand/collapse UX while trimming another large dependency from the main sidebar chunk. (Bundle size unchanged yet; next step is simplifying the Radix-heavy sidebar shell.)
- Dashboard shell rewrite: dropped the shadcn `SidebarProvider` stack in favor of a lightweight custom shell (`DashboardShell`, `AppSidebar`, `MobileSidebar`). Navigation now hydrates only once on the client, mobile nav uses a simple overlay, and the onboarding dialog lazy-loads only when needed. `/dashboard` first-load bundle is down to 1163.9 KB (was 1187.8 KB before the shell rewrite); `/admin` remains 641.8 KB pending further pruning.
- Sonner deferral: replaced all direct `sonner` usages with a `@/lib/toast` loader, swapped the `Toaster` to a runtime import, and simplified the user menu to avoid Radix dropdowns. `/dashboard` first-load JS now sits at 738.7 KB (under the 750 KB budget); `/admin` sits at 608.7 KB, still above its 400 KB cap.
- Global perf config: enabled `reactStrictMode`, disabled the `x-powered-by` header, and added a `modularizeImports` transform for `lucide-react` in `next.config.ts` so tree-shaking keeps working even if someone reverts to named imports.

## 2025-11-14 — Caleb / Codex session (layout, theming, seeding)

- DB seeding:
  - Added curriculum-aware module + `module_content` seeds to `supabase/seed.sql` for Strategic Foundations and subsequent sessions, based on `modules-to-add-to-db.csv`.
  - Mapped session numbers to actual class slugs (`strategic-foundations`, `mission-vision-values`, `theory-of-change`, `piloting-programs`) and fixed a bug where only Mission/Vision/Values modules were appearing by updating the slug mapping.
  - Confirmed the one-liner to apply seeds via `psql "$SUPABASE_DB_URL" -f supabase/seed.sql` using the Supabase `psql` connection string.
- Sidebar/admin visibility:
  - Hid the three-dot module actions menu on learner-facing module cards by gating the dropdown behind `isAdmin && showAdminActions` and wiring `ClassOverview` to pass `showAdminActions={false}`.
  - Fixed the sidebar/nav three-dot module actions button so it only renders for admins (`ClassesSection` now checks `isAdmin` before rendering `ModuleDraftActions`).
  - Removed the `Module {index}:` prefix from sidebar module labels so only the module title appears.
- Module card UX:
  - Updated module card titles to support up to two lines using a clamp and normal wrapping, instead of truncating after one line.
  - Adjusted vertical alignment so cards with no subtitle center the title/icon row (`items-center`) while cards with a subtitle remain top-aligned.
  - Reduced card height and tightened spacing between subtitle and progress bar (`min-h` lowered, gaps and footer spacing reduced).
- Theme updates:
  - Replaced the global CSS color tokens in `src/app/globals.css` with a new OKLCH palette for `:root` and `.dark` (background, primary, secondary, accent, sidebar, charts, etc.).
  - Set `--app-surface` to a slightly tinted light background in light mode and to `var(--background)` in dark mode so cards stand out from the shell.
  - Aligned `--font-geist-mono` with `JetBrains Mono` and kept `Inter` as the sans font; wired `--app-surface` into the base `html`/`body` background.
- Sidebar & shell layout (shadcn `dashboard-01` alignment — work in progress):
  - Introduced a demo route at `src/app/dashboard-01-demo/page.tsx` that uses the new `ui/sidebar` primitives (`SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarHeader/Content/Footer`, `SidebarTrigger`) as a local reference for the desired shell behavior (rounded inset shell, collapsible sidebar, independently scrolling content).
  - Refactored `DashboardShell` to wrap the dashboard in `SidebarProvider` + `Sidebar` + `SidebarInset` instead of custom flex layout and a separate `MobileSidebar`.
  - Reused `SidebarBody` (now built from `SidebarHeader`, `SidebarContent`, `SidebarFooter`) so existing nav components (`NavMain`, `ClassesSection`, `NavDocuments`, `NavSecondary`, `NavUser`) fit into the shadcn sidebar structure:
    - Header: brand/logo link.
    - Content: Platform nav, Accelerator class tree, Resources/support (back in the scrollable body).
    - Footer: user/account section only, fixed at the bottom.
  - Wired `DashboardHeader` to use `SidebarTrigger` with a menu icon instead of a custom mobile toggle.
  - Added rounded, bordered shell styling to `SidebarInset` (`md:rounded-3xl`, `md:border`, `md:shadow-sm`) plus an outer `min-h-svh bg-[var(--app-surface)]` wrapper.
- Known gaps / next session pickup:
  - The real dashboard shell still does not visually match the shadcn `dashboard-01` example 1:1:
    - Shell radius is subtle in light mode due to similar `--app-surface` and `--background` colors; may need stronger contrast or explicit outer padding.
    - Sidebar collapse behavior and animations are driven by `SidebarProvider`, but we need to verify state, data attributes, and classnames match the official example.
  - The original `MobileSidebar` overlay remains in the repo but is no longer used by `DashboardShell`; safe to delete once the new shell is stable.
  - Future Codex runs should treat the `dashboard-01-demo` route as the visual contract for shell + sidebar and align `DashboardShell`/`SidebarBody` markup and classes to that.

## 2025-11-14 — Codex session (dashboard shell + sidebar alignment)

- Shell layout:
  - Updated `DashboardShell` to mirror the `dashboard-01-demo` structure: `SidebarProvider` now directly wraps `Sidebar` + `SidebarInset`, dropped the extra `bg-[var(--app-surface)]` wrapper, and moved the header/main layout inside `SidebarInset` with the same `flex min-h-svh flex-col` pattern.
  - Simplified `DashboardHeader` to match the shadcn header: `h-14` app-bar with a plain `SidebarTrigger` on the left, breadcrumbs in the center, and existing actions (theme toggle, Support, Sign in) on the right.
- Sidebar behavior and scrolling:
  - Adjusted the shared sidebar primitives so `SidebarInset` applies a border and shadow automatically in inset mode (`md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-border md:peer-data-[variant=inset]:shadow-sm`), making the app shell read as a rounded card inset from the outer background on desktop.
  - Updated `AppSidebar` to remove the outer `overflow-y-auto` on the `<aside>` container so header and footer remain pinned while only `SidebarContent` scrolls, matching the `dashboard-01` sidebar scroll behavior when that component is used.
  - Tightened `SidebarBody`’s header so the brand text hides in the collapsed icon state (`group-data-[collapsible=icon]:hidden`, logo only when collapsed).
- Nav + collapse fidelity:
  - Tweaked `NavMain`, `NavDocuments`, and `NavSecondary` so their section labels and item text hide when the sidebar is in the icon-collapsed state, while icons stay centered in an 8×8 button footprint. This brings the collapsed desktop experience closer to the shadcn menu pattern without changing any links or data.
  - Migrated the Accelerator classes tree (`ClassesSection`) to use `SidebarGroup` + `SidebarMenu` / `SidebarMenuSub*` primitives so classes and modules participate fully in the sidebar’s expanded vs icon-collapsed behaviors while preserving existing admin actions and open-state logic, and wired class-level “more” actions and the expand/collapse chevron through `SidebarMenuAction` so spacing and hover behavior match the shadcn demo.
  - Updated the user/account footer (`NavUser`) to render inside a `SidebarMenu` with `SidebarMenuButton` so the avatar acts as an icon-only button in collapsed mode and expands to show name/email only when the sidebar is expanded.
- Remaining gaps vs shadcn `dashboard-01`:
  - The Accelerator tree still uses a custom chevron toggle plus module actions instead of shadcn’s own `SidebarMenuAction`; structurally it matches the menu primitives but could be further simplified if we decide to standardize on that pattern.
  - The shell and sidebar are visually very close to the `dashboard-01-demo` route, but we should still do a pixel pass on light/dark/mobile to confirm spacing, paddings, and radii against the upstream example.
- Next steps:
  - Once the real dashboard matches the `dashboard-01-demo` route pixel-close on desktop and mobile, remove the legacy `MobileSidebar` overlay and consider deleting or simplifying the unused `AppSidebar` wrapper to avoid future divergence.
  - If we keep iterating on the nav, consider swapping the custom chevron/actions in `ClassesSection` for `SidebarMenuAction` variants so the entire class tree matches shadcn’s menu interaction model end-to-end.

## 2025-11-17 — Codex session (collapsed sidebar lesson timeline + Accelerator label wrapping + marketplace hydration)

- Sidebar UX: In collapsed `icon` mode, added a compact, animated module “timeline” under the active class in the rail so lessons remain discoverable without expanding the full sidebar. Each lesson renders as an icon-only `SidebarMenuButton` with tooltip, click, and hover behavior consistent with other collapsed nav buttons, plus a vertical connecting line that mirrors the expanded timeline styling. Files: `src/components/app-sidebar/classes-section.tsx`.
- Accelerator nav: Updated the class label span in `ClassesSection` to allow multi-line wrapping (`whitespace-normal`, `overflow-visible`, `text-clip`) and increased the right padding on the class `SidebarMenuButton` so long titles wrap onto a second line instead of being ellipsized or colliding with the chevron toggle. Files: `src/components/app-sidebar/classes-section.tsx`.
- Marketplace hydration: Converted the `/marketplace` experience to load the tabs UI via a client-only dynamic import wrapper (`MarketplaceClientShell`, `ssr: false`) with a lightweight loading message, avoiding Radix Tabs auto-generated ID mismatches between server and client while keeping the page itself as a Server Component. Files: `src/app/(dashboard)/marketplace/page.tsx`, `src/app/(dashboard)/marketplace/marketplace-shell.tsx`.
- Sidebar open state: Centralized persistence in `useSidebarOpenMap` by removing direct `localStorage` writes from `ClassList.toggleNode` and switching all `openMap` setters to use `React.Dispatch<SetStateAction<...>>`, including the mobile sidebar wrapper. This keeps the Accelerator tree’s open/closed state consistent and concurrency-safe while simplifying the class list component. Files: `src/components/app-sidebar/hooks.ts`, `src/components/app-sidebar.tsx`, `src/components/app-sidebar/mobile-sidebar.tsx`, `src/components/app-sidebar/classes-section.tsx`.
- Module row alignment: Adjusted module rows under the Accelerator tree so `SidebarMenuSubButton` and its inner `Link` no longer override vertical alignment with `items-start`; instead they rely on the sidebar primitive’s default `items-center` and only customize spacing. This centers the dot icon and text within the hover pill, fixing the “content pinned to the top” effect on hover. Files: `src/components/app-sidebar/classes-section.tsx`.
- Class row spacing: Tweaked Accelerator class rows so the chevron `SidebarMenuAction` sits closer to the right edge (`right-2`) while the class button reserves more internal padding on the right (`pr-12`), increasing the visual gap between label text and chevron without reintroducing overlap or truncation. Files: `src/components/app-sidebar/classes-section.tsx`.
- Class labels + chevron stacking: Updated Accelerator class labels to use `whitespace-normal!`, `overflow-visible!`, and `text-clip!` so long titles wrap to multiple lines inside a taller nav pill instead of being ellipsized, and raised `SidebarMenuAction` onto its own stacking layer (`z-10`) so the chevron remains clickable even when the class’s module list is expanded directly below it. Files: `src/components/app-sidebar/classes-section.tsx`, `src/components/ui/sidebar/menu.tsx`.
- Module labels multi-line: Applied the same multi-line, anti-ellipsis treatment to module labels under each class (`whitespace-normal!`, `overflow-visible!`, `text-clip!` on the label span) so longer module titles wrap cleanly and expand the `SidebarMenuSubButton` height instead of truncating. Files: `src/components/app-sidebar/classes-section.tsx`.
- Module hover padding: Added vertical padding (`py-1`) to the Accelerator module `SidebarMenuSubButton` rows so both single-line and multi-line module titles have consistent top/bottom gaps within the hover/active pill instead of multi-line rows looking cramped against the container edges. Files: `src/components/app-sidebar/classes-section.tsx`.
- Class icons: Swapped generic `GraduationCap` icons on Accelerator class rows for slug-specific Lucide icons so each class has a more meaningful visual identity (e.g., `strategic-foundations` → `Layers`, `mission-vision-values` → `Target`, `theory-of-change` → `GitBranch`, `piloting-programs` → `Rocket`), with a simple `getClassIcon(slug)` helper and a sensible default. Files: `src/components/app-sidebar/classes-section.tsx`.
- Sidebar header + trigger polish:
  - Updated the sidebar brand lockup so “Coach House” is always stacked vertically (`Coach` above `House`) rather than reflowing between single-line and stacked layouts, avoiding jitter during sidebar expand/collapse. Implemented via a two-line flex column next to the logo. File: `src/components/app-sidebar.tsx`.
  - Simplified `DashboardHeader` layout so, in the expanded desktop state, the page title is flush with the shell’s left padding (no reserved gap for a hidden sidebar toggle). When the sidebar is collapsed or on mobile, the header now prepends the `SidebarTrigger`, and on desktop adds a slim vertical divider between the trigger and the title. File: `src/components/dashboard/dashboard-shell.tsx`.
- Demo shell: Wired `src/app/dashboard-01-demo/page.tsx` to use the `sidebar-07` block shell exactly as generated by the shadcn CLI (AppSidebar + SidebarProvider/SidebarInset/Breadcrumb header), and removed the extra `/dashboard` route the CLI added so it doesn’t conflict with the existing `(dashboard)/dashboard` page. This keeps `/dashboard-01-demo` as a pure playground mirror of the shadcn block without affecting the real app routes. Files: `src/app/dashboard-01-demo/page.tsx`, `src/app/dashboard/page.tsx` (deleted).

## 2025-11-18 — Codex session (react-grab dev tool)

- Dev tooling: Added a dev-only `react-grab` script tag in the root layout so it loads from unpkg in development while leaving production untouched (`src/app/layout.tsx`).

## 2025-11-18 — Ad-hoc (news AI hero copy)

- News page: Simplified the AI news detail intro by removing the small blurb paragraph and replacing the top placeholder square with a full-width `NewsGradientThumb` hero using the same featured gradient as the listing page (`src/app/(public)/news/how-we-think-about-AI/page.tsx`, `src/components/news/gradient-thumb.tsx`).
- News page: Updated the metadata label above the AI article title from \"Essay\" to \"Tools\" to better reflect the content type (`src/app/(public)/news/how-we-think-about-AI/page.tsx`).

## 2025-11-18 — Ad-hoc (module navigation unlock)

- Modules: Temporarily disabled the route-level redirect that sent learners from locked modules back to the first available module so any `/class/{slug}/module/{index}` can be opened directly or via the “Next” link during development (`src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`).

## 2025-11-18 — Ad-hoc (legacy homework label mapping)

- Homework: Updated `parseLegacyHomework` so that when legacy homework items use a generic label like “Homework”/“Homework 1” but have non-empty `instructions`, the instructions become the visible field label and the helper text is cleared. This makes the actual question text appear above the textarea instead of in tiny muted helper copy (`src/lib/modules/assignment.ts`).

## 2025-11-18 — Ad-hoc (Homework form layout)

- Homework UI: Redesigned the student Homework card to group fields into “steps” using `subtitle` fields as section headers, add separators between sections, and render each prompt as a clean single-column layout (label + helper copy stacked above the control) instead of the earlier two-column grid. Long-form answers now use a TipTap-powered compact editor (bold/italic/underline, lists, quote, links, undo/redo, clear) while admin editors keep additional layout tools (`src/components/training/module-detail/assignment-form.tsx`, `src/components/rich-text-editor.tsx`).

## 2025-11-18 — Ad-hoc (Strategic Foundations · Start with your why)

- Curriculum: Mapped Session 1, Module 2.1 (“Start with your why”) into a structured assignment schema seeded via `module_assignments` so the Homework section shows an Origin Story worksheet instead of a single textarea. The schema includes step headers plus a mix of short/long text and a clarity slider: where you’re from, experiences that shaped the work, your personal why, a 1–2 page origin story draft, and a 1–5 self-rating of story clarity (`supabase/seed.sql`, `src/lib/modules/assignment.ts`, `src/components/training/module-detail/assignment-form.tsx`).
- Org sync: Added an `org_key` of `boilerplate` to the Origin Story draft field and taught the assignment submission route to upsert any `org_key`-mapped answers into `organizations.profile` for the current user. Completing the Origin Story module now populates the org “Boilerplate” field on the My Organization page (`supabase/seed.sql`, `src/app/api/modules/[id]/assignment-submission/route.ts`, `src/app/(dashboard)/my-organization/page.tsx`, `src/components/organization/org-profile-card/**` consume it automatically).

## 2025-11-18 — Ad-hoc (Piloting Programs · Designing your Pilot)

- Curriculum: Converted the “Pilot Design Questions” Markdown into a structured homework schema for the Piloting Programs module “Designing your Pilot”, seeded via `module_assignments`. The worksheet walks learners through Purpose & Outcomes, People, Activities & Design, Resources & Supplies, and Timing & Scale using subtitles plus a mix of short/long text prompts that mirror the original questions, and ends with a Pilot Program Summary field. That summary is mapped via `org_key: "programs"` so it flows into the My Organization “Programs” field (`supabase/seed.sql`, `src/app/api/modules/[id]/assignment-submission/route.ts`).

## 2025-11-18 — Ad-hoc (Org profile ↔ homework field mapping)

- Strategic Foundations Need: Added assignment schemas for “What is the Need?” and “AI The Need” that expose a single long-text `need` field with `org_key: "need"`, so the refined need statement updates `organizations.profile.need` on submission (`supabase/seed.sql`).
- Mission / Vision / Values: Seeded `module_assignments` for the Mission, Vision, and Values modules in the Mission/Vision/Values class, each with a single long-text field (`mission`, `vision`, `values`) mapped via `org_key` into the corresponding org profile keys. Homework answers now populate those sections on the My Organization page (`supabase/seed.sql`, `src/app/api/modules/[id]/assignment-submission/route.ts`, `src/app/(dashboard)/my-organization/**`).
- Branding elective: Updated the Brand Messaging Blueprint assignment schema so the “Organization name” field uses `name` + `org_key: "name"` and added a “One-paragraph boilerplate” textarea mapped via `org_key: "boilerplate"`, giving another path to refine org name and boilerplate text from homework (`scripts/seed-branding-module.mjs`, `src/app/api/modules/[id]/assignment-submission/route.ts`).

## 2025-11-18 — Ad-hoc (Strategic Foundations · Module 2 copy)

- Copy: Renamed Strategic Foundations module 2 from “Start with your why” to “Define your why”, updated the short description to emphasize connecting origin story to the organization, and replaced the Lesson Notes Markdown with a structured Origin Story prompt (intro plus guiding questions and closing paragraph) (`supabase/seed.sql`). This updates both the module page title/nav label and the Lesson Notes content on `/class/strategic-foundations/module/2`.

## 2025-11-18 — Design run (Strategic roadmap & homework UX)

- Notes: Captured a high-level design and implementation plan for improving homework UX (TipTap assist tool), adding a Strategic Roadmap page + public view + shareable sections, onboarding questionnaire, and aligning curriculum copy and homework fields with the accelerator pedagogy. See `docs/RUNLOG-strategic-roadmap.md` for the detailed breakdown and attack plan.

## 2025-11-18 — Ad-hoc (News nav alignment)

- News page: Updated the `/news` left-rail navigation to mirror the landing page header nav — replacing the OpenAI-style items with `Benefits`, `How it works`, `Pricing`, and `News`, and wiring them to `/#benefits`, `/#how`, `/pricing`, and `/news` respectively. The active “News” item now renders with the existing highlighted style (`src/app/(public)/news/page.tsx`).

## 2025-11-18 — Ad-hoc (Dashboard vs My Organization cards)

- Dashboard: Added the Academy progress cards (Organization Completeness, Your Next Class, and per-class module progress) to the main dashboard inside a “Progress at a glance” card so learners see their next module + class completion from `/dashboard` (`src/components/organization/org-progress-cards.tsx`, `src/app/(dashboard)/dashboard/page.tsx`).
- My Organization: Kept the same progress cards at the top of `/my-organization` so learners can still see training progress in the context of editing their org profile (`src/app/(dashboard)/my-organization/page.tsx`).

## 2025-11-19 — Codex session (Strategic Roadmap scaffolding)

- Goal: Stand up the Strategic Roadmap authoring surface outlined in `docs/RUNLOG-strategic-roadmap.md`.
- Plan: add `organizations.is_public_roadmap` + roadmap helpers, build server actions to update sections + toggle visibility, render `/strategic-roadmap` with hero + section editors (TipTap) and nav entry for learners. Public view + shareables to follow once private editor + data plumbing ship.
- Progress: created roadmap helpers + actions, shipped `/strategic-roadmap` editor w/ section-level publish + sharing, added `is_public_roadmap` and toggle UI, and launched public route `/org/{slug}/roadmap` that filters sanitized, published sections.
- Share UX: section drawer now lets learners plan shareable cards (layout presets, CTA placeholder, copy link) while gating copying on published sections; stubs for download/caption automation documented inline. Layout + CTA selections persist in `organizations.profile.roadmap.sections[*]` and drive the public `/org/{slug}/roadmap` CTA button.
- Share cards: Added client-side PNG export in the share drawer (gradient canvas + CTA) with basic analytics logging via toasts; download button enforces published sections.
- Roadmap analytics: Logged page/section events via `/api/public/roadmap-event`, instrumented the public page (views + CTA clicks), and surfaced both KPI + interactive bar chart widgets on `/dashboard` (totals, top sections, sources, conversion rate, time-on-page buckets, 14-day trend, 4-week comparison).
- TODO: Expand analytics to full funnel reporting (time on page, traffic source breakdown, daily/weekly/monthly comparisons, conversion tracking) and expose detailed charts + exports on the dashboard.
- Homework assist stub: Added `/api/homework/assist` with placeholder `generateHomeworkSuggestion`, surfaced a TipTap “Assist” button for long text/custom program fields, and wired AssignmentForm to send module/class/org context so drafts can prefill. Currently returns deterministic helper copy until AI endpoint is ready.
- Onboarding baseline: Added `onboarding_responses` table + RLS, wired `completeOnboardingAction` to store the new confidence sliders + notes, and expanded the onboarding dialog with a “Confidence snapshot” step (1–10 sliders, optional notes, follow-up checkbox) so we can compare pre/post accelerator confidence in future reports.
- Module UX cleanup: Module pages now rely solely on seeded copy for Strategic Foundations (no hard-coded overrides), Lesson Notes default to seed-provided markdown only (no auto-cloned module descriptions), and slide decks render via an embedded viewer with fallback download (powered by `/api/modules/[id]/deck`).
- Curriculum alignment: updated Strategic Foundations (class description, module subtitles, need-statement assignments), Mission/Vision/Values (new subtitles + homework notes), and Theory of Change/System Thinking (class copy, IF–THEN–SO worksheet) directly in `supabase/seed.sql` so UI reflects the new pedagogy automatically.
- Next: capture onboarding confidence questionnaire responses (sliders + context) in a dedicated table, expose server actions, and build a multi-step experience that fits within the existing onboarding guard so we can compare pre/post-cohort data.

## 2025-11-28 — Ad-hoc (Roadmap analytics defaults)

- Fixed a console crash when roadmap analytics had no events by always returning an empty `weeklyComparisons` array from the summary fetcher, keeping the dashboard card render-safe for new orgs (`src/lib/roadmap/analytics.ts`).
- UI spacing: Removed the default top/bottom padding baked into the shared `Card` component and tightened the header/content/footer padding so cards no longer show phantom gaps while preserving consistent breathing room (`src/components/ui/card.tsx`).
- Roadmap page: Removed the instructional copy card on `/strategic-roadmap` to keep the authoring surface minimal and focused on the sections themselves (`src/app/(dashboard)/strategic-roadmap/page.tsx`).
- People: Made the organization map launcher a compact dashboard-style prompt with icon and small “Open map” button instead of a full-bleed placeholder, keeping the people page tighter (`src/components/people/org-chart-canvas-lite.tsx`).
- People: Removed the extra Card wrapper around the organization map section so the prompt and canvas sit directly in the page flow without nested padding (`src/app/(dashboard)/people/page.tsx`).
- People: Prevented the map icon container from shrinking by locking its dimensions (`shrink-0`) so it keeps its intended square size (`src/components/people/org-chart-canvas-lite.tsx`).
- People: Swapped the org map label/icon to an org chart treatment with a network icon and updated CTA text (“Open chart”) for better clarity (`src/components/people/org-chart-canvas-lite.tsx`).
- My Organization: Replaced the mobile tab switcher dropdown with a native select to eliminate hydration ID mismatches from the Radix dropdown menu while keeping mobile navigation intact (`src/components/organization/org-profile-card/org-profile-card.tsx`).
- Marketplace: Replaced `next/image` logos with vanilla `<img>` tags so external vendor logos (e.g., Clearbit) never block the page due to unconfigured domains, while keeping the text fallback visible (`src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).
- Homework: Swapped multi-prompt assignments to a tabbed layout (per section or per prompt) to keep modules with many inputs manageable while preserving the existing field types and assist tooling (`src/components/training/module-detail/assignment-form.tsx`).
- Homework: Pulled the “Your personal why” prompt into its own tab/section so the origin story flow has a dedicated step for that field without mixing it with the other origin prompts (`src/components/training/module-detail/assignment-form.tsx`).
- Homework tabs: Forced tabbed layout whenever there’s more than one prompt, so all multi-field assignments render in tabs (including “Start with your why”) instead of a long scroll column. Swapped the tab UI to the tabs-29 animated underline style for a lighter look across modules (uses a moving underline vs. dashed card tabs) (`src/components/training/module-detail/assignment-form.tsx`, `src/components/training/module-detail.tsx`).
- Homework tabs: Removed the dark tab bar fill so the animated underline sits on a transparent background and the bottom border remains visible (`src/components/training/module-detail/assignment-form.tsx`).
- Homework tabs: Added numbered badges to the tab labels and updated the CTA copy to “Next, then Submit” to better cue the progression; removed the send icon (`src/components/training/module-detail/assignment-form.tsx`).
- Homework layout: Swapped to a vertical tabs panel in a two-column layout (skinny left rail, right content) and removed the Homework heading/step labels for a cleaner experience (`src/components/training/module-detail/assignment-form.tsx`).
- Homework layout: Ensured the vertical tabs rail stays in its own column (top-left) beside the form content, preventing stacked/row collapse on render (`src/components/training/module-detail/assignment-form.tsx`).
- Homework layout: Fixed the custom grid template syntax so the rail/content actually render side-by-side from md+ (`src/components/training/module-detail/assignment-form.tsx`).
- Homework layout: Rethemed the rail to “Progress,” tightened the rail width, added hover outline, and spaced the progress counts with colored state + check icon; meta row now hides when empty and lesson notes card lost extra padding (`src/components/training/module-detail/assignment-form.tsx`, `src/components/training/module-detail.tsx`).
- Homework rail/content: Removed the right-pane card, tightened spacing, and bumped tab label size to improve readability while keeping the two-column layout intact (`src/components/training/module-detail/assignment-form.tsx`).
- Homework inputs: Increased question label sizing to improve readability above each field (`src/components/training/module-detail/assignment-form.tsx`).
- Homework progress rail: restored vertical tab spacing, added padding to the rail list, and aligned counts so long titles wrap instead of colliding with counts (`src/components/training/module-detail/assignment-form.tsx`).
- Module video: Moved the video into the card body with a bordered header, added a status pill, and kept the player full-bleed inside the card; Next/Save buttons now icon-only and aligned to the assignment footer (`src/components/training/module-detail.tsx`, `src/components/training/module-detail/assignment-form.tsx`).
- Homework layout: Forced the rail/content split from medium screens up with self-start cards so the nav stays left/top aligned with the form pane instead of stacking (`src/components/training/module-detail/assignment-form.tsx`).
