# RUNLOG — Ad‑hoc Work History

Purpose: Track changes we’re making outside the formal PR stepper.

## 2025-12-15

- Dashboard: Moved the calendar up beside the Command Center hero, removed the “Calendar / This month.” header wrapper, and resized the calendar to a mid-compact footprint (`src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/dashboard-calendar-card.tsx`, `src/app/(dashboard)/dashboard/loading.tsx`).
- Dashboard: Removed the extra calendar card wrapper so the calendar itself is the card, moved the Accelerator CTA into the “Next up” block (with total module count in the progress copy), and removed the redundant “Next actions” section (`src/components/dashboard/dashboard-calendar-card.tsx`, `src/components/dashboard/accelerator-progress-radial-card.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/loading.tsx`).
- Dashboard: Added a tiny “Updates” notifications card under the calendar (renders up to 2 items + empty state) and standardized gutters across the page (consistent `gap-4` + outer edge alignment) (`src/components/dashboard/dashboard-notifications-card.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/loading.tsx`).
- Dashboard: Removed the redundant “Command Center” eyebrow label from the hero card (`src/app/(dashboard)/dashboard/page.tsx`).
- Dashboard: Tightened the hero card footer padding so the “All clear” line + Roadmap button don’t leave dead space (`src/app/(dashboard)/dashboard/page.tsx`).
- Dashboard: Fixed Accelerator totals to count visible modules (not just enrollments) and split Marketplace into a two-card row with an Insights placeholder to avoid ultra-wide cards on large screens (`src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/loading.tsx`).
- Marketing: Refreshed the landing page copy to focus on outcomes (roadmap/org profile/programs) and removed “LMS/cohort/workspace/My Organization” phrasing (`src/app/(public)/page.tsx`).

## 2025-12-14

- Sidebar (Accelerator): Tightened module list spacing by making the stepper connector rails absolutely positioned (no layout height contribution) and ensuring they render behind the badges; removed extra vertical padding that was making the module list feel overly gappy (`src/components/app-sidebar/module-stepper.tsx`). Verified with `npm run lint -- src/components/app-sidebar/module-stepper.tsx`.
- Sidebar (Accelerator): Ensured the collapsed-icon module rail renders behind badges (explicit z-index) and badges have a sidebar-colored background so the rail reads as a subtle roadmap line, not an overlaid divider (`src/components/app-sidebar/classes-section.tsx`). Verified with `npm run lint -- src/components/app-sidebar/classes-section.tsx`.
- Sidebar (Accelerator): Reduced extra gap between class rows by removing item-level spacing and zeroing submenu padding when collapsed; slightly increased module row padding for breathing room (`src/components/app-sidebar/classes-section.tsx`, `src/components/app-sidebar/module-stepper.tsx`).
- Sidebar (Accelerator): Removed the extra nested `<ul>` wrapper inside `ModuleStepper` so module items render as proper `<li>` children of `SidebarMenuSub` (fewer containers + cleaner DOM) (`src/components/app-sidebar/module-stepper.tsx`).
- Dashboard: Rebuilt `/dashboard` into a minimal “Command Center” with a Mapbox-powered, location-aware hero, “Signals” notification list, marketplace picks, and calendar; fallback dot-grid background when `NEXT_PUBLIC_MAPBOX_TOKEN` is missing (`src/app/(dashboard)/dashboard/page.tsx`, `next.config.ts`).
- Dashboard: Added a route-level skeleton that matches the new layout for faster streaming and less jarring loads (`src/app/(dashboard)/dashboard/loading.tsx`).
- Dashboard: Tightened `/dashboard` by moving quick actions into top-level cards, adding radial chart cards for roadmap publishing progress + people composition, shrinking the calendar, and renaming “Signals” → “Next actions” (with fewer items) (`src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/loading.tsx`, `src/components/dashboard/dashboard-calendar-card.tsx`, `src/components/dashboard/roadmap-progress-radial-card.tsx`, `src/components/dashboard/people-composition-radial-card.tsx`).
- Dashboard: Made the calendar genuinely compact (w-fit + smaller cells), replaced the roadmap radial with an Accelerator progress radial (CTA + next-up copy), added an in-card “Create” person dialog trigger, and swapped the “Profile” metric for a roadmap publishing metric (`src/app/(dashboard)/dashboard/page.tsx`, `src/components/dashboard/dashboard-calendar-card.tsx`, `src/components/dashboard/accelerator-progress-radial-card.tsx`, `src/components/dashboard/people-composition-radial-card.tsx`).
- Tests: Acceptance + snapshots now pass after making `getServerSession()` fall back to `auth.getSession()` when `getUser()` isn’t available (test mocks) (`src/lib/auth.ts`).
- Build fixes: Removed a missing export that was breaking TS (`src/components/ui/sidebar/index.ts`), switched shadcn-studio demo tabs to `framer-motion` (`components/shadcn-studio/tabs/tabs-29.tsx`), and aligned roadmap analytics select fields to the columns used in code (`src/lib/roadmap/analytics.ts`).
- Module homework: Removed a stray unsupported `assist` prop from the TipTap editor callsite and preserved the Assist button UI so TS builds cleanly (`src/components/training/module-detail/assignment-form.tsx`).
- Strategic roadmap: Rebuilt the timeline rail to be a single continuous, behind-the-content gradient line (no per-item rail spans), and upgraded the step nodes to numbered markers aligned to the rail (`src/app/(dashboard)/strategic-roadmap/page.tsx`, `src/components/roadmap/roadmap-section-editor.tsx`).
- Strategic roadmap: Tightened item layout by removing nested shadows, removing the redundant “Step X” pill (step number lives in the node), and fixing a data-loss edge case where saving share settings could overwrite unsaved draft edits (`src/components/roadmap/roadmap-section-editor.tsx`).
- Strategic roadmap: Removed the redundant “Ready to tweak…” footer text and moved the edit trigger to a top-right icon button (`src/components/roadmap/roadmap-section-editor.tsx`).
- Strategic roadmap: Simplified the global visibility control and share drawer UI (compact toggle row, minimal layout picker + preview, reduced copy/sections) to match the new timeline design (`src/components/roadmap/roadmap-visibility-toggle.tsx`, `src/components/roadmap/roadmap-share-drawer.tsx`).
- Strategic roadmap: Removed inline share-link previews and swapped copy buttons for “View” actions that open the public roadmap/section in a new tab (only shown when visibility is Public) (`src/components/roadmap/roadmap-visibility-toggle.tsx`, `src/components/roadmap/roadmap-share-drawer.tsx`).
- Strategic roadmap: Fixed public roadmap URL pathing to use `/{publicSlug}/roadmap` (no `/org` prefix) and moved the “View” button to sit to the right of the visibility switch (`src/components/roadmap/roadmap-visibility-toggle.tsx`, `src/components/roadmap/roadmap-section-editor.tsx`, `src/app/[org]/roadmap/page.tsx`).
- Strategic roadmap: Public roadmap view now renders all sections inside a single, blog-like card and removes the redundant per-section “Section” label (`src/app/[org]/roadmap/page.tsx`).
- Strategic roadmap: Public roadmap view now matches the public org page chrome (dot-grid body background, top action row) and adds the same left-rail stepper (gradient rail + numbered nodes) used in the private timeline (`src/app/[org]/roadmap/page.tsx`).

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

## 2025-12-03 — Codex session (Module detail refactor)

- Refactored the training module detail view into separated concerns: extracted the deck viewer into its own client component, pulled wizard + assignment submission state into reusable hooks, and slimmed the main component while preserving existing UI/behavior (`src/components/training/module-detail.tsx`, `src/components/training/module-detail/deck-viewer.tsx`, `src/components/training/module-detail/use-lesson-wizard.ts`, `src/components/training/module-detail/use-assignment-submission.ts`).
- Further decomposed the deck viewer UI into a dedicated presentation component to keep files under 400 LOC and keep the PDF logic isolated; linted the touched files via `npm run lint -- ...` (`src/components/training/module-detail/deck-viewer.tsx`, `src/components/training/module-detail/deck-viewer/view.tsx`).
- Split remaining UI into focused pieces (header, video block, lesson notes) and tightened `module-detail.tsx` to a small orchestrator so concerns stay isolated while behavior/layout remain unchanged (`src/components/training/module-detail/module-header.tsx`, `src/components/training/module-detail/video-section.tsx`, `src/components/training/module-detail/lesson-notes.tsx`, `src/components/training/module-detail.tsx`).
- Note: Attempted to run `pnpm eslint …` but pnpm is not installed in this environment.

## 2025-12-09 — Codex session (RSC CVE audit + Next.js patch)

- Performed RSC/Flight surface audit for CVE-2025-55182: enumerated server actions across dashboard/admin/public flows and confirmed no custom Flight handling or unsafe eval usage.
- Upgraded Next.js to a patched release to address the RSC RCE issue (`next` -> `^16.0.7`, lockfile updated).
- Confirmed React/React DOM remain on 19.2.0; no experimental RSC flags or custom webpack overrides detected.
- Fixed lucide icon imports in the breadcrumb component to use typed entrypoints and restored snapshot baseline after the Next upgrade (`src/components/ui/breadcrumb.tsx`, `dist-snapshots`).
- Ran `npm test` (snapshots + RLS placeholder); RLS suite skipped due to missing Supabase env vars.
- Migrated the deprecated `middleware` convention to `proxy` by moving auth/redirect logic into `src/proxy.ts` and removing `src/middleware.ts`; reran `npm test` to confirm snapshots unaffected (RLS still skipped without envs).
- Removed the lucide `modularizeImports` transform (Next 16.0.7 now resolves icons directly) to fix the case-sensitive icon resolution failure on `/dashboard`; `npm test` green after the change.
- Redesigned the Strategic Roadmap page to an ultra-minimal timeline: hero removed, timeline list with empty-state messaging, edit via dialog-based editor per section, share/visibility controls preserved, and timeline preview/empty states shown (`src/app/(dashboard)/strategic-roadmap/page.tsx`, `src/components/roadmap/roadmap-section-editor.tsx`); `npm test` still green (RLS skipped without envs).
- Dashboard overhaul: added horizontal roadmap tracker, accelerator tracker hero, calendar with actionable links, workspace shortcuts, and a minimal roadmap timeline preview plus dialog editing flows; introduced dashboard calendar card and roadmap mini tracker components (`src/app/(dashboard)/dashboard/page.tsx`, `src/components/roadmap/roadmap-mini-tracker.tsx`, `src/components/dashboard/dashboard-calendar-card.tsx`); `npm test` remains green (RLS skipped without envs).
- Removed duplicate accelerator progress card to keep the dashboard minimal and prevent overlapping content; layout spacing retained (`src/app/(dashboard)/dashboard/page.tsx`).
- Removed the roadmap analytics summary/share performance card from the dashboard to simplify the layout and avoid duplication (`src/app/(dashboard)/dashboard/page.tsx`).

## 2025-12-22 — Codex session (Roadmap editor + scheduling)

- Theme: made landing/news pages and homework progress rail use theme tokens so dark/light/system are consistent (`src/app/(public)/page.tsx`, `src/app/(public)/news/page.tsx`, `src/components/training/module-detail/assignment-form.tsx`).
- Strategic roadmap: rebuilt data model to support custom sections with title/subtitle, added side-nav single-form editor, and updated public roadmap rendering to show subtitles (`src/lib/roadmap.ts`, `src/components/roadmap/roadmap-editor.tsx`, `src/app/(dashboard)/strategic-roadmap/page.tsx`, `src/app/[org]/roadmap/page.tsx`).
- Roadmap export: added docx download endpoint + button (`src/app/api/roadmap/docx/route.ts`, `src/app/(dashboard)/strategic-roadmap/page.tsx`, `package.json`, `package-lock.json`).
- Public sharing gate: added feature flag to disable public pages/visibility toggles and force public state off in org/roadmap/program updates (`src/lib/feature-flags.ts`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/public-page-settings.tsx`, `src/components/roadmap/roadmap-visibility-toggle.tsx`, `src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/roadmap-share-drawer.tsx`, `src/app/[org]/page.tsx`, `src/app/[org]/roadmap/page.tsx`, `src/app/(dashboard)/my-organization/actions.ts`, `src/app/(dashboard)/my-organization/programs/actions.ts`, `src/app/(dashboard)/dashboard/page.tsx`).
- Scheduling: added a dashboard check-in card with toast prompt and a scheduling API enforcing free-tier meeting caps (`src/components/dashboard/dashboard-checkin-card.tsx`, `src/app/api/meetings/schedule/route.ts`, `src/lib/meetings.ts`, `src/app/(dashboard)/dashboard/page.tsx`).
- Header: added a notifications bell in the dashboard shell with a popover list UI (`src/components/notifications/notifications-menu.tsx`, `src/components/dashboard/dashboard-shell.tsx`).
- What worked: npm dependency install for docx succeeded.
- What didn’t: tests not run; meeting schedule URLs and AI Assist flow still need confirmation.
- Next: confirm Google Calendar links + free-tier definition, decide AI Assist ChatGPT handoff approach, and set `NEXT_PUBLIC_PUBLIC_SHARING_ENABLED` for launch gating.

## 2025-12-22 — Codex session (Mapbox token wiring)

- Mapbox: added a server-only token helper with MAPBOX_TOKEN fallback, passed the token into the community map, and reused it for dashboard/static maps + geocoding (`src/lib/mapbox/token.ts`, `src/app/community/page.tsx`, `src/components/community/community-map.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/lib/mapbox/geocode.ts`).
- What didn’t: tests not run.

## 2025-12-22 — Codex session (Pricing refresh)

- Pricing: rewrote the pricing page copy for OpenNFP, added Free/Paid/Enterprise feature lists with dedicated CTAs, and introduced Public/Marketplace highlights (`src/app/(public)/pricing/page.tsx`, `src/lib/pricing.ts`).
- What didn’t: tests not run.

## 2025-12-22 — Codex session (Pricing layout polish)

- Pricing: tightened the plan cards (footer-anchored CTAs), removed redundant “Free” labeling, set Paid to $99/month, and removed sales CTA from the Paid tier while keeping Enterprise contact (`src/app/(public)/pricing/page.tsx`, `src/lib/pricing.ts`).
- What didn’t: tests not run.

## 2025-12-22 — Codex session (Public header reuse)

- Public nav: extracted the landing header into a reusable component and added it to the pricing page (`src/components/public/public-header.tsx`, `src/app/(public)/page.tsx`, `src/app/(public)/pricing/page.tsx`).
- What didn’t: tests not run.

## 2025-12-22 — Codex session (Pricing tier hierarchy)

- Pricing: updated Free copy to “Brand kit” and clarified tier inheritance (Paid includes Free, Enterprise includes Paid) (`src/app/(public)/pricing/page.tsx`, `src/lib/pricing.ts`).
- What didn’t: tests not run.

## 2025-12-22 — Codex session (Enable public sharing locally)

- Config: enabled public sharing for local prototyping via `NEXT_PUBLIC_PUBLIC_SHARING_ENABLED=true` in `.env.local`.
- What didn’t: tests not run.

## 2025-12-22 — Codex session (Accelerator videos sync)

- Content: created new session classes/modules (S5–S9, E1–E3) from the `accelerator-videos` bucket and attached video URLs across all modules; cleaned duplicate E2/E3 files and reindexed modules to keep sequential navigation.
- What didn’t: tests not run; class titles/descriptions may need refinement after review.

## 2025-12-22 — Codex session (Session S7 module 4)

- Content: added Session S7 module 4 “Donor Journey” from the updated `accelerator-videos` bucket and reindexed Session S7 modules to keep the sequence ordered.

## 2025-12-22 — Codex session (Sidebar class labels)

- UI: shortened sidebar class labels by stripping the “Session X —” prefix for accelerator sessions (`src/components/app-sidebar/classes-section.tsx`).

## 2025-12-22 — Codex session (Inline module video playback)

- Module video: removed the placeholder YouTube fallback and added inline HTML5 playback for direct MP4/MOV/WebM links (`src/components/training/module-detail.tsx`, `src/components/training/module-detail/video-section.tsx`, `src/components/training/module-detail/utils.ts`).

## 2025-12-22 — Codex session (Curriculum CSV sync)

- Content: synced sessions/modules from the S1–S9 CSV (titles + descriptions), attached accelerator video URLs by session/module number, and unpublished non‑CSV E‑sessions to avoid duplication. Modules without matching videos now show no player.

## 2025-12-22 — Codex session (Hide E sessions from sidebar)

- Sidebar: filtered out E-session classes from the sidebar tree so “Session E1/E2/E3” no longer render in nav (`src/lib/academy.ts`).

## 2025-12-22 — Codex session (Curriculum sync + electives consolidation)

- Content: re-synced S1–S9 modules from `docs/lessons-modules-list.csv` (titles/descriptions + indices), refreshed video URLs, consolidated E1–E3 videos into a single Electives class, and added missing electives (“Retention and Security”, “Filing 1023”).
- What didn’t: tests not run.

## 2025-12-28 — Codex session (Slide deck sync)

- Content: attached accelerator slide decks from the `accelerator-slide-decks` bucket to S1–S9 modules (deck_path updates) and flagged the unmatched “S08 M2 Asynch Audiences” deck for follow-up.
- UI: deck viewer now loads module-specific decks via signed URLs and removes the static placeholder PDF (`src/components/training/module-detail/deck-viewer.tsx`, `src/components/training/module-detail.tsx`, `src/lib/storage/decks.ts`).
- What didn’t: tests not run.

## 2025-12-28 — Codex session (Sidebar module list height)

- UI: increased the open sub-list max height in the sidebar so longer lesson module lists no longer clip (`src/components/app-sidebar/classes-section.tsx`).

## 2025-12-28 — Codex session (S9 deck update)

- Content: attached the Session 9 module 6 deck (`S09 _ M6 Asynch - Agendas, Minutes, Resolutions.pdf`) to the “Agendas, Minutes, Resolutions” module.

## 2025-12-28 — Codex session (Lesson icons + S7 deck)

- UI: mapped lesson sidebar icons to unique, relevant glyphs for each session (`src/components/app-sidebar/classes-section.tsx`).
- Content: attached the Session 7 module 8 deck (`S07 M8 Asynch Corporate Giving.pdf`) to the “Corporate Giving” module.

## 2025-12-28 — Codex session (Elective duplicates cleanup)

- Content: removed the unpublished Session E1/E2/E3 classes after consolidating their modules into the single Electives lesson.

## 2025-12-28 — Codex session (Theory of Change homework tabs)

- UI: added an inline If/Then/So tab layout for assignment editors and repositioned Assist to sit beside the tabs (`src/components/training/module-detail/assignment-form.tsx`).
- Content: created structured module assignments for Theory of Change module 1 to remove the “Assignment not found” error and replace legacy homework.

## 2025-12-28 — Codex session (Selectable homework labels)

- UI: made homework prompt labels selectable so learners can copy question text above editors (`src/components/training/module-detail/assignment-form.tsx`).

## 2025-12-28 — Codex session (If/Then/So tabs styling)

- UI: restored the progress card for If/Then/So homework and updated the inline tabs to use the module-stepper style badges with an underline rail (`src/components/training/module-detail/assignment-form.tsx`).

## 2025-12-28 — Codex session (S7 video updates)

- Content: attached Session 7 module 2 and 3 videos (`S 07 M2 Segmentation.mp4`, `S 07 M3 Treasure Mapping.mp4`) to their modules.

## 2025-12-28 — Codex session (S7 M7 video fix)

- Content: attached the Session 7 module 7 video (`S 07 M7 Tools & Systems.mov`) to the “Tools & Systems” module.

## 2025-12-28 — Codex session (S9 video updates)

- Content: attached Session 9 module 4 and 6 videos (`S09 M4 Board Policy 4.mov`, `S09 M6 Agendas, Mins, Resolutions.mov`) to their modules.

## 2025-12-28 — Codex session (Electives naming)

- Content: renamed electives modules to “Naming your NFP”, “NFP Registration”, and “Due Diligence”.

## 2025-12-28 — Codex session (Tiptap rounded corners)

- UI: clipped tiptap toolbar/footer backgrounds to the editor container radius to avoid sharp corners (`src/components/rich-text-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap editor wrapper removal)

- UI: removed the extra bordered wrapper around the roadmap tiptap editor so the editor’s own container defines the card (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Strategic roadmap layout cleanup)

- UI: simplified strategic roadmap header copy and layout, aligning actions to the right and reducing vertical chrome (`src/app/(dashboard)/strategic-roadmap/page.tsx`).
- UI: removed redundant sharing helper text in the editor footer to keep actions tighter (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap header tweak)

- UI: moved roadmap actions under the header copy and removed the link icon from the visibility toggle (`src/app/(dashboard)/strategic-roadmap/page.tsx`, `src/components/roadmap/roadmap-visibility-toggle.tsx`).

## 2025-12-28 — Codex session (Roadmap share drawer cleanup)

- UI: simplified share settings drawer layout, tightened preview, and added a copyable public link field (`src/components/roadmap/roadmap-share-drawer.tsx`).

## 2025-12-28 — Codex session (Tiptap toolbar condense + resize)

- UI: made tiptap editor content resizable via drag handle and condensed toolbar controls into dropdown menus (`src/components/rich-text-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap reset removal)

- UI: removed the reset button from the roadmap editor action row (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Toolbar + hydration fixes)

- UI: removed manual link buttons from the tiptap toolbar and made dropdown triggers ref-safe for Radix menus (`src/components/rich-text-editor.tsx`).
- UI: avoided hydration mismatches in roadmap timestamps by moving relative-time rendering to the client (`src/components/roadmap/roadmap-editor.tsx`).
- UI: deferred notifications popover rendering until mount to prevent Radix id hydration mismatches (`src/components/notifications/notifications-menu.tsx`).

## 2025-12-28 — Codex session (Roadmap sections mobile select)

- UI: moved section status dot to the top-right of each item and added a mobile-only section dropdown selector (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap public toggle + drawer padding)

- UI: moved the roadmap public toggle to the header with a single page-level switch and removed per-section visibility controls (`src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/roadmap-visibility-toggle.tsx`).
- UI: removed the roadmap docx download entry point and moved header rendering into a client shell (`src/app/(dashboard)/strategic-roadmap/page.tsx`).
- UI: added horizontal padding inside the share settings drawer and updated public gating copy (`src/components/roadmap/roadmap-share-drawer.tsx`).

## 2025-12-28 — Codex session (Roadmap public toggle consolidation)

- UI: introduced a client roadmap shell to host the single public toggle and removed per-section visibility toggles (`src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/roadmap-visibility-toggle.tsx`).
- API: removed the roadmap docx export endpoint now that the download control is gone (`src/app/api/roadmap/docx/route.ts`).
- UI: added horizontal padding to the share settings drawer content (`src/components/roadmap/roadmap-share-drawer.tsx`).

## 2025-12-28 — Codex session (Roadmap toggle polish)

- UI: added a visible label to the public roadmap link button and changed the switch checked state to green (`src/components/roadmap/roadmap-visibility-toggle.tsx`, `src/components/ui/switch.tsx`).

## 2025-12-28 — Codex session (Roadmap header alignment)

- UI: constrained header copy width and right-aligned the public toggle row away from the title (`src/components/roadmap/roadmap-shell.tsx`).

## 2025-12-28 — Codex session (Roadmap header icon + sections cleanup)

- UI: added a milestone-style icon next to the roadmap title block and removed section status dots in the selector (`src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap action button sizing)

- UI: aligned Share settings and Save section button heights by using the default size (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Performance + hydration cleanup)

- Perf: parallelized dashboard data fetches to reduce serial Supabase latency (`src/app/(dashboard)/dashboard/page.tsx`).
- Perf: reused Supabase client in class/module routes and parallelized module content/assignment/submission queries (`src/lib/modules/service.ts`, `src/app/(dashboard)/class/[slug]/page.tsx`, `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`).
- Hydration: made sidebar skeleton width deterministic on SSR and moved assignment last-saved label to client-only rendering (`src/components/ui/sidebar.tsx`, `src/components/training/module-detail/assignment-form.tsx`).

## 2025-12-28 — Codex session (Performance plan doc)

- Docs: added a performance and DB sync plan checklist for follow-up (`docs/PERFORMANCE-PLAN.md`).

## 2025-12-28 — Codex session (Roadmap layout refinements)

- UI: swapped roadmap icon to waypoints, moved it above the title, and made it a rounded square (`src/components/roadmap/roadmap-shell.tsx`).
- UI: added a section details label, moved the public toggle into the editor area, and moved the updated timestamp below the editor (`src/components/roadmap/roadmap-editor.tsx`).
- UI: matched the editor default height to the sections list via ResizeObserver and added a minHeight prop to the rich text editor (`src/components/roadmap/roadmap-editor.tsx`, `src/components/rich-text-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap sections list layout)

- UI: removed the sections list card container and tightened the sidebar width to free horizontal space (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap layout + timestamp polish)

- UI: switched sections list to a left “ear” on large screens, uses dropdown on smaller screens, and tightened the main column to be full-width (`src/components/roadmap/roadmap-editor.tsx`).
- UI: shortened the updated timestamp and aligned it on the same row as the action buttons (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap save label)

- UI: shortened the roadmap save button label to "Save" (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap action row width)

- UI: constrained the main editor column on large screens and kept the action row on one line without overflow (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap ear width stability)

- UI: fixed the left “ear” width and clamped section titles to prevent layout shift when switching sections (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap updated label placement)

- UI: moved the updated timestamp under the editor with a shorter "Updated X ago" label and kept action buttons on one row (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-28 — Codex session (Roadmap editor scrollbar stability)

- UI: added stable editor scrollbars for the strategic roadmap to prevent width shifts when switching sections (`src/components/roadmap/roadmap-editor.tsx`, `src/components/rich-text-editor.tsx`).
- UI: pinned dashboard scrollbars to avoid width changes from page-level overflow (`src/components/dashboard/dashboard-shell.tsx`).
- UI: moved the sections picker into a responsive grid column so it stays inside the app shell at narrower widths (`src/components/roadmap/roadmap-editor.tsx`).
- UI: removed the strikethrough tool and hid toolbar separators on mobile (`src/components/rich-text-editor.tsx`).
- UI: tightened mobile toolbar spacing and aligned roadmap inputs/action row (`src/components/rich-text-editor.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- UI: clamped section list item widths to keep the roadmap editor column consistent (`src/components/roadmap/roadmap-editor.tsx`).
- UI: removed code block tooling and forced the editor to stay full width regardless of content length (`src/components/rich-text-editor.tsx`).
- UI: moved the unsaved changes badge under the updated timestamp in the roadmap editor (`src/components/roadmap/roadmap-editor.tsx`).
- UI: pinned roadmap editor grid/items and editor wrapper to full width to prevent content-driven resizing (`src/components/roadmap/roadmap-editor.tsx`, `src/components/rich-text-editor.tsx`).
- UI: locked the strategic roadmap page container to full width inside the flex shell to prevent content-based shrink (`src/app/(dashboard)/strategic-roadmap/page.tsx`).
- UI: updated the public roadmap hero gradient to the new multi-stop palette (`src/app/[org]/roadmap/page.tsx`).
- UI: moved the Strategic Roadmap editor into the My Organization tabs and pointed all dashboard links there (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/organization/org-profile-card/types.ts`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/(dashboard)/dashboard/page.tsx`).
- UI: removed the Strategic Roadmap sidebar nav entry and redirected the old route to the My Organization tab (`src/components/app-sidebar/nav-data.ts`, `src/app/(dashboard)/strategic-roadmap/page.tsx`, `src/app/(dashboard)/strategic-roadmap/actions.ts`).
- UI: added delete support for roadmap sections and surfaced the action in the editor (`src/lib/roadmap.ts`, `src/app/(dashboard)/strategic-roadmap/actions.ts`, `src/components/roadmap/roadmap-editor.tsx`).
- UI: removed the Reports tab and added icons to My Organization tabs (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/organization/org-profile-card/types.ts`, `src/app/(dashboard)/my-organization/page.tsx`).
- UI: swapped roadmap deletion to an alert dialog and stripped HTML tags from About previews (`src/components/roadmap/roadmap-editor.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx`, `src/components/organization/org-profile-card/tabs/company-tab.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/types.ts`).
- UI: cleaned About/Public profile text rendering and replaced values badges with plain text (`src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx`, `src/components/organization/org-profile-card/public-card.tsx`).
- Data: added org profile HTML cleanup helpers and apply them on profile updates, assignment org_key sync, and on My Organization load (`src/lib/organization/profile-cleanup.ts`, `src/app/(dashboard)/my-organization/actions.ts`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/api/modules/[id]/assignment-submission/route.ts`).
- Data: normalized array-backed org profile values into newline-delimited text during cleanup and org sync to keep About fields consistent (`src/lib/organization/profile-cleanup.ts`, `src/app/api/modules/[id]/assignment-submission/route.ts`).

## 2025-12-29 — Codex session (Community map diagnostics)

- UI: added Mapbox error handling + env fallback to surface map load failures (`src/components/community/community-map.tsx`).
- Docs: added a working plan/to-do doc for follow-up (`docs/WORKPLAN.md`).

## 2025-12-29 — Codex session (Dashboard cleanup)

- UI: removed the org hero/focus card from the dashboard and simplified the layout to the remaining utility cards (`src/app/(dashboard)/dashboard/page.tsx`).

## 2025-12-29 — Codex session (Next.js CVE patch)

- Chore: bumped Next.js + eslint-config-next to 16.1.1 to address Vercel CVE warning (`package.json`, `package-lock.json`).

## 2025-12-29 — Codex session (Org profile cleanup type fix)

- Fix: cast cleaned org profile payloads to Supabase Json type during cleanup upsert to satisfy TS (`src/app/(dashboard)/my-organization/page.tsx`).

## 2025-12-29 — Codex session (Build + lint fixes)

- Fix: corrected Mapbox dynamic import typing to resolve TS compile error (`src/components/community/community-map.tsx`).
- Fix: escaped quotes in roadmap delete dialog copy (`src/components/roadmap/roadmap-editor.tsx`).
- Fix: aligned roadmap share save callback deps to satisfy React compiler + hooks rules (`src/components/roadmap/roadmap-section-editor.tsx`).
- Fix: marked unused drag event parameter as intentionally unused (`src/components/people/org-chart-canvas.tsx`).

## 2025-12-29 — Codex session (Rich text editor typing fix)

- Fix: ensured editor inline style is always a string to satisfy TipTap editor typing (`src/components/rich-text-editor.tsx`).

## 2025-12-29 — Codex session (Heading level typing)

- Fix: ensure TipTap heading levels are typed as literals to satisfy Level union (`src/components/rich-text-editor.tsx`).

## 2025-12-29 — Codex session (Org documents tab)

- UI: added a private Documents tab in My Organization with upload/view/rename/delete for the 501(c)(3) verification letter (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/organization/org-profile-card/tabs/documents-tab.tsx`, `src/components/organization/org-profile-card/types.ts`, `src/app/(dashboard)/my-organization/page.tsx`).
- API: added private org documents endpoint for CRUD + signed URLs (`src/app/api/account/org-documents/route.ts`).
- DB: added private `org-documents` storage bucket + RLS policies (`supabase/migrations/20251229140207_storage_org_documents_bucket.sql`).

## 2025-12-29 — Codex session (My Organization searchParams)

- Fix: await promised searchParams before reading tab in My Organization route (`src/app/(dashboard)/my-organization/page.tsx`).

## 2025-12-29 — Codex session (Documents upload click fix)

- Fix: converted file upload button to explicit label/for pairing so click reliably opens the picker (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`).

## 2025-12-29 — Codex session (My Organization mobile spacing)

- UI: reduced mobile horizontal padding on My Organization so the main card uses more width (`src/app/(dashboard)/my-organization/page.tsx`).

## 2025-12-29 — Codex session (My Organization mobile tabs dropdown)

- UI: replaced the mobile tab switcher with the shadcn Select component for cleaner styling (`src/components/organization/org-profile-card/org-profile-card.tsx`).

## 2025-12-29 — Codex session (TipTap duplicate extensions)

- Fix: disabled StarterKit link/underline when custom Link/Underline extensions are registered to avoid duplicate extension warnings (`src/components/rich-text-editor.tsx`).

## 2025-12-29 — Codex session (Roadmap inputs width)

- UI: constrained strategic roadmap title/subtitle inputs to a tighter max width for readability (`src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-29 — Codex session (My Organization desktop padding)

- UI: removed extra desktop horizontal padding so left/right spacing matches top/bottom in the shell (`src/app/(dashboard)/my-organization/page.tsx`).

## 2025-12-29 — Codex session (Public grid overscroll)

- UI: applied dot-grid background to body when viewing public org + roadmap pages so overscroll stays consistent (`src/app/[org]/page.tsx`, `src/app/[org]/roadmap/page.tsx`, `src/app/globals.css`).

## 2025-12-29 — Codex session (Public pages mobile polish)

- UI: tightened spacing and responsive typography on public org + roadmap pages; adjusted card paddings, hero sizing, timeline layout, and public people row padding (`src/app/[org]/page.tsx`, `src/app/[org]/roadmap/page.tsx`, `src/components/organization/org-profile-card/public-card.tsx`, `src/components/organization/org-profile-card/shared.tsx`, `src/components/people/supporters-showcase.tsx`).

## 2025-12-30 — Codex session (Profile + org media)

- Fix: avatar uploads now upsert profiles so new users can save profile photos (`src/app/api/account/avatar/route.ts`, `src/app/(dashboard)/onboarding/actions.ts`).
- UI: added org header image + synced logo uploads between header and Brand Kit, plus public header rendering (`src/components/organization/org-profile-card/header.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/brand-kit.tsx`, `src/components/organization/org-profile-card/public-card.tsx`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/[org]/page.tsx`).
- UI: added roadmap hero image upload + persistence and render it on the public roadmap hero (`src/components/roadmap/roadmap-shell.tsx`, `src/app/(dashboard)/strategic-roadmap/actions.ts`, `src/app/[org]/roadmap/page.tsx`, `src/lib/roadmap.ts`).
- Infra: added org-media upload helper and expanded route support for header/roadmap media (`src/lib/organization/org-media.ts`, `src/app/api/account/org-media/route.ts`).

## 2025-12-30 — Codex session (Prioritized to-do list)

- Docs: organized the Notes re LMS list from easiest to hardest and saved as `docs/TODO_PRIORITIZED.md`.

## 2025-12-30 — Codex session (Quick wins 1-4)

- UX: accept domain-only website inputs and normalize org links to https when missing (`src/lib/organization/urls.ts`, `src/app/(dashboard)/my-organization/actions.ts`, `src/components/organization/org-profile-card/validation.ts`, `src/components/organization/org-profile-card/shared.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/presence.tsx`).
- UI: renamed People action button to "Add" with matching copy (`src/components/people/create-person-dialog.tsx`).
- UI: added Submit feedback entry to the sidebar user menu (`src/components/nav-user.tsx`).

## 2025-12-30 — Codex session (Roadmap hero upload + header spacing)

- Fix: roadmap hero upload button now reliably opens the file picker (`src/components/roadmap/roadmap-shell.tsx`).
- UI: moved the org logo upload button below the header image to avoid overlap (`src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Brand kit upload buttons)

- Fix: brand kit logo upload button now triggers the file picker reliably (`src/components/organization/org-profile-card/tabs/company-tab/edit-sections/brand-kit.tsx`).

## 2025-12-30 — Codex session (Brand kit scope tweak)

- UI: removed header image upload/input from the Brand Kit section so it only manages logo + boilerplate (`src/components/organization/org-profile-card/tabs/company-tab/edit-sections/brand-kit.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx`).

## 2025-12-30 — Codex session (Brand kit boilerplate helper)

- UI: added boilerplate description text and an example tooltip in Brand Kit (`src/components/organization/org-profile-card/tabs/company-tab/edit-sections/brand-kit.tsx`, `src/components/organization/org-profile-card/shared.tsx`).

## 2025-12-30 — Codex session (Presence icon alignment)

- UI: aligned InputWithIcon glyphs via flex centering to fix newsletter icon offset (`src/components/organization/org-profile-card/shared.tsx`).

## 2025-12-30 — Codex session (Story values helper)

- UI: removed the comma-separated values helper text from Story & impact (`src/components/organization/org-profile-card/tabs/company-tab/edit-sections/story.tsx`).

## 2025-12-30 — Codex session (Org form placeholders + icon alignment)

- UI: added placeholders across organization About form inputs and textareas (`src/components/organization/org-profile-card/tabs/company-tab/edit-sections/identity.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/contact.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/story.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/programs-reports.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/brand-kit.tsx`).
- UI: nudged InputWithIcon glyphs up for better alignment in newsletter/social inputs (`src/components/organization/org-profile-card/shared.tsx`).

## 2025-12-30 — Codex session (Empty states + dropzone)

- UI: added empty states to People and Supporters tabs (`src/components/organization/org-profile-card/tabs/people-tab.tsx`, `src/components/organization/org-profile-card/tabs/supporters-tab.tsx`).
- UI: added a dropzone upload area for documents with centered upload control (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`).
- UI: added placeholders for newsletter + logo URL inputs and adjusted icon alignment (`src/components/organization/org-profile-card/tabs/company-tab/edit-sections/presence.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/brand-kit.tsx`, `src/components/organization/org-profile-card/shared.tsx`).

## 2025-12-30 — Codex session (Dropzone PDF validation check)

- Verified: documents dropzone and upload route already restrict files to PDFs only (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`, `src/app/api/account/org-documents/route.ts`).

## 2025-12-30 — Codex session (Org logo upload click fix)

- Fix: logo/header image upload buttons now use labeled inputs so clicking "Add image" opens the file picker (`src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Upload/security review)

- Review: confirmed org-media/avatars are public buckets with RLS by user folder, org-documents is private with signed URLs, and org profile images sync on save; no code changes (`src/app/api/account/org-media/route.ts`, `src/app/api/account/org-documents/route.ts`, `src/app/api/account/avatar/route.ts`, `supabase/migrations/20251001110000_storage_org_media_bucket.sql`, `supabase/migrations/20251229140207_storage_org_documents_bucket.sql`, `supabase/migrations/20251001090000_storage_avatars_bucket.sql`).

## 2025-12-30 — Codex session (Image uploader menus)

- UI: replaced header/logo upload buttons with a three-dot menu that also supports removing images (`src/components/organization/org-profile-card/header.tsx`).
- UI: added a three-dot menu for roadmap hero image upload/remove actions (`src/components/roadmap/roadmap-shell.tsx`).

## 2025-12-30 — Codex session (Org profile autosave + discard)

- Fix: org logo/header uploads now auto-save to the org profile instead of relying on the Save button (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/organization/org-profile-card/header.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/brand-kit.tsx`).
- UX: Save changes button now enables only after edits; Cancel/leave prompts to discard unsaved changes (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Media cleanup + shared unsaved guard)

- Cleanup: deleting or replacing org logo/header/roadmap hero now removes the old storage object (`src/app/(dashboard)/my-organization/actions.ts`, `src/app/(dashboard)/strategic-roadmap/actions.ts`, `src/lib/storage/org-media.ts`, `src/lib/storage/public-url.ts`).
- UX: unsaved-change guard now covers roadmap drafts alongside org profile edits (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/roadmap-editor.tsx`).

## 2025-12-30 — Codex session (Additional media cleanup)

- Cleanup: profile avatar uploads now remove the previous avatar object (`src/app/api/account/avatar/route.ts`, `src/lib/storage/avatars.ts`, `src/lib/storage/public-url.ts`).
- Cleanup: program image updates remove the prior program media object (`src/app/(dashboard)/my-organization/programs/actions.ts`, `src/lib/storage/program-media.ts`, `src/lib/storage/public-url.ts`).
- Cleanup: org people image updates/deletes remove mirrored avatar objects (`src/app/(dashboard)/people/actions.ts`).

## 2025-12-30 — Codex session (Logo/header edit icon)

- UI: replaced the three-dot menu trigger for logo/header actions with an edit icon button (`src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Public page layout polish)

- UI: improved responsive layout for the Public Page settings section and removed the redundant header View Public Page button in edit mode (`src/components/organization/org-profile-card/tabs/company-tab/edit-sections/public-page-settings.tsx`, `src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Logo/header upload UI tweaks)

- UI: moved the logo upload control to the bottom-right of the logo card and swapped menu vs upload button based on whether an image exists (`src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Public URL auto-check)

- UX: public URL now auto-checks availability, shows status next to the label, and the slash prefix is inside the input; save blocks when the slug is unavailable (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/organization/org-profile-card/tabs/company-tab.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/public-page-settings.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/types.ts`, `src/components/organization/org-profile-card/types.ts`).

## 2025-12-30 — Codex session (Public page buttons + share icon)

- UI: stacked View/Share buttons vertically in the public page section and switched the share icon to lucide share (`src/components/organization/org-profile-card/tabs/company-tab/edit-sections/public-page-settings.tsx`, `src/components/shared/share-button.tsx`).

## 2025-12-30 — Codex session (Logo upload placement)

- UI: moved the logo upload/edit control to the right of the logo card with spacing instead of overlaying the logo (`src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Private documents UI)

- UI: private documents now show a square preview card with a three-dot menu (view/replace/delete), hide the dropzone when a file exists or when not in edit mode, and validate PDF uploads (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`).

## 2025-12-30 — Codex session (Edit button sizing)

- UI: matched the Edit button height to the View public page button by using the small button size (`src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Header action sizing)

- UI: aligned Cancel/Save button heights with the small action buttons (`src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Programs tab tooltip + wizard steps)

- UI: moved the public programs note into an info tooltip next to the Programs title (`src/components/organization/org-profile-card/tabs/programs-tab.tsx`).
- Fix: program wizard steps now respect dialog stack index so only the active step shows (`src/components/programs/program-wizard/steps/basics-step.tsx`, `src/components/programs/program-wizard/steps/schedule-step.tsx`, `src/components/programs/program-wizard/steps/funding-step.tsx`).

## 2025-12-30 — Codex session (Program button alignment)

- UI: right-aligned the New program button and added a plus icon to the trigger (`src/components/organization/org-profile-card/tabs/programs-tab.tsx`, `src/components/programs/program-wizard.tsx`).

## 2025-12-30 — Codex session (Program card header fill)

- UI: removed header padding and inner rounding so program card images fill the header edge-to-edge (`src/components/programs/program-card.tsx`).

## 2025-12-30 — Codex session (Header tagline width)

- UI: constrained org header tagline width for better readability (`src/components/organization/org-profile-card/header.tsx`).

## 2025-12-30 — Codex session (Pricing refresh)

- UI: rebuilt the pricing page layout and content for the four tiers, including featured styling and updated feature lists (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Pricing grid sizing)

- UI: adjusted pricing grid to keep four columns on desktop and stack only on smaller screens (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Pricing card header)

- UI: removed tier badges and aligned the header structure closer to the provided pricing card layout (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Pricing fee copy)

- Copy: removed the setup fee note from the Community tier (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Pricing tier label)

- Copy: renamed the Tier 1 label to "Platform" (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Quality fixes)

- Test: made the Stripe mock constructable for billing portal acceptance coverage (`tests/acceptance/test-utils.ts`).
- Lint: resolved missing hook dependencies in assignment form autosave effects (`src/components/training/module-detail/assignment-form.tsx`).
- Lint: replaced marketplace `<img>` with `next/image` for optimized loading (`src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).

## 2025-12-30 — Codex session (Build fix)

- Fix: removed typed `maybeSingle` call on an untyped Supabase chain to unblock build (`src/app/(dashboard)/my-organization/programs/actions.ts`).

## 2025-12-30 — Codex session (Build fix follow-up)

- Fix: adjusted org profile autosave assignment typing to satisfy strict index access (`src/components/organization/org-profile-card/org-profile-card.tsx`).

## 2025-12-30 — Codex session (Theme fallback)

- Fix: added system dark-mode CSS variable fallback and color-scheme hints to restore public page theming without relying on JS theme hydration (`src/app/globals.css`).

## 2025-12-30 — Codex session (News header)

- UI: added the public header to the news page and adjusted spacing for the sticky layout (`src/app/(public)/news/page.tsx`).

## 2025-12-30 — Codex session (Pricing card order)

- UI: reordered pricing cards so the $58/month Community tier appears immediately after Free (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Pricing add-ons cards)

- UI: moved elective/coaching add-ons into separate cards below the tiers and standardized checkmark sizing (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Pricing checkmarks)

- UI: wrapped pricing checkmarks in rounded square badges for a checkbox-like appearance (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Pricing separators)

- UI: added a divider above each tier purpose line to match the pricing card layout (`src/app/(public)/pricing/page.tsx`).

## 2025-12-30 — Codex session (Public header theme toggle)

- UI: removed Benefits/How links and added a theme toggle to the public header (`src/components/public/public-header.tsx`, `src/app/(public)/page.tsx`).

## 2025-12-30 — Codex session (Home prototype)

- UI: added a new `/home` prototype page inspired by the requested template, with studio-style layout and custom typography (`src/app/(public)/home/page.tsx`).

## 2025-12-30 — Codex session (Home prototype polish)

- UI: aligned header linking, added staggered reveal animations, and refined the hero cards (`src/app/(public)/home/page.tsx`).

## 2025-12-30 — Codex session (Home eyebrow tracking)

- UI: removed extra letter-spacing from home page eyebrow labels (`src/app/(public)/home/page.tsx`).

## 2025-12-31 — Codex session (Home2 prototype)

- UI: added a second `/home2` public prototype page based on the provided layout references (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 motion + layout)

- UI: removed serif typography on `/home2`, expanded spacing, and swapped in media placeholders plus a scroll-scaling video block with glow (`src/app/(public)/home2/page.tsx`, `src/components/public/home2-scroll-video.tsx`).
- UI: made the public theme toggle icon-only and added subtle motion utility classes for fade/pop effects (`src/components/organization/public-theme-toggle.tsx`, `src/app/globals.css`).

## 2025-12-31 — Codex session (Home2 news links + video glow)

- UI: aligned `/home2` feature and library cards with the `/news` content and link targets, removed featured header copy, and restored the hero media block without the nested frame (`src/app/(public)/home2/page.tsx`).
- UI: refined the scroll video container to reduce GPU load, added optional video-based glow sampling, and disabled glow when no video is provided (`src/components/public/home2-scroll-video.tsx`).

## 2025-12-31 — Codex session (Home2 photo strip)

- UI: removed the separator and replaced the demo/sprint grid with a horizontally scrollable, bottom-aligned photo strip (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 library cards)

- UI: redesigned the library/news cards to match the new taller card layout with image placeholders and CTA icon (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 studio sections)

- UI: integrated the studio style, process, and studio note sections from `/home` into `/home2` and reordered content blocks (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 photo strip snap)

- UI: replaced the photo strip with a draggable, snap-to-center scroller and expanded the strip to eight placeholder cards (`src/app/(public)/home2/page.tsx`, `src/components/public/home2-photo-strip.tsx`, `src/app/globals.css`).

## 2025-12-31 — Codex session (Home2 photo strip full-bleed)

- UI: made the photo strip section full-bleed so cards extend to the viewport edge without clipping (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 studio note button)

- UI: anchored the “Explore tiers” button to the bottom of the studio note card (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 photo strip build fix)

- Fix: resolved a TypeScript inference error in the photo strip snapping logic (`src/components/public/home2-photo-strip.tsx`).

## 2025-12-31 — Codex session (Home2 news gradients + photo placeholders)

- UI: swapped the 4:3 news feature placeholders for the shared news gradients and added image API placeholders to the photo strip (`src/app/(public)/home2/page.tsx`, `src/components/public/home2-photo-strip.tsx`).

## 2025-12-31 — Codex session (Home2 media block removal)

- UI: removed the standalone gradient media card between the scroll video and news features (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 video spacing)

- UI: reduced the scroll video section height/padding to tighten the space beneath the video container (`src/components/public/home2-scroll-video.tsx`).

## 2025-12-31 — Codex session (Home2 placeholder video)

- UI: added a looping public-domain placeholder video and poster to the scroll video block (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 video scale)

- UI: increased the scroll video max width and scale range for a larger reveal (`src/components/public/home2-scroll-video.tsx`).

## 2025-12-31 — Codex session (Home2 studio note button text)

- UI: left-aligned and shortened the studio note button with updated label text (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 library gradients)

- UI: applied the shared news gradient thumbnails to the library card media placeholders (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 media borders)

- UI: removed borders on photo strip and news gradient cards to eliminate the double-frame artifact (`src/app/(public)/home2/page.tsx`, `src/components/public/home2-photo-strip.tsx`).

## 2025-12-31 — Codex session (Home2 spacing tweak)

- UI: tightened the scroll video section height and added extra spacing below the news feature section (`src/components/public/home2-scroll-video.tsx`, `src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 featured cards removal)

- UI: removed the three-feature card row under the scroll video block (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 narrative text removal)

- UI: removed the narrative text block and list under the hero media section (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 hero buttons)

- UI: added “View pricing” and “Start free” buttons beneath the hero description (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Home2 photo strip easing)

- UI: replaced CSS snapping with eased JS snapping and allowed hover lift without clipping (`src/components/public/home2-photo-strip.tsx`, `src/app/globals.css`).

## 2025-12-31 — Codex session (Home2 as landing)

- UI: set the `/` landing page to render the `/home2` prototype content (`src/app/(public)/page.tsx`).

## 2025-12-31 — Codex session (Home2 photo strip images)

- UI: swapped the photo strip placeholders to the provided Lummi image URLs (`src/app/(public)/home2/page.tsx`).

## 2025-12-31 — Codex session (Accelerator shell + landing copy)

- UI: updated landing hero copy and created a new Accelerator route group with its own shell, sidebar, and overview layout (`src/app/(public)/home2/page.tsx`, `src/app/(accelerator)/layout.tsx`, `src/app/(accelerator)/page.tsx`, `src/components/accelerator/accelerator-shell.tsx`, `src/components/accelerator/accelerator-sidebar.tsx`).
- UI: replaced the sidebar Accelerator label with a button linking into the new Accelerator experience (`src/components/app-sidebar.tsx`).

## 2025-12-31 — Codex session (Accelerator route fix)

- Fix: moved the Accelerator overview page under the `/accelerator` segment to avoid route collisions with `/` (`src/app/(accelerator)/accelerator/page.tsx`).

## 2026-01-06 — Codex session (Accelerator shell refactor)

- UI: rebuilt the Accelerator shell and sidebar on the shadcn sidebar primitives, refreshed the overview layout to match the control-center design, and tightened auth data exposure (`src/components/accelerator/accelerator-shell.tsx`, `src/components/accelerator/accelerator-sidebar.tsx`, `src/app/(accelerator)/accelerator/page.tsx`, `src/app/(accelerator)/layout.tsx`).
- UI: moved Resources/Support navigation into the sidebar footer area (`src/components/app-sidebar.tsx`).

## 2026-01-06 — Codex session (Accelerator polish + status page)

- UI: made the Accelerator shell/theme tokens consistent, removed the header pill/label, and wired scroll-spy highlighting for the overview sections (`src/components/accelerator/accelerator-shell.tsx`, `src/components/accelerator/accelerator-sidebar.tsx`).
- UI: restored the curriculum dropdown to the shared ClassesSection design and updated the overview cards to use theme tokens (`src/components/accelerator/accelerator-sidebar.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- UI: linked the status card to a new public status page (`src/app/(accelerator)/accelerator/page.tsx`, `src/app/(public)/status/page.tsx`).

## 2026-01-06 — Codex session (Accelerator class routing)

- UI: routed accelerator curriculum links through `/accelerator/class/*` and reused existing class/module pages inside the accelerator shell (`src/components/app-sidebar/classes-section.tsx`, `src/components/app-sidebar/nav-data.ts`, `src/components/accelerator/accelerator-sidebar.tsx`, `src/app/(accelerator)/accelerator/class/[slug]/page.tsx`, `src/app/(accelerator)/accelerator/class/[slug]/module/[index]/page.tsx`).

## 2026-01-06 — Codex session (Budget table + deck retry)

- Homework: added a new `budget_table` field type end-to-end (schemas, builders, admin wizard UX, module parsing, assignment UI, and submission sanitization), plus updated tests for the new type (`src/lib/lessons/types.ts`, `src/lib/lessons/fields.ts`, `src/lib/lessons/schemas.ts`, `src/lib/lessons/constants.ts`, `src/lib/lessons/builders.ts`, `src/lib/modules/types.ts`, `src/lib/modules/assignment.ts`, `src/components/training/module-detail/utils.ts`, `src/components/training/module-detail/assignment-form.tsx`, `src/app/api/modules/[id]/assignment-submission/route.ts`, `src/components/admin/lesson-wizard/steps/FormFieldsEditor.tsx`, `tests/acceptance/lessons.fields.test.ts`, `tests/acceptance/lessons.schemas.test.ts`, `tests/acceptance/lessons.builders.test.ts`).
- Homework: seeded a multi-year budgeting homework prompt for the module (migration + seed) (`supabase/migrations/20260106123500_add_multi_year_budget_homework.sql`, `supabase/seed.sql`).
- UI: improved deck download reliability by routing downloads through the API and added a visible retry state when the deck URL fetch fails (`src/components/training/module-detail/deck-viewer.tsx`, `src/components/training/module-detail/deck-viewer/view.tsx`).

## 2026-01-06 — Codex session (Program budget table)

- Homework: upgraded the budget table field to compute totals/subtotal, use cost type select, and present the exact column labels (`src/components/training/module-detail/assignment-form.tsx`).
- Homework: allowed budget table options to carry row metadata through the lesson wizard, plus updated schema normalization/tests to accept structured options (`src/lib/lessons/types.ts`, `src/lib/lessons/schemas.ts`, `src/lib/lessons/builders.ts`, `src/hooks/lessons/use-lesson-wizard.ts`, `src/components/admin/lesson-wizard/steps/FormFieldsEditor.tsx`, `tests/acceptance/lessons.schemas.test.ts`).
- Homework: seeded the Program_Expense_Breakdown table for the Budgeting for a Program module (migration + seed) (`supabase/migrations/20260106191500_add_program_budget_table.sql`, `supabase/seed.sql`).

## 2026-01-06 — Codex session (Systems Thinking prompts)

- Homework: cleared legacy resources/homework for Systems Thinking and enforced the five required prompts in the assignment schema (`supabase/migrations/20260106120000_update_systems_thinking_prompts.sql`).

## 2026-01-06 — Codex session (Budget table fallback targeting)

- Homework: added a fallback migration to locate the Budgeting for a Program module by class slug + index so the budget table schema always attaches even if the module slug differs (`supabase/migrations/20260106200000_fix_program_budget_table.sql`).
- Seed: aligned the seed query with the same fallback targeting (`supabase/seed.sql`).

## 2026-01-06 — Codex session (Deck preview card)

- UI: replaced the inline PDF deck viewer with a compact preview card that opens the full viewer in a dialog (`src/components/training/module-detail/deck-viewer.tsx`).

## 2026-01-06 — Codex session (Deck dialog layout)

- UI: made the deck dialog full-bleed, removed header chrome, and moved the close button into the overlay next to download (`src/components/training/module-detail/deck-viewer.tsx`, `src/components/training/module-detail/deck-viewer/view.tsx`).

## 2026-01-06 — Codex session (Accelerator header + home link)

- UI: matched the accelerator header actions to the main shell (sidebar trigger, notifications, theme toggle, support) and moved the Home link into the sidebar above search (`src/components/accelerator/accelerator-shell.tsx`, `src/components/accelerator/accelerator-sidebar.tsx`).

## 2026-01-07 — Codex session (Strategic Foundations copy refresh)

- UI: hide empty resources so broken/blank resource URLs do not render (`src/components/training/module-detail.tsx`).
- Curriculum: refreshed Strategic Foundations + Theory of Change module copy, prompts, and Systems Thinking guidance, plus aligned Program Budget table labels/instructions (new migration) (`supabase/migrations/20260107100000_update_strategic_foundations_copy.sql`).
- Seed: mirrored the same curriculum copy, prompt, and budget table updates for new environments (`supabase/seed.sql`).

## 2026-01-07 — Codex session (Admin UUID + pilot video)

- Admin: replaced Node-only `randomUUID` usage with Edge-safe `crypto.randomUUID` fallback helper (`src/app/(admin)/admin/classes/actions/utils.ts`, `src/app/(admin)/admin/classes/actions/basic.ts`, `src/app/(admin)/admin/classes/actions/wizard-create.ts`, `src/app/(admin)/admin/classes/[id]/actions.ts`, `src/app/api/admin/classes/[id]/modules/route.ts`).
- Curriculum: set the Designing Your Pilot video URL in module content (migration + seed) (`supabase/migrations/20260107102000_add_designing_pilot_video.sql`, `supabase/seed.sql`).

## 2026-01-07 — Codex session (Deck viewer import fix)

- UI: added missing Button import for the deck dialog close control (`src/components/training/module-detail/deck-viewer.tsx`).

## 2026-01-07 — Codex session (Deck/progress layout)

- UI: moved the assignment progress panel into a flexible header layout so it can sit beside the slide deck card when present, with optional header slot support (`src/components/training/module-detail/assignment-form.tsx`, `src/components/training/module-detail.tsx`).
- UI: restyled the slide deck card to a vertical layout with tighter spacing (`src/components/training/module-detail/deck-viewer.tsx`).

## 2026-01-07 — Codex session (Accelerator badge overlay)

- UI: moved the curriculum highlight badge onto the gradient thumbnail (top-right overlay) (`src/app/(accelerator)/accelerator/page.tsx`).

## 2026-01-07 — Codex session (Budget table UX)

- UI: improved the Program Expense Breakdown table layout with better labeling, clearer instructions, currency inputs, and horizontal scrolling (`src/components/training/module-detail/assignment-form.tsx`).

## 2026-01-07 — Codex session (Budget table QoL)

- UI: added column resizing, row reordering, add-row action, sticky totals, and header/footer spacing improvements for the budget table, plus pill-style progress counts (`src/components/training/module-detail/assignment-form.tsx`).

## 2026-01-07 — Codex session (Module header progress pill)

- UI: replaced the module header progress line with a single pill-style “x of y completed” badge (`src/components/training/module-detail/module-header.tsx`).

## 2026-01-07 — Codex session (Budget table polish)

- UI: refined budget table header spacing, vertical dividers, rounded inputs, header add-row icon, and right-aligned save/status metadata (`src/components/training/module-detail/assignment-form.tsx`).

## 2026-01-07 — Codex session (Budget table corner clipping)

- UI: clipped the budget table to the rounded container and added rounded footer corners to avoid sharp edges on subtotal cells (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.
- Next: verify corner rendering + sticky subtotal cell in the module budget table on wide and scrolled views.

## 2026-01-07 — Codex session (Budget table resize + wrapping)

- UI: removed fixed min-widths that caused overlap, added a wrapping textarea for descriptions with autosize, and ensured numeric inputs can shrink with column resizing (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.
- Next: confirm column resizing no longer overlaps and description text wraps gracefully.

## 2026-01-07 — Codex session (Budget table spacing + responsive width)

- UI: tightened budget table header spacing, widened the responsive table container, and hid the visible subtotal label while keeping an accessible sr-only label (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.
- Next: verify spacing above the table and responsive width behavior on mobile/desktop.

## 2026-01-07 — Codex session (Budget table subtotal cell background)

- UI: removed the explicit background on the sticky subtotal cell to avoid a visible block in the footer (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.
- Next: confirm footer row background still reads well while the subtotal cell no longer looks boxed.

## 2026-01-07 — Codex session (Budget table hint removal)

- UI: removed the drag/resize helper hint text below the budget table (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Next module button alignment)

- UI: moved the next module button to the right-side meta cluster and updated the step label to “x of y” (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Deck preview sizing)

- UI: constrained the deck preview column to a smaller min/max width in the header layout so the preview stays compact (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator sidebar user menu)

- UI: added the NavUser profile menu to the accelerator sidebar footer and allowed NavUser to render without its internal divider when needed (`src/components/accelerator/accelerator-sidebar.tsx`, `src/components/nav-user.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator sidebar links)

- UI: removed Quickstart and Progress from the accelerator sidebar starter links (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator roadmap route)

- UI: routed the accelerator sidebar Roadmap link to a dedicated `/accelerator/roadmap` page and rendered the roadmap editor in the accelerator shell (`src/components/accelerator/accelerator-sidebar.tsx`, `src/app/(accelerator)/accelerator/roadmap/page.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator sidebar footer)

- UI: removed the privacy note from the accelerator sidebar footer, leaving only the user menu (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator quickstart card)

- UI: made the quickstart card visually flat, removed the step badge, and updated the snippet copy to reflect nonprofit planning tools (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Roadmap hero background selector)

- UI: replaced the roadmap hero gradient fallback with a dot-grid background and added swatch controls for grid vs image upload (`src/components/roadmap/roadmap-shell.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Roadmap homework links)

- UI: removed the "Open homework" links from roadmap section list items, leaving only the status pill (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Roadmap delete button)

- UI: removed the visible "Delete" label from the roadmap delete button while keeping an accessible label (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator overview card merge)

- UI: moved the "Next up" content and resume action into the completion card and removed the standalone Next up card (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator support card alignment)

- UI: aligned support cards by making the card links themselves flex containers and centering their contents (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator program builder section)

- UI: replaced curriculum highlights with a program builder preview, including a large create-program empty state and template cards (`src/app/(accelerator)/accelerator/page.tsx`).
- UI: added an optional CTA target for program cards to allow same-tab navigation (`src/components/programs/program-card.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Dashboard kanban layout)

- UI: hid the dashboard notifications card when empty and removed its empty-state copy (`src/components/dashboard/dashboard-notifications-card.tsx`).
- UI: removed the accelerator progress radial card and reorganized the dashboard into three kanban-style columns (`src/app/(dashboard)/dashboard/page.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Dashboard redesign)

- UI: redesigned the dashboard layout into a multi-row snapshot with org status, public reach, brand kit preview, people composition, and a full-bleed map card (`src/app/(dashboard)/dashboard/page.tsx`).
- UI: removed the kanban layout and unused accelerator progress calculation (`src/app/(dashboard)/dashboard/page.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Accelerator completion card)

- UI: simplified the completion/next-up card into a shorter horizontal layout and moved the resume button to a right-aligned footer (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Dashboard sidebar label)

- UI: changed the dashboard sidebar sublabel from “Accelerator” to “Dashboard” (`src/components/app-sidebar.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Dashboard sidebar label tweak)

- UI: updated the dashboard sidebar sublabel to “Platform” (`src/components/app-sidebar.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Deck preview width)

- UI: constrained the assignment header deck preview to a compact max width on desktop (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Origin story formatting)

- Content: updated origin story lesson notes to add hierarchy and line breaks (`supabase/migrations/20260107153000_update_origin_story_hierarchy.sql`, `supabase/seed.sql`).
- Tests: not run.

## 2026-01-07 — Codex session (Lesson notes hierarchy)

- Content: standardized lesson notes formatting for core modules and demo foundations modules, plus a migration to update existing data (`supabase/migrations/20260107100000_update_strategic_foundations_copy.sql`, `supabase/migrations/20251002124500_seed_foundations_class.sql`, `supabase/migrations/20260107173000_format_lesson_notes.sql`, `supabase/seed.sql`).
- Tests: not run.

## 2026-01-07 — Codex session (Assignment form flow)

- UX: centered long-text labels, moved AI assist into the editor toolbar, and reduced status layout shifts in assignment submissions (`src/components/training/module-detail/assignment-form.tsx`, `src/components/rich-text-editor.tsx`, `src/components/training/module-detail/use-assignment-submission.ts`).
- UX: added scroll-snap spacing for assignment sections and extra breathing room in tabbed prompts (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Assignment scroll + assist)

- UX: moved autosave submissions to silent mode, centered long-form labels, and added step-style scroll snapping for non-tabbed prompts (`src/components/training/module-detail/assignment-form.tsx`, `src/components/training/module-detail/use-assignment-submission.ts`, `src/components/rich-text-editor.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Autosave guard)

- UX: skipped autosave when assignment values match the current saved state to avoid redundant submissions (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Brand link previews)

- UI: render brand kit image URLs as thumbnail previews instead of plain links (`src/components/organization/org-profile-card/shared.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Program builder aspect ratio)

- UI: aligned the empty program builder state and program template cards to the same aspect ratio on the accelerator overview (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/programs/program-card.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Completion card width)

- UI: expanded the completion card to full width and removed the module detail line (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Roadmap program preview)

- UI: hid the roadmap hero editor in the accelerator roadmap view and replaced it with a program preview card, using the latest program when available (`src/components/roadmap/roadmap-shell.tsx`, `src/app/(accelerator)/accelerator/roadmap/page.tsx`, `src/components/programs/program-card.tsx`).
- Tests: not run.

## 2026-01-07 — Codex session (Fundraising label)

- UI: updated the program card progress label to “Fundraising Progress” (`src/components/programs/program-card.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Systems thinking + budgeting updates)

- Data: refreshed Systems Thinking copy/prompts and removed resource links via migrations + seed alignment (`supabase/migrations/20260108113000_update_systems_thinking_reflection.sql`, `supabase/seed.sql`).
- Data: expanded multi-year budgeting homework schema and updated program budget categories, plus new migration for live DB updates (`supabase/migrations/20260108120000_update_budgeting_homework.sql`, `supabase/seed.sql`).
- UI: allowed resource entries without URLs to render as “Link coming soon” and preserved description line breaks (`src/lib/modules/service.ts`, `src/components/training/module-detail.tsx`, `src/components/training/resources-card.tsx`, `src/components/training/module-detail/assignment-form.tsx`).
- UX: added reliable slide deck downloads with inline error + retry feedback (`src/components/training/module-detail/deck-viewer/view.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Roadmap homework linkage)

- UI: surfaced homework status + link per roadmap section and added homework labels in the section list (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Roadmap homework hidden)

- UI: removed roadmap homework indicators/links from the editor and mini tracker to keep sections content-focused (`src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/roadmap-mini-tracker.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Pilot resources + multi-year video)

- Data: removed the Designing Your Pilot resource link and added the multi-year budgeting video URL (new migrations + seed updates in `supabase/migrations/20260108132000_remove_designing_pilot_resource.sql`, `supabase/migrations/20260108132500_add_multi_year_budget_video.sql`, `supabase/seed.sql`).
- UI: hide assignment progress panel when a module only has a single step (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Fundraising + comms homework copy)

- Data: updated AI The Need instructions (four prompts) and added budgeting/financial lesson notes (org budget, bookkeeping, financial statements) in seed + migration (`supabase/seed.sql`, `supabase/migrations/20260109140000_add_fundraising_comms_homework.sql`).
- Data: added fundraising fundamentals and communications strategy homework schemas across modules (`supabase/seed.sql`, `supabase/migrations/20260109140000_add_fundraising_comms_homework.sql`).
- Tests: not run.

## 2026-01-08 — Codex session (Apply fundraising/comms homework to live slugs)

- Data: applied fundraising and communications homework to session-s7-mindset and session-s8-comms-as-mission modules, plus budgeting/financial notes for session-s6 (`supabase/migrations/20260109152000_update_fundraising_comms_session_classes.sql`).
- Tests: not run.

## 2026-01-08 — Codex session (Module stepper redesign)

- UI: added shared assignment section helper and a new module stepper that sequences video, deck, notes/resources, assignments, and a celebration step (`src/components/training/module-detail/assignment-sections.ts`, `src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail.tsx`).
- UI: added stepper mode to AssignmentForm (single-section render, no internal progress panel/tabs) (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Module stepper alignment tweak)

- UI: centered the step header while keeping step content left-aligned (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Module header + stepper rail)

- UI: moved module title/subtitle into the accelerator shell header via a header title portal (`src/components/header-title-portal.tsx`, `src/components/accelerator/accelerator-shell.tsx`, `src/components/training/module-detail/module-header.tsx`, `src/components/training/module-detail.tsx`).
- UI: added a gradient progress rail behind step dots and increased spacing (`src/components/training/module-detail/module-stepper.tsx`).
- UI: added the Aceternity timeline component for the animated rail styling reference (`src/components/ui/timeline.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper rail spacing)

- UI: padded the stepper rail container and made step buttons opaque to avoid clipping/see-through (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Module step frames)

- UI: added fixed-aspect step frames for video, deck, and assignment steps to keep consistent sizing across the stepper (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail/video-section.tsx`, `src/components/training/module-detail/deck-viewer.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper scroll centering)

- UI: auto-center the active step dot and added extra rail padding to prevent clipping (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper rail fade)

- UI: added edge fade overlays and scroll-state tracking so long step rails fade in/out when overflowing (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper rail alignment)

- UI: constrained the step rail to the center points of the first/last dots using CSS variables (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Celebration step polish)

- UI: centered celebration copy, simplified to a single gradient icon, and played a one-time completion chime (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Module stepper badge)

- UI: replaced the step counter with a progress badge in the module stepper header (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Resource card redesign + substack link)

- UI: redesigned module resources into square resource cards with icon + CTA button (`src/components/training/resources-card.tsx`).
- Data: ensured the strategic foundations intro module includes the Coach House Substack resource link (`supabase/migrations/20260108190000_update_foundations_substack_resource.sql`).
- Tests: not run.

## 2026-01-08 — Codex session (Accelerator sidebar active state)

- UI: defaulted the accelerator starter nav to Overview when landing on `/accelerator` without a hash (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Deck dialog title)

- UI: added an sr-only dialog title to the deck viewer for accessibility (`src/components/training/module-detail/deck-viewer.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper frame container)

- UI: removed the absolute step-frame wrapper so content stretches naturally inside the fixed aspect frame (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper polish + checklist status)

- UI: added a step count badge, focus-visible styling, and module-level celebration reset in the module stepper (`src/components/training/module-detail/module-stepper.tsx`).
- UI: enriched resource cards with provider/host meta labels, a consistent disabled CTA for missing links, and focus ring styling (`src/components/training/resources-card.tsx`).
- Docs: annotated the updates checklist with done/pending status markers (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-08 — Codex session (Deck preview frame fix)

- UI: ensured the frame-mode deck preview container fills the step frame height so the preview canvas renders (`src/components/training/module-detail/deck-viewer.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Resource card sizing)

- UI: centered resource cards and constrained them to a smaller square footprint (`src/components/training/resources-card.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Grid pattern dark mode)

- UI: tuned grid pattern strokes to render white in dark mode (`src/components/ui/shadcn-io/grid-pattern/index.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Module header/stepper badge removal)

- UI: removed the module progress badge from the module header and the step count badge from the module stepper (`src/components/training/module-detail/module-header.tsx`, `src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper nav + deck trigger)

- UI: moved stepper previous/next controls to sit on either side of the step dots (`src/components/training/module-detail/module-stepper.tsx`).
- UI: relocated the slide deck dialog trigger above-left of the deck frame and removed the overlay trigger (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail/deck-viewer.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Deck dialog header controls)

- UI: added app-shell action buttons to the deck dialog overlay and improved the dialog framing/loading feedback (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail/deck-viewer.tsx`, `src/components/training/module-detail/deck-viewer/view.tsx`, `src/components/training/module-detail.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper dot status styling)

- UI: aligned module step dots with sidebar progress styling (dashed amber for in-progress, green check for complete, muted for not started) (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Electives separator)

- UI: added a sidebar separator above the Electives class entry in the accelerator list (`src/components/app-sidebar/classes-section.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Stepper header text)

- UI: replaced the step label with the module title/subtitle in the stepper header and centered the text (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Program card sizing)

- UI: removed the outer program preview wrapper in the roadmap shell and tightened ProgramCard spacing/hero aspect to reduce overall height (`src/components/roadmap/roadmap-shell.tsx`, `src/components/programs/program-card.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Accelerator overview polish)

- UI: fixed Shift+Enter soft breaks in the rich text editor and reworked accelerator overview layout, progress placement, and program builder card row (`src/components/rich-text-editor.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Quickstart placeholder)

- UI: replaced the quickstart code snippet with a compact placeholder card on the accelerator overview page (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Sidebar group alignment)

- UI: removed extra horizontal padding on accelerator sidebar groups to re-center the navigation list (`src/components/accelerator/accelerator-sidebar.tsx`, `src/components/app-sidebar/classes-section.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Program builder card height)

- UI: increased the accelerator program builder card row height to reduce cramped layouts (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Curriculum call card)

- UI: replaced the accelerator quickstart placeholder with a curriculum call scheduling card that surfaces the 4-call limit and upgrade tag (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/accelerator/accelerator-schedule-card.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Schedule card alignment)

- UI: centered the curriculum call card content for a more balanced layout (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Inline deck controls)

- UI: enabled slide deck overlay controls inside the step frame by rendering the full deck presentation inline and keeping render hooks active outside the dialog (`src/components/training/module-detail/deck-viewer.tsx`, `src/components/training/module-detail/deck-viewer/view.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Accelerator hydration fix)

- Fix: forced the accelerator overview page to render dynamically to prevent stale ISR markup mismatching the client bundle (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Accelerator nav active state)

- UI: pinned the overview nav highlight on `/accelerator` by ordering section visibility updates in the sidebar observer (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-08 — Codex session (Checklist sync)

- Docs: marked completed backlog items per latest status update in the checklist (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-08 — Codex session (Org documents expansion)

- UI/Data: expanded private documents to cover incorporation, bylaws, registration, good standing, W-9, and tax exempt certificates, and extended the document upload API to accept the new kinds (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/api/account/org-documents/route.ts`, `src/components/organization/org-profile-card/types.ts`).
- Data: added a migration to attach the Board Engagement handbook resource (`supabase/migrations/20260109180000_update_board_handbook_resource.sql`).
- Docs: marked the documents checklist and board resource as done (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-08 — Codex session (Notifications cleanup)

- UI: moved toast notifications to top-right and removed the placeholder comments tab from the notifications menu (`src/components/providers/app-providers.tsx`, `src/components/notifications/notifications-menu.tsx`).
- Docs: updated checklist statuses for people roles, notifications, and People action button label (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-09 — Codex session (Supporters foundations + logos)

- People: added a Supporters category (foundation/corporate supporters), including normalization keywords and color tokens (`src/lib/people/categories.ts`).
- Org profile: renamed the Supporters tab, split Supporters vs Volunteers sections, and updated the public profile to show supporters alongside volunteers (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/organization/org-profile-card/tabs/supporters-tab.tsx`, `src/components/organization/org-profile-card/public-card.tsx`).
- UI: render supporter logos in squared, contained avatars for supporter rows (`src/components/people/person-item.tsx`, `src/components/people/supporters-showcase.tsx`).
- Fix: add Supporters lane handling to the org chart canvas and guard unknown categories to avoid runtime crashes (`src/components/people/org-chart-canvas.tsx`).
- Docs: marked supporters/foundations item complete (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator sidebar active state)

- UI: only highlight the Accelerator sidebar group label when the current route starts with `/accelerator` (`src/components/app-sidebar.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (People drawer)

- UI: converted the People add/edit dialog into a right-side sheet tray (`src/components/people/create-person-dialog.tsx`).
- UI: refreshed the People drawer step layout with a progress header, cleaner spacing, and a pinned action bar (`src/components/people/create-person-dialog.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 hero flip words)

- UI: replaced the HomeTwo hero headline with a flip-words treatment and left-aligned copy within a centered container (`src/app/(public)/home2/page.tsx`, `src/components/ui/flip-words.tsx`).
- UI: widened the hero text column, switched the hero typography to Inter, and kept “with Coach House” on the same line (`src/app/(public)/home2/page.tsx`).
- UI: updated the first studio card title and swapped its icon to a training-focused glyph (`src/app/(public)/home2/page.tsx`).
- UI: retitled the coaching card to emphasize 1:1 expert sessions (`src/app/(public)/home2/page.tsx`).
- UI: updated the studio eyebrow copy to “Everything in one place” (`src/app/(public)/home2/page.tsx`).
- UI: set hero headline color treatment per theme and softened to regular weight (`src/app/(public)/home2/page.tsx`).
- UI: tightened hero tracking, reduced headline size, and bolded “Coach House” (`src/app/(public)/home2/page.tsx`).
- UI: refreshed hero subcopy to be more platform-forward and highlight funding roadmaps, discovery tools, and community (`src/app/(public)/home2/page.tsx`).
- UI: refined the hero subcopy to position Coach House as the platform for nonprofit founders through funder readiness (`src/app/(public)/home2/page.tsx`).
- UI: tightened the hero subcopy to a concise “platform for NFP founders and grassroots organizations” line (`src/app/(public)/home2/page.tsx`).
- UI: restored the full hero subcopy with the “from formation through funder readiness” clause (`src/app/(public)/home2/page.tsx`).
- UI: revised the hero subcopy to include founders, operators, and grassroots organizations with “formation to funding” language (`src/app/(public)/home2/page.tsx`).
- UI: centered the left-aligned hero group within the section container (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Public header scroll)

- UI: removed sticky positioning from the public header so it scrolls with the page (`src/components/public/public-header.tsx`).
- UI: restored sticky positioning with top spacing so the public header stays visible while scrolling (`src/components/public/public-header.tsx`).
- Fix: made the public header a server component to avoid hydration mismatches (`src/components/public/public-header.tsx`).
- Fix: removed the top-level overflow clipping in HomeTwo so the sticky public header can stay visible while scrolling (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home page copy cleanup)

- Copy: removed “studio” language across public home pages and updated metadata wording (`src/app/(public)/page.tsx`, `src/app/(public)/home/page.tsx`, `src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (News posts)

- Content: added three new news posts using the AI post layout as a template (`src/app/(public)/news/funding-roadmaps/page.tsx`, `src/app/(public)/news/formation-to-funding/page.tsx`, `src/app/(public)/news/grassroots-discovery/page.tsx`).
- UI: linked the HomeTwo library cards to the new posts and refreshed card copy (`src/app/(public)/home2/page.tsx`).
- UI: updated the News index sidebar cards to feature the new posts (`src/app/(public)/news/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 product highlights)

- UI: converted the HomeTwo news feature cards into compact product highlight cards with centered icons and new copy (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 scroll pacing)

- UI: introduced scroll-reveal sections and normalized vertical pacing across the HomeTwo layout (`src/components/public/section-reveal.tsx`, `src/app/(public)/home2/page.tsx`).
- UI: strengthened the scroll pacing with snap-friendly sections, a dedicated scroll container, and consistent section padding (`src/components/public/section-reveal.tsx`, `src/app/(public)/home2/page.tsx`).
- UI: increased section padding to keep main sections evenly spaced (`src/components/public/section-reveal.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Photo strip hero)

- UI: updated the first photo strip card to a vertical aspect and swapped in the provided avatar image (`src/app/(public)/home2/page.tsx`).
- UI: reduced the primary photo strip card width for a thinner vertical profile (`src/components/public/home2-photo-strip.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Flip words clipping)

- UI: removed overflow clipping on the flip-words container to prevent visible hard edges during blur transitions (`src/components/ui/flip-words.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 news header)

- UI: added a left-aligned News title above the HomeTwo news card grid (`src/app/(public)/home2/page.tsx`).
- UI: moved the partner proof paragraph above the product highlight cards (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Brand link cleanup)

- UI: removed the “Open image” link from brand asset previews (`src/components/organization/org-profile-card/shared.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 team callout)

- UI: stacked the “Meet the team” callout beside the photo strip and tightened the lead card width for a slimmer vertical profile (`src/app/(public)/home2/page.tsx`, `src/components/public/home2-photo-strip.tsx`).
- UI: overlayed the team callout on large screens so the photo strip stays aligned and doesn’t shift left (`src/app/(public)/home2/page.tsx`).
- UI: swapped the second photo strip card to the provided Joel image and matched its width/height to the main portrait card (`src/app/(public)/home2/page.tsx`).
- UI: restored the strip offset padding and ensured the strip layers above the callout text while scrolling (`src/app/(public)/home2/page.tsx`).
- Docs: noted landing page redesign progress in the checklist (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-09 — Codex session (Public header wordmark)

- UI: set the public header wordmark to Inter Black with a larger size for stronger branding (`src/components/public/public-header.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Photo strip image swap)

- UI: switched the Demo night photo strip card to the Joel PNG asset (`src/app/(public)/home2/page.tsx`).
- UI: made the photo strip full-bleed on the left while preserving the right bleed so the first card centers in the viewport (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 scroll video)

- Fix: restored the scroll animation for the Home2 video by listening to the page’s scroll container instead of the window (`src/components/public/home2-scroll-video.tsx`).
- Fix: removed per-frame video sampling and tightened the glow effect to reduce GPU/CPU load and prevent Chrome artifacting (`src/components/public/home2-scroll-video.tsx`).
- Fix: limited scroll updates to when the video section is intersecting the viewport for smoother 60fps scrolling (`src/components/public/home2-scroll-video.tsx`).
- Perf: preloaded the hero poster, deferred video fetching until the section nears the viewport, and switched to `preload="auto"` once loading is requested (`src/app/(public)/home2/head.tsx`, `src/components/public/home2-scroll-video.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 process cards)

- UI: wrapped the process step numbers in rounded cards with a badge-style step marker for clearer hierarchy (`src/app/(public)/home2/page.tsx`).
- UI: removed the redundant “3 steps” label from the process card header (`src/app/(public)/home2/page.tsx`).
- UI: reverted the process rows to plain layout while keeping only the step numbers in rounded badges (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 intro statement)

- UI: added a text-generate effect component and rewrote the intro statement as a title-sized section beneath the video (`src/components/ui/text-generate-effect.tsx`, `src/app/(public)/home2/page.tsx`).
- UI: tightened spacing between the hero video and the new intro section (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Program card grid)

- UI: darkened the program card grid pattern so the template state reads with more contrast (`src/components/programs/program-card.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator nav label)

- UI: renamed the accelerator sidebar “Home” link to “Return to dashboard” for clearer navigation (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Curriculum call section)

- UI: converted the curriculum call card to a horizontal shadcn-style layout and moved it into its own section above the program builder (`src/components/accelerator/accelerator-schedule-card.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- UI: hid the duplicate call card in the hero grid on large screens to keep a single primary section (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Program wizard tray)

- UI: replaced the program wizard dialog with a right-side sheet tray and reused it everywhere create/edit program is triggered (`src/components/programs/program-wizard.tsx`).
- UI: removed redundant close buttons inside wizard steps to align with the sheet chrome (`src/components/programs/program-wizard/steps/basics-step.tsx`, `src/components/programs/program-wizard/steps/schedule-step.tsx`, `src/components/programs/program-wizard/steps/funding-step.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator label styling)

- UI: restyled the accelerator group label as a proper sidebar menu button for consistent hover/active states (`src/components/app-sidebar.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 spacing)

- UI: nudged the “Who we are” section up to balance spacing between the video and the next block (`src/app/(public)/home2/page.tsx`).
- UI: increased spacing around the “Who we are” section and replaced the copy with the shorter headline using the text-generate effect (`src/app/(public)/home2/page.tsx`).
- UI: expanded default vertical padding for all Home2 sections to increase overall spacing (`src/components/public/section-reveal.tsx`).
- UI: increased the default section padding again to create more separation between the mid-page sections (`src/components/public/section-reveal.tsx`).
- UI: added extra padding and larger internal gaps for the Core offering, Everything in one place, Process, and News sections (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Roadmap editor + org chart + global search)

- Roadmap: enabled inline image uploads in the roadmap editor and added local draft persistence to prevent refresh data loss (`src/components/rich-text-editor.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Roadmap: moved section deletion into per-section overflow menus and added a mobile actions menu (`src/components/roadmap/roadmap-editor.tsx`).
- People: added category lane labels and refined the org chart skeleton to match the updated canvas (`src/components/people/org-chart-canvas.tsx`, `src/components/people/org-chart-skeleton.tsx`).
- Search: introduced a global Cmd+K search palette with navigation targets and wired it into dashboard/accelerator shells (`src/components/global-search.tsx`, `src/components/dashboard/dashboard-shell.tsx`, `src/components/accelerator/accelerator-shell.tsx`).
- Dependencies: added TipTap image extension (`package.json`, `package-lock.json`).
- Docs: updated checklist progress for onboarding, org chart, roadmap edits, and global search (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-09 — Codex session (Global search gating + styling)

- Search: gated accelerator results to accelerator context, added class/module indexing, and kept platform links outside the accelerator (`src/components/global-search.tsx`, `src/components/accelerator/accelerator-shell.tsx`, `src/components/dashboard/dashboard-shell.tsx`).
- UI: restyled the command palette to match the dark, rounded command UI pattern and extended command component options (`src/components/global-search.tsx`, `src/components/ui/command.tsx`).
- Docs: updated checklist notes for the global search progress (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator call card cleanup)

- UI: removed the duplicate curriculum call card from the overview grid and retitled the section label to “Book a meeting” (`src/app/(accelerator)/accelerator/page.tsx`).
- UI: aligned the schedule card eyebrow to the updated label (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator sidebar cleanup)

- UI: removed the inline curriculum search input from the accelerator sidebar header now that the global search palette is the primary entry (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Global search button sizing)

- UI: widened the header search trigger for a longer, more prominent pill (`src/components/global-search.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator sidebar spacing)

- UI: added a separator under the accelerator header links and pushed the “Return to dashboard” entry down slightly (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator return button styling)

- UI: removed the header separator, increased spacing above “Return to dashboard,” and styled it as a primary button (light/dark) (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Global search trigger spacing)

- UI: nudged the header search trigger spacing to tighten the icon position (`src/components/global-search.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 intro pacing)

- UI: switched the who-we-are headline to Inter, slowed the text-generate timing, and added extra bottom padding (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Sidebar accelerator progress)

- UI/Data: added an accelerator progress meter next to the main sidebar link, wired to module completion progress (`src/app/(dashboard)/layout.tsx`, `src/components/app-sidebar.tsx`, `src/components/app-sidebar/mobile-sidebar.tsx`, `src/components/dashboard/dashboard-shell.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Search icon spacing)

- UI: tightened left padding on the header search trigger so the icon sits closer to the edge (`src/components/global-search.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Search shortcut alignment)

- UI: moved the CMD+K badge to the right side of the header search trigger (`src/components/global-search.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator shell responsiveness)

- Layout: added min-width/height guards to the sidebar inset and accelerator shell to prevent clipping on resize, and tuned padding for small screens (`src/components/ui/sidebar.tsx`, `src/components/accelerator/accelerator-shell.tsx`).
- Layout: allowed the overview grid to shrink and adjusted support links to wrap earlier on narrow screens (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Roadmap program preview removal)

- UI/Data: removed the program preview card from the accelerator roadmap page (`src/app/(accelerator)/accelerator/roadmap/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Roadmap header relocation)

- UI: moved the strategic roadmap header into the accelerator shell header via the title portal and hid the inline header block (`src/app/(accelerator)/accelerator/roadmap/page.tsx`, `src/components/roadmap/roadmap-shell.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Search footer badge sizing)

- UI: fixed the command palette footer badge sizing so the “Enter” label stays within its pill (`src/components/global-search.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Accelerator documentation card)

- UI: repointed the library support card to the GitBook documentation and retitled it to “Documentation” (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-09 — Codex session (Home2 who-we-are cleanup)

- UI: removed the “Who we are” eyebrow so the text-generate effect stands alone in the HomeTwo intro section (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard dialog layout)

- UI: rebuilt the program wizard steps into a full-screen dialog frame with fixed header/footer actions, scrollable bodies, and mobile drawer styling (`src/components/programs/program-wizard/steps/basics-step.tsx`, `src/components/programs/program-wizard/steps/schedule-step.tsx`, `src/components/programs/program-wizard/steps/funding-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Accelerator sidebar progress)

- UI: replaced the linear accelerator progress meter with a circular indicator and removed the percentage label in the sidebar (`src/components/ui/circular-progress.tsx`, `src/components/app-sidebar.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Home2 process step badges)

- UI: switched the process step badges to rounded-square containers instead of circles on HomeTwo (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard dialog a11y)

- A11y/UI: added a hidden dialog title and ensured the program wizard dialog uses full-width sizing on desktop (`src/components/programs/program-wizard.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard image rounding)

- UI: rounded the program wizard cover image container corners in the Basics step (`src/components/programs/program-wizard/steps/basics-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard cover overlay removal)

- UI: removed the title/subtitle overlay from the program wizard cover preview (`src/components/programs/program-wizard/steps/basics-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard preview card removal)

- UI: removed the Basics step preview card from the program wizard sidebar column (`src/components/programs/program-wizard/steps/basics-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard subtitle placeholder)

- UI: updated the subtitle placeholder example to better match the sample program title (`src/components/programs/program-wizard/steps/basics-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard location summary removal)

- UI: removed the location summary card from the schedule step so the full address drives the summary (`src/components/programs/program-wizard/steps/schedule-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard CTA layout)

- UI: updated the CTA field placeholder, removed the https prefix addon, and prevented the CTA card from stretching tall with empty space (`src/components/programs/program-wizard/steps/funding-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Dialog hydration + funding import fix)

- A11y/UI: moved the command palette dialog title/description into the dialog content to avoid hydration ID mismatch (`src/components/ui/command.tsx`).
- Fix: restored missing input-group addons for currency inputs (`src/components/programs/program-wizard/steps/funding-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Accelerator overview ordering)

- Layout: moved the program builder section below the Start building progress section on the accelerator overview (`src/app/(accelerator)/accelerator/page.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard cover + description)

- UI/Data: rebuilt the cover upload area into a centered dropzone empty state and added a program description field, wiring it through the wizard + program writes (`src/components/programs/program-wizard/steps/basics-step.tsx`, `src/components/programs/program-wizard/schema.ts`, `src/components/programs/program-wizard.tsx`, `src/app/(dashboard)/my-organization/programs/actions.ts`, `src/components/organization/org-profile-card/types.ts`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/[org]/page.tsx`, `supabase/migrations/20260110154000_add_program_description.sql`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard publish toggle)

- UI: added a published/unpublished switch to the program wizard status card with public-sharing messaging (`src/components/programs/program-wizard/steps/basics-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Program wizard tag limits)

- UI: limited program tags to 3 entries and 17 characters each (`src/components/programs/program-wizard/tag-input.tsx`, `src/components/programs/program-wizard/steps/funding-step.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Home2 scroll-tied text reveal)

- UI: added a scroll-linked text reveal component for the “Changing the world…” section and increased its bottom spacing (`src/components/ui/scroll-text-reveal.tsx`, `src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Deck header cleanup)

- UI: removed the slide deck label pill from the deck viewer header overlay (`src/components/training/module-detail/deck-viewer/view.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Deck step dialog-only)

- UI: removed the inline deck preview/button and now auto-opens the deck dialog when the deck step is active (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail/deck-viewer.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Origin story CTA + copy tweak)

- UI/Content: added a “Book a session” CTA below the origin story coaching prompt and updated the follow-up bullet copy; includes a new migration to refresh lesson notes (`src/components/training/module-detail/lesson-notes.tsx`, `supabase/migrations/20260110170000_update_origin_story_notes.sql`, `supabase/seed.sql`).
- Tests: not run.

## 2026-01-10 — Codex session (Assignment step fit-to-content)

- UI: removed scrollable assignment frames so homework steps expand to fit the page content (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Homework description alignment)

- UI: left-aligned long-text homework labels and descriptions so they align with the prompt title (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Module completion CTA)

- UI: added a booking CTA in the completion card to schedule a coaching session (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Completion icon color)

- UI: forced the module completion celebration icon to render white in all themes (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Support menu)

- UI: swapped the Support button for a dropdown menu with Email + Book an expert session across dashboard/accelerator/module deck headers (`src/components/support-menu.tsx`, `src/components/accelerator/accelerator-shell.tsx`, `src/components/dashboard/dashboard-shell.tsx`, `src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Sidebar separator centering)

- UI: centered the sidebar separator within the sidebar content width for the electives divider (`src/components/ui/sidebar.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap editor layout)

- UI: reorganized the roadmap section editor into a single editor surface with top status/actions, inline visibility, and minimalist title/subtitle inputs to match a doc-style layout (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Scroll text reveal container)

- Fix: made the scroll-tied text reveal detect the nearest scroll container so it animates inside the Home2 scroll viewport (`src/components/ui/scroll-text-reveal.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (News card rounding)

- UI: increased the corner radius on News page gradient thumbnails and card shells for a softer look (`src/app/(public)/news/page.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Home2 scroll reveal)

- UI: swapped the Home2 statement to a GSAP-based scroll reveal and wired supporting styles (`src/components/ui/scroll-reveal.tsx`, `src/app/(public)/home2/page.tsx`, `src/components/ScrollReveal.css`, `src/app/globals.css`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap editor centering)

- UI: centered the roadmap editor column and offset the sections list to read as a left-side “ear” on large screens (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Home2 core offerings)

- UI: expanded the Home2 core offering cards to cover platform, community, documentation, and the NFP map with updated icon treatments (`src/app/(public)/home2/page.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap sections stepper)

- UI: restyled the roadmap sections sidebar into a stepper-style rail with progress colors and title/subtitle previews per section (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Inline deck restore)

- Fix: restored the inline slide deck viewer in module step 2 and removed the auto-opening dialog (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Budget table fit)

- UI: compacted the program budget table and auto-fit column widths to reduce scrolling (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Module routing + hydration fix)

- Fix: added accelerator-aware module links plus a safer module index fallback to stop 404s (`src/components/training/class-overview.tsx`, `src/components/training/class-overview/module-card.tsx`, `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`).
- Fix: render theme toggle during SSR to avoid SupportMenu hydration id mismatches (`src/components/accelerator/accelerator-shell.tsx`, `src/components/dashboard/dashboard-shell.tsx`, `src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.
