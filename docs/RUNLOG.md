# RUNLOG — Ad‑hoc Work History

Purpose: Track changes we’re making outside the formal PR stepper.

## 2026-02-16 — Codex session (tester rollout + pricing/access overhaul planning)

- Added consolidated execution brief for the new direction spanning tooling governance, pricing simplification, entitlements, onboarding/paywall flow, tutorials, and Stripe lifecycle validation (`docs/briefs/tester-rollout-pricing-access-overhaul.md`).
- Captured decision lock from product direction:
  - 3-tier model (`Free`, `$20/mo`, `$58/mo`)
  - remove Accelerator Pro/Base and elective-only purchase surfaces
  - include Accelerator in paid tiers
  - testers can access test/tutorial/payment tools but not seed actions.
- Updated brief index to mark the new consolidated brief as active and mark older pricing/electives briefs as superseded (`docs/briefs/INDEX.md`).
- Validation: docs-only planning pass (no test suite run in this step).

## 2026-02-16 — Codex session (WS1 tooling governance implementation)

- Added centralized devtools access policy + audience resolver:
  - `src/lib/devtools/access.ts`
  - `src/lib/devtools/audience.ts`
- Wired tester/admin audience through app shell + sidebar/user menu:
  - added `isTester` propagation through `AppShell` and `SidebarBody`
  - `NavUser` testing section now uses centralized policy controls
  - testers can access tutorial/onboarding/payment-playground tools
  - seed notifications remains admin-only
  - files: `src/components/app-shell.tsx`, `src/components/app-sidebar.tsx`, `src/components/nav-user.tsx`
- Updated server actions to allow tester-safe reset actions while preserving admin-only seed behavior:
  - `src/app/actions/tutorial.ts`
  - `src/app/actions/admin-testing.ts`
- Added tester flag support in schema + migration:
  - migration: `supabase/migrations/20260216183000_add_profiles_is_tester.sql`
  - schema types: `src/lib/supabase/schema/tables/profiles.ts`
- Updated dashboard and accelerator layouts to resolve and pass tester audience state:
  - `src/app/(dashboard)/layout.tsx`
  - `src/app/(accelerator)/layout.tsx`
- Made react-grab explicit opt-in in development (`NEXT_PUBLIC_ENABLE_REACT_GRAB=1` required):
  - `src/components/dev/react-grab-loader.tsx`

- Validation:
  - `pnpm exec eslint src/lib/devtools/access.ts src/lib/devtools/audience.ts src/components/nav-user.tsx src/components/app-sidebar.tsx src/components/app-shell.tsx 'src/app/(dashboard)/layout.tsx' 'src/app/(accelerator)/layout.tsx' src/app/actions/admin-testing.ts src/app/actions/tutorial.ts src/components/dev/react-grab-loader.tsx src/lib/supabase/schema/tables/profiles.ts` ✅
  - `pnpm test:acceptance tests/acceptance/onboarding.test.ts tests/acceptance/pricing.test.ts` ✅ (6 passed)

## 2026-02-07 — Codex session (demo-seed realism + fixture guardrails)

- Executed targeted full-account seed against staging Supabase for `caleb@bandto.com` with mixed progress and coaching variant (`pnpm seed:full-account --email caleb@bandto.com --variant with_coaching --progress mixed`), after dry-run fixture verification (`org_people_seeded: 161`).
- Seed run result: existing user updated (`created_user: no`) and account/org fixtures refreshed with deterministic launch dataset (`user_id: f59693c3-f357-4811-9348-dd93559d3c7e`, `public_slug: launch-qa-account-f59693`, `accelerator_variant: with_coaching`).
- Seed correction: executed targeted full-account seed for `caleb.hamernick@gmail.com` (existing user, no password rotation) with mixed progress/coaching variant (`pnpm seed:full-account --email caleb.hamernick@gmail.com --variant with_coaching --progress mixed`), resulting in refreshed launch dataset (`user_id: 807cda53-4787-4e9a-896c-2c623a367327`, `public_slug: launch-qa-account-807cda`, `created_user: no`).
- Seed script safety fix: existing-user runs no longer force password updates unless `--password` is explicitly provided; new-user path still generates a strong temporary password when omitted (`scripts/seed-full-account.mjs`).
- Seed script: upgraded full-account fixture consistency checks with roadmap status counts, required-core content depth checks, and stricter document shape validation (`scripts/seed-full-account.mjs`).
- Seed script: made profile seeding idempotent for existing users (role/headline/timezone/email/full name now upserted, not create-only) and propagated timezone to seeded member profiles (`scripts/seed-full-account.mjs`).
- Seed script: added idempotent onboarding response write (update-or-insert) and organization access settings seeding (`admins_can_invite`, `staff_can_manage_calendar`) with backward-compatible table-missing handling (`scripts/seed-full-account.mjs`).
- Seed script: fixed calendar seed rows to include real duration windows instead of zero-length start/end timestamps (`scripts/seed-full-account.mjs`).
- Tests: extended dry-run acceptance coverage to assert roadmap status reporting in the fixture output (`tests/acceptance/seed-full-account-dry-run.test.ts`).
- Docs: marked incremental queue item complete for this pass (`docs/briefs/accelerator-launch-active-worklog.md`).
- Docs: expanded readiness/journey spec with an operational evidence matrix, journey gap analysis, connection map, game-theory levers, and v1 completion checklist (`docs/briefs/accelerator-readiness-criteria-and-journey.md`, `docs/organize.md`, `docs/briefs/INDEX.md`).
- UX: removed residual `Locked` rendering from accelerator/sidebar progression surfaces by normalizing to `Not started` while preserving entitlement redirects at route level (`src/components/app-sidebar/classes-section.tsx`, `src/components/accelerator/accelerator-next-module-card.tsx`).
- WS-D QA pass: expanded tier-path acceptance coverage for checkout + onboarding:
  - pricing fallback routing for org/accelerator/elective modes (`tests/acceptance/pricing.test.ts`);
  - organization/elective checkout Stripe metadata assertions (`tests/acceptance/pricing-accelerator-checkout-metadata.test.ts`);
  - onboarding gate assertions for both completed and incomplete states (`tests/acceptance/onboarding.test.ts`).
- WS-D QA pass (continued): added route-level Stripe webhook acceptance coverage for lifecycle-critical scenarios (`tests/acceptance/stripe-webhook-route.test.ts`):
  - early monthly cancellation does not roll to Organization plan;
  - completed-installment cancellation does roll to Organization plan;
  - one-time accelerator purchase does not create duplicate Organization subscription when one is already active.
- WS-D QA pass (continued): expanded webhook route coverage (`tests/acceptance/stripe-webhook-route.test.ts`) for:
  - duplicate already-processed event idempotency short-circuit path;
  - `invoice.paid` monthly installment progression and `cancel_at_period_end` toggle at installment limit.
- WS-D QA pass (continued): added additional webhook edge-path coverage (`tests/acceptance/stripe-webhook-route.test.ts`) for:
  - duplicate event retry behavior when stored payload is still `processed=false`;
  - non-cycle invoice no-op path (no installment progression side effects).
- WS-D QA pass (continued): expanded webhook boundary/error coverage (`tests/acceptance/stripe-webhook-route.test.ts`) for:
  - missing stripe signature returns `400`;
  - non-duplicate idempotency lock failure returns `500 processing_failed`.
- WS-D QA pass (continued): added `customer.subscription.updated` transition assertions (`tests/acceptance/stripe-webhook-route.test.ts`):
  - `status=canceled` + completed installments triggers Organization rollover;
  - `status=active` does not trigger rollover.
- UI parity: updated accelerator board calendar layout/surface spacing to better match `/my-organization` calendar card rhythm (rounded container, internal panel cards, and consistent padding tokens) without changing behavior (`src/components/roadmap/roadmap-calendar.tsx`).
- QA hygiene: silenced expected webhook error-path console output in acceptance tests using a scoped `console.error` spy, keeping test logs clean while preserving behavior assertions (`tests/acceptance/stripe-webhook-route.test.ts`).
- WS-D QA pass (continued): added webhook subscription-mode checkout assertion (`checkout.session.completed` with `mode=subscription` upserts local subscription row with expected metadata) in `tests/acceptance/stripe-webhook-route.test.ts`.
- WS-D QA pass (continued): added additional webhook edge assertions in `tests/acceptance/stripe-webhook-route.test.ts`:
  - `customer.subscription.updated` with `status=past_due` does not roll to Organization plan;
  - one-time accelerator checkout without `customer` does not create Organization subscription.
- WS-D execution prep: added a concrete staging/pre-prod live verification runbook for billing lifecycle scenarios (`docs/briefs/accelerator-billing-lifecycle-qa-matrix.md`), including setup, scenario order, expected artifacts, and sign-off steps.
- Seed hardening: refactored full-account seed script to use centralized deterministic builders for org people/profile and added required org-profile key/shape validation to dry-run fixture checks (`scripts/seed-full-account.mjs`).
- Type hardening: removed `locked` from accelerator module progress source typing and normalized progress parsing to `not_started|in_progress|completed`, then cleaned residual lock branches in module card surfaces (`src/lib/accelerator/progress.ts`, `src/app/(dashboard)/my-organization/page.tsx`, `src/components/roadmap/roadmap-rail-card.tsx`, `src/components/accelerator/start-building-pager.tsx`, `src/components/accelerator/accelerator-next-module-card.tsx`).
- WS-D QA pass (continued): extended checkout metadata assertions for accelerator monthly `without_coaching` variant (`tests/acceptance/pricing-accelerator-checkout-metadata.test.ts`).
- Docs: updated QA matrix and active launch worklog to reflect the new coverage increment (`docs/briefs/accelerator-billing-lifecycle-qa-matrix.md`, `docs/briefs/accelerator-launch-active-worklog.md`).
- Docs: updated WS-D status to in-progress with clear remaining scope (live Stripe/Supabase execution pass) in the active launch worklog (`docs/briefs/accelerator-launch-active-worklog.md`).
- Ordering hardening: refined accelerator module ordering logic so known elective add-ons cannot be promoted by legacy elective-class index fallback, while preserving Formation-first fallback behavior for legacy unlabeled modules (`src/lib/accelerator/module-order.ts`).
- Tests: extended ordering acceptance coverage with reversed-legacy index scenario assertions to lock Formation-first behavior ahead of paid electives (`tests/acceptance/accelerator-module-order.test.ts`).
- Module UX: increased accelerator module rich-text assignment editor minimum height to match roadmap-depth expectations for long-form responses (`src/components/training/module-detail/assignment-form.tsx`).
- Org chart UX: added explicit interaction mode toggle (default `Pan`, optional `Move nodes`) and expanded canvas translate extent bounds so large org charts remain pannable and easier to reposition (`src/components/people/org-chart-canvas.tsx`).
- Pricing copy pass: refined Accelerator billing switch language (`Pay once` / `Pay monthly`) and updated included-feature copy to clearly describe Pro coaching flow (4 included sessions, then discounted link) and platform continuation terms across both option cards and the feature comparison table (`src/components/public/accelerator-option-card.tsx`, `src/components/public/pricing-surface.tsx`).
- Org chart stability pass: removed the `Pan` / `Move nodes` mode switch and disabled node dragging to avoid heavy runtime state churn; chart now uses deterministic hierarchy layout (reports-to relationships globally ordered), with explicit recenter control and optimized pan/zoom behavior (`src/components/people/org-chart-canvas.tsx`).
- Org chart overflow handling: added a safe canvas cap (`MAX_CANVAS_NODES=80`) and introduced below-canvas overflow cards grouped by category when records exceed chart density limits, so non-fit people are still cleanly organized and visible (`src/components/people/org-chart-canvas.tsx`).
- Validation:
  - `pnpm lint` (pass)
  - `pnpm lint src/components/app-sidebar/classes-section.tsx src/components/accelerator/accelerator-next-module-card.tsx` (pass)
  - `pnpm lint tests/acceptance/pricing.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/onboarding.test.ts` (pass)
  - `pnpm test:acceptance` (pass, 48 passed / 1 skipped)
  - `pnpm test:acceptance tests/acceptance/pricing.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/onboarding.test.ts` (pass, 10 passed)
  - `pnpm lint tests/acceptance/stripe-webhook-route.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts` (pass, 3 passed)
  - `pnpm lint tests/acceptance/stripe-webhook-route.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts` (pass, 5 passed)
  - `pnpm lint tests/acceptance/stripe-webhook-route.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts` (pass, 7 passed)
  - `pnpm lint tests/acceptance/stripe-webhook-route.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts` (pass, 9 passed)
  - `pnpm lint tests/acceptance/stripe-webhook-route.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts` (pass, 11 passed)
  - `pnpm test:acceptance` (pass, 53 passed / 1 skipped)
  - `pnpm test:acceptance` (pass, 56 passed / 1 skipped)
  - `pnpm test:acceptance` (pass, 58 passed / 1 skipped)
  - `pnpm test:acceptance` (pass, 60 passed / 1 skipped)
  - `pnpm test:acceptance` (pass, 62 passed / 1 skipped)
  - `pnpm test:acceptance` (pass, 64 passed / 1 skipped)
  - `pnpm lint` (pass)
  - `pnpm lint src/components/roadmap/roadmap-calendar.tsx` (pass)
  - `pnpm test:acceptance` (pass, 64 passed / 1 skipped)
  - `pnpm lint tests/acceptance/stripe-webhook-route.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts` (pass, 11 passed)
  - `pnpm test:acceptance` (pass, 64 passed / 1 skipped)
  - `pnpm lint tests/acceptance/stripe-webhook-route.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts` (pass, 12 passed)
  - `pnpm test:acceptance` (pass, 65 passed / 1 skipped)
  - `pnpm lint tests/acceptance/stripe-webhook-route.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts` (pass, 14 passed)
  - `pnpm test:acceptance` (pass, 67 passed / 1 skipped)
  - `pnpm lint scripts/seed-full-account.mjs tests/acceptance/seed-full-account-dry-run.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/seed-full-account-dry-run.test.ts` (pass)
  - `pnpm seed:validate` (pass)
  - `pnpm test:acceptance` (pass, 67 passed / 1 skipped)
  - `pnpm lint src/lib/accelerator/progress.ts 'src/app/(dashboard)/my-organization/page.tsx' src/components/roadmap/roadmap-rail-card.tsx src/components/accelerator/start-building-pager.tsx src/components/accelerator/accelerator-next-module-card.tsx` (pass)
  - `pnpm test:acceptance` (pass, 67 passed / 1 skipped)
  - `pnpm lint` (pass)
  - `pnpm test:snapshots` (pass, snapshots match)
  - `pnpm lint tests/acceptance/pricing-accelerator-checkout-metadata.test.ts` (pass)
  - `pnpm test:acceptance tests/acceptance/pricing-accelerator-checkout-metadata.test.ts` (pass, 5 passed)
  - `pnpm lint src/lib/accelerator/module-order.ts tests/acceptance/accelerator-module-order.test.ts src/components/training/module-detail/assignment-form.tsx` (pass)
  - `pnpm test:acceptance tests/acceptance/accelerator-module-order.test.ts` (pass, 4 passed)
  - `pnpm lint src/components/people/org-chart-canvas.tsx` (pass)
  - `pnpm lint src/components/public/accelerator-option-card.tsx src/components/public/pricing-surface.tsx` (pass)
  - `pnpm test:acceptance tests/acceptance/pricing.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts` (pass, 9 passed)
  - `pnpm lint src/components/people/org-chart-canvas.tsx src/components/people/org-chart-canvas-lite.tsx 'src/app/(dashboard)/people/page.tsx'` (pass)
  - `pnpm test:acceptance` (pass, 68 passed / 1 skipped)
  - `pnpm test:acceptance tests/acceptance/module-progress.test.ts` (pass)
  - `pnpm test:snapshots` (pass, snapshots match)
  - `pnpm test:rls` (fails in this environment: DNS `ENOTFOUND vswzhuwjtgzrkxknrmxu.supabase.co`)

## 2026-02-03 — Codex session (react-grab performance setup)

- React-grab now loads only when explicitly enabled in development via `NEXT_PUBLIC_ENABLE_REACT_GRAB=1` (disabled by default), reducing baseline dev sluggishness (`src/app/layout.tsx`).
- Updated script loading to pinned CDN versions with non-blocking strategies (`afterInteractive` + `lazyOnload`) instead of always loading before interactive (`src/app/layout.tsx`).
- Updated npm scripts so React-grab mode no longer depends on the failing `npx @react-grab/opencode` install path: `npm run dev:opencode` and `npm run dev:grab` both start dev with the env flag set (`package.json`).
- Moved react-grab injection into a client loader that skips iframe/embed contexts (`window.top !== window.self` and `?embed=1`) so canvas pages with embedded pricing/login no longer initialize react-grab twice (`src/components/dev/react-grab-loader.tsx`, `src/app/layout.tsx`).
- Tests: `npm run lint -- "src/app/layout.tsx"`.

## 2026-02-03 — Codex session (public home canvas preview)

- Refactored homepage sections into shared components so both the existing `/` home2 page and canvas preview reuse the same real content blocks (`src/components/public/home2-sections.tsx`, `src/app/(public)/home2/page.tsx`).
- Rebuilt `/home-canvas` to use internal shell styling with one section visible at a time, animated panel transitions, and off-frame sections hidden (`src/components/public/home-canvas-preview.tsx`).
- Added in-canvas panels for full `/pricing` and `/login` page content via embedded same-origin previews (`src/components/public/home-canvas-preview.tsx`).
- Sidebar section switching now uses in-canvas link targets + click handlers; removed the extra rail section label and added touch-swipe (up/down) navigation between sections (`src/components/public/home-canvas-preview.tsx`).
- Follow-up fixes: removed top header border in the canvas inset, dropped preview-only font override, fixed section state reset bug that blocked nav switching, and added drag/swipe gesture handling through Framer Motion (`src/components/public/home-canvas-preview.tsx`).
- Header alignment pass: matched the preview header structure to app-shell alignment (trigger + separator + title rail), and removed the uppercase eyebrow label text (`src/components/public/home-canvas-preview.tsx`).
- Mobile header pass: forced a single-row top rail layout so trigger/title/theme controls stay horizontally aligned on small screens (`src/components/public/home-canvas-preview.tsx`).
- Removed extra top/bottom canvas wrapper padding under the header to eliminate the visual gap between top rail and content panel (`src/components/public/home-canvas-preview.tsx`).
- Impact section fix: disabled ScrollReveal blur animation inside canvas mode so “We help non-profits raise money.” renders fully sharp immediately (`src/components/public/home2-sections.tsx`, `src/components/public/home-canvas-preview.tsx`).
- Gesture behavior pass: removed drag-follow movement so swipe no longer drags the canvas/top rail; section switching now stays snap-based with hidden panel transitions only (`src/components/public/home-canvas-preview.tsx`).
- Offerings panel alignment: centered the “What we do” section block within the canvas viewport instead of anchoring it toward the top (`src/components/public/home-canvas-preview.tsx`).
- Offerings card grid now uses the requested 3-column span pattern (hero card spans 3x2 with supporting cards in fixed row/col positions) for `Home2OfferingsSection` (`src/components/public/home2-sections.tsx`).
- Canvas inset spacing tweak: removed left wrapper gutter and restored bottom gap below the content panel (`src/components/public/home-canvas-preview.tsx`).
- Canvas inset spacing tweak #2: increased bottom gap to match the right-side content gutter by using the shared shell padding token (`src/components/public/home-canvas-preview.tsx`).
- Section alignment pass: centered additional canvas panels (`process`, `news`, `team`) vertically in the viewport using a consistent `min-h-full` + centered wrapper pattern (`src/components/public/home-canvas-preview.tsx`).
- Mobile canvas spacing pass: restored balanced left/top/right/bottom outer padding on small screens while preserving desktop-specific gutter behavior (`src/components/public/home-canvas-preview.tsx`).
- Team carousel fix: updated `Home2PhotoStrip` to support container-centered spacers (instead of viewport-centered spacers) and enabled that mode for canvas rendering so cards appear correctly in the Team section (`src/components/public/home2-photo-strip.tsx`, `src/components/public/home2-sections.tsx`).
- Embedded page panel simplification: removed the extra header row/card chrome in pricing/sign-in canvas views so the page content renders directly in the main canvas area (`src/components/public/home-canvas-preview.tsx`).
- Pricing embed mode: added `?embed=1` handling to hide `PublicHeader` and tighten top spacing when rendered inside the canvas iframe; canvas pricing panel now loads `/pricing?embed=1` (`src/app/(public)/pricing/page.tsx`, `src/components/public/home-canvas-preview.tsx`).
- Home-canvas header update: moved sign-in access into the right side of the top rail and removed the sidebar sign-in section item (`src/components/public/home-canvas-preview.tsx`).
- Home-canvas auth entry update: sign-in button now performs a full-page navigation to `/login` (no in-canvas embedding); existing `/login` behavior still redirects signed-in users into the app (`src/components/public/home-canvas-preview.tsx`, `src/app/(auth)/login/page.tsx`).
- Tests: `npm run lint -- "src/app/(public)/home2/page.tsx" "src/components/public/home2-sections.tsx" "src/components/public/home-canvas-preview.tsx" "src/app/(public)/home-canvas/page.tsx"`.

## 2026-02-03 — Codex fix (roadmap params promise)

- Roadmap section page: await route params to satisfy Next.js async params requirement (`src/app/(dashboard)/roadmap/[slug]/page.tsx`).
- Tests: not run.

## 2026-01-27 — Codex session (presentation deck)

- Added an 8-slide, full-screen `/presentation` deck with keyboard + button navigation, product demo facsimiles, and a final CTA linking to the live homepage (`src/app/(public)/presentation/page.tsx`, `src/components/presentation/presentation-deck.tsx`).
- Updated the deck to an investor-style product update with launch blockers + roadmap, removed nested card wrappers, added logo header, and integrated the Paper Design dithering shader as an isolated orb accent (`src/components/presentation/presentation-deck.tsx`).
- Refined the intro slide to a black split layout with the orb on the right, reduced uppercase/tracking styles, and simplified the header tone (`src/components/presentation/presentation-deck.tsx`).
- Enlarged the orb, removed its container chrome, centered the intro layout grouping, and removed the header right-side label (`src/components/presentation/presentation-deck.tsx`).
- Increased orb size again, set shader canvas to 640×640, and tightened the intro text/orb spacing (`src/components/presentation/presentation-deck.tsx`).
- Removed orb cropping by dropping the circular container and scaling it responsively while tightening the intro gap (`src/components/presentation/presentation-deck.tsx`).
- Deleted the `/presentation` page and its deck component after the meeting and removed the shader dependency (`src/app/(public)/presentation/page.tsx`, `src/components/presentation/presentation-deck.tsx`, `package.json`).
- Tests: `pnpm lint`.

## 2026-01-27 — Codex session (roadmap landing polish)

- Roadmap landing: added section icon squares above each card, removed phase eyebrow labels, removed public roadmap link, and moved pagination controls above the rail; StepperRail now supports a roadmap variant with spread-out icon squares (`src/components/roadmap/roadmap-landing.tsx`, `src/components/ui/stepper-rail.tsx`).
- Roadmap page: removed the duplicate “Open roadmap editor” link below the landing header (`src/app/(dashboard)/roadmap/page.tsx`).
- Tests: `pnpm lint`.

## 2026-01-27 — Codex session (roadmap rail content)

- Roadmap landing: moved title/subtitle into the rail steps so the icon squares and copy live in a single row, and wired step clicks to route into sections (`src/components/roadmap/roadmap-landing.tsx`, `src/components/ui/stepper-rail.tsx`).
- Tests: `pnpm lint`.

## 2026-01-27 — Codex session (calendar feed tokens)

- Calendar: fixed feed token result narrowing to return `{ error }` only when present (`src/actions/roadmap-calendar.ts`).
- Tests: `pnpm lint`.

## 2026-01-27 — Codex session (roadmap delete notification)

- Roadmap: removed an invalid public-share notification from section delete action (fixed TS error) (`src/actions/roadmap.ts`).

## 2026-01-27 — Codex session (roadmap header width)

- Roadmap: restored header max-width alignment to match editor body by applying the same `contentMaxWidth` container (`src/components/roadmap/roadmap-section-panel.tsx`).
## 2026-01-27 — Codex session (roadmap landing stepper)

- Roadmap landing: removed eyebrow, retitled to “Launch Roadmap”, and swapped the timeline to the shared StepperRail with 4-step pagination and card grid (`src/components/roadmap/roadmap-landing.tsx`, `src/components/ui/stepper-rail.tsx`).
- Module stepper: now renders the rail via StepperRail to keep roadmap checkpoint icons consistent (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: `pnpm lint`.

## 2026-01-27 — Codex session (roadmap checkpoints in modules)

- Module UX: render roadmap-linked prompts with Roadmap-style header/status/editor chrome and editable status selector using explicit `roadmap_section` flags (`src/components/training/module-detail/assignment-form.tsx`, `src/lib/roadmap.ts`, `src/lib/modules/types.ts`, `src/lib/modules/assignment.ts`).
- Module UX: stepper uses roadmap flags instead of org_key and shows a green Waypoints icon for completed roadmap steps (`src/components/training/module-detail/module-stepper.tsx`).
- Data: added migration to tag roadmap-linked assignment fields (`supabase/migrations/20260127223000_add_roadmap_section_markers.sql`).
- Lint fixes: resolved conditional hooks and missing imports in the sidebar classes section; cleaned up icon a11y and module variable naming; aligned roadmap editor deps; corrected accelerator copy (`src/components/app-sidebar/classes-section.tsx`, `src/components/tiptap/toolbars/image-placeholder-toolbar.tsx`, `src/lib/modules/service.ts`, `src/components/roadmap/roadmap-editor.tsx`, `src/app/(accelerator)/accelerator/page.tsx`, `src/components/global-search.tsx`).

## 2026-01-27 — Codex session (roadmap mapping audit)

- Audited roadmap-to-module linkage sources (`docs/progression-system-map.md`, `src/lib/roadmap.ts`, `src/lib/roadmap/homework.ts`) after reviewing `AGENTS.md` and `docs/organize.md`; confirmed only six roadmap sections are wired to module homework; no code changes.
- Next: draft a brief + full mapping table if you want copy-aligned prompts for every roadmap section.
- Drafted `docs/briefs/roadmap-module-mapping.md` and indexed it for implementation sequencing.

## 2026-01-27 — Codex session (roadmap mapping implementation)

- Roadmap: removed the Strategic Roadmap section definition, filtered legacy strategic-roadmap entries, and updated TOC grouping to reflect section-only roadmap content (`src/lib/roadmap.ts`, `src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/roadmap-icons.tsx`, `src/components/roadmap/roadmap-outline-card.tsx`).
- Roadmap: default edit fallback now targets `/roadmap/origin-story` (`src/app/(dashboard)/roadmap/page.tsx`).
- Roadmap homework: remapped section IDs to module targets across the curriculum and added index fallbacks (`src/lib/roadmap/homework.ts`).
- Curriculum mapping: documented new section mappings and checklist counts, and removed Strategic Roadmap as a section (`docs/progression-system-map.md`).
- Data: added migration to align module prompt copy to roadmap sections, add missing prompts, and remove the origin-story org_key sync (`supabase/migrations/20260127210000_map_roadmap_module_prompts.sql`).

## 2026-01-27 — Codex session (Bento grid ordering)

- Marketing: moved the full-width community highlight card to the top of the Home Two bento grid so the longest tile leads the layout (`src/app/(public)/home2/page.tsx`).
- Marketing: swapped bento tile sizing so the nonprofit platform leads, placed the community card beneath it, moved the arrow to a subtle top-right badge, and refreshed the process copy to Formation → Roadmap → Funding readiness (`src/app/(public)/home2/page.tsx`).
- Module UX: limited roadmap flag icons to assignment steps that map to roadmap-linked org profile fields and removed the checkpoint dialog (`src/components/training/module-detail/module-stepper.tsx`).
- Module UX: removed the non-roadmap dot so non-roadmap steps render as empty circles (`src/components/training/module-detail/module-stepper.tsx`).
- Module UX: skipped rendering the stepper icon wrapper when no icon is present to keep non-roadmap steps fully empty (`src/components/training/module-detail/module-stepper.tsx`).
- Module UX: numbered non-roadmap assignment steps in the module stepper while keeping roadmap flags for org-linked prompts (`src/components/training/module-detail/module-stepper.tsx`).
- Module UX: replaced roadmap flags with the Strategic Roadmap (Waypoints) icon (`src/components/training/module-detail/module-stepper.tsx`).
- Module UX: initialize module stepper state on the server-safe default to avoid hydration mismatches before syncing from session storage (`src/components/training/module-detail/module-stepper.tsx`).
- Module UX: numbered all steps (video/notes/resources/assignments/complete), used Waypoints only for roadmap-linked assignment steps, and removed boilerplate from the roadmap mapping set (`src/components/training/module-detail/module-stepper.tsx`).

## 2026-01-19 — Codex session (Shell polish, progress integrity, admin rebuild)

- Shell: tightened AppShell spacing, removed header separator, synced right-rail width to sidebar, and slimmed sidebar width for a more unified rail layout (`src/components/app-shell.tsx`, `src/components/ui/sidebar.tsx`).
- Shell: hid the header brand on collapsed rail, added a collapsed-state rail toggle in the left nav, and reintroduced a right-edge gap when no right rail is present with symmetric mobile padding (`src/components/app-shell.tsx`, `src/components/app-sidebar.tsx`).
- Shell: moved the collapsed-state expand toggle into the top rail with a separator ahead of breadcrumbs (`src/components/app-shell.tsx`, `src/components/app-sidebar.tsx`).
- Shell: animated the header brand/toggle transitions and applied an inverted theme toggle style to the sidebar trigger button (`src/components/app-shell.tsx`).
- Shell: restored the left collapsed toggle styling to the neutral button treatment (`src/components/app-shell.tsx`).
- Modules: moved module-level back/next navigation into the right rail below the module list (`src/components/app-sidebar/classes-section.tsx`).
- Admin: avoid schema-cache join errors by fetching enrollments/subscriptions separately for the admin users list (`src/lib/admin/users.ts`).
- Shell: fixed right-rail toggle to respect user collapse/expand and stopped auto-reopening while keeping auto-close when content disappears (`src/components/app-shell.tsx`).
- Accelerator: “Next up” CTA now routes directly to the next module instead of class landing pages (`src/app/(accelerator)/accelerator/page.tsx`).
- Shell: aligned left/right header toggles to the shell container edges and moved header actions into the centered rail (`src/components/app-shell.tsx`).
- Shell: swapped header toggle icons to panel-left/panel-right open/close variants (`src/components/ui/sidebar.tsx`, `src/components/app-shell.tsx`).
- UI: tightened accelerator/community/news spacing for the unified shell layout (`src/app/(accelerator)/accelerator/page.tsx`, `src/app/(dashboard)/community/loading.tsx`, `src/app/(dashboard)/news/*/page.tsx`).
- UI: removed the nested Card chrome from the My Organization profile container so it renders directly in the shell (`src/components/organization/org-profile-card/org-profile-card.tsx`).
- Shell: slightly widened the left rail so “My Organization” stays on one line (`src/components/ui/sidebar.tsx`).
- Progress: merged assignment submissions into module progress mapping for accelerator and class views, fixed “Next Up” selection + accelerator class link, and revalidated accelerator routes on progress changes (`src/lib/accelerator/progress.ts`, `src/lib/modules/service.ts`, `src/app/(accelerator)/accelerator/page.tsx`, `src/app/(admin)/admin/classes/actions/utils.ts`).
- Notifications: class-completion notification now uses module progress + submissions for accuracy (`src/app/api/modules/[id]/assignment-submission/route.ts`).
- Admin: rebuilt admin dashboard/progress/subscriptions pages, added data helpers, updated admin nav/search, and refreshed breadcrumbs + date formatting (`src/app/(admin)/admin/page.tsx`, `src/app/(admin)/admin/progress/page.tsx`, `src/app/(admin)/admin/subscriptions/page.tsx`, `src/lib/admin/progress.ts`, `src/lib/admin/subscriptions.ts`, `src/components/app-sidebar.tsx`, `src/components/app-sidebar/nav-data.ts`, `src/components/global-search.tsx`, `src/app/(admin)/@breadcrumbs/admin/**`, `src/app/(admin)/admin/users/page.tsx`, `src/app/(admin)/admin/users/[id]/page.tsx`).

## 2026-01-16 — Codex session (Budget table UX + CSV template)

- Brief: added and completed the budget table UX brief (`docs/briefs/budget-table-ux.md`).
- UI: redesigned the budget table header/toolkit with a 3-step guide, quick add categories, subtotal panel, and CSV download (`src/components/training/module-detail/assignment-form.tsx`).
- UI: removed the accelerator full-bleed offset so the budget table stays centered and avoids clipping (`src/components/training/module-detail/assignment-form.tsx`).
- UI: made the budget table description textarea fill its table cell and match dark-mode cell color (`src/components/training/module-detail/assignment-form.tsx`).
- UI: moved the budget steps into the description callout and rebuilt the subtotal row as a horizontal single-column block under the intro (`src/components/training/module-detail/assignment-form.tsx`).
- UI: made the desktop budget table full-bleed within the app shell so it reaches both edges (`src/components/training/module-detail/assignment-form.tsx`).
- Fix: moved budget guide definitions above the callout to avoid a TDZ runtime error (`src/components/training/module-detail/assignment-form.tsx`).
- UI: removed quick-add categories, unified budget card radii, and matched the subtotal panel to the sidebar background (`src/components/training/module-detail/assignment-form.tsx`).
- UI: matched the budget table description textarea height to the row so it fills the cell without extra gap (`src/components/training/module-detail/assignment-form.tsx`).
- Fix: stop budget rows from disappearing by only resetting values when the module or saved data changes (`src/components/training/module-detail/assignment-form.tsx`).
- UI: updated the subtotal actions to “Add Item” and a download icon button (`src/components/training/module-detail/assignment-form.tsx`).
- UI: expanded the budget table cell sizing so inputs and textareas fill each cell and wrap with centered alignment (`src/components/training/module-detail/assignment-form.tsx`).
- UI: removed the mobile card layout so the budget table is used on all screen sizes (`src/components/training/module-detail/assignment-form.tsx`).
- Assets: added a downloadable CSV template for offline budgeting (`public/templates/budget-template.csv`).
- Docs: updated brief index and NOW checklist (`docs/briefs/INDEX.md`, `docs/organize.md`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance` (punycode warnings), `pnpm test:rls`.

## 2026-01-16 — Codex session (Coaching booking standardization)

- Brief: added and completed the coaching booking brief (`docs/briefs/coaching-booking.md`).
- Meetings: shifted scheduling to Accelerator entitlements (free → discounted → full) with new env-based links and legacy fallback (`src/app/api/meetings/schedule/route.ts`, `src/lib/meetings.ts`, `src/lib/env.ts`).
- UI: standardized booking CTAs + pricing context and centralized scheduling logic in a shared hook (`src/hooks/use-coaching-booking.ts`, `src/components/dashboard/dashboard-checkin-card.tsx`, `src/components/accelerator/accelerator-schedule-card.tsx`, `src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail/lesson-notes.tsx`, `src/components/support-menu.tsx`, `src/app/(dashboard)/dashboard/page.tsx`).
- Docs: updated brief index + NOW checklist (`docs/briefs/INDEX.md`, `docs/organize.md`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance` (punycode warnings), `pnpm test:rls`.

## 2026-01-15

- Org access: Added P0 brief for multi-account org access (`docs/briefs/multi-account-org-access.md`).
- Supabase: Pushed membership-aware RLS + invite gating (owner toggle for `admins_can_invite`) + storage policies via `20260115220000_multi_account_org_access.sql` (`supabase/migrations/20260115220000_multi_account_org_access.sql`).
- App: Added active-org resolver and refactored org pages/actions/APIs to use `orgId` (members can view; staff/admin can edit; board read-only) (`src/lib/organization/active-org.ts`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/(dashboard)/people/page.tsx`, `src/components/roadmap/roadmap-editor.tsx`, `src/app/actions/organization-access.ts`).
- Search + helpers: Ensured org context uses active org for search, homework assist, meeting requests, and people position reset (`src/app/api/search/route.ts`, `src/app/api/homework/assist/route.ts`, `src/app/api/meetings/schedule/route.ts`, `src/app/api/people/position/reset/route.ts`).
- Tests: Expanded RLS test coverage for org memberships (staff vs board), invite toggle behavior, and staff/board subscription visibility (`supabase/tests/rls.test.mjs`). Ran `pnpm lint && pnpm test:snapshots && pnpm test:acceptance && pnpm test:rls`.
- Follow-up: No org switcher UI yet; membership selection is “first membership wins” until we add an org picker.

## 2026-01-16

- Tutorial: Fixed highlight overlay corner mismatch by deriving cutout radius from the highlighted element (prevents the “sharp corner” overlay artifact) (`src/components/tutorial/highlight-tour.tsx`).
- Accelerator: Added the same Welcome/tutorial modal behavior used on the platform shell, driven by user metadata state (`src/app/(accelerator)/layout.tsx`, `src/components/accelerator/accelerator-shell.tsx`).
- Admin: Added `/admin` index redirect to `/admin/academy` and updated auth redirect target (`src/app/(admin)/admin/page.tsx`, `src/lib/admin/auth.ts`).
- Notifications: Made the per-item unread dot use `bg-destructive` so it’s consistently red (`src/components/notifications/notifications-menu.tsx`).
- Validation: Ran `pnpm lint && pnpm test:snapshots && pnpm test:acceptance && pnpm test:rls`.
- Tutorial: Updated Accelerator Welcome checklist copy, added a Return home callout, and inserted a matching tour step (`src/components/onboarding/onboarding-welcome.tsx`, `src/components/tutorial/tutorial-manager.tsx`, `src/components/accelerator/accelerator-sidebar.tsx`).
- Welcome: Hid the platform “Upgrade when you’re ready to publish” checklist item when the org has an active/trialing subscription (`src/app/(dashboard)/layout.tsx`, `src/components/dashboard/dashboard-shell.tsx`, `src/components/onboarding/onboarding-welcome.tsx`).
- UI: Made the Welcome modal + tutorial tooltip theme-aware (light/dark) by swapping hard-coded dark colors for shadcn tokens (`src/components/onboarding/onboarding-welcome.tsx`, `src/components/tutorial/highlight-tour.tsx`).
- Validation: Ran `pnpm lint && pnpm test:snapshots && pnpm test:acceptance && pnpm test:rls`.
- Planning: Captured meeting notes into `docs/organize.md` as structured decisions + launch checklist tasks + batchable UI backlog items.
- Planning: Updated `docs/organize.md` with clarified decisions (Accelerator $499 one-time vs $58/mo installment, coaching scheduling via 3 calendar links, doc sharing via signed links).
- Planning: Locked Accelerator installment details (6 months; bundles Organization; single-user license; cancellations/no-shows handled manually for now) in `docs/organize.md`.
- Docs: Added `docs/GO.md`, added `docs/briefs/INDEX.md`, and added a `docs/organize.md` “NOW (Next 3)” block + explicit “BLOCKS IMPLEMENTATION” decision list.

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

## 2026-01-10 — Codex session (CI lint fixes)

- Fix: resolved Next lint issues around variable naming and hook deps (`src/lib/roadmap/homework.ts`, `src/components/training/module-detail/module-stepper.tsx`, `src/components/roadmap/roadmap-editor.tsx`, `src/components/public/home2-scroll-video.tsx`, `src/components/organization/org-profile-card/tabs/documents-tab.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Vercel build fix)

- Fix: import `randomUUID` for enrollment invite token generation to satisfy typecheck (`src/app/(admin)/admin/classes/[id]/actions.ts`).
- Tests: not run.

## 2026-01-10 — Codex session (Build/typing follow-ups)

- Fix: replace Edge-unsafe `randomUUID` import with `randomId` helper and restore missing mobile sidebar prop (`src/app/(admin)/admin/classes/[id]/actions.ts`, `src/components/app-sidebar/mobile-sidebar.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Dashboard sidebar prop)

- Fix: pass `isAcceleratorActive` into the desktop dashboard sidebar body to satisfy types (`src/components/dashboard/dashboard-shell.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Home2 scroll video typing)

- Fix: corrected scroll-parent detection typing so IntersectionObserver roots never receive `window` (`src/components/public/home2-scroll-video.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap preview typing)

- Fix: added a null `imageUrl` to the fallback program preview so ProgramCard props typecheck (`src/components/roadmap/roadmap-shell.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Scroll text reveal typing)

- Fix: aligned scroll reveal offset typing with Motion's `useScroll` options to satisfy TS (`src/components/ui/scroll-text-reveal.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Lesson wizard options typing)

- Fix: guard lesson wizard field options so budget-table rows are preserved and string trimming only runs on string options (`src/hooks/lessons/use-lesson-wizard.ts`).
- Tests: not run.

## 2026-01-10 — Codex session (Assignment frame cleanup)

- UI: removed the StepFrame wrapper around stepper assignments so questions sit directly in the module layout, and removed the “Last saved” line from assignment forms (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Origin story split)

- Data: split the origin-story “why” prompt into two distinct questions, preserved any prior answers into both new fields, and updated seeds (`supabase/migrations/20260110191500_split_origin_story_questions.sql`, `supabase/seed.sql`).
- Docs: updated the checklist copy to reflect the split (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Completion CTA order)

- UI: moved the “Book a session” completion CTA below the next-step buttons in the module completion card (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Budget table width)

- UI: widened the program budget table container at larger breakpoints so more columns fit without scrolling (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Budget table inputs)

- UI: made budget table inputs visually borderless/transparent until focused (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Budget table full-bleed)

- UI: allow the program budget table to extend edge-to-edge within the accelerator shell on large screens (`src/components/training/module-detail/assignment-form.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Budget table overflow + inputs)

- UI: switched budget table inputs to underline-only styling, added internal horizontal scrolling for the table, and hid horizontal page overflow in the accelerator shell (`src/components/training/module-detail/assignment-form.tsx`, `src/components/accelerator/accelerator-shell.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap editor header)

- UI: removed the roadmap editor header card styling, dropped saved/updated metadata, and reduced the section title size (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap rail alignment)

- UI: offset the roadmap rail to align with the step dot centers (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap input padding)

- UI: added subtle left padding to the roadmap title and subtitle inputs so the text breathes from the edge (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap editor footer)

- UI: removed the Shift+Enter soft-break tip from the rich text editor footer (`src/components/rich-text-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap editor label)

- UI: removed the “Section details” label above the roadmap section editor inputs (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Public grid background)

- UI: fixed public org/roadmap dot-grid backgrounds to be fixed on html/body and removed the per-page grid wrapper backgrounds (`src/components/organization/public-org-body-background.tsx`, `src/app/[org]/page.tsx`, `src/app/[org]/roadmap/page.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap template guidance)

- UI/Data: separated roadmap template titles/subtitles from user inputs, added example placeholders, and updated dirty-state comparisons accordingly (`src/lib/roadmap.ts`, `src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap input placeholders)

- UI: switched roadmap title/subtitle placeholders back to “Title” and “Add a subtitle”, and normalized the editor placeholder to “Start writing...” (`src/components/roadmap/roadmap-editor.tsx`, `src/lib/roadmap.ts`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap actions menu)

- UI: consolidated roadmap share/view actions into a three-dots menu and removed the standalone “View live” button from the visibility toggle (`src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/roadmap-visibility-toggle.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap section header copy)

- UI: renamed the roadmap sidebar header label to “Roadmap” (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap toolbar background)

- UI: removed the muted background behind the rich text editor toolbar so it blends into the page (`src/components/rich-text-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap input padding v2)

- UI: increased left padding on roadmap title/subtitle inputs for more breathing room (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Deck step frame)

- UI: wrapped the module deck step in the shared StepFrame and passed through `hasDeck` so the inline viewer has a fixed height and respects actual deck availability (`src/components/training/module-detail/module-stepper.tsx`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap visibility row)

- UI: restyled the roadmap visibility toggle to Live/Offline with a dashed item shell and aligned it with the save/actions row (`src/components/roadmap/roadmap-visibility-toggle.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Docs: tracked the roadmap visibility update (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap card layout)

- UI: reworked the roadmap outline + editor into two responsive card containers that stack on small screens and sit side-by-side on larger screens (`src/components/roadmap/roadmap-editor.tsx`).
- Docs: updated the visual checklist (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap template card + toolbar placement)

- UI: moved the rich-text toolbar above the title inputs, added a dashed template card with section icons, and removed the main editor card wrapper for a more document-like layout (`src/components/rich-text-editor.tsx`, `src/components/roadmap/roadmap-editor.tsx`, `src/app/(accelerator)/accelerator/roadmap/page.tsx`).
- Docs: logged updates (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap editor surface)

- UI: matched the roadmap editor background to the page and applied input-like corner radius on the ProseMirror surface (`src/components/rich-text-editor.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Docs: tracked the update (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap title/subtitle growth)

- UI: converted roadmap title/subtitle inputs to auto-growing textareas with character limits (`src/components/roadmap/roadmap-editor.tsx`).
- Docs: updated checklist (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap outline width)

- UI: expanded roadmap outline items to fill the full width of the outline card (`src/components/roadmap/roadmap-editor.tsx`).
- Docs: updated the visual checklist (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap top alignment)

- UI: aligned the outline card top with the section guidance block on large screens (`src/components/roadmap/roadmap-editor.tsx`).
- Docs: updated checklist (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap editor placeholder)

- UI: restored TipTap placeholder visibility when the editor is empty (`src/app/globals.css`).
- Docs: updated checklist (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-10 — Codex session (Roadmap outline alignment + draft sync)

- UI: aligned the outline card with the title input row using a two-row grid layout and tightened column spacing (`src/components/roadmap/roadmap-editor.tsx`).
- UI: new sections now start blank with template guidance, and outline titles/subtitles reflect draft edits before saving (`src/components/roadmap/roadmap-editor.tsx`).
- Docs: updated checklist (`docs/updates_edits.md`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap outline actions layout)

- UI: moved the section actions trigger into the outline row container and expanded the row to full width (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap editor background)

- UI: matched TipTap editor background to the word-count footer (`src/components/rich-text-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (TipTap placeholder color)

- UI: matched TipTap empty-state placeholder color to the subtitle textarea tone (`src/app/globals.css`).
- Tests: not run.

## 2026-01-11 — Codex session (Item card background)

- UI: set Item card background to #FAFAFA (`src/components/ui/item.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap item background override)

- UI: set roadmap outline card background to #FAFAFA (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap sidebar card background)

- UI: set roadmap sidebar card background to #FAFAFA (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (TipTap editor background match)

- UI: set TipTap editor background to #FAFAFA (`src/components/rich-text-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap selection color)

- UI: matched active roadmap row background/text to sidebar active color (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Sidebar hover contrast)

- UI: softened sidebar menu hover text color to a dark grey using sidebar foreground tokens (`src/components/ui/sidebar.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap toolbar shadow)

- UI: softened roadmap editor toolbar shadow (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap autosave + placeholder)

- UX: removed title-required guard for saving, added 10s autosave loop for dirty drafts (`src/components/roadmap/roadmap-editor.tsx`).
- UI: aligned TipTap placeholder color with textarea placeholder and applied to any empty paragraph (`src/app/globals.css`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap visibility actions)

- UI: removed the mobile section actions dropdown in the roadmap header and added a public link icon button beside the live/offline switch (`src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/roadmap-visibility-toggle.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap save label)

- UI: switched the roadmap save button to show “Saved” when there are no unsaved changes (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Public link button placement)

- UI: moved the public link icon button outside the status pill, positioned to the right (`src/components/roadmap/roadmap-visibility-toggle.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (TipTap placeholder grey)

- UI: softened TipTap placeholder text to a grey tone (`src/app/globals.css`).
- Tests: not run.

## 2026-01-11 — Codex session (Textarea placeholder)

- UI: softened textarea placeholder color to muted foreground at 70% for consistency (`src/components/ui/textarea.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap placeholder override)

- UI: forced roadmap title/subtitle placeholder color to a consistent grey in both themes (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap dark backgrounds)

- UI: added dark-mode background overrides for roadmap sidebar card and outline item (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap item icon background)

- UI: set the roadmap item icon container background to white (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Sidebar button tokens)

- UI: aligned sidebar menu button base/hover text colors with sidebar tokens for light mode visibility (`src/components/ui/sidebar.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Sidebar hover text tone)

- UI: lightened sidebar hover text color to a lighter grey (`src/components/ui/sidebar.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Return to dashboard styles)

- UI: aligned the Accelerator sidebar return button to sidebar tokens for light-mode hover contrast (`src/components/accelerator/accelerator-sidebar.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap empty title)

- UI: removed the "Untitled section" fallback in the roadmap outline (`src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Dropdown trigger ids)

- UI: added stable ids to dropdown triggers in support menu and roadmap actions to prevent hydration mismatches (`src/components/support-menu.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Roadmap empty title persistence)

- Logic: removed "Untitled section" fallbacks so empty titles persist across refresh (`src/lib/roadmap.ts`).
- Tests: not run.

## 2026-01-11 — Codex session (TipTap placeholder match)

- UI: matched TipTap placeholder color to the subtitle textarea placeholder (`src/app/globals.css`).
- Tests: not run.

## 2026-01-11 — Codex session (Public roadmap revalidate)

- Logic: revalidate the public roadmap page after saves/deletes to update the live view immediately (`src/app/(dashboard)/strategic-roadmap/actions.ts`).
- Tests: not run.

## 2026-01-11 — Codex session (Public toggle revalidate)

- Logic: revalidate the public roadmap page after public toggle updates (`src/app/(dashboard)/strategic-roadmap/actions.ts`).
- Tests: not run.

## 2026-01-11 — Codex session (Public roadmap redesign)

- UI: rebuilt the public roadmap page into a full-screen, scroll-snapping presentation with a left timeline rail and GSAP section transitions (`src/components/roadmap/public-roadmap-presentation.tsx`).
- UI: replaced the public roadmap page layout to use the new presentation component and removed the card-based list/hero (`src/app/[org]/roadmap/page.tsx`).
- Tests: not run.

## 2026-01-11 — Codex session (Public roadmap pagination UI)

- UI: replaced the public roadmap scroll+rail layout with a centered, single-section-at-a-time presentation view and fixed bottom up/down controls (wheel/keys/swipe supported) (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-11 — Codex session (Public roadmap toolbar tweaks)

- UI: moved share + theme toggle into the bottom navigation toolbar, aligned buttons horizontally, removed the strategic-roadmap pill, and added a logo badge next to org name/subtitle (`src/components/roadmap/public-roadmap-presentation.tsx`, `src/components/shared/share-button.tsx`, `src/components/organization/public-theme-toggle.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-11 — Codex session (Public roadmap toolbar position)

- UI: moved the public roadmap toolbar (nav/share/theme) from bottom-center to the top-left area (`src/components/roadmap/public-roadmap-presentation.tsx`).

## 2026-01-11 — Codex session (Roadmap sidebar shadow)

- UI: reduced shadow on the roadmap sidebar card (`src/components/roadmap/roadmap-editor.tsx`).

## 2026-01-11 — Codex session (Public roadmap logo)

- UI: display the organization’s uploaded logo on the public roadmap presentation (falls back to Coach House mark if missing) (`src/app/[org]/roadmap/page.tsx`, `src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-11 — Codex session (Public roadmap header + bottom toolbar)

- UI: moved org logo/name/subtitle into the fixed top-left pill and centered the nav/share/theme toolbar at the bottom (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-11 — Codex session (Sidebar roadmap icon)

- UI: added the roadmap icon next to the Accelerator sidebar Roadmap link (`src/components/accelerator/accelerator-sidebar.tsx`).

## 2026-01-11 — Codex session (Public roadmap header container)

- UI: removed the pill/card styling around the fixed public roadmap org header (kept logo + org name/subtitle) (`src/components/roadmap/public-roadmap-presentation.tsx`).

## 2026-01-11 — Codex session (Remove hero editor)

- UI: removed the "Roadmap hero image" editor card from My Organization → Roadmap by disabling `showHeroEditor` (`src/components/organization/org-profile-card/org-profile-card.tsx`).

## 2026-01-11 — Codex session (Roadmap header lockup)

- UI: refactored the roadmap header to an icon-left "lockup" layout (icon + title + description) (`src/components/roadmap/roadmap-shell.tsx`).

## 2026-01-12 — Codex session (Roadmap/docs routes + public uploads)

- Navigation: moved My Organization Roadmap + Documents into dedicated pages and updated redirects/links (`src/app/(dashboard)/my-organization/page.tsx`, `src/app/(dashboard)/my-organization/roadmap/page.tsx`, `src/app/(dashboard)/my-organization/documents/page.tsx`, `src/app/(dashboard)/strategic-roadmap/page.tsx`, `src/components/global-search.tsx`, `src/app/(dashboard)/dashboard/page.tsx`).
- Sidebar: removed the Dashboard nav item (shelved in `docs/trashcan/dashboard-sidebar-nav-item.md`), added Roadmap + Documents under People (`src/components/app-sidebar/nav-data.ts`).
- Public roadmap: adjusted section title styling (h2, higher placement) and logged section view events on slide changes (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Org profile: renamed “Story & impact” → “About us” and replaced Programs/Reports textareas with public PDF upload dropzones (`src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/story.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/programs-reports.tsx`, `src/app/api/account/org-public-documents/route.ts`).
- Tests: fixed Vitest config runtime import issue and normalized budget table options to include empty fields (`vitest.config.ts`, `src/lib/lessons/schemas.ts`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped without Supabase env vars).

## 2026-01-12 — Codex session (Org profile content background)

- UI: set My Organization tab content area background to `bg-sidebar` to match the sidebar container (`src/components/organization/org-profile-card/org-profile-card.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Accelerator roadmap editor layout)

- UI: moved the roadmap section list card to the right and centered the editor column on large screens via `editorLayout="centered-right"` (`src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/roadmap-shell.tsx`, `src/app/(accelerator)/accelerator/roadmap/page.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Roadmap sections mobile dropdown)

- UI: replaced the stacked mobile roadmap section list with a dropdown selector (keeps “New” button) (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Public roadmap section badge)

- UI: moved the active section title into a small pill badge under the org tagline in the fixed header (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Accelerator roadmap header)

- UI: enabled the in-page Strategic roadmap header/description on the Accelerator roadmap page (`src/app/(accelerator)/accelerator/roadmap/page.tsx`, `src/components/roadmap/roadmap-shell.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Accelerator roadmap header layout)

- UI: stacked the roadmap header icon/title/description vertically for Accelerator Roadmap (`src/components/roadmap/roadmap-shell.tsx`, `src/app/(accelerator)/accelerator/roadmap/page.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Mobile roadmap dropdown sizing)

- UI: increased the mobile roadmap section dropdown trigger height and allowed a 2-line subtitle (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Framework label)

- UI: renamed the roadmap section list header label to “Framework” and added an icon (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Tiptap background tokens)

- UI: updated the RichTextEditor ProseMirror background to match input tokens (`bg-transparent dark:bg-input/30`) (`src/components/rich-text-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Public roadmap badge spacing)

- UI: separated the section badge from the logo/text row and increased spacing below the tagline (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Roadmap editor alignment)

- UI: centered the default RoadmapEditor grid so the Framework card aligns with the “Live” row and sits closer to the editor column (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env).
- Next: verify alignment on `/my-organization/roadmap` at desktop widths.

## 2026-01-12 — Codex session (Roadmap mobile subtitle truncation)

- UI: changed the mobile section dropdown trigger subtitle to use single-line ellipsis truncation (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Framework card chrome)

- UI: removed the border/background/shadow wrapper around the Framework list in the default roadmap editor layout (keeps it for the centered-right layout) (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Roadmap share actions removed)

- UI: removed the Roadmap editor header “Section actions” dropdown trigger (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Editor word count rounding)

- UI: rounded the bottom corners of the RichTextEditor word/character count footer (and link preview footer when present) (`src/components/rich-text-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Framework rail endcap)

- UI: masked the section list rail so it stops at the center of the last badge (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (My Organization header background)

- UI: matched the OrgProfile header content background to the tabs panel background (`bg-sidebar`) (`src/components/organization/org-profile-card/header.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Item dark mode background)

- UI: fixed `Item` to use `dark:bg-[#151515]` and `text-foreground` so it renders correctly in dark mode (`src/components/ui/item.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Hide Supporters tab)

- UI: removed the Supporters tab trigger (and disallowed `?tab=supporters`) on My Organization for now (`src/components/organization/org-profile-card/org-profile-card.tsx`, `src/app/(dashboard)/my-organization/page.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Roadmap section cover image)

- UI: repurposed the Roadmap editor toolbar “Insert image” button to upload a per-section cover image and show a preview above the toolbar with swap/remove controls (`src/components/roadmap/roadmap-editor.tsx`, `src/components/rich-text-editor.tsx`).
- Data: persisted `imageUrl` on roadmap sections and cleaned up replaced/removed images (`src/lib/roadmap.ts`, `src/app/(dashboard)/strategic-roadmap/actions.ts`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Roadmap cover image verification)

- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).
- Next: verify in-browser that “Insert image” uploads a cover image, shows the preview above the toolbar, and persists on refresh (including the public page revalidate).

## 2026-01-12 — Codex session (Public roadmap cover images)

- UI: render per-section `imageUrl` cover images on the public roadmap presentation (`src/app/[org]/roadmap/page.tsx`, `src/components/roadmap/public-roadmap-presentation.tsx`).
- UX: include sections with a cover image even if the rich text body is empty (`src/app/[org]/roadmap/page.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Roadmap editor toolbar placement)

- UI: moved the RichTextEditor toolbar portal target back into the editor column so formatting controls appear above the editor (and the cover image preview sits directly above the toolbar) (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:acceptance`.

## 2026-01-12 — Codex session (Public roadmap section headings)

- UI: show the section title + subtitle above the body content on the public roadmap page (`src/app/[org]/roadmap/page.tsx`, `src/components/roadmap/public-roadmap-presentation.tsx`).

## 2026-01-12 — Codex session (Accelerator roadmap page layout)

- UI: aligned `/accelerator/roadmap` wrapper + RoadmapShell props to match `/my-organization/roadmap` (`src/app/(accelerator)/accelerator/roadmap/page.tsx`).

## 2026-01-12 — Codex session (Public roadmap uses user headings)

- UI: public roadmap uses the user-entered section title/subtitle (not the template defaults) (`src/app/[org]/roadmap/page.tsx`).

## 2026-01-12 — Codex session (Public roadmap content alignment)

- UI: align the main slide content block with the header badge column (`src/components/roadmap/public-roadmap-presentation.tsx`).

## 2026-01-12 — Codex session (Public roadmap section eyebrow)

- UI: moved section title/subtitle into the fixed header as an eyebrow (badge + short description) above the slide body (`src/components/roadmap/public-roadmap-presentation.tsx`).

## 2026-01-12 — Codex session (Public roadmap hides template headings)

- UI: treat template section titles/subtitles as empty on the public roadmap page, even if they were previously persisted (`src/app/[org]/roadmap/page.tsx`).

## 2026-01-12 — Codex session (Roadmap section limit)

- Guardrails: limited roadmaps to 10 sections (UI + server-side check) (`src/components/roadmap/roadmap-editor.tsx`, `src/app/(dashboard)/strategic-roadmap/actions.ts`, `src/lib/roadmap.ts`).

## 2026-01-12 — Codex session (Strategic roadmap page sync)

- Refactor: `/my-organization/roadmap` and `/accelerator/roadmap` now reuse a shared server component so they stay in lockstep (`src/components/roadmap/strategic-roadmap-editor-page.tsx`, `src/app/(dashboard)/my-organization/roadmap/page.tsx`, `src/app/(accelerator)/accelerator/roadmap/page.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Strategic roadmap title sync)

- Fix: recompute `titleIsTemplate`/`subtitleIsTemplate` when saving an existing roadmap section so a newly-entered title stays visible immediately (and stays consistent between `/my-organization/roadmap` and `/accelerator/roadmap`) (`src/lib/roadmap.ts`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Public roadmap headings layout)

- UX: moved section title/subtitle into the slide content (image → eyebrow badge → title → subtitle → body) and kept the top header focused on org info (`src/app/[org]/roadmap/page.tsx`, `src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Framework vs custom sections)

- Editor: “New” now opens a menu to re-add missing framework sections or create a custom section; custom sections no longer show the framework info card, and the section rail shows framework labels for framework sections (`src/components/roadmap/roadmap-editor.tsx`).
- Public roadmap: ensured a visible section title above the subtitle by falling back to the framework eyebrow when the user title is empty (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Custom roadmap sections)

- Fix: creating a new custom roadmap section no longer persists a default `"New section"` title when the user leaves the title blank (`src/lib/roadmap.ts`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Public roadmap includes headings)

- UX: public roadmap now includes sections that only have a user title/subtitle (no body yet) so headings can be previewed on the live page (`src/app/[org]/roadmap/page.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Public roadmap badge above image)

- UX: when a section has a cover image, render the framework eyebrow badge directly above the image card (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Roadmap title autosave)

- UX: title/subtitle changes now auto-save after a short pause (and include content when needed) so the public roadmap reflects edits quickly (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Public roadmap blur transitions)

- UI: integrated the shadcn `@react-bits/GradualBlur-JS-CSS` component and added a subtle bottom blur overlay on the public roadmap presentation (`src/components/GradualBlur.jsx`, `src/components/GradualBlur.css`, `src/app/globals.css`, `src/components/roadmap/public-roadmap-presentation.tsx`).
- UX: slide navigation now animates out/in with an upward reveal + blur-to-clear transition and respects `prefers-reduced-motion` (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (My Organization card background)

- UI: make the org profile card background match the tab panel background (`bg-sidebar`) for consistent light/dark rendering (`src/components/organization/org-profile-card/org-profile-card.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Radix hydration mismatch)

- Fix: stabilize Radix dropdown trigger `id` attributes to prevent hydration mismatch warnings in the strategic roadmap editor (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Program wizard location + team)

- Programs: added `location_type` + `location_url` (in-person vs online link) and `team_ids` to persist the new wizard fields (`supabase/migrations/20260112142000_programs_location_type_url.sql`, `supabase/migrations/20260112142500_programs_team_ids.sql`).
- Wizard: schedule step now toggles between full address and online meeting link; funding goals UI removed for now; added a team picker that pulls org people from a new API route (`src/components/programs/program-wizard/schema.ts`, `src/components/programs/program-wizard.tsx`, `src/components/programs/program-wizard/steps/schedule-step.tsx`, `src/components/programs/program-wizard/steps/funding-step.tsx`, `src/app/api/account/org-people/route.ts`).
- Actions: program create/update now persist the new fields and support clearing values (`src/app/(dashboard)/my-organization/programs/actions.ts`).
- UI: accelerator sidebar “Return to dashboard” now links to `/my-organization` as “Return home”; meeting CTA card restyled into a square tile (`src/components/accelerator/accelerator-sidebar.tsx`, `src/components/accelerator/accelerator-schedule-card.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Accelerator Start Building pager)

- UX: redesigned Accelerator overview “Start building” into a paginated, lesson-style module preview with CTAs + locked/in-progress/completed states (`src/components/accelerator/start-building-pager.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Logic: derive statuses from org profile, programs, and roadmap progress; later steps lock until the first “not started” step (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: `pnpm lint` (warnings only), `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls` (skipped; missing env vars).

## 2026-01-12 — Codex session (Accelerator program Empty border)

- UI: make the “Create your first program” Empty state use a thicker dashed border to match the intended styling (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Hide Accelerator support links)

- UI: removed the Help center / Community calls / Documentation / System status tiles from the Accelerator overview for now (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Roadmap Introduction icon)

- UI: swap the framework “Introduction” icon to `Hand` (waving hello) instead of sparkles (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Sidebar Live badges)

- UI: when both the org public page and public roadmap are live, show a “Live” badge on the right side of the “My Organization” and “Roadmap” sidebar items (`src/app/(dashboard)/layout.tsx`, `src/components/nav-main.tsx`, `src/components/app-sidebar.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Framework header alignment)

- UI: align the “Framework” label + “New” button header row with the “Live” toggle row by tightening top padding and using `leading-none` (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Roadmap top-row alignment)

- UI: in the centered-right roadmap layout, move the Framework header (“Framework” + “New”) into the top grid row so it aligns horizontally with the “Live” toggle row (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-12 — Codex session (Accelerator Start Building icon keys)

- Fix: switched Start Building steps to pass serializable `iconKey` values and map them to lucide icons inside the client component to avoid RSC serialization errors (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator Start Building serialization guard)

- Fix: explicitly remapped Start Building steps to a plain serializable shape before passing to the client pager to avoid stray non-serializable props (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator meeting card layout)

- Layout: moved the meeting card into the overview grid right column and removed the standalone meeting section (`src/app/(accelerator)/accelerator/page.tsx`).
- UI: removed meeting badges/upsell, added an image placeholder above the meeting header, and renamed the CTA to “Book a call” (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator meeting card height)

- Layout: let the meeting card stretch to the overview grid row height (matching the left column) by removing the square aspect lock and ensuring the right column fills the row (`src/components/accelerator/accelerator-schedule-card.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator Start building subtitle removal)

- UI: removed the “Plan → Publish → Prove” subtitle from the Start building header (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator Start building header alignment)

- UI: moved the Start building label into the pager header, renamed it “Continue building,” and placed the page count between the pagination buttons (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator meeting card icon overlay)

- UI: moved the meeting icon into the image placeholder so it overlays the media block, giving the image more space (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator Next up card removal)

- UI: removed the Next up card container and placed the label/title/CTA directly under the progress bar (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator overview label)

- UI: renamed the Accelerator overview eyebrow label to “Overview” (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator progress bar + CTA)

- UI: aligned the Next up CTA with the progress bar width, added segmented module progress with orange/green states, and updated the CTA label to Start/Continue/Complete based on progress (`src/app/(accelerator)/accelerator/page.tsx`).
- Data: compute module totals and completion/in-progress counts from enrollments, modules, and module_progress to drive the progress bar (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator meeting card layout refresh)

- UI: restyled the meeting card to match the HomeTwo news card layout, using a gradient media block with overlay icons and click-to-schedule behavior (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator Start Building grid)

- UI: replaced the Start Building pager with a responsive grid (up to 6 columns) and redesigned step cards to mirror the HomeTwo news card style with gradient media blocks (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator module grid by class)

- UI: reworked the Start Building section into class-grouped module grids (max 4 columns) with module cards styled like the HomeTwo news tiles (`src/components/accelerator/start-building-pager.tsx`).
- Data: fetch published classes/modules for the accelerator, map module progress/locks per class, and drive the overview progress totals from those modules (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Budget table guided layout)

- UX: added quick-add chips, step guidance, and row-level remove actions for budget tables; switched to a stacked card layout on small screens while keeping the resizable table for desktop (`src/components/training/module-detail/assignment-form.tsx`).
- UI: added an actions column to the budget table and adjusted widths/min sizes to keep the layout balanced (`src/components/training/module-detail/assignment-form.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator progress segment contrast)

- UI: darkened the empty progress segments so unfilled steps read more clearly against the background (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator progress sync)

- Data: aligned accelerator overview and sidebar progress to the shared accelerator progress summary helper (`src/app/(accelerator)/accelerator/page.tsx`, `src/app/(dashboard)/layout.tsx`, `src/lib/accelerator/progress.ts`).
- UI: switched the start-building grid to consume shared accelerator progress types (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator overview spacing tweaks)

- UI: tightened the coaching card padding so the gradient media sits closer to the card edge, and added vertical padding to the overview section for more height (`src/components/accelerator/accelerator-schedule-card.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator progress helper default)

- Fix: defaulted the accelerator progress helper options object to avoid destructuring undefined (`src/lib/accelerator/progress.ts`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Strategic roadmap build fix)

- Fix: returned `public_slug` from the roadmap public toggle upsert to satisfy TypeScript and allow revalidation (`src/app/(dashboard)/strategic-roadmap/actions.ts`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Accelerator meeting card layout)

- UI: removed the card-level click handler, tightened top padding, increased the media block height, and moved the "Book a call" label into a right-aligned action button (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Meeting card padding fix)

- UI: limited the 5px inset to the media block only and restored standard padding for the text/actions (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Launch master doc + brief template)

- Docs: added master process, design rules, search requirements, and docs naming standards to the launch organizer; introduced a task brief template (`docs/organize.md`, `docs/briefs/BRIEF_TEMPLATE.md`).
- Checks: not run (docs only).

## 2026-01-12 — Codex session (Launch organizer deltas)

- Docs: pulled missing context from the raw notes into the structured sections (2FA, knowledge base, community/map pricing decision, supporter map view, roadmap payments, AI phase 2, and guidance tags) and added a delta section for cleanup (`docs/organize.md`).
- Checks: not run (docs only).

## 2026-01-12 — Codex session (Global search brief)

- Docs: added a global search brief with scope, gating, data model notes, and rollout plan; extended the brief template to include a Moonshot section (`docs/briefs/global-search.md`, `docs/briefs/BRIEF_TEMPLATE.md`).
- Checks: not run (docs only).

## 2026-01-12 — Codex session (Global search build)

- Feature: added a server-backed global search endpoint and wired the command palette to query it with debounce; included classes, modules, assignment questions, and programs with gating via RLS (`src/app/api/search/route.ts`, `src/components/global-search.tsx`, `src/lib/search/types.ts`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Global search expansion)

- Feature: extended search results to include marketplace items and public organizations; added program deep links into the programs tab and wired marketplace query params (`src/app/api/search/route.ts`, `src/components/global-search.tsx`, `src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`, `src/components/organization/org-profile-card/org-profile-card.tsx`, `src/components/organization/org-profile-card/types.ts`, `src/app/(dashboard)/my-organization/page.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Global search roadmap + documents)

- Feature: added roadmap section and org document matches to global search results and updated group ordering (`src/app/api/search/route.ts`, `src/components/global-search.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Global search analytics)

- Feature: added search analytics events (open/query/select) with a new search_events table and logging routes (`supabase/migrations/20260112194500_add_search_events.sql`, `src/lib/supabase/schema/tables/search_events.ts`, `src/lib/supabase/schema/tables/index.ts`, `src/app/api/search/event/route.ts`, `src/app/api/search/route.ts`, `src/components/global-search.tsx`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Global search FTS ranking)

- Feature: added weighted FTS indexing + ranking via a search_index view and a search_global RPC, and switched the search API to use ranked results while preserving marketplace matching (`supabase/migrations/20260112200000_add_search_index_view.sql`, `src/lib/supabase/schema/functions.ts`, `src/app/api/search/route.ts`).
- Checks: not run (not requested).

## 2026-01-12 — Codex session (Search RPC fallback + tests)

- Feature: added a fallback search path when the ranked RPC fails, reusing the prior manual matching across classes/modules/questions/programs/org data (`src/app/api/search/route.ts`).
- Tests: added basic search route coverage for RPC ranking/filters and fallback behavior (`tests/acceptance/search-route.test.ts`).
- Docs: noted the admin search analytics view as a Phase 4 task (`docs/organize.md`).
- Checks: `pnpm db:push`; `pnpm test:acceptance -- search-route` (ran full acceptance suite).

## 2026-01-13 — Codex session (Auth session missing guard)

- Fix: treated Supabase `AuthSessionMissingError` as a logged-out state so authed routes redirect instead of throwing (`src/lib/supabase/auth-errors.ts`, `src/app/(dashboard)/layout.tsx`, `src/app/(accelerator)/layout.tsx`, `src/lib/admin/auth.ts`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/classes/page.tsx`, `src/app/(dashboard)/training/page.tsx`, `src/app/(dashboard)/organizations/page.tsx`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/(dashboard)/my-organization/documents/page.tsx`, `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`, `src/components/dashboard/subscription-status-card.tsx`, `src/app/(dashboard)/onboarding/actions.ts`, `src/lib/accelerator/progress.ts`).
- Fix: renamed the `module` loop variable to satisfy Next.js ESLint (`src/app/api/search/route.ts`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- search-route`.

## 2026-01-13 — Codex session (Launch gate run + RLS test fix)

- DB: verified the two search migrations are already applied to the linked Supabase project (`pnpm db:push` → “Remote database is up to date.”).
- Fix: updated the RLS test runner to use `is_published` (the `published` column is dropped by migrations) so tests run instead of erroring (`supabase/tests/rls.test.mjs`).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls` (with `.env.local` sourced).

## 2026-01-13 — Codex session (Post-login redirect to My Organization)

- UX: changed the default post-auth landing route from `/dashboard` → `/my-organization` while still honoring explicit `?redirect=` params (`src/components/auth/login-form.tsx`, `src/components/auth/sign-up-form.tsx`, `src/app/(auth)/callback/route.ts`, `src/app/(auth)/update-password/page.tsx`, `src/components/auth/update-password-form.tsx`).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls` (with `.env.local` sourced).

## 2026-01-13 — Codex session (Disable sidebar brand link)

- UX: made the sidebar header brand button inert (removed the `/dashboard` link) so clicking “Coach House / Platform” does nothing for now (`src/components/app-sidebar.tsx`).
- Checks: `pnpm lint`.

## 2026-01-13 — Codex session (Sidebar brand styling)

- UI: improved light-mode visibility of the sidebar brand header by adding a subtle gray logo tile background and switching the “Coach House” label to green (`src/components/app-sidebar.tsx`).

## 2026-01-13 — Codex session (Circular progress styling)

- UI: updated the accelerator sidebar progress ring to use a darker light-mode track and a green progress stroke; reverted the sidebar brand header text styling back to default (`src/components/ui/circular-progress.tsx`, `src/components/app-sidebar.tsx`).

## 2026-01-13 — Codex session (Global search loading state)

- UX: ensured the global search command palette shows an in-flight “Searching…” row (and error row) while results are loading, so it doesn’t appear empty on slow queries (`src/components/global-search.tsx`).
- UI: darkened the circular progress track in light mode for better contrast (`src/components/ui/circular-progress.tsx`).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls` (with `.env.local` sourced).

## 2026-01-13 — Codex session (Pricing page redesign)

- Docs: created a pricing-page brief with screenshot-driven layout notes and the canonical tier spec (`docs/briefs/pricing-page.md`).
- UI: redesigned `/pricing` to a Cal.com-inspired layout (hero → tier cards with featured plan → callout → feature breakdown table → bottom CTA) and updated tiers to Formation / Organization / The Accelerator (`src/app/(public)/pricing/page.tsx`).
- UX: aligned pricing checkout fallbacks to the new default landing by redirecting to `/my-organization` (`src/app/(public)/pricing/actions.ts`, `src/app/(public)/pricing/success/page.tsx`).
- Tests: updated pricing acceptance expectations for the new redirect destination (`tests/acceptance/pricing.test.ts`).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls` (with `.env.local` sourced).

## 2026-01-13 — Codex session (Pricing background)

- UI: removed the pricing page dot-grid background and restored the plain background styling (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing typography)

- UI: removed expanded letter-spacing (tracking) from the pricing page overline/eyebrow text styles (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing feature inclusion)

- UI: marked community access as included on the free plan (and in the feature breakdown table) (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing copy tweak)

- Copy: updated the Organization plan board-member feature to “Manage and update your board” (`src/app/(public)/pricing/page.tsx`, `docs/organize.md`, `docs/briefs/pricing-page.md`).
- Checks: `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing surfaces)

- UI: set the `/pricing` page light-mode background to the `--surface` token via token override and restored standard `Card`/`Badge` backgrounds (removed custom black/white overrides) (`src/app/(public)/pricing/page.tsx`).
- Docs: updated pricing spec notes to reflect Community Access being included in Formation (`docs/organize.md`, `docs/briefs/pricing-page.md`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Public header home link)

- UX: made the public header brand (“Coach House” logo/text) link back to `/` (`src/components/public/public-header.tsx`).
- Checks: `pnpm lint`.

## 2026-01-13 — Codex session (Pricing free tier card)

- UI: adjusted the Formation (free) tier card styling to match the Cal.com-inspired reference (bigger title, dark CTA with chevron, dashed divider, solid check icons, stronger feature text) (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing free label)

- UI: updated the Formation plan price label to render only “Free” (no “per month” text) (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Launch gates + search migrations)

- DB: verified the two search migrations are applied to the linked Supabase project (`supabase db push --yes` reports “Remote database is up to date”).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls` (with `SUPABASE_URL` exported from `.env.local`’s `NEXT_PUBLIC_SUPABASE_URL`).

## 2026-01-13 — Codex session (Pricing CTA copy)

- Copy: changed pricing CTAs from “Start Free” to “Get started” (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing Accelerator border)

- UI: applied a dashed outline border style to the Accelerator tier card (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing feature table header)

- UI: matched the feature breakdown group header row background to the Organization column background tint (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing table alignment)

- UI: forced left alignment for all pricing feature table headers/cells (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing table group icons)

- UI: added icons to the feature breakdown section headers (Platform / Team / AI / Accelerator) (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing free tier rename)

- Copy: renamed the free tier from “Formation” to “Individual” across the pricing page (kept “501(c)(3) Formation Flow” feature text as-is) (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing chips removal)

- UI: removed the “Built for founders…” chip row section from `/pricing` (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing table group header alignment)

- UI: centered the feature breakdown section header icon+label vertically within the rowgroup header cells (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing Accelerator bundle + copy refresh)

- Brief: added a launch-focused brief for the Accelerator bundle + pricing copy updates (`docs/briefs/pricing-accelerator-bundle.md`).
- UI: moved the Accelerator into a horizontal add-on card mid-page and strengthened the dashed border, plus added Roadmap `Public/Private` pills and refreshed tier copy (`src/app/(public)/pricing/page.tsx`).
- Stripe: added optional env vars for Stripe price IDs and extended checkout to support an Accelerator bundle that starts the Organization subscription with a 30-day trial (`src/lib/env.ts`, `src/app/(public)/pricing/actions.ts`).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls` (with `SUPABASE_URL` exported from `.env.local`’s `NEXT_PUBLIC_SUPABASE_URL`).

## 2026-01-13 — Codex session (Pricing organization checklist)

- UI: made “Fundraising tools and frameworks” its own checklist line item (separate check) in the Organization tier (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing container width)

- UI: reduced the `/pricing` page max content width to tighten the main column (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing copy tweak)

- Copy: changed “Guided 501(c)(3) Formation Flow” to “Guided 501(c)(3) Formation Guidance” (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing coming soon tags)

- UI: added “Coming soon” pills to select pricing checklist items and matching feature-table rows (Resource map listing, Board member portal, AI enabled NFP development, Fundraising tools) (`src/app/(public)/pricing/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Pricing top bar background)

- UI: matched the top overscroll/gap background on `/pricing` to the page surface by overriding `--app-surface` when the pricing page is mounted (`src/app/(public)/pricing/page.tsx`, `src/app/globals.css`).
- Checks: `pnpm lint`; `pnpm test:acceptance -- pricing`.

## 2026-01-13 — Codex session (Unblock Vercel build)

- Fix: corrected `OrgPersonSummary.category` typing for `/api/account/org-people` and tightened Program Wizard `locationType` payload typing (`src/app/api/account/org-people/route.ts`, `src/components/programs/program-wizard.tsx`).
- Fix: ensured `PublicRoadmapPresentation` GSAP cleanup returns `void` and hardened touch handling types (`src/components/roadmap/public-roadmap-presentation.tsx`).
- Fix: updated `vitest.config.ts` to use the correct Vitest config type without a runtime import (avoids ESM/CJS config-load crash) (`vitest.config.ts`).
- Supabase: verified the two search migrations are already applied on the linked project (`20260112194500_add_search_events`, `20260112200000_add_search_index_view`).
- Checks: `pnpm build`; `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls` (skipped without required env vars).

## 2026-01-13 — Codex session (Homepage hero pill copy)

- Copy: replaced “The Coach House Commons” with “The Coach House Platform” on the `/` prototype hero pill (`src/app/(public)/home2/page.tsx`).

## 2026-01-14 — Codex session (Stripe gating + Accelerator entitlement)

- Stripe: added one-time Accelerator checkout path and success callback handling (`src/app/(public)/pricing/actions.ts`, `src/app/(public)/pricing/success/page.tsx`).
- Supabase: added `accelerator_purchases` (RLS) and removed the `subscriptions_self_update` policy (`supabase/migrations/20260114170000_add_accelerator_purchases.sql`, `supabase/migrations/20260114170500_lock_subscriptions_updates.sql`).
- Supabase: pushed both migrations to the linked remote project (`supabase db push`).
- Gating: hide/block Accelerator UI/routes/search unless entitled (admins bypass) (`src/app/(accelerator)/layout.tsx`, `src/components/app-sidebar.tsx`, `src/components/global-search.tsx`, `src/app/api/search/route.ts`).
- Roadmap: disable public-roadmap publish toggle + server action unless subscription is `active|trialing` (`src/components/roadmap/roadmap-visibility-toggle.tsx`, `src/app/(dashboard)/strategic-roadmap/actions.ts`).
- Fix: removed a brittle type predicate in `/api/account/org-people` that broke Vercel typechecking (`src/app/api/account/org-people/route.ts`).
- Checks: `pnpm build`; `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls` (skipped without required env vars).

## 2026-01-14 — Codex session (Onboarding v2 brief)

- Docs: drafted a launch-ready onboarding + plan selection + welcome + highlight-tour brief with screenshot notes and flow strategy (`docs/briefs/onboarding.md`).
- Docs: expanded the brief to cover account setup fields, notification prefs, skippable 2FA prompt, replayable tutorial entry, and social-login (P1) considerations (`docs/briefs/onboarding.md`).

## 2026-01-14 — Codex session (Onboarding v2 implementation + auth plumbing)

- Onboarding: replaced the onboarding dialog with a 3-step stepper (org → account → plan), plus avatar crop, slug availability check, draft resume, and optional Stripe checkout for Organization plan (`src/components/onboarding/onboarding-dialog.tsx`, `src/app/(dashboard)/onboarding/actions.ts`).
- Tutorial: added a welcome modal + highlight tour overlay with “Replay tutorial” in the account menu; wired tour targets in nav + global search (`src/components/onboarding/onboarding-welcome.tsx`, `src/components/tutorial/highlight-tour.tsx`, `src/components/tutorial/tutorial-manager.tsx`, `src/components/nav-main.tsx`, `src/components/nav-user.tsx`, `src/components/global-search.tsx`, `src/components/dashboard/dashboard-shell.tsx`).
- Auth: preserved pricing plan params through signup/login via safe redirects; added `/auth/callback` route (and shared handler) so Supabase email links land correctly; fixed password recovery fallback to `/update-password` (`src/app/(auth)/sign-up/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/update-password/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/(auth)/callback/route.ts`, `src/lib/supabase/auth-callback.ts`, `src/components/auth/login-form.tsx`, `src/components/auth/sign-up-form.tsx`, `src/components/auth/forgot-password-form.tsx`).
- Routing: aligned legacy onboarding/admin redirects to land on `/my-organization` (`src/app/(dashboard)/onboarding/page.tsx`, `src/lib/admin/auth.ts`, `src/lib/auth.ts`).
- Supabase: revoked `subscriptions` mutations for `anon`/`authenticated` (service-role/webhooks only) and pushed the migration; updated the RLS runner to auto-load `.env.local` so `pnpm test:rls` runs locally (`supabase/migrations/20260114183000_revoke_subscription_mutations.sql`, `supabase/tests/rls.test.mjs`).
- Tests: updated onboarding acceptance redirect expectation (`tests/acceptance/onboarding.test.ts`); ran `pnpm build`, `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance -- search-route`, `pnpm test:rls`.

## 2026-01-14 — Codex session (Formation status field)

- Onboarding: added “Formation status” selection in step 1 and persist it into `organizations.profile.formationStatus` (`src/components/onboarding/onboarding-dialog.tsx`, `src/app/(dashboard)/onboarding/actions.ts`).
- My org: surfaced + editable “Formation status” in the org profile Identity section; added safe server-side normalization (`src/app/(dashboard)/my-organization/page.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/identity.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx`, `src/app/(dashboard)/my-organization/actions.ts`).
- Types/validation: added `FormationStatus` + schema validation (`src/components/organization/org-profile-card/types.ts`, `src/components/organization/org-profile-card/validation.ts`).
- Checks: `pnpm build`, `pnpm lint`, `pnpm test:acceptance -- onboarding`, `pnpm test:rls`.

## 2026-01-14 — Codex session (Onboarding brief tour steps)

- Docs: expanded the onboarding brief with a concrete “highlight tour” step list (gating + mobile behaviors) to guide implementation + QA (`docs/briefs/onboarding.md`).
- Docs: updated the global search brief status + “current state” to reflect the shipped MVP implementation (`docs/briefs/global-search.md`).
- Supabase: confirmed `supabase db push --dry-run` reports “Remote database is up to date.”
- Ops: still needed — add `/auth/callback` to Supabase Auth allowed redirect URLs (email signup/reset links now use it).

## 2026-01-14 — Codex session (Stripe webhook robustness + Accelerator bundle)

- Brief: updated Stripe gating brief to include the Accelerator → 30-day Organization trial bundle (`docs/briefs/stripe-gating.md`).
- Stripe: made webhook idempotency retry-safe by tracking `processed` state in `stripe_webhook_events.payload` (prevents “logged but not processed” drops) (`src/app/api/stripe/webhook/route.ts`).
- Stripe: on Accelerator purchase, auto-start an Organization subscription with a 30-day trial (uses Stripe idempotency key based on checkout session) (`src/app/api/stripe/webhook/route.ts`, `src/app/(public)/pricing/success/page.tsx`).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance -- search-route`; `pnpm test:rls`.

## 2026-01-14 — Codex session (Tutorial system + page tours)

- Tutorial: persisted per-tutorial completion/dismissal in Supabase Auth user metadata (`src/app/actions/tutorial.ts`).
- Tutorial: updated highlight tour to distinguish finish vs dismiss, and expanded `TutorialManager` to support multiple tours (`src/components/tutorial/highlight-tour.tsx`, `src/components/tutorial/tutorial-manager.tsx`).
- Intro: redesigned the first-run welcome modal to match the Cal.com-style intro (dark card + rings) and made it auto-show for users who completed onboarding but haven’t completed/dismissed the platform tour (`src/components/onboarding/onboarding-welcome.tsx`, `src/app/(dashboard)/layout.tsx`, `src/components/dashboard/dashboard-shell.tsx`).
- UI: added per-page “Tutorial” buttons (header portal) and wired tour targets across My Organization, Roadmap, Documents, People, Marketplace, and Accelerator (`src/components/tutorial/page-tutorial-button.tsx`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/(dashboard)/my-organization/roadmap/page.tsx`, `src/app/(dashboard)/my-organization/documents/page.tsx`, `src/app/(dashboard)/people/page.tsx`, `src/app/(dashboard)/marketplace/page.tsx`, `src/components/accelerator/accelerator-shell.tsx`).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-14 — Codex session (Fix highlight tour setState warning)

- Fix: removed a render-phase state update by avoiding `finish()` inside the `setIndex()` updater in `HighlightTour` (prevents “Cannot update a component while rendering a different component” console error) (`src/components/tutorial/highlight-tour.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-14 — Codex session (Dashboard + Billing tutorials)

- Tutorial: added Dashboard + Billing tutorial steps, buttons, and stable tour anchors (`src/components/tutorial/tutorial-manager.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/billing/page.tsx`, `src/app/(dashboard)/billing/billing-portal-button.tsx`).
- Build: `pnpm build` now passes again (fixes missing tutorial keys that broke typechecking).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-14 — Codex session (My Organization default landing + roadmap upgrade hint)

- Routing: made public “Platform” CTA and unauth `/dashboard` login redirect land on `/my-organization` by default (`src/app/(public)/home2/page.tsx`, `src/app/(dashboard)/dashboard/page.tsx`).
- UI: updated “back” links away from `/dashboard` (errors, accelerator header link, training “Take a break”, empty classes state) (`src/app/error.tsx`, `src/app/(dashboard)/error.tsx`, `src/components/accelerator/accelerator-sidebar.tsx`, `src/components/training/module-detail/module-stepper.tsx`, `src/app/(dashboard)/classes/page.tsx`).
- Roadmap: added a small inline “Upgrade” badge inside the publish toggle pill for free-tier users (`src/components/roadmap/roadmap-visibility-toggle.tsx`).
- Supabase: confirmed `supabase db push --dry-run` reports “Remote database is up to date.”
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-14 — Codex session (Remove `/dashboard` from global search + UI)

- Search: removed the `/dashboard` “Pages” entry from the command palette and stabilized analytics logging via `useCallback` (`src/components/global-search.tsx`).
- UI: removed remaining UI links pointing at `/dashboard` (admin header + empty states) (`src/app/(admin)/layout.tsx`, `src/components/dashboard/classes-list.tsx`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance -- search-route`.

## 2026-01-14 — Codex session (Electives add-ons launch planning)

- Docs: added a P0 brief for Electives paid add-ons (pricing, Stripe integration, entitlements, gating, and billing UX) (`docs/briefs/electives-addons.md`).
- Launch plan: added Electives add-ons to Open Questions, P0 launch checklist (Payments + Accelerator), and Workstreams (`docs/organize.md`).

## 2026-01-14 — Codex session (Search loading + tutorial manager fix + pricing header gap)

- Search: updated the command palette empty state to show a spinning “Searching…” indicator while remote results load (`src/components/global-search.tsx`).
- Search: added per-result icons plus thumbnails for Marketplace + org results when available (`src/components/global-search.tsx`, `src/app/api/search/route.ts`, `src/lib/search/types.ts`).
- Tutorial: removed `useTransition()` from `TutorialManager` to avoid a render-phase state update warning when finishing tours (`src/components/tutorial/tutorial-manager.tsx`).
- Tutorial: guarded `window` access in `HighlightTour` memos to avoid SSR pitfalls (`src/components/tutorial/highlight-tour.tsx`).
- UI: increased the CircularProgress track contrast in light mode (`src/components/ui/circular-progress.tsx`).
- Pricing: prevented header margin collapse from showing body background by adding a tiny top padding on `/pricing` (`src/app/(public)/pricing/page.tsx`).
- Tooling: added `pnpm promote:admin` to promote an existing Supabase user to admin for testing (`scripts/promote-user-to-admin.mjs`, `package.json`).
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`; `pnpm build`.

## 2026-01-14 — Codex session (Supabase security scan fixes + role rename rollout)

- Supabase: pushed `search_index` hardening + `student` → `member` enum rename to the remote DB (`supabase/migrations/20260114210000_security_scan_fixes.sql`, `supabase/migrations/20260114211000_rename_student_role_to_member.sql`).
- Tests: fixed acceptance mocks to support `.in()` filters used by the search route enrichment (`tests/acceptance/search-route.test.ts`).
- RLS tests: added coverage that `authenticated` users cannot select `search_index` directly (RPC-only contract) (`supabase/tests/rls.test.mjs`).
- Docs: updated internal docs to use “member” terminology instead of “student” (`docs/OVERVIEW.md`, `docs/CODEX_RUNBOOK.md`, `docs/briefs/global-search.md`).
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`; `pnpm build`.

## 2026-01-15 — Codex session (Admin “super user” sidebar links)

- UI: show Platform + Resources nav items for admins (previously admins only saw Accelerator), and add an “Admin” link to `/admin` (`src/components/app-sidebar/nav-data.ts`, `src/components/app-sidebar.tsx`).
- UI: added `surface` color token (`--surface`, slightly lighter than `#F4F4F4`) and applied it to Accelerator overview cards in light mode (Start Building cards, coaching card, program templates, and empty state) (`src/app/globals.css`, `src/components/accelerator/start-building-pager.tsx`, `src/components/accelerator/accelerator-schedule-card.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Pricing: refactored the `/pricing` background override to use the new `surface` token (keeps token conventions and reusability) (`src/app/(public)/pricing/page.tsx`, `src/app/globals.css`).
- Fix: avoid throwing raw Supabase errors (object `{ code, details, hint, message }`) from Accelerator progress fetch; log and fall back to default progress instead of crashing `/accelerator` (`src/lib/accelerator/progress.ts`).
- Checks: `pnpm build`.

## 2026-01-15 — Codex session (Supabase lints CSV cleanup: RLS perf)

- Supabase: added migrations to address the remaining Supabase lints CSV warnings:
  - `auth_rls_initplan` (wrap `auth.*` in `(select auth.*())`) (`supabase/migrations/20260115193000_fix_auth_rls_initplan_policies.sql`).
  - `multiple_permissive_policies` (consolidate policies to one-per-action) (`supabase/migrations/20260115194500_consolidate_rls_policies.sql`).
- Checks: `pnpm lint`; `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`; `pnpm build`.

## 2026-01-15 — Codex session (Supabase lints CSV cleanup: FK indexes)

- Supabase: added missing covering indexes for FK columns flagged by Supabase lints (`unindexed_foreign_keys`) (`supabase/migrations/20260115200000_add_missing_fk_indexes.sql`).
- Docs: recorded the remaining INFO lints (unused indexes + auth connection setting) as post-launch follow-ups (`docs/briefs/supabase-security-scan.md`, `docs/organize.md`).

## 2026-01-15 — Codex session (Onboarding simplification + admin test menu + accelerator tour)

- Brief: added a focused P0 brief for onboarding simplification + test toggles (`docs/briefs/onboarding-simplification.md`).
- Onboarding: removed the plan-selection step from the onboarding modal and removed Stripe checkout from onboarding submit (`src/components/onboarding/onboarding-dialog.tsx`, `src/app/(dashboard)/onboarding/actions.ts`).
- Tutorials: added an Accelerator-specific welcome modal (route-aware) and updated dashboard shell wiring for Platform vs Accelerator (`src/components/onboarding/onboarding-welcome.tsx`, `src/components/dashboard/dashboard-shell.tsx`, `src/app/(dashboard)/layout.tsx`).
- Admin QA: added admin-only “Testing” actions to the account menu (open onboarding, start tours, show welcomes, reset onboarding/tutorial state) (`src/components/nav-user.tsx`, `src/app/actions/tutorial.ts`, `src/app/actions/admin-testing.ts`).
- Tour UX: highlight overlay no longer blocks/dims the highlighted element; tooltip now includes an icon tile per step (`src/components/tutorial/highlight-tour.tsx`, `src/components/tutorial/tutorial-manager.tsx`).
- Tour UX: switched the spotlight overlay to an SVG even-odd mask so the hole corners match the rounded highlight ring (`src/components/tutorial/highlight-tour.tsx`).
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-15 — Codex session (Fix `/admin` runtime error)

- Admin dashboard: fixed recent enrollments query by removing the invalid `enrollments → profiles` FK embed (no FK exists); fetch profile emails via a second query instead (`src/lib/admin/kpis.ts`).
- Admin auth: avoid throwing raw Supabase error objects (redirect on auth failure; wrap DB errors in `Error`) (`src/lib/admin/auth.ts`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance`; `pnpm build`.

## 2026-01-15 — Codex session (Dialog a11y: required titles)

- A11y: added `DialogTitle`/`DialogDescription` to onboarding dialogs to satisfy Radix accessibility requirements and remove console error (`src/components/onboarding/onboarding-dialog.tsx`, `src/components/onboarding/onboarding-welcome.tsx`).
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-15 — Codex session (Onboarding formation status layout)

- UI: changed Formation Status option cards to stack text under the check indicator to avoid squished labels on small widths (`src/components/onboarding/onboarding-dialog.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-15 — Codex session (Onboarding avatar removal)

- UI: added a “Remove photo” action after selecting/cropping an avatar so users can clear the file input before finishing onboarding (`src/components/onboarding/onboarding-dialog.tsx`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance`.

## 2026-01-15 — Codex session (Input placeholder ellipsis)

- UI: added `truncate` to the shared Input styles so long placeholder/value text shows an ellipsis instead of hard clipping (`src/components/ui/input.tsx`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance`.

## 2026-01-15 — Codex session (Onboarding dialog width + snapshot baseline)

- UI: increased onboarding dialog max width to reduce squishing on desktop (`src/components/onboarding/onboarding-dialog.tsx`).
- A11y: added `DialogTitle`/`DialogDescription` to the avatar crop dialog to avoid Radix warnings (`src/components/onboarding/onboarding-dialog.tsx`).
- Snapshots: updated the baseline to reflect the Input truncation style change (`pnpm snapshots:update`).
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-15 — Codex session (Account settings profile layout)

- UI: restyled the Account Settings → Profile section to match onboarding (rounded card, shadcn file input, tighter grids) (`src/components/account-settings/sections/desktop/profile.tsx`, `src/components/account-settings/sections/mobile-sections.tsx`).
- UX: avatar upload no longer marks Account Settings as “dirty” (since it saves immediately) (`src/components/account-settings/account-settings-dialog-state.ts`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance`.

## 2026-01-15 — Codex session (Organization access: invites + roles)

- Supabase: added `organization_member_role`, `organization_memberships`, and `organization_invites` (RLS enabled; owner-managed) (`supabase/migrations/20260115203000_add_organization_access.sql`).
- App: added server actions to list/create/revoke invites + manage member roles (`src/app/actions/organization-access.ts`).
- UI: replaced Account Settings → Organization with a team access manager and a link back to `/my-organization` for profile editing (`src/components/account-settings/sections/desktop/organization.tsx`, `src/components/account-settings/sections/organization-access-manager.tsx`, `src/components/account-settings/sections/mobile-sections.tsx`).
- UX: added `/join-organization` invite acceptance route (`src/app/(auth)/join-organization/page.tsx`).
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-15 — Codex session (Notifications: real inbox + archive)

- Brief: added a focused brief for the notifications system (`docs/briefs/notifications.md`).
- Supabase: added `notifications` table + RLS and fixed `public.is_admin()` so admin policies evaluate correctly (`supabase/migrations/20260115210000_add_notifications.sql`, `supabase/migrations/20260115213000_fix_is_admin_function.sql`).
- App: added server actions for list/read/archive/unarchive/archive-all plus an admin-only seed action (`src/app/actions/notifications.ts`).
- UI: wired the bell popover to Supabase-backed notifications, added skeleton loading + per-item archive controls, and exposed an admin-only “Seed notifications” button in the account menu (`src/components/notifications/notifications-menu.tsx`, `src/components/nav-user.tsx`).
- UI: switched the bell unread indicator dot to `bg-destructive` (red) instead of `bg-primary` (`src/components/notifications/notifications-menu.tsx`).
- RLS tests: added coverage for notification isolation + admin access (`supabase/tests/rls.test.mjs`).
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-15 — Codex session (Documents tab: horizontal upload rows)

- UI: redesigned the My Organization → Documents cards into compact horizontal rows (details on the left, upload/preview on the right) and switched the list to a single-column stack for easier scanning (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-15 — Codex session (Onboarding dialog width tweak)

- UI: reduced the onboarding dialog max width (was feeling too wide after the previous adjustment) (`src/components/onboarding/onboarding-dialog.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-15 — Codex session (Fix raw Supabase errors in RSC)

- Errors: added `supabaseErrorToError()` and stopped throwing raw Supabase error objects from server actions/components (fixes the generic `{code, details, hint, message}` Next.js runtime error) (`src/lib/supabase/errors.ts`, `src/app/(admin)/admin/classes/[id]/actions.ts`, `src/app/(admin)/admin/classes/actions/basic.ts`, `src/lib/modules/service.ts`).
- API: wrapped Supabase errors thrown from route handlers so failures are `Error` instances (`src/app/api/stripe/webhook/route.ts`, `src/app/api/account/avatar/route.ts`).
- UX: password update now shows toast success/error instead of throwing (prevents unhandled promise rejections) (`src/components/account-settings/account-settings-dialog-state.ts`).
- Checks: `pnpm lint` (warnings only); `pnpm test:snapshots`; `pnpm test:acceptance`; `pnpm test:rls`.

## 2026-01-15 — Codex session (Remove `/admin` entry route)

- Nav: updated the platform sidebar + search to link admins to `/admin/academy` instead of `/admin` (`src/components/app-sidebar/nav-data.ts`, `src/components/global-search.tsx`).
- Admin: removed the `/admin` page and updated admin top-nav + breadcrumbs to use `/admin/academy` as the entry point (`src/app/(admin)/layout.tsx`, `src/app/(admin)/@breadcrumbs/admin/page.tsx`, `src/app/(admin)/@breadcrumbs/admin/academy/page.tsx`, `src/app/(admin)/@breadcrumbs/admin/classes/page.tsx`, `src/app/(admin)/@breadcrumbs/admin/classes/[id]/page.tsx`, `src/app/(admin)/@breadcrumbs/admin/users/page.tsx`, `src/app/(admin)/@breadcrumbs/admin/users/[id]/page.tsx`, `src/app/(admin)/admin/page.tsx`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance`.

## 2026-01-15 — Codex session (Roadmap header alignment)

- UI: aligned the Strategic Roadmap page header with the Roadmap editor’s framework rail on large screens (`src/components/roadmap/roadmap-shell.tsx`).
- Checks: `pnpm lint` (warnings only).

## 2026-01-15 — Codex session (People: org chart always visible)

- UI: removed the “Open chart” CTA card so the organization chart canvas is always rendered on `/people` (`src/components/people/org-chart-canvas-lite.tsx`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance`.

## 2026-01-15 — Codex session (Profile data sync + no `/dashboard` auth redirects)

- Onboarding: seeded the organization owner as the first `org_people` entry on onboarding completion (`src/app/(dashboard)/onboarding/actions.ts`).
- People: ensured the owner is always present/first and syncs name/title/photo from `profiles` (`src/app/(dashboard)/people/page.tsx`).
- Auth: redirected signed-in users away from `/login` and `/sign-up` to `/my-organization` (and normalized any `/dashboard` redirect params) (`src/app/(auth)/login/page.tsx`, `src/app/(auth)/sign-up/page.tsx`, `src/proxy.ts`).
- Notifications: removed the remaining seeded notification link to `/dashboard` (`src/app/actions/notifications.ts`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance`.

## 2026-01-15 — Codex session (Edge runtime: remove `node:crypto`)

- Fix: removed `node:crypto` usage from organization access server actions (Edge-safe token generation via Web Crypto) (`src/app/actions/organization-access.ts`).
- Checks: `pnpm lint` (warnings only); `pnpm test:acceptance`.

## 2026-01-15 — Codex session (Add `notes.md`)

- Docs: added a minimal `notes.md` summary of done vs TODO from `docs/organize.md`.

## 2026-01-16 — Codex session (Remove legacy class creation/publishing UI)

- Accelerator: removed the old class progress grid from the overview page (`src/app/(accelerator)/accelerator/page.tsx`) and deleted the legacy pager component (`src/components/accelerator/start-building-pager.tsx`).
- Training: stripped edit/publish wizard controls from class + module views (`src/components/training/class-overview.tsx`, `src/components/training/class-overview/module-card.tsx`, `src/components/training/module-detail.tsx`, `src/components/training/module-detail/module-header.tsx`).
- Sidebar/Admin: removed the create/publish popover and draft actions from the accelerator sidebar + admin academy header (`src/components/app-sidebar/classes-section.tsx`, `src/app/(admin)/admin/academy/page.tsx`).
- Cleanup: deleted legacy lesson wizard UI + hooks (`src/components/admin/lesson-creation-wizard.tsx`, `src/components/admin/lesson-wizard/*`, `src/hooks/lessons/use-lesson-wizard.ts`).
- Checks: not run (UI-only removals).

## 2026-01-16 — Codex session (Budget table cells fill height)

- Budget table: made table controls fill cell height and align center, with absolute cell wrappers and full-height inputs/selects (`src/components/training/module-detail/assignment-form.tsx`).
- Budget table: textarea auto-resize now respects cell height to avoid bottom gaps (`src/components/training/module-detail/assignment-form.tsx`).
- Checks: not run (UI-only styling updates).

## 2026-01-16 — Codex session (Budget table padding + unit dropdown)

- Budget table: added a 10px inset on the full-bleed table frame so it no longer touches the app shell edges (`src/components/training/module-detail/assignment-form.tsx`).
- Budget table: replaced Unit with a select + custom input (select sets unit, custom input allows overrides) and kept full-height layout (`src/components/training/module-detail/assignment-form.tsx`).
- Checks: not run (UI-only styling changes).

## 2026-01-16 — Codex session (Budget table background uniformity)

- Budget table: aligned drag/textarea/action cells to use the same dark-mode background as the inputs (`src/components/training/module-detail/assignment-form.tsx`).
- Checks: not run (UI-only styling updates).

## 2026-01-16 — Codex session (Budget table shrink + unit suggestions + rebuild brief)

- Budget table: fixed textarea resize to shrink correctly by using min-height instead of row height (`src/components/training/module-detail/assignment-form.tsx`).
- Budget table: replaced the unit select+input combo with a single input + datalist suggestions (no duplicate controls) and kept preset options (`src/components/training/module-detail/assignment-form.tsx`).
- Docs: added a TanStack rebuild brief and indexed it (`docs/briefs/budget-table-rebuild.md`, `docs/briefs/INDEX.md`).
- Checks: not run (UI + docs).

## 2026-01-16 — Codex session (Budget table rebuild integration + uniform surface)

- Budget table: wired the TanStack-based table component into assignments and updated the full-bleed frame calc for a consistent 10px shell inset (`src/components/training/module-detail/assignment-form.tsx`).
- Budget table: unified table surface/backgrounds and ensured cell content renders on the same surface across controls (`src/components/training/module-detail/budget-table.tsx`).
- API: preserve blank budget table rows so newly added items don't get stripped on autosave (`src/app/api/modules/[id]/assignment-submission/route.ts`).
- UI: matched the budget description card radius and increased subtotal spacing (`src/components/training/module-detail/assignment-form.tsx`).
- Checks: not run (UI-only changes).

## 2026-01-16 — Codex session (Notifications brief refresh)

- Docs: refreshed the notifications brief to cover system-wide event triggers and launch-ready scope (`docs/briefs/notifications.md`).
- Docs: marked the notifications brief as active in the brief index (`docs/briefs/INDEX.md`).
- Checks: not run (docs-only changes).

## 2026-01-16 — Codex session (Restore accelerator module cards)

- Accelerator overview: restored the module cards/categories section while filtering out the legacy LMS class (`src/app/(accelerator)/accelerator/page.tsx`, `src/lib/accelerator/progress.ts`).
- UI: reintroduced the module card grid component (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only changes).

## 2026-01-16 — Codex session (Notifications event triggers)

- Notifications: added shared helper + schema extensions for event metadata (`src/lib/notifications.ts`, `supabase/migrations/20260116130000_extend_notifications.sql`, `src/lib/supabase/schema/tables/notifications.ts`).
- Notifications: emit events for module completion, coaching link opens, roadmap adds/publish, and document uploads (`src/app/api/modules/[id]/assignment-submission/route.ts`, `src/app/api/meetings/schedule/route.ts`, `src/app/(dashboard)/strategic-roadmap/actions.ts`, `src/app/api/account/org-documents/route.ts`, `src/app/api/account/org-public-documents/route.ts`).
- Checks: not run (server/UI wiring changes).

## 2026-01-16 — Codex session (Notifications event map doc)

- Docs: documented active notifications and high-signal proposals (`docs/notifications-events.md`).
- Checks: not run (docs-only).

## 2026-01-16 — Codex session (Accelerator card image spacing)

- UI: aligned accelerator module card image container spacing/radius with the coaching card pattern (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-16 — Codex session (Accelerator card image clipping)

- UI: clipped module card media within the rounded card container to prevent overflow (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-16 — Codex session (Accelerator card image sizing)

- UI: adjusted module card media sizing to avoid overflow/clipping while keeping the inset spacing (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-16 — Codex session (Curriculum header centering)

- UI: centered and spaced the accelerator curriculum header block (`src/app/(accelerator)/accelerator/page.tsx`).
- Checks: not run (UI-only).

## 2026-01-16 — Codex session (Curriculum group picker + search)

- UI: show one accelerator group at a time with search + track selector controls (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-16 — Codex session (Curriculum search/selector icons)

- UI: added icons to the module search and track selector, and tightened the search width (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-16 — Codex session (Accelerator sidebar class nav hidden)

- UI: hid accelerator class navigation in the sidebar to prioritize overview navigation (`src/components/accelerator/accelerator-sidebar.tsx`).
- UI: matched search input width to module card sizing breakpoints (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-16 — Codex session (Accelerator auto-collapse sidebar)

- UI: auto-collapsed the accelerator sidebar on module pages and styled the trigger with a bordered container (`src/components/accelerator/accelerator-shell.tsx`).
- Checks: not run (UI-only).

## 2026-01-16 — Codex session (Coaching button contrast)

- UI: made the coaching schedule button black-on-white in light mode while preserving dark mode styling (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Checks: not run (UI-only).

## 2026-01-18 — Codex session (Accelerator select hydration mismatch)

- UI: render a non-hydrating placeholder for the track select until mount to avoid Radix Select SSR ID mismatches (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-18 — Codex session (AGENTS UI quality rubric)

- Docs: merged UI quality rubric (interaction, animation, layout, a11y, perf, theming, hydration, design rules) into `AGENTS.md` without duplicating existing guidance.
- Checks: not run (docs-only).

## 2026-01-18 — Codex session (UI rubric punctuation)

- Docs: aligned UI rubric placeholders and curly quote examples with the canonical ellipsis and curly quote characters (`AGENTS.md`).
- Checks: not run (docs-only).

## 2026-01-18 — Codex session (Accelerator card backgrounds)

- UI: removed custom surface backgrounds on accelerator schedule and module cards to use default card background tokens (`src/components/accelerator/accelerator-schedule-card.tsx`, `src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-18 — Codex session (Accelerator next class + completion notification)

- UI: compute accelerator Next up card from the first incomplete class group instead of hardcoded text (`src/app/(accelerator)/accelerator/page.tsx`).
- Data: include class slug in accelerator module groups (`src/lib/accelerator/progress.ts`).
- Notifications: on module completion, check class completion and create a class completion notification when all class modules are done (`src/app/api/modules/[id]/assignment-submission/route.ts`).
- Checks: not run (UI/logic-only).

## 2026-01-18 — Codex session (Unified app shell brief)

- Docs: added unified app shell brief and indexed it (`docs/briefs/app-shell-unification.md`, `docs/briefs/INDEX.md`).
- Checks: not run (docs-only).

## 2026-01-18 — Codex session (Unified shell scope updates)

- Docs: updated app shell brief to include public shell usage, dashboard scope, and sign-in top bar requirement (`docs/briefs/app-shell-unification.md`).
- Checks: not run (docs-only).

## 2026-01-18 — Codex session (Unified app shell scaffold)

- UI: added shared AppShell with fixed center scroll container, top bar, and right-rail support (`src/components/app-shell.tsx`, `src/components/app-shell/right-rail.tsx`).
- UI: unified left-rail nav to include accelerator links, admin section links, and optional class list; hide account menu when signed out (`src/components/app-sidebar.tsx`).
- Routing: moved community and news routes into the dashboard group to inherit the unified shell (`src/app/(dashboard)/community`, `src/app/(dashboard)/news`).
- Layouts: switched dashboard, accelerator, and admin layouts to use AppShell (`src/app/(dashboard)/layout.tsx`, `src/app/(accelerator)/layout.tsx`, `src/app/(admin)/layout.tsx`).
- Checks: not run (layout-only).

## 2026-01-18 — Codex session (Unified shell rollout continued)

- UI: moved marketplace, people, and accelerator module controls into the right rail (`src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`, `src/components/people/people-table.tsx`, `src/components/accelerator/start-building-pager.tsx`).
- UI: refit community + news pages to AppShell content-only layout and removed legacy headers (`src/app/(dashboard)/community/page.tsx`, `src/app/(dashboard)/community/loading.tsx`, `src/app/(dashboard)/news/page.tsx`, `src/app/(dashboard)/news/how-we-think-about-AI/page.tsx`, `src/app/(dashboard)/news/funding-roadmaps/page.tsx`, `src/app/(dashboard)/news/formation-to-funding/page.tsx`, `src/app/(dashboard)/news/grassroots-discovery/page.tsx`).
- Layout: expanded AppShell max width when the left rail collapses and cleaned extra padding across dashboard/org/classes/training pages (`src/components/app-shell.tsx`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/my-organization/page.tsx`, `src/app/(dashboard)/my-organization/documents/page.tsx`, `src/app/(dashboard)/classes/page.tsx`, `src/app/(dashboard)/classes/loading.tsx`, `src/app/(dashboard)/class/[slug]/page.tsx`, `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`, `src/app/(dashboard)/organizations/page.tsx`, `src/app/(dashboard)/onboarding/page.tsx`, `src/app/(dashboard)/training/page.tsx`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`).
- Data: limited sidebar drafts to admins (`src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/training/page.tsx`).
- Checks: not run (UI/layout-only).

## 2026-01-18 — Codex session (Remove legacy admin academy/classes/settings)

- UI: removed admin Academy/Classes/Settings nav entries and retargeted admin landing to users (`src/components/app-sidebar.tsx`, `src/components/app-sidebar/nav-data.ts`, `src/components/global-search.tsx`, `src/app/(admin)/admin/page.tsx`, `src/lib/admin/auth.ts`).
- UI: deleted legacy admin academy/classes/settings pages and components, plus related breadcrumbs (`src/app/(admin)/admin/academy`, `src/app/(admin)/admin/settings`, `src/app/(admin)/admin/classes/page.tsx`, `src/app/(admin)/admin/classes/_components`, `src/app/(admin)/admin/classes/[id]/page.tsx`, `src/app/(admin)/admin/classes/[id]/loading.tsx`, `src/app/(admin)/admin/classes/[id]/_components`, `src/app/(admin)/admin/classes/[id]/actions.ts`, `src/app/(admin)/@breadcrumbs/admin/academy`, `src/app/(admin)/@breadcrumbs/admin/classes`, `src/app/(admin)/@breadcrumbs/admin/classes/[id]`).
- Cleanup: removed revalidation targets pointing at deleted admin routes and updated stray redirects/CTAs (`src/app/(admin)/admin/classes/actions/utils.ts`, `src/app/(admin)/admin/classes/actions/revalidate.ts`, `src/app/api/admin/classes/[id]/publish/route.ts`, `src/app/api/admin/classes/[id]/modules/route.ts`, `src/app/(admin)/admin/classes/actions/basic.ts`, `src/app/(admin)/admin/modules/[id]/actions.ts`, `src/components/dashboard/classes-overview.tsx`).
- Checks: not run (routing/nav cleanup).

## 2026-01-18 — Codex session (Clamp AppShell to viewport)

- Layout: clamp AppShell container to viewport height and prevent body overflow (`src/components/app-shell.tsx`).
- Checks: not run (layout-only).

## 2026-01-18 — Codex session (AppShell background tuning)

- UI: darkened rail backgrounds and header panel to emphasize the center shell (`src/components/app-shell.tsx`).
- Checks: not run (styling-only).

## 2026-01-18 — Codex session (AppShell surface palette)

- UI: defined AppShell-local surface variables and updated rail/header/container backgrounds and borders to match the dark reference palette (`src/components/app-shell.tsx`).
- Checks: not run (styling-only).

## 2026-01-18 — Codex session (Shell rail alignment polish)

- UI: unified shell background/overscroll colors, tightened shell spacing, and narrowed left/right rails to match the reference layout (`src/components/app-shell.tsx`, `src/components/ui/sidebar.tsx`, `src/app/globals.css`).
- Checks: not run (layout-only).

## 2026-01-18 — Codex session (Shell width fix)

- UI: ensured the AppShell wrapper fills the provider width to prevent the layout from shrinking and leaving unused space (`src/components/app-shell.tsx`).
- Checks: not run (layout-only).

## 2026-01-18 — Codex session (Accelerator classes rail move)

- UI: moved accelerator class/module nav into the right rail via multi-slot rail support and filtered legacy Published Class entries (`src/components/app-shell/right-rail.tsx`, `src/components/app-shell.tsx`, `src/components/app-sidebar/classes-section.tsx`, `src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-18 — Codex session (Right rail store stabilization)

- UI: switched right-rail slots to an external store to prevent render loops while preserving live updates in rail content (`src/components/app-shell/right-rail.tsx`, `src/components/app-shell.tsx`).
- Checks: not run (runtime fix).

## 2026-01-18 — Codex session (Remove accelerator module search control)

- UI: removed the accelerator module search input from the right rail while keeping track selection and module list intact (`src/components/accelerator/start-building-pager.tsx`).
- Checks: not run (UI-only).

## 2026-01-18 — Codex session (Class selector for modules)

- UI: replaced the accelerator class list with a dropdown selector and a single module list, removing the multi-class sidebar list (`src/components/app-sidebar/classes-section.tsx`, `src/components/app-sidebar.tsx`, `src/components/app-shell.tsx`, `src/components/dashboard/dashboard-shell.tsx`).
- Checks: not run (UI-only).

## 2026-01-18 — Codex session (Header alignment pass)

- UI: reorganized the AppShell header into rail/middle/action columns so the brand/toggle align with the left rail and the title area centers over the main content (`src/components/app-shell.tsx`).
- Checks: not run (layout-only).

## 2026-01-18 — Codex session (Shell rail borders removed)

- UI: removed visible borders from the top rail and left/right rails to match the unified surface treatment (`src/components/app-shell.tsx`).
- Checks: not run (styling-only).

## 2026-01-18 — Codex session (Shell spacing + rail responsiveness)

- UI: tightened accelerator/community/marketplace/news/people/modules spacing and aligned roadmap header width for the unified shell (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/accelerator/start-building-pager.tsx`, `src/app/(dashboard)/community/page.tsx`, `src/app/(dashboard)/marketplace/page.tsx`, `src/app/(dashboard)/people/page.tsx`, `src/app/(dashboard)/news/page.tsx`, `src/components/training/class-overview.tsx`, `src/components/training/module-detail.tsx`, `src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`).
- UI: made the right rail persist down to `md` sizes and auto-close on mobile to prevent off-canvas overlays on resize (`src/components/app-shell.tsx`).
- Checks: not run (layout-only).

## 2026-01-20 — Codex session (Header right-rail alignment)

- UI: aligned the top-rail right padding with right-rail and no-rail states so the right toggle matches the shell container edge (`src/components/app-shell.tsx`).
- Checks: not run (layout-only).

## 2026-01-20 — Codex session (Shell gutter restore)

- UI: restored the shell gutter between the viewport/rails and the main container, keeping header alignment in sync (`src/components/app-shell.tsx`).
- Checks: not run (layout-only).

## 2026-01-20 — Codex session (Track selector in right rail)

- UI: updated the right-rail class selector to a Track dropdown and removed the class description block so it drives the module list (`src/components/app-sidebar/classes-section.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (App shell contract + checklist)

- Docs: added the unified app shell contract and QA checklist, and linked them from the unification brief and overview (`docs/app-shell.md`, `docs/app-shell-checklist.md`, `docs/briefs/app-shell-unification.md`, `docs/OVERVIEW.md`).
- Checks: not run (docs-only).

## 2026-01-20 — Codex session (Shell spacing standardization)

- UI: standardized rail spacing tokens, reduced redundant label styling, and aligned rail padding across header/rails/right rail (`src/components/app-shell.tsx`, `src/components/app-shell/right-rail.tsx`, `src/components/ui/sidebar.tsx`, `src/components/app-sidebar.tsx`, `src/components/nav-main.tsx`, `src/components/nav-documents.tsx`, `src/components/nav-secondary.tsx`, `src/components/app-sidebar/module-stepper.tsx`).
- Docs: documented rail spacing tokens in the app shell contract (`docs/app-shell.md`).
- Checks: not run (layout-only).

## 2026-01-20 — Codex session (Remove legacy shells)

- Cleanup: removed unused legacy shell/sidebar components now superseded by AppShell (`src/components/accelerator/accelerator-shell.tsx`, `src/components/accelerator/accelerator-sidebar.tsx`, `src/components/dashboard/dashboard-shell.tsx`, `src/components/app-sidebar/mobile-sidebar.tsx`).
- Checks: not run (cleanup-only).

## 2026-01-20 — Codex session (Right-rail labeling + spacing)

- UI: introduced a shared rail label component and aligned right-rail control spacing to shell tokens (`src/components/ui/rail-label.tsx`, `src/components/app-sidebar/classes-section.tsx`, `src/components/accelerator/start-building-pager.tsx`, `src/components/people/people-table.tsx`, `src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).
- Checks: not run (layout-only).

## 2026-01-20 — Codex session (Org admin + accelerator redirects)

- UI: refined shell padding, rail width, and accelerator module cards to align with the unified container; removed nested rounding on My Organization header (`src/components/app-shell.tsx`, `src/components/ui/sidebar.tsx`, `src/app/(accelerator)/accelerator/page.tsx`, `src/components/organization/org-profile-card/header.tsx`).
- UI: standardized ProgramCard usage and hardened accelerator module cards to use Link semantics (`src/components/programs/program-card.tsx`, `src/components/organization/org-profile-card/tabs/programs-tab.tsx`, `src/components/organization/org-profile-card/public-card.tsx`, `src/components/roadmap/roadmap-shell.tsx`, `src/components/accelerator/start-building-pager.tsx`).
- Admin: repurposed `/admin` to organization access management, removed internal admin subroutes, and aligned nav/search gating (`src/app/(admin)/layout.tsx`, `src/app/(admin)/admin/page.tsx`, `src/app/(admin)/@breadcrumbs/admin/page.tsx`, `src/components/app-sidebar.tsx`, `src/components/app-sidebar/nav-data.ts`, `src/components/global-search.tsx`).
- Routing: redirect accelerator class landing to the next module and update search/notification links to avoid class pages (`src/app/(accelerator)/accelerator/class/[slug]/page.tsx`, `src/app/api/search/route.ts`, `src/components/global-search.tsx`, `src/app/api/modules/[id]/assignment-submission/route.ts`).
- Checks: not run (manual changes only).

## 2026-01-20 — Codex session (Roadmap TOC + shell polish)

- Roadmap: replaced section definitions with the new strategic roadmap outline, merged stored sections safely, and rebuilt the right-rail TOC with grouped items + animated indicator; added a template route under `/my-organization/roadmap/template` (`src/lib/roadmap.ts`, `src/components/roadmap/roadmap-editor.tsx`, `src/app/(dashboard)/my-organization/roadmap/template/page.tsx`).
- Shell/nav: removed the Platform label, tweaked rail width + group padding, tightened top content padding, and doubled the shell bottom gap; updated global search button width and dropped the accelerator roadmap entry (`src/components/app-sidebar.tsx`, `src/components/nav-main.tsx`, `src/components/ui/sidebar.tsx`, `src/components/app-shell.tsx`, `src/components/global-search.tsx`).
- Branding/UI: public header wordmark now uses default Inter and aligns to logo height; tutorial button icon updated (`src/components/public/public-header.tsx`, `src/components/tutorial/page-tutorial-button.tsx`).
- Dashboard links: roadmap CTAs now route to `/my-organization/roadmap`; test notification updated to the same (`src/app/(dashboard)/dashboard/page.tsx`, `src/app/actions/notifications.ts`).
- My Organization: increased header height and strengthened edit-mode section separators (`src/components/organization/org-profile-card/header.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/edit-mode.tsx`).
- Checks: not run (UI/layout changes).

## 2026-01-20 — Codex session (Remove rail border)

- UI: removed left/right rail container borders so the shell rails blend with the background (`src/components/ui/sidebar.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Admin split + layout fixes)

- My Organization: removed the header background block so the org profile doesn’t look like a nested card (`src/components/organization/org-profile-card/header.tsx`).
- Documents: switched the documents section to a centered single-column layout with a stacked header (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`).
- Nav: enforced single-line accelerator label + non-wrapping nav badges (`src/components/app-sidebar.tsx`, `src/components/nav-main.tsx`).
- Search: widened the global search button for better large-screen alignment (`src/components/global-search.tsx`).
- Admin: added a staff-only `/internal` route with its own layout/breadcrumbs, updated admin redirects, reserved slug, and protected routing, plus surfaced links in nav/search (`src/app/(internal)/layout.tsx`, `src/app/(internal)/internal/page.tsx`, `src/app/(internal)/@breadcrumbs/internal/page.tsx`, `src/app/(internal)/@breadcrumbs/default.tsx`, `src/components/app-sidebar/nav-data.ts`, `src/components/global-search.tsx`, `src/components/organization/org-profile-card/tabs/company-tab/constants.ts`, `src/lib/admin/auth.ts`, `src/proxy.ts`, `src/app/(admin)/admin/classes/actions/basic.ts`, `src/app/(admin)/admin/modules/[id]/actions.ts`).
- Checks: not run (UI/layout-only).

## 2026-01-20 — Codex session (Hide staff admin nav)

- Nav/Search: removed the Staff Admin entry from the sidebar and search results (`src/components/app-sidebar/nav-data.ts`, `src/components/global-search.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Brand label nowrap)

- Header: forced the Coach House wordmark to stay single-line during sidebar collapse animation (`src/components/app-shell.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap menu width)

- Roadmap: widened the “Add section” dropdown menu so labels stay single-line (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap TOC indicator timing)

- Roadmap: deferred TOC indicator measurement to the next frame so it aligns with the selected item after right-rail updates (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Header search responsiveness)

- Header: centered the actions slot and made the global search switch to icon-only based on available header width to avoid overlaps (`src/components/app-shell.tsx`, `src/components/global-search.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap publish CTA cleanup)

- Roadmap: removed the offline/upgrade/slug helper labels from the visibility toggle, keeping only the switch + live state and view links (`src/components/roadmap/roadmap-visibility-toggle.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap header + visibility toggle cleanup)

- Roadmap: removed the visibility toggle strip from the editor toolbar, leaving just the Save action (`src/components/roadmap/roadmap-editor.tsx`).
- Roadmap: hid the Strategic roadmap header in the editor/template pages while keeping an SR-only h1 for semantics (`src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`, `src/app/(dashboard)/my-organization/roadmap/template/page.tsx`).
- Roadmap: dropped unused publish-state props + subscription query now that the toggle is removed (`src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`).
- Tutorials: removed the roadmap publish step since the visibility toggle is gone (`src/components/tutorial/tutorial-manager.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap add-section removal)

- Roadmap: removed the “New” add-section dropdown from the right-rail TOC header and cleaned up unused add-section helpers (`src/components/roadmap/roadmap-editor.tsx`).
- Tutorials: removed the add-section walkthrough step since the trigger is gone (`src/components/tutorial/tutorial-manager.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap TOC header + section removal)

- Roadmap: retitled the right-rail header to “Strategic Roadmap” with the roadmap icon and filtered the strategic_roadmap section out of the editable TOC list (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap section actions removal)

- Roadmap: removed per-section action menus (no more delete controls) so sections are no longer addable/removable from the TOC (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap save button in toolbar)

- Roadmap: moved the Save/Saved button into the rich-text toolbar, positioned after Redo (`src/components/roadmap/roadmap-editor.tsx`).
- Rich text editor: added trailing toolbar actions slot so callers can place buttons to the right of Undo/Redo (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Item description size)

- UI: increased Item description text size for roadmap item subtitles (`src/components/ui/item.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor height + scroll)

- Roadmap: capped the rich-text editor height so it stays in view and scrolls internally instead of expanding, and disabled manual resize (`src/components/roadmap/roadmap-editor.tsx`).
- Rich text editor: added optional max height + resize lock support to enforce fixed editor heights (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap title/subtitle removal)

- Roadmap: removed the per-section title/subtitle inputs from the editor body (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Nav active + footer divider)

- Nav: compute active sidebar item by longest matching path so Roadmap doesn’t double-highlight My Organization (`src/components/nav-main.tsx`).
- Sidebar: removed the user menu divider line in the main app sidebar (`src/components/app-sidebar.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Nav user menu portal)

- Nav user: portaled the account menu to the document body and positioned it relative to the trigger so it can overflow the sidebar without clipping (`src/components/nav-user.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Nav live badge removal)

- Nav: removed the Live badge support from the left-rail nav (`src/components/nav-main.tsx`, `src/components/app-shell.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor fill height)

- Roadmap: shortened the editor min height, removed the fixed max height, and made the editor card stretch to the bottom with an even gap below while disabling bottom rounding on the contenteditable area (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor layout + rounding)

- Roadmap: reduced the editor min height, removed the fixed max height, and made the editor card fill the remaining space with a matching bottom gap; removed bottom rounding on the contenteditable area (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Remove roadmap test sections)

- Roadmap: added a cleanup pass to remove legacy "test"/"testing" sections from stored roadmap data and persist the cleaned profile (`src/lib/roadmap.ts`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Header actions overlap)

- Header: detect header action overflow to toggle compact search and tag header actions with `data-compact` for responsive layout (`src/components/global-search.tsx`, `src/components/app-shell.tsx`).
- Header actions: hide the tutorial label in compact mode and ensure the search label truncates cleanly (`src/components/tutorial/page-tutorial-button.tsx`, `src/components/global-search.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Header actions rework)

- Header actions: split center/right slots and convert the header actions area to a grid container for stable centering without JS (`src/components/app-shell.tsx`, `src/components/header-actions-portal.tsx`).
- Search: removed ResizeObserver compact logic and switched to container-query-driven search sizing to avoid flicker/overlap (`src/components/global-search.tsx`).
- Tutorial: restored original button styling and mounted it into the right header slot (`src/components/tutorial/page-tutorial-button.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Header rail layout states)

- Header: restructured the top rail into a three-column grid so the center actions stay centered, and moved the right actions into the right column for consistent alignment across rail open/close states (`src/components/app-shell.tsx`).
- Search: split the full search (center) and compact icon (right) into separate header slots, toggled via container queries for responsive layout without JS flicker (`src/components/global-search.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap section hero)

- Roadmap editor: replaced the dashed section banner with a centered icon + h1 + subtitle header and added breathing room from the top (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor height fill)

- Roadmap layout: converted the roadmap shell and editor page wrapper to flex/min-h-0 so the editor can stretch to the bottom with consistent shell padding (`src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor stretch)

- Roadmap shell: ensure the roadmap layout can fill the scroll viewport by using a full-height flex column (`src/components/roadmap/roadmap-shell.tsx`).
- Roadmap editor: removed the fixed min height and made the rich text editor container/content stretch to fill the remaining space (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Editor footer radius)

- Rich text editor: matched the footer rounding to the editor content and removed the separating border (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap save button styling)

- Roadmap editor: styled the save state button as a ghost action with muted text and disabled it when no changes are pending (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor height fix)

- Roadmap editor: removed min-height overrides on the contenteditable area so the editor renders at its default height and remains editable (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Revert editor height)

- Roadmap editor: restored the contenteditable height overrides for the rich text editor (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap prompt + count)

- Roadmap editor: moved the prompt text outside the editor and removed the editor placeholder so the typing area starts below the word count bar (`src/components/roadmap/roadmap-editor.tsx`).
- Rich text editor: left-aligned the word/character count bar (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor prompt header)

- Rich text editor: added an optional header slot rendered above the word count bar for static prompts (`src/components/rich-text-editor.tsx`).
- Roadmap editor: moved the prompt into the editor header slot so the typing area starts below the word count bar (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor header/count styling)

- Rich text editor: added customizable header/count/content classes and made the editor body flex-fill so the typing area extends beneath the word count bar (`src/components/rich-text-editor.tsx`).
- Roadmap editor: styled the header/count backgrounds and set the dark editor background to #171717 (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Editor padding + fill)

- Roadmap editor: added header bottom padding, rounded the count bar, and made the typing area fill the remaining height with the dark #171717 background (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Editor corner fix)

- Roadmap editor: clipped the typing area to rounded corners and removed the count bar rounding to prevent sharp corners showing behind (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Shadcn tiptap import)

- Added the shadcn tiptap basic files (skipped overwriting existing UI components) and kept our layout intact.
- Rich text editor: incorporated shadcn tiptap extensions (text style/color/typography/subscript/superscript) without changing the toolbar UI (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Tiptap import fix)

- Rich text editor: switched TextStyle to a named import to fix the build error (`src/components/rich-text-editor.tsx`).
- Checks: not run.

## 2026-01-20 — Codex session (Frameworks brief + editor placeholder)

- Docs: added the frameworks brief and indexed it; tracked the frameworks feature in the organizer (`docs/briefs/frameworks.md`, `docs/briefs/INDEX.md`, `docs/organize.md`).
- Roadmap editor: restored editor placeholder text using section examples and enabled TipTap placeholder styling via empty-node classes (`src/components/roadmap/roadmap-editor.tsx`, `src/components/rich-text-editor.tsx`).
- Cleanup: removed the shadcn tiptap demo route (`src/app/text-editor/page.tsx`).
- Checks: not run (UI/doc-only).

## 2026-01-20 — Codex session (Roadmap editor scroll)

- Roadmap editor: forced the TipTap body to flex-fill and scroll within the card to prevent the editor from expanding past its container (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor rounding)

- Roadmap editor: removed rounding from the typing surface and constrained it to its container height so the editor scrolls inside the card (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap extensions alignment)

- Rich text editor: aligned StarterKit list HTML attributes and link-on-paste behavior to the shadcn tiptap defaults without changing UI; kept placeholder behavior scoped to the root node (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor scroll container)

- Roadmap editor: moved scrolling to the editor body wrapper and pinned the page column to full height so pasted content scrolls within the card; typing surface stays square at the bottom (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap editor scroll target)

- Roadmap editor: moved scrolling onto the contenteditable element so the editor scrolls when the cursor is over the typing area; the card wrapper stays rounded and the typing surface remains square (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Toolbar dropdown fix)

- Rich text editor: simplified toolbar dropdown triggers to use Radix DropdownMenuTrigger directly to restore text style/blocks/align menus without changing styling (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Tutorial selectors)

- Tutorial: pointed the accelerator “Return home” step at the existing My Organization nav target; added a tour anchor to the accelerator CTA and roadmap TOC so tutorial steps resolve in the new layout (`src/components/tutorial/tutorial-manager.tsx`, `src/app/(accelerator)/accelerator/page.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Text style menu fix)

- Rich text editor: replaced the text style radio group with direct menu items to ensure heading level commands fire reliably; styling remains the same (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap placeholders)

- Rich text editor: allow placeholders to render in read-only mode so template views still show prompts (`src/components/rich-text-editor.tsx`).
- Roadmap editor: fall back to section placeholders when subtitle examples are missing to ensure every section has prompt copy (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap section header fallback)

- Roadmap editor: render the section header block for custom sections like Foundations by falling back to the section’s title/subtitle when template copy is missing (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap custom placeholders)

- Roadmap data: derive unique placeholder text for custom roadmap sections from their subtitle or title so every section has a distinct prompt (`src/lib/roadmap.ts`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap caret + placeholder behavior)

- Rich text editor: focus the editor when clicking the header/count area and prevent placeholders from persisting after adding extra empty lines; added caret cursor styling and placeholder visibility control (`src/components/rich-text-editor.tsx`, `src/app/globals.css`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap light-mode tones)

- Roadmap editor: set three light-grey tones for header, count bar, and editor body to mirror the dark-mode layering (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (DropdownMenu radio import)

- Rich text editor: restored DropdownMenuRadioGroup/Item imports to fix the align menu runtime error (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap placeholder per section)

- Rich text editor: keep the placeholder text in sync with prop changes so each roadmap section shows its own prompt (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap light-mode swap)

- Roadmap editor: swapped the light-mode backgrounds between the word-count bar and the typing surface to make the content area lighter (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap placeholder scope)

- Rich text editor: scope placeholder display to empty editors only so placeholders don’t appear after text is present (`src/app/globals.css`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap placeholders + inline images)

- Roadmap editor: prioritize section prompt placeholders for the editor body and switch image uploads to insert inline content instead of rendering a separate image header (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap placeholder visibility restore)

- Rich text editor: show placeholder text again by removing the root-class requirement while keeping the hidden-placeholder guard (`src/app/globals.css`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap placeholder gating)

- Rich text editor: gate placeholder rendering on a computed empty state so placeholders only show when the document is empty and disappear after heading changes create trailing empty blocks (`src/components/rich-text-editor.tsx`, `src/app/globals.css`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Remove legacy roadmap section)

- Roadmap data: filter out the legacy Foundations section from stored roadmap entries so it no longer appears in the TOC (`src/lib/roadmap.ts`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap image controls)

- Rich text editor: swapped to the shadcn ImageExtension and ensured a paragraph is created after inline image insertion so typing continues; image uploads now flow through the real uploader (`src/components/rich-text-editor.tsx`, `src/hooks/use-image-upload.ts`, `src/components/tiptap/extensions/image.tsx`).
- TipTap extensions: wired image upload hooks to accept real upload handlers in the image and placeholder node views (`src/components/tiptap/extensions/image.tsx`, `src/components/tiptap/extensions/image-placeholder.tsx`, `src/hooks/use-image-upload.ts`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap heading sizes)

- Rich text editor: increased H1/H2/H3 sizes and weight so heading levels are visually distinct and H1 is bold enough (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (TipTap heading behavior)

- Rich text editor: switch heading menu actions to toggleHeading and add explicit .tiptap h1/h2/h3 styling so H1 is visibly bold and large (`src/components/rich-text-editor.tsx`, `src/app/globals.css`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Ordered list indent)

- Rich text editor: move ordered list markers inside with extra padding to prevent clipping and restore indentation (`src/components/rich-text-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap image upload UX + private bucket)

- Rich text editor: insert images with an inline loading state and drop a paragraph after insertion so typing/scrolling continues; upload placeholders are removed on failure (`src/components/rich-text-editor.tsx`, `src/components/tiptap/extensions/image.tsx`).
- Roadmap editor: route inline image uploads through a private roadmap bucket (`src/components/roadmap/roadmap-editor.tsx`, `src/app/api/account/org-media/route.ts`, `src/lib/organization/org-media.ts`).
- Storage: added a private `roadmap-media` bucket with org-scoped RLS policies for read/write (`supabase/migrations/20260120190000_roadmap_media_bucket.sql`).
- Checks: not run (UI + migration).

## 2026-01-20 — Codex session (Roadmap editor scroll + image upload overlay)

- Image upload: add a pulsing inline upload overlay that doesn't block scrolling while uploads finish (`src/components/tiptap/extensions/image.tsx`).
- Roadmap editor: move scrolling to the editor content container to prevent clipping after image inserts (`src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Ordered list indent fix)

- Rich text editor: force list markers inside with explicit padding so ordered lists indent and markers are not clipped (`src/app/globals.css`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (List marker alignment)

- Rich text editor: ensure list item text sits on the same line as markers by zeroing list paragraph margins and rendering inline (`src/app/globals.css`).
- Checks: not run (UI-only).

## 2026-01-20 — Codex session (Roadmap placeholders)

- Roadmap: add short prompts for section headers and expand editor placeholder copy into multi-sentence guidance per section (`src/lib/roadmap.ts`, `src/components/roadmap/roadmap-editor.tsx`).
- Checks: not run (UI-only).

## 2026-01-22 — Codex session (Roadmap route)

- Routing: add `/roadmap` page and redirect `/my-organization/roadmap` to the new route; update nav/search/notifications/dashboard links to `/roadmap` (`src/app/(dashboard)/roadmap/page.tsx`, `src/app/(dashboard)/my-organization/roadmap/page.tsx`, `src/components/app-sidebar/nav-data.ts`, `src/components/nav-main.tsx`, `src/components/global-search.tsx`, `src/app/api/search/route.ts`, `src/app/(dashboard)/dashboard/page.tsx`, `src/app/actions/notifications.ts`).
- Roadmap actions: revalidate `/roadmap` after edits; reserve the `roadmap` slug (`src/app/(dashboard)/strategic-roadmap/actions.ts`, `src/app/api/public/organizations/slug-available/route.ts`).
- Worked: route change and redirects implemented; links now point to `/roadmap`.
- Didn't: tests not run.
- Next: verify `/roadmap` loads and `/my-organization/roadmap` redirects; run `pnpm lint && pnpm test:snapshots && pnpm test:acceptance` if needed.

## 2026-01-22 — Codex session (Accelerator program builder hide)

- Accelerator overview: hide the Program Builder section behind a feature toggle for now (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Mobile shell cleanup)

- App shell: move sidebar toggles to a mobile footer bar, hide header toggles on mobile, and add bottom padding for the new footer (`src/components/app-shell.tsx`).
- Sidebar: add inner padding to the mobile sheet so content doesn't touch edges (`src/components/ui/sidebar.tsx`).
- Accelerator: render the curriculum track selector inline on mobile to remove duplicate right-rail dropdowns (`src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Module step rail controls)

- Accelerator right rail: swap module nav buttons for step navigation controls with chevron icons and wire them to the module stepper via custom events (`src/components/app-sidebar/classes-section.tsx`, `src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Right rail padding)

- App shell: add explicit padding to the mobile right-rail sheet and revert unintended left sheet padding (`src/components/app-shell.tsx`, `src/components/ui/sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Mobile header/search spacing)

- App shell: hide brand text on mobile and add labels to the mobile footer nav buttons (`src/components/app-shell.tsx`).
- Global search: constrain command dialog width on mobile for viewport gutter (`src/components/global-search.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Command palette height)

- Global search: cap command dialog height on mobile so it clears the footer (`src/components/global-search.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Shell header/footer slots)

- App shell: add content header/footer slots inside the main shell container for card-like page framing (`src/components/app-shell.tsx`, `src/components/app-shell/shell-content-portal.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Shell content padding)

- App shell: increase top/bottom padding inside the main content column for all pages (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Shell body spacing)

- App shell: increase top/bottom padding inside the content body to keep cards off the shell edges (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Shell body padding bump)

- App shell: increase content body padding to create a clear gap above/below page cards (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Shell body padding follow-up)

- App shell: increase content body padding and let the body flex to keep a clear gap above/below page cards (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Shell scroll spacing)

- App shell: make the scroll container a column flex layout and increase bottom padding to ensure visible gap below page cards (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Documents tab bottom padding)

- Documents: add bottom padding to the documents list section so the scroll ends below the last card (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Admin column layout)

- Admin nav: rename sidebar item to “Admin” for org admins and platform admins (`src/components/app-sidebar/nav-data.ts`).
- Org admin page: align layout to the centered single-column design (`src/app/(admin)/admin/page.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Community/Accelerator column layout)

- Community + Accelerator pages: apply the centered single-column layout wrapper to match other shell pages (`src/app/(dashboard)/community/page.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Revert Accelerator layout)

- Accelerator overview: revert the centered single-column wrapper change per request (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Marketplace column layout)

- Marketplace: apply the centered column layout, remove the redundant eyebrow label, and move search/category filters under the page header (`src/app/(dashboard)/marketplace/page.tsx`, `src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Marketplace results columns)

- Marketplace: reduce the results grid to two columns across breakpoints (`src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Marketplace featured carousel)

- Marketplace: show featured recommendations one at a time with dot controls and autoplay (prefers-reduced-motion aware) (`src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Marketplace header icon)

- Marketplace: center the page header and add the icon badge container above the title (`src/app/(dashboard)/marketplace/page.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Marketplace category width)

- Marketplace: make the category select trigger full width within its column (`src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Marketplace card banner)

- Marketplace cards: add a rounded banner image container above the card details and stack the content below (`src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Marketplace image fallbacks)

- Marketplace cards: add local banner fallback per item and swap to it when remote logos fail; hide the initial when images load (`src/app/(dashboard)/marketplace/ui/marketplace-client.tsx`).
- Assets: generate placeholder banner/logo SVGs for each marketplace item (`public/marketplace/banners/*`, `public/marketplace/logos/*`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Sidebar progress size)

- Sidebar: reduce accelerator progress indicator size to fit tighter in the nav row (`src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Breadcrumb overflow)

- Breadcrumbs: prevent overflow on mobile by enforcing nowrap/truncation and min-width constraints so header content doesn't overlap actions (`src/components/ui/breadcrumb.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Breadcrumb overlap fix)

- Header: clamp breadcrumb container and enforce truncation so the title can't overlap right-side actions on mobile (`src/components/app-shell.tsx`, `src/components/ui/breadcrumb.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Header mobile grid)

- Header: switch mobile layout to two-column grid and hide the center slot under 640px to prevent breadcrumb overlap with right actions (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Header layout rollback)

- Header: restore desktop grid structure, keep center slot visible, and reduce rail width on mobile to prevent breadcrumb overlap (`src/components/app-shell.tsx`).
- Breadcrumbs: revert earlier truncation/nowrap changes to restore original desktop layout (`src/components/ui/breadcrumb.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (People filters labels)

- People page: remove visible SEARCH/CATEGORY rail labels and add aria-labels for accessibility (`src/components/people/people-table.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (People category width)

- People page: make the category select trigger full width to match the search input (`src/components/people/people-table.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (People page bottom padding)

- People page: add extra bottom padding so the table/pagination isn't flush against the shell bottom (`src/app/(dashboard)/people/page.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Org chart details)

- People page: remove the map details toggle and always show org chart extras (`src/components/people/org-chart-canvas-lite.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Org chart controls panel)

- People org chart: remove the controls panel border/background so the panel container is invisible (`src/app/globals.css`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Org chart top padding)

- People org chart: add top padding to match side spacing by offsetting the lane layout start position (`src/components/people/org-chart-canvas.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Org chart padding constant)

- People org chart: introduce a shared padding constant to fix the translateExtent ReferenceError (`src/components/people/org-chart-canvas.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Header/mobile fixes + People hydration)

- Header: switch header action grid to 2-column on small screens and hide center slot until >=640px to prevent breadcrumb overlap (`src/components/app-shell.tsx`).
- Breadcrumbs: enforce single-line, truncated breadcrumb labels in dashboard header (`src/components/dashboard/breadcrumbs.tsx`).
- People page: render the table/client rail only after mount to avoid Radix hydration ID mismatches; add a lightweight loading fallback (`src/app/(dashboard)/people/page.tsx`).
- People table: add extra bottom padding for pagination spacing (`src/components/people/people-table.tsx`).
- Org chart: align left padding for lane labels and node columns with the shared padding constant (`src/components/people/org-chart-canvas.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Header/breadcrumb stability)

- Header: make the desktop header grid always 3 columns at md+ to stop mobile tweaks from collapsing the desktop layout (`src/components/app-shell.tsx`).
- Breadcrumbs: scope truncation/nowrap to mobile and restore wrapping/visibility on sm+ (`src/components/dashboard/breadcrumbs.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Header/rail alignment + sidebar animation)

- Header: align logo padding with rail item padding so the logo and sidebar items share a vertical axis in collapsed state (`src/components/app-shell.tsx`).
- Sidebar: smooth collapse/expand transitions with ease-in-out and longer duration for gap + container (`src/components/ui/sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Header stability brief)

- Added header stability brief using the standard template (`docs/briefs/app-shell-header-stability.md`).
- Updated brief index (`docs/briefs/INDEX.md`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Header stability refactor)

- Header: center the logo within the collapsed rail and remove container-query header classes (`src/components/app-shell.tsx`).
- Sidebar: set collapsed rail padding variables at the provider level and center menu items; smooth menu button transitions (`src/components/ui/sidebar.tsx`).
- Header actions: replace container-query visibility with explicit `md` breakpoints (`src/components/global-search.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (Collapsed rail spacing)

- App shell: remove extra left gutter when the sidebar is collapsed so the rail sits tight to the shell (`src/components/app-shell.tsx`).
- Sidebar: center collapsed menu buttons and remove extra gap within the icon rail (`src/components/ui/sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-22 — Codex session (App shell container)

- App shell: remove the extra centering wrapper so the main shell spans the full available width without left/right gaps (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator shell polish)

- Synced accelerator Track selectors via `?track=` and kept icon variant (`src/components/accelerator/start-building-pager.tsx`, `src/components/app-sidebar/classes-section.tsx`, `src/hooks/use-track-param.ts`).
- App shell: unified sidebar/right-rail toggle styles and added header subnav slot (`src/components/app-shell.tsx`, `src/components/header-subnav-portal.tsx`).
- Module pages: moved stepper into header subnav and left-aligned header copy (`src/components/training/module-detail.tsx`, `src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail/module-header.tsx`).
- Fix module stepper fragment close + nesting (`src/components/training/module-detail/module-stepper.tsx`).
- Suppress duplicate Track rail control on `/accelerator` (`src/components/accelerator/start-building-pager.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Rail label + right rail width)

- Right rail: remove the visible Track label while keeping it available to screen readers (`src/components/app-sidebar/classes-section.tsx`).
- Right rail: match mobile sheet width to the left rail by removing the max-width cap (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Right rail padding)

- Right rail: remove top padding above the Track selector on desktop (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Header alignment + right rail animation)

- Header: align collapsed rail toggles with the shell edge by removing collapsed inset and using full-width header max (`src/components/app-shell.tsx`).
- Right rail: fade content out before collapsing width to avoid squished text (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Shell body padding)

- Shell content: reduce bottom padding by matching top/bottom padding in the main content body (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Module continue lock)

- Module completion: disable “Continue to next lesson” when the next module is still locked/unpublished (`src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`, `src/components/training/module-detail.tsx`, `src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Take a break routing)

- Module completion: route “Take a break” back to `/accelerator` when in accelerator context, keep `/my-organization` otherwise (`src/components/training/module-detail.tsx`, `src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (TipTap focus)

- RichTextEditor: prevent wrapper focus handler from stealing cursor when clicking inside contenteditable (`src/components/rich-text-editor.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (StartBuildingCard spacing)

- Tightened vertical spacing between module card text elements (`src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator overview polish)

- Overview: filter out legacy “Published Class” groups, add more vertical padding, and increase spacing above Next up (`src/app/(accelerator)/accelerator/page.tsx`).
- Coaching card: remove extra horizontal padding by letting the card fill the column width (`src/components/accelerator/accelerator-schedule-card.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Module re-entry reset)

- Module stepper: reset active step to the first step when navigating to a different module (`src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (TipTap select-all)

- RichTextEditor: Cmd/Ctrl+A now selects only editor content instead of the whole page (`src/components/rich-text-editor.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Item description wrap)

- Item UI: allow secondary text to wrap instead of truncating (`src/components/ui/item.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Sidebar progress size)

- Sidebar: reduce Accelerator CircularProgress size for tighter nav (`src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (RichTextEditor setContent)

- RichTextEditor: defer setContent to the next animation frame to avoid lifecycle flushSync warnings (`src/components/rich-text-editor.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator progress errors)

- Accelerator progress: suppress expected missing-table errors to avoid noisy console logs (`src/lib/accelerator/progress.ts`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Sidebar nav order)

- Sidebar: move Roadmap (and Documents) to render below Accelerator by splitting primary/secondary nav groups (`src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Global search width)

- Header: let the search bar run wider and bias right alignment on tighter widths (`src/components/app-shell.tsx`, `src/components/global-search.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Tutorial icon)

- Tutorial button: switch to a book icon for clearer affordance (`src/components/tutorial/page-tutorial-button.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator curriculum label)

- Accelerator overview: remove the “Curriculum” label above Modules & sessions (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator curriculum alignment)

- Accelerator overview: left-align the Modules & sessions header block (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (StartBuildingCard top spacing)

- Accelerator module cards: reduce top spacing above the CTA label (`src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (StartBuildingCard top spacing tweak)

- Accelerator module cards: further reduce spacing above the status label (`src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator title)

- Accelerator overview: rename header to “Idea to Impact Accelerator” (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator intro copy)

- Accelerator overview: updated intro paragraph copy to the new welcome statement (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Track picker wrap)

- Right-rail track picker: allow two-line selection label to avoid truncation (`src/components/app-sidebar/classes-section.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator layout + sidebar order)

- Accelerator overview: constrain layout width with even padding; removed redundant section padding (`src/app/(accelerator)/accelerator/page.tsx`).
- Sidebar: keep Accelerator nav in original position and move Roadmap below it (`src/components/app-sidebar.tsx`).
- Select: added multiline trigger option and applied to track picker (`src/components/ui/select.tsx`, `src/components/app-sidebar/classes-section.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Track picker layout)

- Track picker: two-line label/value layout with multiline trigger sizing and aligned chevron (`src/components/ui/select.tsx`, `src/components/app-sidebar/classes-section.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Hide AI The Need module)

- Accelerator overview: hide the “AI The Need” module card in the overview grid (`src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Track stepper alignment)

- Right-rail module stepper: align badge column to the track picker icon by padding the list (`src/components/app-sidebar/classes-section.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator card status alignment)

- Accelerator overview cards: move the status pill into the CTA row so it aligns with the CTA label (`src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Track dropdown icons)

- Track pickers: add per-track icons in the dropdown list and show the selected icon in triggers (`src/components/app-sidebar/classes-section.tsx`, `src/components/accelerator/start-building-pager.tsx`, `src/lib/accelerator/track-icons.ts`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Track label hidden)

- Right-rail track picker: remove visible “Track” label while keeping the sr-only label and multi-line value layout (`src/components/app-sidebar/classes-section.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Track dropdown icons cleanup)

- Track dropdowns: hide the right-side indicator so only the left track icons appear (`src/components/ui/select.tsx`, `src/components/app-sidebar/classes-section.tsx`, `src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Track dropdown alignment)

- Track dropdowns: render a single left icon via SelectItem icon slot; center multiline triggers for single-line values (`src/components/ui/select.tsx`, `src/components/app-sidebar/classes-section.tsx`, `src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Track picker line spacing)

- Track picker: tighten multiline line-height to reduce vertical gap (`src/components/ui/select.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Module stepper header wrapper)

- Module stepper: wrap header stepper rail in a semantic header container in the app shell subnav (`src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Module stepper body header)

- Module pages: render the stepper inside the content body and keep headings in the body (`src/components/training/module-detail.tsx`, `src/components/training/module-detail/module-stepper.tsx`).
- App shell: remove the border around the main content container (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Right rail controls removal)

- Right rail: removed the module stepper prev/next control buttons under the list (`src/components/app-sidebar/classes-section.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (App shell border restore)

- App shell: restored the main content container border to keep the rounded shell visible (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Module header + stepper placement)

- Module pages: move the stepper into the content header slot within the shell body (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail.tsx`).
- Module header: reduce title/subtitle sizing in the body (`src/components/training/module-detail/module-header.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Sidebar nav spacing)

- Sidebar: tighten spacing between Accelerator and Roadmap nav items (`src/components/app-sidebar.tsx`, `src/components/nav-main.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Sidebar nav spacing fix)

- Sidebar: pull Roadmap group closer to Accelerator while keeping separate groups (`src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (App shell cleanup brief)

- Docs: drafted cleanup brief for removing `/dashboard`, unifying sidebar/app shell, and DRY module pages (`docs/briefs/app-shell-structure-cleanup.md`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (App shell cleanup inventory)

- Inventory: mapped sidebar duplication (`src/components/ui/sidebar.tsx` vs `src/components/ui/sidebar/`), `/dashboard` route dependencies, and `(dashboard)` action imports used by shared components.
- Worked: confirmed module routes and app shell layout entry points.
- Didn't: no code changes; ready to propose consolidation and removal diffs.

## 2026-01-24 — Codex session (Sidebar module consolidation)

- Sidebar: moved the canonical implementation into `src/components/ui/sidebar/` and removed the conflicting `src/components/ui/sidebar.tsx`; aligned sidebar constants to the in-use dimensions (`src/components/ui/sidebar/constants.ts`, `src/components/ui/sidebar/context.tsx`, `src/components/ui/sidebar/layout.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Dashboard removal + shared actions cleanup)

- Actions: moved shared server actions out of `(dashboard)` into `src/actions` and updated imports (`src/actions/people.ts`, `src/actions/roadmap.ts`, `src/actions/organization.ts`, `src/actions/programs.ts`).
- Routes/components: removed `/dashboard` route + related API/data/components and moved marketplace data to `src/lib/marketplace/data.ts`; moved breadcrumbs + pagination into app-shell/ui (`src/components/app-shell/breadcrumbs.tsx`, `src/components/ui/pagination-controls.tsx`).
- Cleanup: removed `/dashboard` redirect handling and revalidation targets; updated protected routes and breadcrumb stories.
- Didn't: tests not run.

## 2026-01-24 — Codex session (Sidebar menu top alignment tweak)

- Sidebar: remove main nav group vertical padding by using a `py-0` override so the menu can sit flush with the sidebar container (`src/components/nav-main.tsx`, `src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator/Roadmap group)

- Sidebar: group Accelerator + Roadmap together with standard item spacing and add a larger gap from the main nav group via group padding (`src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Sidebar top alignment)

- Sidebar: reduce top padding so the main nav aligns with the content body (`src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Sidebar/content top alignment)

- Sidebar: remove top padding and override main nav group top padding for top alignment (`src/components/app-sidebar.tsx`).
- App shell: remove top padding on the content flex wrapper to eliminate the small top gap (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Sidebar group gap removal)

- Sidebar: remove group vertical padding for the top nav section to eliminate the gap (`src/components/nav-main.tsx`, `src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Sidebar group spacing control)

- Sidebar: set content gap to zero and control group spacing via explicit padding (`src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (NavMain cn import)

- Fix runtime error by importing `cn` in `src/components/nav-main.tsx`.
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator card spacing)

- Accelerator overview cards: tighten the image-to-CTA spacing to center the CTA/status row between image and title (`src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-23 — Codex session (Accelerator card spacing tune)

- Accelerator overview cards: nudge CTA/status row down slightly for more even vertical balance (`src/components/accelerator/start-building-pager.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Sidebar brand runtime fix)

- App shell: add `SidebarBrand` component to restore the logo/title link in the sidebar header and stop the runtime error (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap icon fix)

- Sidebar: swap the Accelerator group Roadmap icon back to the Waypoints icon for consistency (`src/components/app-sidebar.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Module right-rail tool tray)

- Module pages: add a right-rail tool tray with notes, resources, coaching, AI access, and return-home actions (`src/components/training/module-right-rail.tsx`, `src/components/training/module-detail.tsx`).
- Notes: add a per-module local notes hook stored in localStorage (`src/hooks/use-module-notes.ts`).
- Right rail: widen module-page rail slightly and use a dedicated rail width variable (`src/components/app-shell.tsx`).
- Resources: add a stacked layout option for right-rail rendering (`src/components/training/resources-card.tsx`).
- Brief: document scope for the tool tray (`docs/briefs/module-right-rail-tool-tray.md`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator roadmap outline + stepper style)

- Accelerator overview: add a Strategic Roadmap outline card next to the schedule card (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/roadmap/roadmap-outline-card.tsx`).
- Module stepper: render the active step with a solid border instead of dashed (`src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Header wrap + dashboard cleanup)

- App shell: allow header actions to wrap on small screens to prevent overlaps (`src/components/app-shell.tsx`).
- Tooling: cleared `.next` to drop stale dashboard route references.
- Didn't: tests not run.

## 2026-01-24 — Codex session (Module header + right-rail alignment tweaks)

- Module header: tighten title/subtitle spacing and align with module content width (`src/components/training/module-detail/module-header.tsx`).
- Module stepper header: reduce height and right-align the header stepper (`src/components/training/module-detail/module-stepper.tsx`, `src/components/app-shell.tsx`).
- Right rail: align module tool tray section to the bottom of the rail (`src/components/training/module-detail.tsx`, `src/components/app-shell/right-rail.tsx`).
- Notes panel: remove the notes description line (`src/components/training/module-right-rail.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Module notes persistence)

- Notes: store user-scoped module notes in `module_progress.notes` with server actions and a debounced client hook (`src/app/actions/module-notes.ts`, `src/hooks/use-module-notes.ts`).
- Brief: update module rail brief to reflect DB persistence (`docs/briefs/module-right-rail-tool-tray.md`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Module header placement)

- Module header: render title/subtitle in the app header on desktop, keep body header on mobile (`src/components/training/module-detail/module-header.tsx`, `src/components/training/module-detail.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Header stepper alignment)

- Stepper header: right-align and tighten dot spacing for the header stepper (`src/components/training/module-detail/module-stepper.tsx`).
- Shell header: reduce content header padding height (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Stepper navigation spacing)

- Stepper header: move prev/next buttons closer to the step group with consistent spacing (`src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Header subtitle placement)

- Module subtitle: move into the shell content header on desktop so it sits left of the stepper (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/module-detail/module-header.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Module subtitle copy fix)

- Content: fix grammar and punctuation for the intro module subtitle (`supabase/seed.sql`, `supabase/migrations/20260124193000_fix_intro_module_subtitle.sql`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Module header icon)

- Module header: add the track icon in a rounded card to the left of the title/subtitle in the shell header (`src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Select trigger alignment)

- Select trigger: auto-align center for single-line values and top-align for wrapped values (`src/components/ui/select.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Track picker padding)

- Track picker: remove top padding in the select trigger so the track label sits higher (`src/components/app-sidebar/classes-section.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Track picker alignment)

- Track picker: restore balanced padding so the trigger keeps equal top/bottom space while the text aligns with the icon (`src/components/app-sidebar/classes-section.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Module stepper pagination)

- Module stepper: paginate step dots in sets of five with animated page shifts, keeping prev/next buttons intact (`src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Global search width)

- Header: make the global search button shrink within a flexible center column to avoid overlap on smaller screens (`src/components/global-search.tsx`, `src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Header stepper centering)

- Module header: hide title block until large screens and center the stepper when the title is hidden (`src/components/training/module-detail/module-stepper.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator auto-collapse)

- Sidebar: auto-collapse the left rail on accelerator routes while still allowing manual toggle (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Header alignment + sidebar toggle)

- Header: align left/right header actions to the same padding as shell content and keep accelerator auto-collapse from blocking manual toggles (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Header alignment + search collapse)

- Shell padding: unify header/body padding via `--shell-content-pad` so header toggles align with content (`src/components/app-shell.tsx`).
- Sidebar: ensure accelerator auto-collapse runs once and doesn't fight manual toggles (`src/components/app-shell.tsx`).
- Search: collapse to icon when the header center slot is too narrow; enforce min/max widths on the full button (`src/components/global-search.tsx`).
- Right rail: raise z-index to avoid top-edge clipping behind the header (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Header alignment + search visibility)

- Header: remove inner max-width so the toggle aligns with the shell content edge (`src/components/app-shell.tsx`).
- Search: show a compact icon in the center slot on tighter desktop widths and keep the mobile icon-only control visible (`src/components/global-search.tsx`).
- Accelerator: widen the right rail slightly (`src/components/app-shell.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Select multiline alignment)

- Select trigger: align multiline text to the top and nudge icons down when wrapping so the icons match the first line (`src/components/ui/select.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator overview swap)

- Accelerator overview: replace the coaching card with a compact next-module card and remove the in-page Next up block; change "Overview" to "Welcome" (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/accelerator/accelerator-next-module-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap right-rail carousel)

- Roadmap outline: convert the right-rail card to a horizontal, paginated carousel while keeping the roadmap navigation CTA (`src/components/roadmap/roadmap-outline-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator roadmap strip)

- Brief: add `docs/briefs/accelerator-roadmap-strip.md` and index it (`docs/briefs/INDEX.md`).
- Accelerator overview: move the roadmap summary to a full-width horizontal strip and tighten overview spacing (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/roadmap/roadmap-outline-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator curriculum header)

- Accelerator overview: remove the Modules & sessions heading block above the curriculum pager (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator overview spacing)

- Accelerator overview: tighten intro copy to two stacked blocks, cap line length, and increase vertical spacing between page sections (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator roadmap strip + routes)

- Roadmap strip: remove CTA, switch count to "X of Y completed", add section icons, status dots, taller clickable cards, and link to `/roadmap/[slug]` (`src/components/roadmap/roadmap-outline-card.tsx`).
- Roadmap routing: add `/roadmap/[slug]` page and support initial section selection in the editor shell (`src/app/(dashboard)/roadmap/[slug]/page.tsx`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`, `src/components/roadmap/roadmap-shell.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Shared roadmap icon map for consistent section icons (`src/components/roadmap/roadmap-icons.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Select trigger radius)

- Select triggers: increase rounding to match header toggle button styling across the app (`src/components/ui/select.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator next module card)

- Accelerator next module card: remove the uppercase "Start"/CTA label line above the title (`src/components/accelerator/accelerator-next-module-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap strip spacing)

- Roadmap outline: add top padding to separate the strip from the content above (`src/components/roadmap/roadmap-outline-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator next module width)

- Accelerator next module card: cap width to keep the card from stretching too wide (`src/components/accelerator/accelerator-next-module-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap strip card width)

- Roadmap outline: cap section card width to avoid oversized links (`src/components/roadmap/roadmap-outline-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap strip responsive paging)

- Roadmap outline: adjust page size based on viewport width so smaller screens show 2–3 items instead of 4 (`src/components/roadmap/roadmap-outline-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap strip min width)

- Roadmap outline: add a min width and prevent icon tile shrink to avoid squished cards on narrow viewports (`src/components/roadmap/roadmap-outline-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Accelerator spacing pass)

- Accelerator overview: reduce overall vertical spacing and tighten the overview section gap (`src/app/(accelerator)/accelerator/page.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header status)

- Roadmap sections: add persisted status field, save support, and header control for not started/in progress/complete; auto-mark in progress when content begins (`src/lib/roadmap.ts`, `src/actions/roadmap.ts`, `src/components/roadmap/roadmap-editor.tsx`).
- Roadmap overview: use status for completion counts and dots (`src/components/roadmap/roadmap-outline-card.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header layout + status select)

- Roadmap header: align icon to the left of the title/subtitle, stretch it to match header height, and replace the status pill/button with a status dropdown (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap rail status + snap)

- Roadmap rail: add status dots per item, snap scrolling with auto section selection on scroll stop, and data hooks for scroll sync (`src/components/roadmap/roadmap-editor.tsx`).
- Roadmap header: stretch icon to match title block height (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header icon square)

- Roadmap header: prevent icon container from shrinking so it stays square relative to the header block (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header square icon)

- Roadmap header: measure title/subtitle block height and size the icon tile to match so it stays perfectly square (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header icon sizing fix)

- Roadmap header: fix hook ordering to avoid accessing header title/subtitle before initialization (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header icon sizing tweak)

- Roadmap header: size icon tile directly to the text block height (no enforced minimum) and simplify styling to match shadcn item feel (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header icon rounding)

- Roadmap header: restore rounded-2xl corners on the icon tile (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header sizing reset)

- Roadmap header: remove dynamic sizing, restore bordered icon tile, and align text to top without extra vertical padding (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header icon sizing revisit)

- Roadmap header: reintroduce measured icon sizing based on the title/subtitle block height while keeping visible border/background (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header square layout)

- Roadmap header: switch to a grid layout so the icon square stretches to the text block height without JS sizing (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap header responsive layout)

- Roadmap header: stack icon above text on small screens and use measured square size on desktop via CSS variable (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap rail scroll undo)

- Roadmap rail: remove list scroll snapping/auto-selection and restore non-scrollable TOC list container (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap rail snap scroll)

- Roadmap rail: restore scroll-driven selection with snap and hidden scrollbars in the TOC list (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap rail scroll undo again)

- Roadmap rail: remove scroll-driven selection and restore static TOC list container (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap calendar brief)

- Brief: draft roadmap calendar replacement (new events table, permissions, recurrence drawer, shadcn calendar UI) (`docs/briefs/roadmap-calendar.md`).
- Brief index: add roadmap calendar entry (`docs/briefs/INDEX.md`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap calendar brief updates)

- Brief: update roadmap calendar spec for role-based assignments, notifications, UTC storage + locale display, and org ICS feed tokenization (`docs/briefs/roadmap-calendar.md`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap calendar feed decision)

- Brief: record ICS feed decision (single org-level feed includes all events) (`docs/briefs/roadmap-calendar.md`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap calendar build)

- Roadmap calendar: add public/internal event + feed tables with RLS, staff calendar permission toggle, and Supabase schema types (`supabase/migrations/20260124220000_roadmap_calendar_events.sql`, `src/lib/supabase/schema/tables/organization_access_settings.ts`, `src/lib/supabase/schema/tables/roadmap_calendar_*`, `src/lib/supabase/schema/tables/index.ts`).
- Calendar actions + notifications: CRUD, feed tokens, notifications on create/update/delete (`src/actions/roadmap-calendar.ts`, `src/lib/roadmap/calendar.ts`).
- Board Calendar UI: new left-presets + month grid + day list, public/internal toggle, event drawer, feed links; swap for board_calendar section (`src/components/roadmap/roadmap-calendar.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Admin setting: add staff calendar management toggle (`src/app/actions/organization-access.ts`, `src/components/account-settings/sections/organization-access-manager.tsx`).
- ICS feed endpoint for public/internal calendars (`src/app/api/roadmap/calendar.ics/route.ts`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap calendar layout polish)

- Board calendar layout: remove nested cards, align with editor container width, adjust responsive columns, and drop uppercase tracking styles (`src/components/roadmap/roadmap-calendar.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap calendar layout match)

- Roadmap calendar: match Cal.com layout with left overview + centered month grid + right day list, move quick add to right, add 12h/24h toggle, and normalize typography/styles (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap calendar layout fixes)

- Calendar layout: remove read-only note, stabilize header wrapping, and tighten calendar grid layout to reduce overlap (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-24 — Codex session (Roadmap calendar restructure)

- Calendar layout: remove outer card, shift presets into dropdown, drop public/internal + 12/24 toggles, and reflow columns for guided layout (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap section routing)

- Roadmap TOC: switch section items to Link-based navigation so URLs include section slugs (`src/components/roadmap/roadmap-editor.tsx`).
- Added `/accelerator/roadmap/[slug]` route to persist selection on refresh (`src/app/(accelerator)/accelerator/roadmap/[slug]/page.tsx`).
- Brief: added roadmap section routing brief + updated brief index (`docs/briefs/roadmap-section-routing.md`, `docs/briefs/INDEX.md`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap slug persistence fix)

- Roadmap section routing: sync active section to slug changes and add slug/id fallback in initial section resolution (`src/components/roadmap/roadmap-editor.tsx`, `src/components/roadmap/strategic-roadmap-editor-page.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap TOC slug sync + Select hydration)

- Roadmap TOC: sync active section to URL slug on client to prevent fallback to Origin Story when navigating or refreshing (`src/components/roadmap/roadmap-editor.tsx`).
- Select trigger: suppress hydration warning caused by Radix aria-controls id mismatch (`src/components/ui/select.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap loading skeletons)

- Roadmap: added a shared shell skeleton and route-level loading UI to prevent Origin Story flashes on navigation (`src/components/roadmap/roadmap-shell-skeleton.tsx`, `src/app/(dashboard)/roadmap/loading.tsx`, `src/app/(dashboard)/roadmap/[slug]/loading.tsx`, `src/app/(accelerator)/accelerator/roadmap/loading.tsx`, `src/app/(accelerator)/accelerator/roadmap/[slug]/loading.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap calendar layout + seeding)

- Calendar layout: equal-width three-column grid, removed feed rotation, and replaced feed block with a shadcn Item-style share button (`src/components/roadmap/roadmap-calendar.tsx`).
- Dev-only seed data: auto-create a larger set of demo events for scale testing (guarded by localStorage, non-production only) (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap calendar default styling)

- Calendar: reverted to default shadcn calendar styles, added event dot indicator, and widened roadmap calendar layout for equal columns (`src/components/roadmap/roadmap-calendar.tsx`, `src/components/roadmap/roadmap-editor.tsx`).
- Demo data: increased dev-only seed volume and bumped seed key (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap calendar card color)

- Calendar: set the month grid container to black with a subtle border for stronger contrast (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap calendar event row + share hidden)

- Calendar events: reflowed day list entries into stacked text and removed the status dot for a cleaner layout (`src/components/roadmap/roadmap-calendar.tsx`).
- Calendar share: hid the share card and removed unused imports (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap calendar timezone item)

- Calendar: restyled the time zone block as a shadcn Item with icon (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap calendar timezone dropdown)

- Calendar: added time zone dropdown using a shadcn Item-style trigger with chevron and persisted selection in localStorage; formatting now honors the selected time zone (`src/components/roadmap/roadmap-calendar.tsx`).
- Calendar layout: allow the calendar section to use full-width layout (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap calendar styling polish)

- Roadmap header spacing: reduced title/subtitle gap and matched top padding for the calendar section (`src/components/roadmap/roadmap-editor.tsx`).
- Calendar styling: kept default layout but enforced readable colors on the black card, added event dot contrast, and prevented hover from flipping to black (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Swap to calendar-01)

- Calendar: replaced the month grid with the shadcn `calendar-01` component and reattached event/date interactions + dot indicators (`src/components/calendar-01.tsx`, `src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Calendar centering)

- Calendar: centered the calendar-01 instance within its column to remove extra right-side space (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Calendar width)

- Calendar: removed max width/centering so the calendar fills its column (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Calendar padding)

- Calendar: removed internal padding so left/right spacing matches the container (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Calendar width enforcement)

- Calendar: forced full-width layout by overriding root/table/week/day classes and removing internal padding (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Calendar-01 defaults)

- Calendar: removed custom grid overrides, set root to full width, and hid nav buttons in calendar-01 instance (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Calendar-01 defaults restored)

- Calendar: removed custom class overrides so calendar-01 uses shadcn defaults and nav buttons stay inside the calendar; centered the calendar in its column (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Calendar day list order)

- Calendar: moved the date/time line below the event title in the day list cards (`src/components/roadmap/roadmap-calendar.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (Roadmap header skeleton)

- Roadmap: added a hydration-safe skeleton for the section header to prevent Origin Story text flashes on refresh (`src/components/roadmap/roadmap-editor.tsx`).
- Didn't: tests not run.

## 2026-01-26 — Codex session (curriculum alignment)
- Data: added a curriculum alignment migration to upsert the current accelerator classes/modules and archive legacy session/elective slugs (`supabase/migrations/20260126152000_align_accelerator_curriculum.sql`).
- App: updated roadmap homework mappings to the new class slugs (`src/lib/roadmap/homework.ts`).

## 2026-01-26 — Codex session (progression system map)
- Docs: added full accelerator/roadmap progression map with display vs DB status and org_key sync (`docs/progression-system-map.md`).

## 2026-01-26 — Codex session (progression map audit checklist)
- Docs: added a per-module UI audit checklist to track displayed vs expected questions (`docs/progression-system-map.md`).

## 2026-01-26 — Codex session (module resources overhaul)
- Module resources: removed the dedicated slide-deck step, added a centered resources header + divider, and rendered resources (plus deck card) in the resources step (`src/components/training/module-detail/module-stepper.tsx`, `src/components/training/deck-resource-card.tsx`).
- Right rail: included the deck card in the resources panel and wired the new prop (`src/components/training/module-right-rail.tsx`, `src/components/training/module-detail.tsx`).

## 2026-01-26 — Codex quick fix (resources header)
- Resources step now shows a distinct “Resources” header/icon instead of duplicating the module title (`src/components/training/module-detail/module-stepper.tsx`).

## 2026-01-26 — Codex tweak (resources card sizing)
- Resource cards are now consistent height and the deck resource opens externally; kept square sizing in grids and min-height for stacked lists (`src/components/training/resources-card.tsx`, `src/components/training/deck-resource-card.tsx`, `src/components/training/module-detail/deck-viewer.tsx`).

## 2026-01-26 — Codex fix (notes upsert + intro copy)
- Notes: fixed module notes save failures by upserting on `(user_id,module_id)` (`src/app/actions/module-notes.ts`).
- Content: corrected intro module subtitle punctuation via migration (`supabase/migrations/20260126173000_fix_intro_module_copy.sql`).

## 2026-01-26 — Codex iteration (module stepper caching & unlock)
- Stepper: cached video/resources/notes content, preserved active step via sessionStorage, and marked modules complete on finish/continue; continue button now calls the completion action (`src/components/training/module-detail/module-stepper.tsx`, `src/app/actions/module-progress.ts`).
- Resources: single resource card centers in grid; deck card padding tightened (`src/components/training/resources-card.tsx`, `src/components/training/module-detail/deck-viewer.tsx`).
- Tests: `npm test` hit snapshot drift (Design System/Breadcrumb). Snapshots not updated.

## 2026-01-26 — Codex fix (duplicate subtitle)
- Suppressed duplicate module subtitles by removing subtitle rendering in the module header (`src/components/training/module-detail.tsx`).

## 2026-02-03 — Codex fix (react-grab dev default)
- React Grab loader now defaults to enabled in development unless explicitly disabled with `NEXT_PUBLIC_ENABLE_REACT_GRAB=0`; this restores `/home-canvas` behavior when running plain `npm run dev` (`src/components/dev/react-grab-loader.tsx`).
- Validation: `npm run lint -- src/components/dev/react-grab-loader.tsx`.

## 2026-02-03 — Codex copy refresh (home-canvas labels)
- Replaced internal section labels on `/home-canvas` with marketing-forward copy for the sidebar and top rail: `Welcome`, `Why Coach House`, `What You Get`, `Latest Stories`, `Meet the Team`, `Get Started`, and `Plans & Pricing` (`src/components/public/home-canvas-preview.tsx`).
- Validation: `npm run lint -- src/components/public/home-canvas-preview.tsx`.

## 2026-02-03 — Codex UX tweak (compact labels + scroll hint)
- Shortened `/home-canvas` section labels for cleaner marketing nav: `Welcome`, `Why Us`, `Platform`, `Stories`, `Team`, `Start`, and `Pricing` (`src/components/public/home-canvas-preview.tsx`).
- Added a bottom-right in-canvas helper chip (`Scroll` + icon) that auto-fades and dismisses after wheel/swipe/keyboard scroll interactions (`src/components/public/home-canvas-preview.tsx`).
- Validation: `npm run lint -- src/components/public/home-canvas-preview.tsx`.

## 2026-02-03 — Codex UI tweak (sidebar nav position + pricing icon)
- Shifted the `/home-canvas` sidebar nav button group down slightly as a group by adding top padding to `SidebarContent` (`src/components/public/home-canvas-preview.tsx`).
- Replaced the pricing nav icon from `ReceiptText` to `CircleDollarSign` to better match pricing semantics (`src/components/public/home-canvas-preview.tsx`).
- Validation: `npm run lint -- src/components/public/home-canvas-preview.tsx`.

## 2026-02-03 — Codex fix (team photo strip clipping in canvas)
- Added `imageFit` support to `Home2PhotoStrip` and switched the `/home-canvas` team section to `contain` so portraits are no longer cropped/clipped in the card tiles (`src/components/public/home2-photo-strip.tsx`, `src/components/public/home2-sections.tsx`).
- Validation: `npm run lint -- src/components/public/home2-photo-strip.tsx src/components/public/home2-sections.tsx`.

## 2026-02-03 — Codex nav update (sidebar sign-up CTA)
- Added a separate lower sidebar group on `/home-canvas` with a `Sign up` CTA button (white background, black text/icon), visually separated from the main section nav (`src/components/public/home-canvas-preview.tsx`).
- Validation: `npm run lint -- src/components/public/home-canvas-preview.tsx`.

## 2026-02-03 — Codex auth + embed navigation fixes
- Added a `FrameEscape` client utility and mounted it in auth and dashboard layouts so auth/app routes loaded inside an iframe immediately promote to top-level navigation (`src/components/navigation/frame-escape.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(dashboard)/layout.tsx`).
- Updated public header sign-in link to target top-level browsing context to avoid in-canvas auth rendering (`src/components/public/public-header.tsx`).
- Login page layout adjusted so the Coach House logo block now sits directly above the sign-in heading/content block (`src/app/(auth)/login/page.tsx`).
- Reverted temporary `imageFit` prop usage on team photo strip wiring (`src/components/public/home2-sections.tsx`, `src/components/public/home2-photo-strip.tsx`).
- Validation: `npm run lint -- src/components/navigation/frame-escape.tsx src/app/(auth)/layout.tsx src/app/(dashboard)/layout.tsx src/components/public/public-header.tsx src/app/(auth)/login/page.tsx src/components/public/home2-photo-strip.tsx src/components/public/home2-sections.tsx`.

## 2026-02-03 — Codex canvas auth routing update
- Updated `/home-canvas` so `Sign in` and `Sign up` now render inside the canvas as embedded auth screens instead of navigating away (`src/components/public/home-canvas-preview.tsx`).
- Added hidden canvas sections for `login`/`signup`, wired top-rail `Sign in` and sidebar CTA `Sign up` to switch sections in-canvas (`src/components/public/home-canvas-preview.tsx`).
- Removed auth-layout iframe escape and restored normal public header sign-in targeting so auth can render within embedded contexts when needed (`src/app/(auth)/layout.tsx`, `src/components/public/public-header.tsx`).
- Validation: `npm run lint -- src/components/public/home-canvas-preview.tsx src/app/(auth)/layout.tsx src/components/public/public-header.tsx`.

## 2026-02-06 — Codex docs refactor (AGENTS progressive disclosure)
- Refactored `AGENTS.md` into a concise root contract (33 lines) and moved detailed guidance into `docs/agent/product-scope.md`, `docs/agent/architecture-security.md`, `docs/agent/workflow-quality.md`, and `docs/agent/ui-rubric.md`.
- Preserved all critical requirements while removing duplication and making navigation explicit via links.
- Validation: verified new files exist and root length is under 50 lines.

## 2026-02-06 — Codex cleanup (deprecated archive + UI refactor eval)
- Archived disconnected/legacy artifacts under `deprecated/**`: `src/app/dashboard-01-demo/**`, `components/shadcn-studio/tabs/tabs-29.tsx`, prior `docs/trashcan/**`, root `runlog.md` (moved to `deprecated/docs/runlog-legacy-2025-02.md`), and empty root artifact `coach-house-lms@0.1.0`.
- Added `deprecated/README.md` to define archive rules and list what was moved in this pass.
- Added UI refactor evaluation + phased unification plan at `docs/briefs/ui-unification-refactor-evaluation.md` and indexed it in `docs/briefs/INDEX.md`.
- Normalized stale runlog references in docs to canonical `docs/RUNLOG.md` (`docs/NEXTJS_RUNBOOK.md`, `docs/organize.md`).

## 2026-02-06 — Codex planning brief (accelerator launch system unification)
- Added `docs/briefs/accelerator-launch-system-unification.md` to consolidate launch-critical system work: shell naming/rules, design-system engineering, canvas signup/onboarding, role/stage UX, `/my-organization` bento redesign, notifications coverage, module-roadmap UI bridge, and security/Next.js conformance.
- Captured the MPF messaging/positioning/lifecycle framework inside the brief as canonical product context for implementation.
- Indexed the new brief in `docs/briefs/INDEX.md`.

## 2026-02-06 — Codex planning update (launch unification + MVP sprint)
- Expanded `docs/briefs/accelerator-launch-system-unification.md` with missing launch workstreams: coaching entitlement UX, home-canvas content hardening (hide Team + real News links), Find map/search/filter/save MVP, and React Flow org-chart v2 runtime/performance spec.
- Added system visualizations for onboarding, coaching entitlement routing, and module/roadmap progression spine.
- Added `docs/briefs/accelerator-launch-mvp-sprint.md` with ordered `S01`-`S14` implementation queue, dependency sequencing, and MVP cut line.
- Updated `docs/briefs/INDEX.md` to include the new sprint brief.

## 2026-02-06 — Codex implementation pass (home-canvas launch hygiene + coaching UX)
- Home-canvas: removed hidden-home sections from navigation source so `team` and `process` are no longer reachable in canvas nav/query routing (`src/components/public/home-canvas-preview.tsx`).
- Public News cards: added external-link support and switched non-hosted article cards to Substack publication links, while keeping the hosted AI article internal (`src/components/public/home2-sections.tsx`).
- Coaching UX: improved schedule success messaging by tier (`free`/`discounted`/`full`) and added post-click entitlement feedback on the accelerator schedule card (`src/hooks/use-coaching-booking.ts`, `src/components/accelerator/accelerator-schedule-card.tsx`).
- Env template: added missing coaching booking URLs and Substack publication URL placeholders for launch setup (`.env.example`).
- Validation: `npm run lint -- src/components/public/home-canvas-preview.tsx src/components/public/home2-sections.tsx src/hooks/use-coaching-booking.ts src/components/accelerator/accelerator-schedule-card.tsx`.

## 2026-02-06 — Codex implementation pass (my-organization bento workspace shell)
- Redesigned `/my-organization` into a launch-oriented bento workspace with six cards: profile snapshot, notifications, upcoming calendar, documents, team snapshot, and quick actions (`src/app/(dashboard)/my-organization/page.tsx`).
- Added server-loaded previews for org-scoped notifications and upcoming internal roadmap events; surfaced doc counts from profile metadata for at-a-glance status (`src/app/(dashboard)/my-organization/page.tsx`).
- Preserved existing full editor flow behind `?view=editor` (and automatically when `tab`/`programId` query params are present) so existing deep links and edit workflows keep working (`src/app/(dashboard)/my-organization/page.tsx`).
- Validation: `npm run lint -- 'src/app/(dashboard)/my-organization/page.tsx'`.
- Sprint tracking: added explicit `S01`-`S14` execution states to the MVP queue to support live launch burndown (`docs/briefs/accelerator-launch-mvp-sprint.md`).

## 2026-02-06 — Codex implementation pass (shell collapse/focus stability)
- Sidebar interaction polish: removed width/height/padding animation on sidebar menu buttons in favor of color/opacity/transform transitions to prevent icon/text squish during collapse (`src/components/ui/sidebar/layout.tsx`).
- Focus visibility hardening: added inset focus rings on sidebar labels/buttons/actions so keyboard focus no longer clips against collapsed/overflowing rails (`src/components/ui/sidebar/layout.tsx`).
- Right-rail motion cleanup: removed delayed width/opacity sequencing to reduce overlap/jitter when opening or closing details rail (`src/components/app-shell.tsx`).
- Validation: `npm run lint -- src/components/ui/sidebar/layout.tsx src/components/app-shell.tsx`.

## 2026-02-06 — Codex implementation pass (module notes persistence + elective rail split)
- Module notes durability: upgraded notes persistence from debounce-only to multi-trigger saves (`onBlur`, unmount flush, page-hide keepalive) so quick navigation/refresh no longer drops recent text (`src/hooks/use-module-notes.ts`, `src/components/training/module-right-rail.tsx`).
- Added `POST /api/modules/[id]/notes` for keepalive-safe note writes during page lifecycle transitions (`src/app/api/modules/[id]/notes/route.ts`).
- Accelerator rail tracks: split the prior combined Formation/electives content into separate virtual tracks in the left rail. `Financial Handbook`, `Due Diligence`, and `Retention and Security` now appear under `Electives` with an add-on unlock message when access is missing (`src/components/app-sidebar/classes-section.tsx`).
- Validation: `npm run lint -- src/components/app-sidebar/classes-section.tsx src/hooks/use-module-notes.ts src/components/training/module-right-rail.tsx src/app/api/modules/[id]/notes/route.ts`.

## 2026-02-06 — Codex implementation pass (program builder v1 + 6-step brief wizard)
- Added `programs.wizard_snapshot` JSONB persistence for structured program-builder data (`supabase/migrations/20260206183000_programs_wizard_snapshot.sql`, `src/actions/programs.ts`, `src/components/organization/org-profile-card/types.ts`, `src/app/(dashboard)/my-organization/page.tsx`).
- Replaced the prior 3-step modal flow with a 6-step + review Program Wizard matching launch spec: Name, Type/Format, Audience/Outcomes, Pilot/Staffing, When/Where, Budget/Feasibility, and Review/Generate; includes step validation, progress indicator, create-draft local autosave, edit autosave, feasibility metrics, and copyable program brief (`src/components/programs/program-wizard.tsx`, `src/components/programs/program-wizard/schema.ts`).
- Upgraded `/my-organization` Program Builder surface to support empty/list/manage-multiple states with a list + inspector pattern and direct edit/open controls (`src/components/organization/program-builder-dashboard-card.tsx`, `src/app/(dashboard)/my-organization/page.tsx`).
- Type-safety cleanup for my-organization doc counts/team snapshot rendering (`src/app/(dashboard)/my-organization/page.tsx`).
- Validation: `pnpm exec eslint src/components/programs/program-wizard.tsx src/components/programs/program-wizard/schema.ts src/components/organization/program-builder-dashboard-card.tsx src/app/(dashboard)/my-organization/page.tsx src/actions/programs.ts src/components/organization/org-profile-card/types.ts`.

## 2026-02-06 — Codex implementation pass (incremental demo seeding for Program Builder)
- Added `seedNextDemoProgramAction` to create one demo program stage per click (`Planned` -> `In progress` -> `Completed` -> `Applications Open` -> `Paused`) for the current org so states can be reviewed incrementally in `/my-organization` (`src/actions/programs.ts`).
- Added `Seed next stage` control to Program Builder card header with toast feedback and refresh after each seed (`src/components/organization/program-builder-dashboard-card.tsx`).
- Validation: `pnpm exec eslint src/actions/programs.ts src/components/organization/program-builder-dashboard-card.tsx`.

## 2026-02-06 — Codex implementation pass (one-click full workspace demo seed)
- Added `seedDemoWorkspaceAction` to populate launch demo data in one run for the active org/user: remaining demo programs, team members (`org_people`), notifications, internal roadmap calendar events, class enrollments, and module progress rows (`src/actions/demo-workspace.ts`).
- Added `Seed demo workspace` control in Program Builder card header to execute full data seeding and refresh the workspace (`src/components/organization/program-builder-dashboard-card.tsx`).
- Kept `Seed next stage` for gradual program-state demos.
- Validation: `pnpm exec eslint src/actions/demo-workspace.ts src/components/organization/program-builder-dashboard-card.tsx`.

## 2026-02-06 — Codex implementation pass (my-organization bento refinements + activity/roadmap UX)
- Removed duplicated documents CTA patterns from dashboard surface and moved `Edit organization` to bottom-anchored action in profile card (`src/app/(dashboard)/my-organization/page.tsx`).
- Switched notifications card to `Activity` with green activity dot and revised badge styling: unread `New` now green; read/other states use neutral light-gray/dark text styling (`src/app/(dashboard)/my-organization/page.tsx`).
- Calendar card now includes both `Open calendar` and `Add event` actions (`/roadmap/board-calendar`) in addition to upcoming items (`src/app/(dashboard)/my-organization/page.tsx`).
- Replaced documents KPI card with conditional `Launch roadmap` mini-card showing first three formation modules and status badges; card auto-hides when all three are completed (`src/app/(dashboard)/my-organization/page.tsx`).
- Editor UX cleanup: when `view=editor`/tab deep links are used, page now shows editor-focused view (no bento stacked above) (`src/app/(dashboard)/my-organization/page.tsx`).
- Program Builder card: empty state now uses shared `Empty` component style and active preview now uses existing `ProgramCard` presentation to align with prior program display language while retaining new wizard data (`src/components/organization/program-builder-dashboard-card.tsx`).
- Validation: `pnpm exec eslint src/app/(dashboard)/my-organization/page.tsx src/components/organization/program-builder-dashboard-card.tsx`.

## 2026-02-06 — Codex implementation pass (bento stretch contract + card layout rules)
- Added an explicit bento contract for `/my-organization` with per-card span/min-height/stretch rules in code: `src/components/organization/my-organization-bento-rules.ts`.
- Updated `/my-organization` to consume the shared rule map for card class assignment and grid sizing (`md` 2-col, `xl` 12-col with `auto-rows minmax`) so cards stretch consistently and avoid ad-hoc layout drift (`src/app/(dashboard)/my-organization/page.tsx`).
- Documented the rule set and card behavior in `docs/briefs/my-organization-bento-rules.md` and indexed it in `docs/briefs/INDEX.md`.
- Validation: `pnpm exec eslint src/app/(dashboard)/my-organization/page.tsx src/components/organization/my-organization-bento-rules.ts src/components/roadmap/roadmap-calendar.tsx`.

## 2026-02-06 — Codex implementation pass (profile mini-editor + anti-squish pass)
- Refined `/my-organization` bento sizing to reduce over-tall cards and added conditional class resolution for states where Launch Roadmap is hidden (`src/components/organization/my-organization-bento-rules.ts`).
- Reworked profile card into a compact “mini editor” surface: renamed internal copy (`Organization hub`), replaced fallback title/copy, added About/Programs/People quick links with completion snapshots, and kept actions anchored at the bottom (`src/app/(dashboard)/my-organization/page.tsx`).
- Added anti-squish classes for compact badges/chips (`shrink-0 whitespace-nowrap`) across Activity and Launch Roadmap statuses plus Program Builder list status pills (`src/app/(dashboard)/my-organization/page.tsx`, `src/components/organization/program-builder-dashboard-card.tsx`).
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx' src/components/organization/my-organization-bento-rules.ts src/components/organization/program-builder-dashboard-card.tsx`.

## 2026-02-06 — Codex implementation pass (roadmap rail packaging + accelerator swap prep)
- Added reusable `RoadmapRailCard` container component that maps roadmap sections into a paged icon-rail with progress summary and section navigation (`src/components/roadmap/roadmap-rail-card.tsx`).
- Updated `/roadmap` landing to use the packaged rail component so the roadmap navigator is modular and ready for reuse (`src/components/roadmap/roadmap-landing.tsx`).
- Replaced legacy `RoadmapOutlineCard` internals with a wrapper around `RoadmapRailCard`, preparing accelerator overview for direct drop-in parity with roadmap navigation (`src/components/roadmap/roadmap-outline-card.tsx`).
- Tuned roadmap rail track alignment to center better behind icon cards by increasing roadmap icon token size and offsetting rail line placement (`src/components/ui/stepper-rail.tsx`).
- Validation: `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx src/components/roadmap/roadmap-landing.tsx src/components/roadmap/roadmap-outline-card.tsx src/components/ui/stepper-rail.tsx`.

## 2026-02-06 — Codex implementation pass (sidebar roadmap hidden + TOC icon tiles)
- Hid direct `/roadmap` item from the dashboard sidebar navigation while keeping accelerator entry and existing roadmap routes intact (`src/components/app-sidebar.tsx`, `src/components/app-sidebar/nav-data.ts`).
- Added roadmap section icon tiles to the left side of section links in the roadmap editor TOC rail (including grouped child items) to match the roadmap card visual language (`src/components/roadmap/roadmap-editor.tsx`).
- Updated tutorial targeting to point platform onboarding at the accelerator nav item so tours no longer depend on a hidden roadmap nav selector (`src/components/app-sidebar.tsx`, `src/components/tutorial/tutorial-manager.tsx`).
- Validation: `pnpm exec eslint src/components/app-sidebar/nav-data.ts src/components/app-sidebar.tsx src/components/roadmap/roadmap-editor.tsx src/components/tutorial/tutorial-manager.tsx`.

## 2026-02-06 — Codex implementation pass (roadmap TOC icon-size correction)
- Replaced oversized roadmap TOC icon tiles with compact icon-only markers for section links (grouped and child rows) and tightened link spacing to fit the rail cleanly (`src/components/roadmap/roadmap-editor.tsx`).
- Validation: `pnpm exec eslint src/components/roadmap/roadmap-editor.tsx`.

## 2026-02-06 — Codex fix (roadmap rich-text autosave gating)
- Fixed roadmap editor autosave debounce to trigger on any dirty draft (`isDirty`) instead of title/subtitle-only changes, so body typing in `RichTextEditor` now persists to DB without requiring manual save (`src/components/roadmap/roadmap-editor.tsx`).
- Removed now-unused `headingsDirty` memo after correcting the save gate.
- Validation: `pnpm exec eslint src/components/roadmap/roadmap-editor.tsx`.

## 2026-02-06 — Codex fix (roadmap section switch skeleton flash)
- Prevented full route navigation when clicking roadmap TOC section links; now switches active section client-side and updates URL via `history.replaceState`, which removes loading skeleton flashes between section clicks (`src/components/roadmap/roadmap-editor.tsx`).
- Preserved normal browser behavior for modifier/middle clicks (new tab/window still works).
- Validation: `pnpm exec eslint src/components/roadmap/roadmap-editor.tsx`.

## 2026-02-06 — Codex hotfix (roadmap TOC click regression)
- Fixed TOC click no-op regression by removing stale pathname->activeId resync logic that was overriding client-side section switches after `preventDefault` link handling (`src/components/roadmap/roadmap-editor.tsx`).
- Validation: `pnpm exec eslint src/components/roadmap/roadmap-editor.tsx`.

## 2026-02-06 — Codex tweak (lighter accelerator in-progress badge)
- Updated the `In progress` status chip in `AcceleratorNextModuleCard` to a lighter light-mode palette (`border-amber-200 bg-amber-50 text-amber-700`) while preserving existing dark-mode styling (`src/components/accelerator/accelerator-next-module-card.tsx`).
- Validation: `pnpm exec eslint src/components/accelerator/accelerator-next-module-card.tsx`.

## 2026-02-06 — Codex fix (roadmap rail center snapping)
- Updated `StepperRail` roadmap variant to measure real icon center positions and map the progress track/fill to those measured anchors, eliminating in-between stop positions when stepping next/prev (`src/components/ui/stepper-rail.tsx`).
- Added resize-aware recalculation so alignment stays correct after layout changes.
- Validation: `pnpm exec eslint src/components/ui/stepper-rail.tsx`.

## 2026-02-06 — Codex tweak (roadmap icon status colors)
- Updated roadmap rail icons in `StepperRail` to reflect section status color: in-progress icons now amber and completed icons now emerald (not-started remains muted); added matching subtle border tint on icon tiles (`src/components/ui/stepper-rail.tsx`).
- Validation: `pnpm exec eslint src/components/ui/stepper-rail.tsx`.

## 2026-02-06 — Codex implementation pass (S04/S05 canvas auth + inline onboarding)
- Home-canvas auth stabilization: replaced iframe-based `/login` and `/sign-up` previews with native in-canvas auth panels using existing `LoginForm`/`SignUpForm`, while keeping pricing embedded (`src/components/public/home-canvas-preview.tsx`).
- Added canvas-local auth handoff links so login/signup can switch sections without leaving canvas (`/home-canvas?section=login|signup`) (`src/components/public/home-canvas-preview.tsx`).
- Removed onboarding modal dependency in app shell by rendering onboarding inline inside the main canvas/content surface when onboarding is required (`src/components/app-shell.tsx`).
- Extended onboarding component to support both dialog and inline presentation modes from the same flow (`src/components/onboarding/onboarding-dialog.tsx`).
- Validation: `pnpm exec eslint src/components/public/home-canvas-preview.tsx src/components/onboarding/onboarding-dialog.tsx src/components/app-shell.tsx`.

## 2026-02-06 — Codex fix pass (roadmap switch/save stabilization + rail/badge polish)
- Reworked roadmap TOC interaction to button-based client switching (no route navigation), while still updating URL via `history.replaceState`; this removes section-click skeleton reload behavior and restores reliable side-rail switching (`src/components/roadmap/roadmap-editor.tsx`).
- Added explicit draft flush on section switch and component teardown by saving the currently active section before moving away, reducing data loss when users switch sections quickly (`src/components/roadmap/roadmap-editor.tsx`).
- Unified save paths via `saveSectionById` so manual save, autosave, and switch-flush share the same write logic (`src/components/roadmap/roadmap-editor.tsx`).
- Fixed roadmap rail progress stop alignment by indexing measured icon centers per visible step and falling back safely when refs are temporarily missing (`src/components/ui/stepper-rail.tsx`).
- Reduced roadmap icon-card visual bulk and centered roadmap step content; updated roadmap progress fill to amber→emerald gradient for status clarity (`src/components/ui/stepper-rail.tsx`).
- Lightened `In progress`/`Completed` status chips in `AcceleratorNextModuleCard` for better light-mode contrast tuning (`src/components/accelerator/accelerator-next-module-card.tsx`).
- Validation: `pnpm exec eslint src/components/roadmap/roadmap-editor.tsx src/components/ui/stepper-rail.tsx src/components/accelerator/accelerator-next-module-card.tsx`.

## 2026-02-06 — Codex UI pass (my-organization calendar split view + bento override fix)
- Removed hardcoded `xl:col-span-12` from `ProgramBuilderDashboardCard` so bento placement rules can control sizing/positioning cleanly (`src/components/organization/program-builder-dashboard-card.tsx`).
- Redesigned My Organization calendar card into a split preview inspired by booking UI: left event summary panel (duration chips, location/timezone) plus right monthly grid with highlighted event days and selected day state (`src/app/(dashboard)/my-organization/page.tsx`).
- Added server-side month/grid derivation for calendar rendering (`src/app/(dashboard)/my-organization/page.tsx`).
- Tightened bento sizing contract to reduce over-tall two-column cards and give calendar enough height for the new split layout (`src/components/organization/my-organization-bento-rules.ts`).
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx' src/components/organization/my-organization-bento-rules.ts src/components/organization/program-builder-dashboard-card.tsx`.

## 2026-02-06 — Codex fix (accelerator track param collision)
- Fixed `/accelerator` sidebar track flicker by separating URL params for independent track selectors:
  - Sidebar ClassesSection now uses `classTrack`.
  - Start Building pager now uses `moduleTrack`.
- Root cause was both components writing to the same `track` query param through `useTrackParam`, causing post-hydration replacements that switched the selected rail unexpectedly.
- Files: `src/components/app-sidebar/classes-section.tsx`, `src/components/accelerator/start-building-pager.tsx`.
- Validation: `pnpm exec eslint src/components/app-sidebar/classes-section.tsx src/components/accelerator/start-building-pager.tsx`.

## 2026-02-06 — Codex fix (accelerator roadmap next/prev route target)
- Fixed roadmap rail navigation context so Accelerator overview no longer routes to `/roadmap/*` when clicking next/prev or step items.
- Added configurable `hrefBase` to `RoadmapRailCard` and set `RoadmapOutlineCard` to use `/accelerator/roadmap`.
- Files: `src/components/roadmap/roadmap-rail-card.tsx`, `src/components/roadmap/roadmap-outline-card.tsx`.
- Validation: `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx src/components/roadmap/roadmap-outline-card.tsx`.

## 2026-02-06 — Codex fix (activity notifications clear on open)
- Added `readNotification` + `next` query handling on `/my-organization` to mark a notification as read server-side, then redirect to the requested internal destination.
- Updated Activity card links to route through that read-and-forward flow.
- Result: unread items stay green (`New`) and clear when opened.
- File: `src/app/(dashboard)/my-organization/page.tsx`.
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex implementation pass (accelerator right-rail workspace + snake roadmap grid)
- Added `AcceleratorOverviewRightRail` to `/accelerator` right rail with:
  - module switching,
  - per-module note editing/saving,
  - coach scheduling,
  - AI hidden,
  - no return-home CTA (replaced with "Open selected module").
- Wired overview right rail data from accelerator groups/modules (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/accelerator/accelerator-overview-right-rail.tsx`).
- Scoped default accelerator `ClassesSection` right rail out of overview and roadmap routes so it no longer appears where not requested (`src/components/app-shell.tsx`).
- Converted accelerator roadmap block to snake-grid layout with all section cards visible, curved/turning connector rail, per-card status, and unlock text; kept next/prev paginator controls (`src/components/roadmap/roadmap-rail-card.tsx`, `src/components/roadmap/roadmap-outline-card.tsx`).
- Added roadmap homework mapping on accelerator overview so unlock labels can reference actual modules (`src/app/(accelerator)/accelerator/page.tsx`).
- Validation: `pnpm exec eslint src/components/app-shell.tsx src/components/roadmap/roadmap-rail-card.tsx src/components/roadmap/roadmap-outline-card.tsx src/components/accelerator/accelerator-overview-right-rail.tsx 'src/app/(accelerator)/accelerator/page.tsx'`.

## 2026-02-06 — Codex fix (accelerator right-rail clipping + session switcher restore)
- Simplified `/accelerator` overview right rail to coach-only content and removed the module dropdown/UI stack that was overflowing/clipping the rail container (`src/components/accelerator/accelerator-overview-right-rail.tsx`).
- Restored lesson/session switching in-page on accelerator overview by showing Start Building controls inline when rail controls are disabled (`src/components/accelerator/start-building-pager.tsx`).
- Added lightweight per-module notes presence indicator (`Notes` chip) on accelerator module cards and sourced `hasNotes` from `module_progress.notes` in progress summary mapping (`src/components/accelerator/start-building-pager.tsx`, `src/lib/accelerator/progress.ts`).
- Validation: `pnpm lint src/components/accelerator/accelerator-overview-right-rail.tsx src/components/accelerator/start-building-pager.tsx src/lib/accelerator/progress.ts`.

## 2026-02-06 — Codex fix (first visible module incorrectly locked)
- Fixed accelerator overview module lock display after hidden-module filtering: when `AI The Need` is removed from card display, lock states are now normalized over the visible list so the first visible module does not appear locked by a hidden prerequisite (`src/components/accelerator/start-building-pager.tsx`).
- Validation: `pnpm lint src/components/accelerator/start-building-pager.tsx`.

## 2026-02-06 — Codex tweak (coach rail pinned to bottom)
- Moved accelerator overview coach scheduling rail slot to bottom alignment so it anchors at the bottom of the right sidebar (`src/components/accelerator/accelerator-overview-right-rail.tsx`).
- Validation: `pnpm lint src/components/accelerator/accelerator-overview-right-rail.tsx`.

## 2026-02-06 — Codex fix (right rail bottom align for single slot)
- Fixed `RightRailSlot align="bottom"` behavior when only one slot is mounted: single-slot snapshots now respect bottom alignment instead of always rendering at top (`src/components/app-shell/right-rail.tsx`).
- This unblocks coach scheduling card positioning at the bottom on `/accelerator`.
- Validation: `pnpm lint src/components/app-shell/right-rail.tsx`.

## 2026-02-06 — Codex restore (ClassesSection on /accelerator right rail)
- Restored `ClassesSection` mounting in the right sidebar on `/accelerator` by removing the overview-route exclusion from `showAcceleratorRail` route guard (`src/components/app-shell.tsx`).
- Roadmap route exclusion remains intact.
- Validation: `pnpm lint src/components/app-shell.tsx`.

## 2026-02-06 — Codex tweak (lesson-session selector moved right)
- Reordered accelerator module header layout so inline lesson-session selector renders on the right side of the track title/description block (`src/components/accelerator/start-building-pager.tsx`).
- Kept compact selector width (`220px`) and responsive wrapping behavior.
- Validation: `pnpm lint src/components/accelerator/start-building-pager.tsx`.

## 2026-02-06 — Codex implementation (dual accelerator pricing + coaching entitlement split)
- Added dual Accelerator SKU support:
  - `$499` Accelerator + Coaching (`with_coaching`) with 4 included coaching credits.
  - `$349` Accelerator Core (`without_coaching`) with no included coaching credits.
- Pricing UI now exposes two accelerator purchase options and sends explicit `acceleratorVariant` in checkout payload (`src/app/(public)/pricing/page.tsx`, `src/app/(public)/pricing/actions.ts`).
- Checkout metadata now records `accelerator_variant` + `coaching_included` for payment-mode accelerator sessions (`src/app/(public)/pricing/actions.ts`).
- Persisted coaching entitlement on purchases by adding `coaching_included` to `accelerator_purchases` inserts in webhook + success fallback paths (`src/app/api/stripe/webhook/route.ts`, `src/app/(public)/pricing/success/page.tsx`).
- Added migration + schema typing for `accelerator_purchases.coaching_included` (`supabase/migrations/20260206224000_add_coaching_included_to_accelerator_purchases.sql`, `src/lib/supabase/schema/tables/accelerator_purchases.ts`).
- Updated coaching scheduling logic so only purchases with `coaching_included=true` get free/discounted coaching routing; non-coaching accelerator purchases route to full-rate links. Added backward-compatible fallback for environments before the migration (`src/app/api/meetings/schedule/route.ts`, `src/lib/meetings.ts`).
- Added env support for separate price IDs and kept legacy fallback:
  - `STRIPE_ACCELERATOR_WITH_COACHING_PRICE_ID`
  - `STRIPE_ACCELERATOR_WITHOUT_COACHING_PRICE_ID`
  - legacy `STRIPE_ACCELERATOR_PRICE_ID` still maps to with-coaching when present (`src/lib/env.ts`, `.env.example`).
- Validation:
  - `pnpm lint src/lib/env.ts src/lib/meetings.ts src/lib/supabase/schema/tables/accelerator_purchases.ts 'src/app/(public)/pricing/actions.ts' 'src/app/(public)/pricing/page.tsx' src/app/api/stripe/webhook/route.ts 'src/app/(public)/pricing/success/page.tsx' src/app/api/meetings/schedule/route.ts`
  - `pnpm test:acceptance -- pricing` (fails due pre-existing unrelated suite import error in `tests/acceptance/admin-crud.test.ts`: missing `@/app/(admin)/admin/classes/[id]/actions`; pricing tests pass).

## 2026-02-06 — Codex pricing tweak (separate accelerator cards + Base naming)
- Reworked Accelerator pricing presentation into two separate cards (`Accelerator + Coaching` and `Accelerator Base`) instead of nested option boxes inside one card (`src/app/(public)/pricing/page.tsx`).
- Renamed all user-facing and checkout fallback naming from `Core` to `Base` for the no-coaching option (`src/app/(public)/pricing/page.tsx`, `src/app/(public)/pricing/actions.ts`).
- Validation: `pnpm lint 'src/app/(public)/pricing/page.tsx' 'src/app/(public)/pricing/actions.ts'`.

## 2026-02-06 — Codex pricing polish (accelerator CTA shape)
- Updated Accelerator option card CTAs from pill buttons to rounded-corner rectangle buttons (`rounded-xl`) for both submit and fallback-link states (`src/app/(public)/pricing/page.tsx`).
- Validation: `pnpm lint 'src/app/(public)/pricing/page.tsx'`.

## 2026-02-06 — Codex fix (`/my-organization` bento overlap containment)
- Fixed cross-card overlap on `/my-organization` by hardening the Program Builder card against overflow:
  - Added `min-w-0` + `overflow-hidden` on the card shell and active detail pane.
  - Switched the internal two-column layout to `minmax(0, ...)` tracks.
  - Forced embedded `ProgramCard` sizing to fluid (`w-full !max-w-none !min-h-0`) so it cannot spill into adjacent bento cards.
  (`src/components/organization/program-builder-dashboard-card.tsx`).
- Added a global shrink guard for bento cards by appending `min-w-0` in class resolution (`src/components/organization/my-organization-bento-rules.ts`).
- Validation: `pnpm exec eslint src/components/organization/program-builder-dashboard-card.tsx src/components/organization/my-organization-bento-rules.ts 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex layout pass (dashboard anti-squish)
- Rebalanced dashboard density so complex cards stop compressing at laptop widths:
  - `/my-organization` bento now promotes to 3 columns only at `2xl` (was `xl`), with all positional span rules moved to `2xl` (`src/components/organization/my-organization-bento-rules.ts`).
  - `/my-organization` calendar split panel now uses side-by-side columns only at `2xl` (`src/app/(dashboard)/my-organization/page.tsx`).
  - Program Builder list/detail split now activates only at `2xl` (`src/components/organization/program-builder-dashboard-card.tsx`).
- Rebalanced `/accelerator` layout density:
  - Widened page cap from `max-w-5xl` to `max-w-6xl` (`src/app/(accelerator)/accelerator/page.tsx`).
  - Hero split (welcome + next module card) now activates at `2xl` instead of `lg` (`src/app/(accelerator)/accelerator/page.tsx`).
  - Module card grid reduced on laptop widths (`sm:2`, `xl:3`, `2xl:4`) and lesson-session selector width made less rigid (`src/components/accelerator/start-building-pager.tsx`).
  - Slightly reduced accelerator right-rail width to return canvas space (`src/components/app-shell.tsx`).
- Validation: `pnpm exec eslint 'src/components/organization/my-organization-bento-rules.ts' 'src/app/(dashboard)/my-organization/page.tsx' 'src/components/organization/program-builder-dashboard-card.tsx' 'src/app/(accelerator)/accelerator/page.tsx' 'src/components/accelerator/start-building-pager.tsx' 'src/components/app-shell.tsx'`.

## 2026-02-06 — Codex layout pass (`/my-organization` structural unsquish + chrome flattening)
- Upgraded bento allocation from 2-column-at-XL to explicit 12-column placement at `xl` so Program Builder gets primary width on common desktop sizes (`src/components/organization/my-organization-bento-rules.ts`).
- Redesigned `Organization workspace` card as a mini editor-inspired summary:
  - Added compact hero/cover strip + logo slot.
  - Replaced nested mini-cards with lighter segmented rows and compact quick links.
  (`src/app/(dashboard)/my-organization/page.tsx`).
- Flattened nested-card UI inside activity/calendar/launch/team cards:
  - moved from stacked bordered cards to single-container lists with dividers,
  - simplified calendar internals and reduced day-cell compression by switching to square compact cells and 1-letter weekday labels.
  (`src/app/(dashboard)/my-organization/page.tsx`).
- Reworked Program Builder internals to remove card-within-card presentation:
  - removed embedded `ProgramCard` in the dashboard card,
  - switched to list + detail panel layout with lighter row/list styling and inline metrics/outcomes.
  (`src/components/organization/program-builder-dashboard-card.tsx`).
- Company view mode identity/separator behavior:
  - hide Identity when only default empty state is present,
  - disable divider-line treatment when identity section is absent.
  (`src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx`).
- Validation: `pnpm exec eslint 'src/components/organization/my-organization-bento-rules.ts' 'src/app/(dashboard)/my-organization/page.tsx' 'src/components/organization/program-builder-dashboard-card.tsx' 'src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx'`.

## 2026-02-06 — Codex tweak (workspace mini-header spacing)
- Increased mini workspace summary header height and top content padding so the title sits farther below the floating logo tile (`src/app/(dashboard)/my-organization/page.tsx`).
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex tweak (my-organization calendar day-cell border removal)
- Removed borders from calendar day cells and empty placeholders in the `/my-organization` calendar card for a cleaner, flatter visual style while preserving selected/event emphasis via background contrast (`src/app/(dashboard)/my-organization/page.tsx`).
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex nav update (locked Fundraising item)
- Added `Fundraising` to the left sidebar main navigation as a locked item with `Coming soon` badge and lock affordance; item is visible but non-navigable (`src/components/app-sidebar/nav-data.ts`, `src/components/nav-main.tsx`).
- Validation: `pnpm exec eslint src/components/app-sidebar/nav-data.ts src/components/nav-main.tsx`.

## 2026-02-06 — Codex nav tweak (fundraising lock icon removed)
- Removed the extra lock icon from the locked `Fundraising` sidebar item while keeping disabled behavior + `Coming soon` badge (`src/components/nav-main.tsx`).
- Validation: `pnpm exec eslint src/components/nav-main.tsx`.

## 2026-02-06 — Codex UI tweak (workspace header badge removed)
- Removed the `Organization hub` badge from the `/my-organization` workspace card header (`src/app/(dashboard)/my-organization/page.tsx`).
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex UI tweak (workspace hero background parity + badge alignment)
- Updated the mini workspace card hero strip to use org-header styling parity (header image when present + gradient overlay + grid pattern treatment) instead of a flat gradient bar (`src/app/(dashboard)/my-organization/page.tsx`).
- Moved the `% complete` badge alignment to the right side of the workspace card header (`src/app/(dashboard)/my-organization/page.tsx`).
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex layout reshape (`/my-organization` 6-col bento + smaller calendar)
- Reworked the workspace bento grid to align with a 6-column template structure at desktop widths, including a full-width top card and rebalanced spans for team/program builder/activity/calendar/action cards (`src/components/organization/my-organization-bento-rules.ts`).
- Reduced calendar card dominance by shrinking its span/min-height and tightening internal content density (removed session-duration chip row, compacted metadata chips, reduced day-cell minimum size) (`src/app/(dashboard)/my-organization/page.tsx`).
- Validation: `pnpm exec eslint src/components/organization/my-organization-bento-rules.ts 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex people delete guardrail fix (in progress hardening)
- Hardened people deletion path to prevent deleting the signed-in user, return a clear `Person not found` error, clean subordinate `reportsToId` references when a manager is removed, and use org-scoped avatar cleanup path (`src/actions/people.ts`).
- Validation: `pnpm exec eslint src/actions/people.ts 'src/app/(dashboard)/people/page.tsx'`.

## 2026-02-06 — Codex bento re-map (`/my-organization` profile/team 50-50 + actions rail)
- Updated desktop bento placement so `Organization workspace` and `Team snapshot` now share the top row at 50/50 width (`xl:col-span-3` each).
- Moved `Workspace actions` into the previous team rail footprint (`xl:col-span-1 xl:row-span-3`) to match requested placement.
- Validation: `pnpm exec eslint src/components/organization/my-organization-bento-rules.ts`.

## 2026-02-06 — Codex UI copy pass (my-organization card title simplification)
- Simplified `/my-organization` card titles to concise labels:
  - `Organization`, `Activity`, `Calendar`, `Roadmap`, `Team`, `Actions`
  - Program builder card title changed to `Programs`
  (`src/app/(dashboard)/my-organization/page.tsx`, `src/components/organization/program-builder-dashboard-card.tsx`).
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx' src/components/organization/program-builder-dashboard-card.tsx`.

## 2026-02-06 — Codex bento packing fix (no holes + actions left rail)
- Switched `/my-organization` desktop bento to explicit coordinates (`xl:col-start` + `xl:row-start`) with `xl:grid-flow-dense` to eliminate open placement gaps between cards (`src/components/organization/my-organization-bento-rules.ts`).
- Anchored `Actions` to the left rail area (`col-start-1`, `row-start-3`) and preserved `Organization` + `Team` as 50/50 top row.
- Reduced `Actions` card internal squish by making action buttons a single-column stack (`src/app/(dashboard)/my-organization/page.tsx`).
- Validation: `pnpm exec eslint src/components/organization/my-organization-bento-rules.ts 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex team card footer alignment (manage people)
- Moved `Manage people` from middle content to `CardFooter` so it stays anchored at the bottom of the Team card.
- Made Team list scrollable with a max height to prevent card overgrowth (`max-h-56 overflow-y-auto`).
- File: `src/app/(dashboard)/my-organization/page.tsx`
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex scroll-end spacing normalization (my-organization)
- Added explicit bottom spacer blocks (`h-5 md:h-6`) in both `/my-organization` workspace and editor views so scrolling to the end reveals visible end-gap matching the top stack spacing.
- Removed wrapper `pb-*` in those views and used deterministic spacer nodes for consistent scroll-end behavior.
- File: `src/app/(dashboard)/my-organization/page.tsx`
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx'`.

## 2026-02-06 — Codex entitlement wiring (Formation vs Electives vs Accelerator)
- Implemented elective add-on entitlements end-to-end:
  - Added `elective_purchases` migration + RLS (`supabase/migrations/20260207010000_add_elective_purchases.sql`).
  - Added Supabase table types (`src/lib/supabase/schema/tables/elective_purchases.ts`, `src/lib/supabase/schema/tables/index.ts`).
  - Added shared entitlement resolver for accelerator/subscription/elective access (`src/lib/accelerator/entitlements.ts`).
- Unified track handling and module partitioning:
  - Sidebar and accelerator pager now split Formation vs Electives via module slug/title helpers (`src/lib/accelerator/elective-modules.ts`, `src/components/app-sidebar/classes-section.tsx`, `src/components/accelerator/start-building-pager.tsx`, `src/lib/academy.ts`, `src/lib/accelerator/progress.ts`).
  - Track selector remains `track-picker` + `classTrack`.
- Added checkout + persistence for elective purchases:
  - New checkout mode `elective` in pricing action (`src/app/(public)/pricing/actions.ts`).
  - Added elective cards/CTAs on pricing page (`src/app/(public)/pricing/page.tsx`).
  - Persisted purchases in success page + webhook (`src/app/(public)/pricing/success/page.tsx`, `src/app/api/stripe/webhook/route.ts`).
  - Added required env vars (`src/lib/env.ts`, `.env.example`).
- Enforced server-side access:
  - Module route now gates non-formation tracks by accelerator access and elective modules by per-module entitlement (`src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`).
  - Accelerator shell now allows elective-only users while still locking accelerator-only tracks (`src/app/(accelerator)/layout.tsx`, `src/app/(accelerator)/accelerator/page.tsx`, `src/components/app-shell.tsx`, `src/components/app-sidebar.tsx`, `src/components/app-sidebar/classes-section.tsx`).
  - Search access check now uses shared entitlement resolver (`src/app/api/search/route.ts`).
- Added QA scenario matrix doc (`docs/briefs/elective-entitlement-scenarios.md`) and indexed it (`docs/briefs/INDEX.md`).
- Validation:
  - `pnpm eslint src/components/app-sidebar/classes-section.tsx 'src/app/(public)/pricing/actions.ts' 'src/app/(public)/pricing/page.tsx' 'src/app/(dashboard)/layout.tsx' 'src/app/(accelerator)/layout.tsx' 'src/app/(dashboard)/class/[slug]/module/[index]/page.tsx' src/app/api/stripe/webhook/route.ts 'src/app/(public)/pricing/success/page.tsx' src/lib/academy.ts src/lib/accelerator/progress.ts src/lib/accelerator/entitlements.ts src/components/app-shell.tsx src/components/app-sidebar.tsx src/app/api/search/route.ts src/lib/env.ts src/lib/supabase/schema/tables/index.ts src/lib/supabase/schema/tables/elective_purchases.ts src/lib/accelerator/elective-modules.ts src/components/accelerator/start-building-pager.tsx`

## 2026-02-06 — Codex pricing/gating update (monthly accelerator + elective catalog remap)
- Added monthly checkout support for both accelerator tiers:
  - `acceleratorBilling=one_time|monthly` in pricing checkout actions (`src/app/(public)/pricing/actions.ts`).
  - Monthly Stripe price env vars added (`src/lib/env.ts`, `.env.example`).
  - Pricing UI now presents both `Pay in full` and `Pay monthly` CTAs for each accelerator tier (`src/app/(public)/pricing/page.tsx`).
- Updated elective catalog and free Formation split:
  - Electives now: `Retention and Security`, `Due Diligence`, `Financial Handbook`.
  - Formation/free modules now: `Naming your NFP`, `NFP Registration`, `Filing 1023`.
  - Source mapping updated in `src/lib/accelerator/elective-modules.ts`.
- Updated elective DB constraint migration to new module slugs and added a follow-up migration to normalize environments where the earlier slug set was applied (`supabase/migrations/20260207010000_add_elective_purchases.sql`, `supabase/migrations/20260207013000_update_elective_catalog.sql`).
- Extended subscription metadata handling for accelerator monthly:
  - Pricing success page now treats accelerator subscriptions as accelerator purchase success redirect and persists full metadata (`src/app/(public)/pricing/success/page.tsx`).
  - Webhook subscription upsert now stores full session metadata payload (`src/app/api/stripe/webhook/route.ts`).
  - Coaching schedule eligibility now also checks active accelerator subscription metadata for coaching-included tiers (`src/app/api/meetings/schedule/route.ts`).
- Updated scenario doc to reflect new elective list + monthly mode (`docs/briefs/elective-entitlement-scenarios.md`).
- Validation:
  - `pnpm eslint src/lib/accelerator/elective-modules.ts 'src/app/(public)/pricing/actions.ts' src/lib/env.ts 'src/app/(public)/pricing/page.tsx' 'src/app/(public)/pricing/success/page.tsx' src/app/api/stripe/webhook/route.ts src/app/api/meetings/schedule/route.ts`

## 2026-02-06 — Codex home-canvas pricing de-iframe (native panel)
- Removed iframe-based pricing embed from home-canvas preview and replaced it with native in-app pricing section rendering (`src/components/public/home-canvas-preview.tsx`).
- Removed internal `embedPath`/`EmbeddedPagePanel` usage from canvas nav flow; pricing now renders as a first-class panel in the same layout system.
- Verified no remaining `pricing?embed=1` usage in home-canvas flow.
- Validation:
  - `pnpm eslint src/components/public/home-canvas-preview.tsx`
  - `rg -n "pricing\\?embed=1|/pricing\\?embed|iframe" src/app src/components | head -n 200`

## 2026-02-06 — Codex home-canvas pricing parity (shared surface, no iframe, no mock)
- Replaced duplicated `/pricing` route implementation with a shared `PricingSurface` server component (`src/components/public/pricing-surface.tsx`) and made `/pricing` a thin wrapper (`src/app/(public)/pricing/page.tsx`).
- Wired `/home-canvas` to render the exact same `PricingSurface` in embedded mode instead of the simplified fallback panel (`src/app/(public)/home-canvas/page.tsx`, `src/components/public/home-canvas-preview.tsx`).
- Removed route-level exports from the shared component and moved checkout action import to canonical path (`@/app/(public)/pricing/actions`) to keep one source of truth.
- Validation:
  - `pnpm exec eslint 'src/components/public/pricing-surface.tsx' 'src/app/(public)/pricing/page.tsx' 'src/app/(public)/home-canvas/page.tsx' 'src/components/public/home-canvas-preview.tsx'`

## 2026-02-06 — Codex accelerator progression phase pass (org strip + roadmap/lessons merge)
- Added a live phase tracker brief for current launch scope and open items:
  - `docs/briefs/accelerator-launch-active-worklog.md`
  - Indexed in `docs/briefs/INDEX.md`.
- Added new top-of-page accelerator org snapshot strip with horizontal layout (identity/media left, status/actions right) and checkpoint progress rail:
  - `Fundable` + `Verified` checkpoint pills and checkpoint dots.
  - Orange -> green checkpoint color behavior and final blue verified checkpoint styling.
  - File: `src/components/accelerator/accelerator-org-snapshot-strip.tsx`.
- Wired snapshot strip into `/accelerator` and sourced organization/profile/program-count/roadmap-completion metrics from live data:
  - File: `src/app/(accelerator)/accelerator/page.tsx`.
- Refactored roadmap progression to be the primary container and embedded lessons/modules within the same surface:
  - `RoadmapRailCard` now supports `lessons` content slot.
  - Added stronger winding connector path behind deliverable cards with active progress path rendering.
  - Added Deliverables/Lessons labeling and per-deliverable lesson linkage copy.
  - Files: `src/components/roadmap/roadmap-rail-card.tsx`, `src/components/roadmap/roadmap-outline-card.tsx`.
- Updated `StartBuildingPager` with `embedded` mode for tighter in-card lesson rendering:
  - File: `src/components/accelerator/start-building-pager.tsx`.
- Validation:
  - `pnpm exec eslint 'src/app/(accelerator)/accelerator/page.tsx' 'src/components/accelerator/accelerator-org-snapshot-strip.tsx' 'src/components/roadmap/roadmap-rail-card.tsx' 'src/components/roadmap/roadmap-outline-card.tsx' 'src/components/accelerator/start-building-pager.tsx'`

## 2026-02-06 — Codex queue update (coaching avatar-group design task)
- Added new queued workstream in `docs/briefs/accelerator-launch-active-worklog.md`:
  - `WS-H Coaching CTA avatar-group design pass`.
- Captured requested component source (`mynaui avatargroups2`), target surfaces, content requirements (placeholder + two existing team images), and guardrails.

## 2026-02-06 — Codex accelerator checkpoint rail track color
- UI: restored the background rail behind the `Fundable`/`Verified` checkpoint progress bar to a neutral gray so the unfilled track is not orange-tinted (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Validation:
  - `pnpm lint -- src/components/accelerator/accelerator-org-snapshot-strip.tsx`

## 2026-02-06 — Codex accelerator org strip CTA + container flattening
- UI: replaced the secondary org strip action from `Open company tab` to `Continue`, and wired it to the computed next accelerator module path (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- UI: removed the org-header `% complete` badge and flattened the readiness progress + About/Programs/People sections by removing their bordered card containers (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Validation:
  - `pnpm lint -- 'src/components/accelerator/accelerator-org-snapshot-strip.tsx' 'src/app/(accelerator)/accelerator/page.tsx'`

## 2026-02-06 — Codex accelerator org strip outer wrapper removal
- UI: removed the outer styled parent container (`section` with overflow/border/background/shadow) from `AcceleratorOrgSnapshotStrip`, promoting the inner grid as the root element (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Validation:
  - `pnpm lint -- src/components/accelerator/accelerator-org-snapshot-strip.tsx`

## 2026-02-06 — Codex accelerator org strip full-width fill after wrapper removal
- UI: removed leftover root/inner gutter padding (`p-4`/`lg:p-5` and `px-1`) from `AcceleratorOrgSnapshotStrip` so child components expand into the full available space now that the outer container is gone (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Validation:
  - `pnpm lint -- src/components/accelerator/accelerator-org-snapshot-strip.tsx`

## 2026-02-06 — Codex accelerator unification pass (org identity + roadmap/module merge)
- Data/UI: removed preset org strip fallback copy on `/accelerator`; org identity now uses live org profile fields only (name plus optional tagline, otherwise city/state), and omits subtitle when absent (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- UI: restyled the org identity/media block to follow the same card language as module surfaces (media-first card shell, floating logo, compact text stack) while preserving existing org-strip controls and stats (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Layout: folded the standalone next-module surface into the top of `RoadmapRailCard` and removed the separate `AcceleratorNextModuleCard` block from the overview page (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/roadmap/roadmap-rail-card.tsx`).
- Layout: merged deliverables and all modules into one unified timeline list inside `RoadmapRailCard`, hid the old separate Lessons container, and kept each card family’s existing visual style while adding a subtle connector path behind the combined grid (`src/components/roadmap/roadmap-rail-card.tsx`, `src/components/roadmap/roadmap-outline-card.tsx`).
- Sequencing: timeline ordering now follows deliverable order with linked module inserts via `homework.moduleIdx`, then appends any unmatched modules for deterministic chronology (`src/components/roadmap/roadmap-rail-card.tsx`).
- Queue update: added `WS-I Home-canvas pricing scroll unification` to active worklog for the pricing-section internal scroll + section-handoff bug (`docs/briefs/accelerator-launch-active-worklog.md`).
- Validation:
  - `pnpm lint -- 'src/app/(accelerator)/accelerator/page.tsx' src/components/accelerator/accelerator-org-snapshot-strip.tsx src/components/roadmap/roadmap-outline-card.tsx src/components/roadmap/roadmap-rail-card.tsx`

## 2026-02-06 — Codex org strip overlap/CTA refinement
- UI: increased org identity card lower-body height/padding and shifted text stack to eliminate logo/title overlap; tightened subtitle spacing under title (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- UI: moved `Edit organization` from footer into a top-right overlaid icon action on the identity media card (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- UI/Data: made the bottom continue CTA explicit with next lesson context (`Lesson N • Track`) plus module title detail, sourced from computed `nextModule`/`nextGroup` in accelerator page data (`src/app/(accelerator)/accelerator/page.tsx`, `src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Validation:
  - `pnpm lint -- 'src/app/(accelerator)/accelerator/page.tsx' src/components/accelerator/accelerator-org-snapshot-strip.tsx`

## 2026-02-06 — Codex pricing label rename (Accelerator Pro)
- UI copy: renamed the accelerator coaching option card title from `Accelerator + Coaching` to `Accelerator Pro` (`src/components/public/pricing-surface.tsx`).
- Checkout metadata fallback: aligned accelerator with-coaching fallback `planName` to `Accelerator Pro` for consistency (`src/app/(public)/pricing/actions.ts`).
- Validation:
  - `pnpm lint -- src/components/public/pricing-surface.tsx 'src/app/(public)/pricing/actions.ts'`

## 2026-02-06 — Codex accelerator pricing toggle pass (single CTA + monthly visibility)
- Pricing UI: replaced dual accelerator CTA buttons with a per-card billing switch (`One-time` / `Monthly`) in the card header, and now renders only one checkout CTA at a time based on selected billing mode (`src/components/public/accelerator-option-card.tsx`, `src/components/public/pricing-surface.tsx`).
- Pricing copy: replaced `Pay in full` / `Pay monthly` with clearer action labels (`Get one-time access`, `Start monthly plan`) and updated displayed price/note by selected billing mode.
- Monthly visibility: monthly mode now explicitly displays a monthly price line and billing-context helper text on-card (`src/components/public/accelerator-option-card.tsx`, `src/components/public/pricing-surface.tsx`).
- Queue update: added `WS-J Accelerator billing lifecycle automation` to active worklog for backend enforcement of 6-month included access + `$20/month` rollover rules (`docs/briefs/accelerator-launch-active-worklog.md`).
- Validation:
  - `pnpm lint -- src/components/public/pricing-surface.tsx src/components/public/accelerator-option-card.tsx`

## 2026-02-06 — Codex queue update (Pro coaching included-link URL)
- Queue: added explicit Accelerator Pro included-session booking URL and routing requirement to `WS-J`:
  - `https://calendar.app.google/EKs5A4iaXFAbFSp57`
  - use included link for first 4 Pro sessions, then switch to discounted link.
  (`docs/briefs/accelerator-launch-active-worklog.md`).

## 2026-02-06 — Codex pricing copy update (Pro coaching link in includes + feature matrix)
- Pricing cards: added explicit Accelerator Pro “Includes” line for the Pro coaching booking link (`calendar.app.google/EKs5A4iaXFAbFSp57`) and first-4-session usage (`src/components/public/pricing-surface.tsx`).
- Feature breakdown: added a `Pro only` matrix row noting Pro booking-link usage and discounted-link switch after included sessions (`src/components/public/pricing-surface.tsx`).
- Validation:
  - `pnpm lint -- src/components/public/pricing-surface.tsx`

## 2026-02-06 — Codex home-canvas pricing scroll boundary fix (WS-I)
- Scroll behavior: fixed `/home-canvas?section=pricing` to allow full in-panel vertical scrolling while only switching canvas sections at top/bottom boundaries (`src/components/public/home-canvas-preview.tsx`).
- Touch behavior: pricing panel now uses `touchAction: pan-y`; non-pricing panels keep horizontal gesture behavior to prevent accidental section jumps.
- Embedded sizing: updated shared `PricingSurface` embedded mode from `min-h-screen` to `min-h-full` to prevent clipping/scroll lock inside home-canvas panel (`src/components/public/pricing-surface.tsx`).
- Validation:
  - `pnpm lint -- src/components/public/home-canvas-preview.tsx src/components/public/pricing-surface.tsx`

## 2026-02-06 — Codex coaching avatar-group integration pass (WS-H)
- Added reusable coaching visual component with one placeholder avatar + two homepage team avatars (Paula/Joel), including accessible group labeling (`src/components/coaching/coaching-avatar-group.tsx`).
- Applied avatar-group treatment to accelerator coaching CTA surfaces:
  - accelerator overview right-rail coach card (`src/components/accelerator/accelerator-overview-right-rail.tsx`)
  - module right-rail coach panel (`src/components/training/module-right-rail.tsx`)
  - inline lesson coaching upsell CTA (`src/components/training/module-detail/lesson-notes.tsx`)
  - accelerator schedule card parity pass (`src/components/accelerator/accelerator-schedule-card.tsx`)
  - Accelerator Pro pricing option (also used in home-canvas pricing surface) (`src/components/public/accelerator-option-card.tsx`)
- Kept booking/entitlement routing intact; this pass is visual + copy-state only.
- Validation:
  - `pnpm lint -- src/components/coaching/coaching-avatar-group.tsx src/components/accelerator/accelerator-overview-right-rail.tsx src/components/training/module-right-rail.tsx src/components/accelerator/accelerator-schedule-card.tsx src/components/training/module-detail/lesson-notes.tsx src/components/public/accelerator-option-card.tsx src/components/public/home-canvas-preview.tsx src/components/public/pricing-surface.tsx`

## 2026-02-06 — Codex billing lifecycle backend slice (WS-J)
- Webhook lifecycle: replaced fixed 30-day post-accelerator trial helper with configurable organization-subscription provisioning (`maybeStartOrganizationSubscription`) in Stripe webhook handling (`src/app/api/stripe/webhook/route.ts`).
- One-time accelerator flow: `checkout.session.completed` for accelerator one-time now creates the Organization subscription with a 180-day trial to represent included platform access (`context=accelerator_bundle_one_time`).
- Monthly accelerator rollover: on `customer.subscription.updated` (canceled) or `customer.subscription.deleted` for accelerator monthly subscriptions, webhook now starts Organization `$20/month` continuation if no active/trialing subscription exists (`context=accelerator_rollover`).
- Safety: preserved idempotent behavior via existing webhook-event lock table and existing active-subscription existence guard before provisioning a new organization subscription.
- Validation:
  - `pnpm lint -- src/app/api/stripe/webhook/route.ts 'src/app/(public)/pricing/actions.ts' src/lib/meetings.ts`

## 2026-02-06 — Codex WS-J installment metering + rollover hardening
- Added shared billing constants for accelerator lifecycle rules (`src/lib/accelerator/billing.ts`):
  - `ACCELERATOR_PLATFORM_INCLUDED_TRIAL_DAYS = 180`
  - `ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT = 6`
- Checkout metadata: accelerator monthly Stripe checkout now stamps deterministic installment metadata on both checkout session and subscription creation payload (`src/app/(public)/pricing/actions.ts`):
  - `accelerator_installment_limit`
  - `accelerator_installments_paid`
- Webhook lifecycle hardening (`src/app/api/stripe/webhook/route.ts`):
  - one-time accelerator Organization trial now uses shared 180-day constant;
  - added `invoice.paid` handler for accelerator monthly installment metering;
  - increments `accelerator_installments_paid` for eligible subscription invoices (`subscription_create`/`subscription_cycle`);
  - sets `cancel_at_period_end=true` automatically once installment limit is reached;
  - keeps existing cancellation/deletion rollover to Organization `$20/month` path and idempotency guards.
- Worklog/docs updates:
  - updated `WS-J` implementation notes in `docs/briefs/accelerator-launch-active-worklog.md`;
  - added `docs/briefs/accelerator-billing-lifecycle-qa-matrix.md`;
  - refreshed `docs/briefs/stripe-gating.md` to current lifecycle contracts;
  - updated `docs/briefs/INDEX.md` statuses/entries.
- Validation:
  - `pnpm lint -- src/app/api/stripe/webhook/route.ts 'src/app/(public)/pricing/actions.ts' src/lib/accelerator/billing.ts`

## 2026-02-06 — Codex test-suite stabilization pass (acceptance + snapshots)
- Fixed acceptance test breakages caused by stale path/mocks:
  - added compatibility admin action export for `createModuleAction` at `src/app/(admin)/admin/classes/[id]/actions.ts` (preserves expected redirect/revalidate behavior used by acceptance suite).
  - made entitlement subscription query tolerant of test doubles without `.order()` while preserving production ordering when available (`src/lib/accelerator/entitlements.ts`).
- Snapshot baseline reconciled to current UI state:
  - updated `tests/snapshots/design-system.json` via `pnpm snapshots:update`.
- Validation run results:
  - `pnpm lint -- src/lib/accelerator/entitlements.ts 'src/app/(admin)/admin/classes/[id]/actions.ts'`
  - `pnpm test:acceptance` ✅ (11 passed, 1 skipped)
  - `pnpm test:snapshots` ✅ (baseline matches)
  - `pnpm test:rls` ❌ blocked in this environment (`ENOTFOUND vswzhuwjtgzrkxknrmxu.supabase.co`)

## 2026-02-06 — Codex WS-H coaching CTA expansion (module completion step)
- Extended coaching avatar-group treatment into module completion flow (`src/components/training/module-detail/module-stepper.tsx`):
  - added `CoachingAvatarGroup` to the “Book a session” completion card;
  - added tier-aware helper copy (`free`/`discounted`/`full`) using schedule response payload;
  - switched completion CTA to shared `handleSchedule` callback to retain booking behavior while surfacing remaining-session feedback.
- Validation:
  - `pnpm lint -- src/components/training/module-detail/module-stepper.tsx`
  - `pnpm test:acceptance` ✅
  - `pnpm test:snapshots` ✅

## 2026-02-06 — Codex WS-J rollover eligibility tightening
- Updated Stripe webhook rollover guard so Organization `$20/month` continuation only triggers when Accelerator monthly installment term is complete (`accelerator_installments_paid >= accelerator_installment_limit`) and subscription is canceled/deleted (`src/app/api/stripe/webhook/route.ts`).
- This prevents automatic rollover on early cancellation before completing the intended installment term.
- Synced lifecycle docs/worklog:
  - `docs/briefs/accelerator-launch-active-worklog.md`
  - `docs/briefs/stripe-gating.md`
  - `docs/briefs/accelerator-billing-lifecycle-qa-matrix.md`
- Validation:
  - `pnpm lint -- src/app/api/stripe/webhook/route.ts`

## 2026-02-06 — Codex Pro included booking-link default wiring
- Coaching schedule API now defaults free/included booking tier to the provided Pro calendar URL when no env override is set (`src/app/api/meetings/schedule/route.ts`):
  - `https://calendar.app.google/EKs5A4iaXFAbFSp57`
- Existing env override precedence is preserved (`NEXT_PUBLIC_MEETING_FREE_URL` still wins when present).
- Synced worklog/brief docs:
  - `docs/briefs/accelerator-launch-active-worklog.md`
  - `docs/briefs/stripe-gating.md`
- Validation:
  - `pnpm lint -- src/app/api/meetings/schedule/route.ts`
  - `pnpm test:acceptance` ✅

## 2026-02-06 — Codex coaching schedule route acceptance coverage
- Added acceptance tests for `/api/meetings/schedule` tier routing + session counters (`tests/acceptance/coaching-schedule-route.test.ts`):
  - verifies free tier uses the Pro included default URL (`https://calendar.app.google/EKs5A4iaXFAbFSp57`) when no env override is configured;
  - verifies discounted routing after included-session limit exhaustion;
  - verifies full-tier routing for users without included coaching.
- Test harness notes:
  - used hoisted Vitest mocks for `createSupabaseServerClient`, `resolveActiveOrganization`, `canEditOrganization`, `createNotification`, and env injection.
- Validation:
  - `pnpm test:acceptance` ✅
  - `pnpm test:snapshots` ✅

## 2026-02-06 — Codex env hardening + booking defaults polish
- Env validation robustness: optional env vars now tolerate blank-string placeholders by normalizing `"" -> undefined` (`src/lib/env.ts`), preventing unnecessary runtime env parse failures.
- `.env.example` updated to include the provided Pro included booking link as the default free coaching URL (`.env.example`).
- Validation:
  - `pnpm lint -- src/lib/env.ts src/app/api/meetings/schedule/route.ts tests/acceptance/coaching-schedule-route.test.ts`
  - `pnpm test:acceptance` ✅
  - `pnpm test:snapshots` ✅

## 2026-02-06 — Codex WS-J helper extraction + lifecycle test coverage
- Extracted reusable billing lifecycle helpers to `src/lib/accelerator/billing-lifecycle.ts`:
  - installment parsing
  - monthly installment progression computation
  - rollover eligibility guard based on installment completion + cancellation event
- Updated webhook implementation to consume helper functions (`src/app/api/stripe/webhook/route.ts`) while preserving existing side effects.
- Added acceptance-level unit coverage for lifecycle rules (`tests/acceptance/accelerator-billing-lifecycle.test.ts`) including:
  - installment parsing fallbacks
  - cancel-at-period-end behavior at installment limit
  - non-cycle invoice exclusion
  - rollover blocked before term completion
- Validation:
  - `pnpm lint -- src/lib/accelerator/billing-lifecycle.ts src/app/api/stripe/webhook/route.ts tests/acceptance/accelerator-billing-lifecycle.test.ts`
  - `pnpm test:acceptance` ✅
  - `pnpm test:snapshots` ✅

## 2026-02-06 — Codex accelerator checkout redirect + metadata test coverage
- Fixed a server-action checkout control-flow bug in `startCheckout` (`src/app/(public)/pricing/actions.ts`):
  - redirect exceptions are now rethrown (including test redirect sentinel), preventing valid Stripe checkout redirects from being swallowed by generic fallback handling.
- Added acceptance coverage for accelerator checkout creation metadata (`tests/acceptance/pricing-accelerator-checkout-metadata.test.ts`):
  - monthly path asserts installment metadata is present (`accelerator_installment_limit`, `accelerator_installments_paid`) and correct price selection;
  - one-time path asserts variant/coaching metadata and absence of installment fields.
- Validation:
  - `pnpm lint -- 'src/app/(public)/pricing/actions.ts' tests/acceptance/pricing-accelerator-checkout-metadata.test.ts`
  - `pnpm test:acceptance` ✅
  - `pnpm test:snapshots` ✅

## 2026-02-06 — Codex validation status checkpoint (post WS-J/WS-H test expansion)
- Validation snapshot after latest changes:
  - `pnpm lint` on all touched files ✅
  - `pnpm test:acceptance` ✅ (14 files passed, 1 skipped)
  - `pnpm test:snapshots` ✅
  - `pnpm test:rls` ❌ blocked by network/DNS in current environment (`ENOTFOUND vswzhuwjtgzrkxknrmxu.supabase.co`)

## 2026-02-06 — Codex WS-I scroll logic extraction + test coverage
- Refactored home-canvas section handoff logic into a dedicated helper (`src/components/public/home-canvas-scroll.ts`) used by `src/components/public/home-canvas-preview.tsx`.
- Preserved behavior while making it deterministic and testable:
  - wheel threshold + boundary handoff
  - swipe threshold + vertical-intent gating
  - animation lockout protection
- Added acceptance-level logic tests (`tests/acceptance/home-canvas-scroll-logic.test.ts`) for:
  - non-scrollable panel transitions
  - scrollable mid/boundary behavior
  - threshold/animation guards for wheel and swipe
- Validation:
  - `pnpm lint -- src/components/public/home-canvas-scroll.ts src/components/public/home-canvas-preview.tsx tests/acceptance/home-canvas-scroll-logic.test.ts`
  - `pnpm test:acceptance` ✅
  - `pnpm test:snapshots` ✅

## 2026-02-06 — Codex accelerator UI polish + WS-J legacy rollover compatibility
- Accelerator org snapshot polish (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`):
  - increased identity card footer spacing to avoid logo/title overlap;
  - tightened title/subtitle spacing and line-height;
  - moved progress base rail to neutral gray and set the post-fundable segment to neutral until verified.
- My Organization workspace CTA/copy alignment (`src/app/(dashboard)/my-organization/page.tsx`):
  - removed generic fallback copy (`Organization workspace`, fixed helper sentence);
  - subtitle now prefers tagline, then city/state (hidden when neither exists);
  - replaced `Open company tab` action with accelerator continuation CTA (`Continue - Lesson {n}`) targeting the computed next module href.
- Pricing accelerator card copy refinement:
  - updated one-time/monthly CTA labels to `Continue with one-time` / `Continue with monthly` (`src/components/public/pricing-surface.tsx`);
  - clarified billing detail copy in mode switch card and kept one active checkout button (`src/components/public/accelerator-option-card.tsx`).
- WS-J helper coverage:
  - added legacy monthly-cancellation rollover coverage for subscriptions missing installment metadata (`tests/acceptance/accelerator-billing-lifecycle.test.ts`).
- Synced active queue notes:
  - updated checkpoint rail spec + WS-J legacy behavior note in `docs/briefs/accelerator-launch-active-worklog.md`.
- Validation:
  - `pnpm lint 'src/components/accelerator/accelerator-org-snapshot-strip.tsx' 'src/app/(dashboard)/my-organization/page.tsx' 'src/components/public/pricing-surface.tsx' 'src/components/public/accelerator-option-card.tsx' 'tests/acceptance/accelerator-billing-lifecycle.test.ts' 'src/lib/accelerator/billing-lifecycle.ts'`
  - `pnpm test:acceptance tests/acceptance/accelerator-billing-lifecycle.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/home-canvas-scroll-logic.test.ts tests/acceptance/coaching-schedule-route.test.ts` ✅
  - `pnpm test:acceptance` ✅ (15 files passed, 1 skipped)
  - `pnpm test:snapshots` ✅
  - `pnpm test:rls` ❌ blocked by DNS/network in this environment (`ENOTFOUND vswzhuwjtgzrkxknrmxu.supabase.co`)

## 2026-02-06 — Codex WS-J QA-matrix edge test expansion
- Expanded acceptance coverage for billing lifecycle helper edge cases (`tests/acceptance/accelerator-billing-lifecycle.test.ts`):
  - no rollover on non-cancellation subscription events even when installment count is complete;
  - installment progression capping at configured limit without requesting duplicate cancel-at-period-end updates.
- Updated QA matrix with an explicit automated-coverage snapshot and remaining manual/integration gaps (`docs/briefs/accelerator-billing-lifecycle-qa-matrix.md`).
- Validation:
  - `pnpm test:acceptance tests/acceptance/accelerator-billing-lifecycle.test.ts` ✅
  - `pnpm test:acceptance` ✅ (15 files passed, 1 skipped)

## 2026-02-07 — Codex coaching card copy/layout cleanup
- Removed the extra `"Coach team"` text label from `CoachingAvatarGroup` so the component renders avatar-only (`src/components/coaching/coaching-avatar-group.tsx`).
- Updated accelerator overview right-rail coaching card layout so avatars are centered above the `Coach scheduling` title and removed the inner bordered avatar container (`src/components/accelerator/accelerator-overview-right-rail.tsx`).
- Rewrote coaching card copy for clarity and brevity:
  - stronger description copy,
  - CTA text `Book coaching`,
  - clearer included/discounted/full booking state messaging.
- Validation:
  - `pnpm lint src/components/coaching/coaching-avatar-group.tsx src/components/accelerator/accelerator-overview-right-rail.tsx` ✅

## 2026-02-07 — Codex accelerator bento standardization + roadmap badge cleanup
- Removed the `NextModuleBanner` block from the roadmap surface to reduce duplicate hierarchy and keep one unified timeline list (`src/components/roadmap/roadmap-rail-card.tsx`, `src/components/roadmap/roadmap-outline-card.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Standardized timeline card layout for cleaner bento fit:
  - unified grid row baseline (`auto-rows` raised to 220px),
  - wrappers/cards now stretch to full row height,
  - deliverable cards aligned to the same card-shell rhythm as module cards.
  (`src/components/roadmap/roadmap-rail-card.tsx`)
- Changed long top-right module text badge (`Mission, Vision & Values`, etc.) to an icon-only badge and moved it to bottom-right of the media container (`src/components/roadmap/roadmap-rail-card.tsx`).
- Updated accelerator strip continue CTA behavior:
  - removed extra detail line that rendered values like `Mission`,
  - converted CTA row to left title + right icon container `Continue`,
  - removed `Lesson {n}` prefix from CTA label source (uses module title directly).
  (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`, `src/app/(accelerator)/accelerator/page.tsx`)
- Validation:
  - `pnpm lint src/components/roadmap/roadmap-rail-card.tsx src/components/roadmap/roadmap-outline-card.tsx src/components/accelerator/accelerator-org-snapshot-strip.tsx 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex roadmap rail label cleanup
- Removed the timeline header labels from `RoadmapRailCard`:
  - `DELIVERABLES + MODULES`
  - `{completed}/{total} deliverables complete`
  (`src/components/roadmap/roadmap-rail-card.tsx`)
- Validation:
  - `pnpm lint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex roadmap lesson filter restoration
- Restored a lesson filter dropdown in the top-right corner of the `Strategic Roadmap` header for snake-grid layout (`src/components/roadmap/roadmap-rail-card.tsx`).
- Filter behavior:
  - `All lessons` shows full timeline;
  - selecting a lesson filters timeline to that lesson card plus deliverables linked to that module index.
- Preserved existing roadmap navigation behavior and connector rendering for the currently visible filtered set.
- Validation:
  - `pnpm lint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex roadmap filter stabilization (group-based + fixed right anchor)
- Reworked roadmap picker from per-module to lesson-group filtering (`Formation`, `Electives`, etc.) using grouped module metadata in `RoadmapRailCard` (`src/components/roadmap/roadmap-rail-card.tsx`).
- Updated dropdown UI to match existing track-picker pattern:
  - fixed-width trigger (`220px`) anchored to the top-right (`ml-auto`) so selection text does not shift layout;
  - icons in trigger + options via `getTrackIcon`;
  - concise option labels (`All groups` + group names) with no long module titles.
- Validation:
  - `pnpm lint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex accelerator track rail hidden (temporary)
- Hid the accelerator `ClassesSection`/`TRACK` rail block in `AppShell` by gating `showAcceleratorRail` behind a temporary flag (`showAcceleratorTrackRail = false`) while preserving the rest of right-rail behavior (`src/components/app-shell.tsx`).
- Validation:
  - `pnpm lint src/components/app-shell.tsx` ✅

## 2026-02-07 — Codex roadmap picker alignment/copy fix
- Updated `lesson-group-picker` trigger so selected value text is left-aligned and ellipsized (no clipping/centering drift on short or long labels) by applying `SelectValue` sizing/alignment classes (`src/components/roadmap/roadmap-rail-card.tsx`).
- Renamed picker default option/placeholder from `All groups` to `All Modules` (`src/components/roadmap/roadmap-rail-card.tsx`).
- Validation:
  - `pnpm lint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex accelerator welcome dismissible banner
- Replaced the static in-page accelerator welcome block with a dismissible banner component rendered above the org snapshot strip (`src/components/accelerator/accelerator-welcome-banner.tsx`, `src/app/(accelerator)/accelerator/page.tsx`).
- Banner behavior:
  - dismiss button in top-right;
  - per-user local persistence via `localStorage` (`accelerator-overview-welcome-dismissed:v1:{userId}`) so dismissed state stays hidden for that user.
- Validation:
  - `pnpm lint src/components/accelerator/accelerator-welcome-banner.tsx 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex org snapshot counter correction (Programs/People)
- Updated `AcceleratorOrgSnapshotStrip` stat tiles so `Programs` and `People` display numeric counters instead of percentages (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Removed unused `programCompletion` / `peopleCompletion` wiring from accelerator overview page to keep props aligned (`src/app/(accelerator)/accelerator/page.tsx`).
- Kept `%` only where intended: readiness progress and About completeness.
- Validation:
  - `pnpm lint src/components/accelerator/accelerator-org-snapshot-strip.tsx 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex accelerator pricing CTA cleanup + overview shadow flattening
- Pricing accelerator option cards now use a single CTA label (`Continue`) for both billing modes while retaining billing switch behavior and mode-specific price/plan metadata submission (`src/components/public/accelerator-option-card.tsx`, `src/components/public/pricing-surface.tsx`).
- Removed drop-shadow styling from accelerator overview surface cards/elements so the page reads flatter and more unified:
  - org snapshot strip card/elements (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`)
  - roadmap deliverable/module cards and internal media badges (`src/components/roadmap/roadmap-rail-card.tsx`)
- Validation:
  - `pnpm test:acceptance tests/acceptance/home-canvas-scroll-logic.test.ts tests/acceptance/accelerator-billing-lifecycle.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/coaching-schedule-route.test.ts` ✅
  - `pnpm lint src/components/accelerator/accelerator-org-snapshot-strip.tsx src/components/roadmap/roadmap-rail-card.tsx src/components/public/accelerator-option-card.tsx src/components/public/pricing-surface.tsx` ✅

## 2026-02-07 — Codex accelerator welcome banner redesign (icon + light surface)
- Redesigned `AcceleratorWelcomeBanner` layout for cleaner hierarchy and spacing (`src/components/accelerator/accelerator-welcome-banner.tsx`).
- Added rounded-square icon container in the banner header (`Rocket` icon).
- Switched banner surface to a light-grey container (`bg-zinc-100/80` in light mode, darker adaptive tint in dark mode).
- Updated dismiss control styling to match the new banner visual language (rounded square, bordered background).
- Validation:
  - `pnpm lint src/components/accelerator/accelerator-welcome-banner.tsx` ✅

## 2026-02-07 — Codex right-rail bottom gap removal (accelerator surface)
- Removed desktop right-rail shell bottom padding so bottom-aligned rail cards sit flush with no extra gap (`src/components/app-shell.tsx`).
- Change: `ShellRightRail` inner container `pb-4` -> `pb-0`.
- Validation:
  - `pnpm lint src/components/app-shell.tsx` ✅

## 2026-02-07 — Codex right-rail vertical offset tweak
- Shifted desktop right-rail content down slightly by increasing top padding on the shared `ShellRightRail` scroll container (`src/components/app-shell.tsx`).
- Change: `pt-0` -> `pt-2`.
- Validation:
  - `pnpm lint src/components/app-shell.tsx` ✅

## 2026-02-07 — Codex right-rail vertical offset increase
- Increased desktop right-rail top offset further for the roadmap/coaching stack (`src/components/app-shell.tsx`).
- Change: `pt-2` -> `pt-4`.
- Validation:
  - `pnpm lint src/components/app-shell.tsx` ✅

## 2026-02-07 — Codex org snapshot logo seam alignment
- Adjusted org logo badge vertical position to better center it on the header/body seam and prevent overlap drift (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Change: logo badge offset `top-[-22px]` -> `top-[-28px]`.
- Validation:
  - `pnpm lint src/components/accelerator/accelerator-org-snapshot-strip.tsx` ✅

## 2026-02-07 — Codex coaching toast copy cleanup (full-tier)
- Replaced the full-tier coaching toast message to avoid exposing internal pricing/link-tier language (`src/hooks/use-coaching-booking.ts`).
- Change: `Opening the full-rate coaching booking link.` -> `Opening your coaching booking link.`
- Validation:
  - `pnpm lint src/hooks/use-coaching-booking.ts` ✅

## 2026-02-07 — Codex module assignment editor height parity
- Increased module-stepper assignment editor height behavior to match roadmap-style vertical space (`src/components/training/module-detail/assignment-form.tsx`).
- Changes:
  - roadmap checkpoint rich-text editor now sets `minHeight: 420`;
  - stepper assignment container now uses `h-full` so inner editor can stretch;
  - single-field long-text stepper sections now render as a full-height flex column (`flex-1`) instead of a short stacked block.
- Validation:
  - `pnpm lint src/components/training/module-detail/assignment-form.tsx` ✅

## 2026-02-07 — Codex people metric default floor
- Updated accelerator snapshot `People` metric to default to `1` when no team entries exist (`src/app/(accelerator)/accelerator/page.tsx`).
- Change: `peopleCount` now uses `Math.max(1, computedCount)`.
- Validation:
  - `pnpm lint 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex roadmap module badge hide
- Hid the `Module {n}` media overlay badge on roadmap module cards in the accelerator overview timeline (`src/components/roadmap/roadmap-rail-card.tsx`).
- Validation:
  - `pnpm lint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex roadmap module media icon reposition + locked label cleanup
- Replaced the module media icon treatment in roadmap cards:
  - moved from bottom-right circular badge to centered rounded-rectangle badge in the image area;
  - badge icon now resolves from the module’s associated track icon (`getTrackIcon(module.groupTitle ?? module.title)`).
  (`src/components/roadmap/roadmap-rail-card.tsx`)
- Removed redundant uppercase `LOCKED` helper text line from module card header row while preserving locked status badge semantics (`src/components/roadmap/roadmap-rail-card.tsx`).
- Validation:
  - `pnpm lint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex roadmap ordering fix + subtitle copy cleanup
- Fixed accelerator roadmap timeline ordering in `RoadmapRailCard` so module cards render in deterministic sequence first, with linked deliverables placed immediately after their corresponding module instead of front-loading deliverables (`src/components/roadmap/roadmap-rail-card.tsx`).
- Updated lesson-group filtering to prefer `homework.moduleId` linkage (with `moduleIdx` fallback) for accurate deliverable filtering in grouped views (`src/components/roadmap/roadmap-rail-card.tsx`).
- Removed the appended completion suffix (`x of y complete`) from the roadmap subtitle line (`src/components/roadmap/roadmap-rail-card.tsx`).
- Updated roadmap subtitle copy to: `Track progress and open each section to continue building your organization.` (`src/components/roadmap/roadmap-outline-card.tsx`).
- Validation:
  - `pnpm lint src/components/roadmap/roadmap-rail-card.tsx src/components/roadmap/roadmap-outline-card.tsx` ✅

## 2026-02-07 — Codex roadmap cleanup (rail removal + pinned CTA + module ordering hardening)
- Removed the decorative background rail/path rendering behind accelerator roadmap cards to simplify the visual surface (`src/components/roadmap/roadmap-rail-card.tsx`).
- Pinned module-card footer action copy (`Open module`) to a stable bottom-left position regardless of content height by converting card body layout to a full-height flex column (`src/components/roadmap/roadmap-rail-card.tsx`).
- Hardened accelerator overview module ordering so Formation/Electives are normalized across source groups, deduped, and explicitly ordered:
  - core Formation modules are forced first (`Naming your NFP`, `NFP Registration`, `Filing 1023`) with slug/title fallback,
  - paid Electives are sorted by elective catalog order and appended after main tracks.
  (`src/app/(accelerator)/accelerator/page.tsx`)
- Validation:
  - `pnpm exec eslint 'src/components/roadmap/roadmap-rail-card.tsx' 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex roadmap media container height correction
- Restored a taller module media area in accelerator roadmap cards so the image container no longer appears compressed after recent layout changes (`src/components/roadmap/roadmap-rail-card.tsx`).
- Change: module media wrapper updated from `aspect-[5/3]` to `aspect-[4/3]` with `min-h-[170px]` to keep consistent card proportions across viewport widths.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex roadmap media size rollback
- Reverted roadmap module media container sizing to the prior design in `src/components/roadmap/roadmap-rail-card.tsx`.
- Change: restored `aspect-[5/3]` and removed the temporary `min-h-[170px]` override.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex roadmap media ratio tuning (restore pre-shortened feel)
- Updated accelerator roadmap module media container from `aspect-[5/3]` to `aspect-[3/2]` to restore the prior visual height without reintroducing the overly tall variant (`src/components/roadmap/roadmap-rail-card.tsx`).
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex roadmap card footer spacing fix
- Reworked module-card footer action positioning in accelerator roadmap cards to eliminate forced vertical slack introduced by `mt-auto` + full-height content (`src/components/roadmap/roadmap-rail-card.tsx`).
- Changes:
  - module media ratio set to `aspect-[4/3]` (taller than `5/3`);
  - content stack no longer uses `h-full`;
  - `Open module` is now absolutely positioned at the bottom-left of the content block (`absolute bottom-4 left-4`);
  - module card minimum height reduced from `220px` to `200px` to avoid unnecessary empty space on short-content cards.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex roadmap card alignment pass (deliverable vs module)
- Updated accelerator roadmap deliverable card layout to visually align with module card content structure in `RoadmapRailCard` (`src/components/roadmap/roadmap-rail-card.tsx`).
- Changes on deliverable cards:
  - normalized card minimum height to `200px` to match module cards;
  - switched top row to a compact left helper label + right status badge layout;
  - aligned title/subtitle spacing with module card text stack;
  - pinned lesson footer metadata to bottom-left via absolute positioning (`bottom-4 left-4`) to match module footer behavior.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex track lock-state recompute fix (formation first module)
- Fixed incorrect `locked` statuses in accelerator overview timeline when visible tracks are split/filtered from source classes (`src/app/(accelerator)/accelerator/page.tsx`).
- Root cause: lock progression was inherited from pre-filter class ordering, so hidden modules could force visible first modules (for example, `Naming your NFP`) to appear locked.
- Added `relockModulesWithinTrack(...)` and applied it after dedupe/sort for both `Formation` and `Electives` tracks, treating inherited `locked` as `not_started` before recomputing progression within the visible track.
- Validation:
  - `pnpm exec eslint 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex roadmap footer CTA consistency pass
- Standardized bottom-left footer CTA treatment across accelerator roadmap module and deliverable cards in `RoadmapRailCard` (`src/components/roadmap/roadmap-rail-card.tsx`).
- Deliverable cards now use the same anchored CTA pattern as module cards (icon + short action label), replacing lesson-specific footer metadata.
- Change on deliverables: `Lesson ...` footer -> `Open deliverable` with `ArrowUpRight` icon.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex module card status-row cleanup + locked badge overlay
- Removed module helper label text (`REVIEW`/`CONTINUE`/`START`) from accelerator roadmap module cards to reduce redundancy (`src/components/roadmap/roadmap-rail-card.tsx`).
- Moved the `Locked` status pill from the text stack into the module media area as a top-right overlay badge.
- Unlocked module cards keep their status pill in the text area header row; locked cards now show status only in the media overlay.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex module status badge placement unification
- Unified module status badge placement in accelerator roadmap cards so `Locked`, `In progress`, and `Completed` all render in the same top-right media overlay position (`src/components/roadmap/roadmap-rail-card.tsx`).
- Removed the extra in-body module status row to avoid split positioning and visual drift.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex deliverable card spacing stabilization
- Added an invisible spacer block to deliverable cards in `RoadmapRailCard` to preserve module-aligned vertical rhythm after removing visible deliverable media overlays (`src/components/roadmap/roadmap-rail-card.tsx`).
- Spacer mirrors the module media dimensions (`aspect-[4/3]` + matching margins), while remaining hidden (`invisible`) and non-semantic (`aria-hidden`).
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex deliverable icon + badge position reset (module parity)
- Restored visible top media container treatment for deliverable cards so the roadmap icon (e.g., Compass) is centered inside the card container like module cards (`src/components/roadmap/roadmap-rail-card.tsx`).
- Moved deliverable status badge (`In progress` / `Complete`) to top-right media overlay to match module badge placement.
- Removed deliverable in-body status row after overlay unification.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex lesson-group progress metric (replace 5/17 deliverables counter)
- Replaced accelerator snapshot completion counter logic from raw roadmap deliverables (`x/17`) to lesson-group completion semantics in `AcceleratorOverviewPage` (`src/app/(accelerator)/accelerator/page.tsx`).
- A lesson group now counts complete only when:
  - all modules in that group are `completed`, and
  - all roadmap deliverables linked to modules in that group are complete.
- Wired new values into org snapshot strip via `moduleGroupsComplete`/`moduleGroupsTotal` (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Updated snapshot copy:
  - subcopy now reports `x/y lesson groups complete`;
  - summary row label changed from `Modules completed` to `Lesson groups completed`.
- Validation:
  - `pnpm exec eslint 'src/app/(accelerator)/accelerator/page.tsx' src/components/accelerator/accelerator-org-snapshot-strip.tsx src/components/roadmap/roadmap-rail-card.tsx src/lib/accelerator/progress.ts src/lib/module-progress.ts src/components/accelerator/start-building-pager.tsx 'src/app/(dashboard)/class/[slug]/module/[index]/page.tsx'` ✅

## 2026-02-07 — Codex copy tweak (lesson groups -> lessons)
- Updated accelerator snapshot progress copy to use `lessons` instead of `lesson groups` in `AcceleratorOrgSnapshotStrip` (`src/components/accelerator/accelerator-org-snapshot-strip.tsx`).
- Changes:
  - `x/y lesson groups complete` -> `x/y lessons complete`
  - `Lesson groups completed` -> `Lessons completed`
- Validation:
  - `pnpm exec eslint src/components/accelerator/accelerator-org-snapshot-strip.tsx` ✅

## 2026-02-07 — Codex coaching CTA copy tweak (right rail)
- Updated accelerator right-rail coaching CTA label from `Book coaching` to `Book a session` (`src/components/accelerator/accelerator-overview-right-rail.tsx`).
- Validation:
  - `pnpm exec eslint src/components/accelerator/accelerator-overview-right-rail.tsx` ✅

## 2026-02-07 — Codex accelerator roadmap rail CTA + overview copy update
- Added a right-rail navigation CTA in roadmap editor views under `/accelerator/roadmap*` to jump back to accelerator home (`/accelerator`) (`src/components/roadmap/roadmap-editor.tsx`).
- CTA placement: bottom of the roadmap TOC rail, full-width outlined button with home icon.
- Updated accelerator overview roadmap card copy to accelerator-specific language:
  - title `Strategic Roadmap` -> `Accelerator Progress`
  - subtitle `Track progress and open each section to continue building your organization.` -> `Track lessons and deliverables as you move through the accelerator.`
  (`src/components/roadmap/roadmap-outline-card.tsx`)
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-editor.tsx src/components/roadmap/roadmap-outline-card.tsx` ✅

## 2026-02-07 — Codex roadmap media grid-pattern integration
- Added `GridPattern` overlays to accelerator roadmap card media containers (deliverable + module cards) in `RoadmapRailCard` to match the visual system used in `AcceleratorOrgSnapshotStrip` (`src/components/roadmap/roadmap-rail-card.tsx`).
- Kept existing centered icon container and top-right status badge layering intact.
- Implementation details:
  - shared `ROADMAP_MEDIA_SQUARES` pattern seed;
  - unique `patternId` per card (`roadmap-deliverable-media-{id}` / `roadmap-module-media-{id}`);
  - masked + skewed pattern styling aligned with snapshot visual treatment.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅

## 2026-02-07 — Codex notifications + accelerator rail + module order stabilization
- Removed Notifications archive UI surface and converted the popover to inbox-only display in `src/components/notifications/notifications-menu.tsx`.
  - Deleted `Archive` tab trigger and archive list content.
  - Removed `Archive all` footer action.
  - Kept read-state behavior on notification open.
- Stabilized accelerator roadmap module ordering in `src/components/roadmap/roadmap-rail-card.tsx`.
  - Enforced core formation modules first: `Naming your NFP`, `NFP Registration`, `Filing 1023` (slug-based ordering).
  - Forced elective upsell modules to the end: `Financial Handbook`, `Due Diligence`, `Retention and Security`.
  - Maintained sequence/index ordering for all other modules.
- Hardened lesson-group filter trigger layout in `src/components/roadmap/roadmap-rail-card.tsx`.
  - Fixed width so the select stays anchored at the right.
  - Forced left text alignment + truncation behavior for long labels.
- Added accelerator sidebar jump list in `src/components/accelerator/accelerator-overview-right-rail.tsx`.
  - New top right-rail card lists modules with status pills and direct links.
  - Preserved coaching card as bottom slot.
- Removed full-rate coaching phrasing from user-facing coaching hints.
  - `src/components/accelerator/accelerator-overview-right-rail.tsx`
  - `src/components/accelerator/accelerator-schedule-card.tsx`
  - `src/components/training/module-right-rail.tsx`
  - `src/components/training/module-detail/module-stepper.tsx`
- Validation:
  - `pnpm exec eslint src/components/notifications/notifications-menu.tsx src/components/roadmap/roadmap-rail-card.tsx src/components/accelerator/accelerator-overview-right-rail.tsx src/components/accelerator/accelerator-schedule-card.tsx src/components/training/module-right-rail.tsx src/components/training/module-detail/module-stepper.tsx` ✅

## 2026-02-07 — Codex module assignment editor height parity pass
- Increased roadmap-linked assignment editor minimum height from `420` to `560` in `RoadmapCheckpointField` within `src/components/training/module-detail/assignment-form.tsx` to better match strategic-roadmap editing ergonomics.
- Increased non-roadmap rich text field containers in accelerator module pages:
  - `long_text` and `custom_program` editors now use `min-h-[460px]` in accelerator shell (`/accelerator/*`) and `min-h-[360px]` elsewhere.
- Goal: remove cramped editor feel on `/accelerator/class/.../module/...` assignment surfaces.
- Validation:
  - `pnpm exec eslint src/components/training/module-detail/assignment-form.tsx` ✅

## 2026-02-07 — Codex full-account seed expansion (case-study completeness)
- Expanded `scripts/seed-full-account.mjs` to seed a realistic end-to-end case-study dataset instead of baseline placeholder data only.
- Added seeded organization document metadata (`verification letter`, `articles`, `bylaws`, `state registration`, `good standing`, `W9`) under `organizations.profile.documents`.
- Added seeded strategic roadmap content under `organizations.profile.roadmap.sections` with mixed statuses (`complete`, `in_progress`, `not_started`) across key sections to support realistic accelerator and roadmap walkthroughs.
- Added additional profile realism fields (`ein`, `rep`) to improve settings/account/org demo fidelity.
- Added assignment submission seeding (`assignment_submissions`) tied to module progression so homework and completion surfaces have concrete data (`accepted`/`submitted` states).
- Validation:
  - `pnpm exec eslint scripts/seed-full-account.mjs` ✅

## 2026-02-07 — Codex readiness criteria + journey brief kickoff
- Added `docs/briefs/accelerator-readiness-criteria-and-journey.md` as the v1 contract for:
  - evidence-based `Fundable` / `Verified` criteria,
  - founder journey map,
  - gamification/flywheel model,
  - implementation backlog for deterministic readiness calculation.
- Indexed the brief in `docs/briefs/INDEX.md`.
- Updated active launch worklog (`docs/briefs/accelerator-launch-active-worklog.md`):
  - bumped `Last updated` to `2026-02-07`;
  - added WS-K workstream for readiness criteria + journey optimization.

## 2026-02-07 — Codex readiness scoring integration (accelerator overview)
- Added deterministic readiness scoring utility at `src/lib/accelerator/readiness.ts`.
  - Computes `Fundable`/`Verified` state from real evidence sources:
    - formation module completion,
    - roadmap core section completion,
    - document presence,
    - program funding-goal setup,
    - formation status,
    - team baseline.
  - Produces a derived readiness progress percentage + checkpoint thresholds (`70` / `90`).
- Wired accelerator overview to use readiness-derived progress/checkpoints instead of raw roadmap completion percent in `src/app/(accelerator)/accelerator/page.tsx`.
- Validation:
  - `pnpm exec eslint src/lib/accelerator/readiness.ts 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex incremental pass (INC-01/INC-02/INC-03)
- Added incremental execution queue tracking in `docs/briefs/accelerator-launch-active-worklog.md` and moved statuses to explicit `done/in progress/queued`.

### INC-01 — Readiness missing-criteria checklist UI (done)
- Added mapped readiness CTA links in accelerator overview page:
  - `src/app/(accelerator)/accelerator/page.tsx`
- Extended snapshot strip props + UI to show "Next to reach Fundable/Verified" linked checklist:
  - `src/components/accelerator/accelerator-org-snapshot-strip.tsx`
- Checklist items are deduped and capped to top 3 highest-signal actions.

### INC-02 — Accelerator calendar parity spacing pass (done)
- Normalized roadmap calendar shell spacing/margins and card chrome toward `/my-organization` calendar visual tokens:
  - reduced outer offset padding,
  - unified border/background treatments,
  - tightened section padding,
  - made embedded calendar width behavior explicit.
- File:
  - `src/components/roadmap/roadmap-calendar.tsx`

### INC-03 — Scroll logic QA + lock-model acceptance alignment (in progress)
- Acceptance test run confirms shared home-canvas scroll logic suite is passing:
  - `tests/acceptance/home-canvas-scroll-logic.test.ts`
- Updated acceptance test expectation to align with current non-locking module navigation model:
  - `tests/acceptance/module-progress.test.ts`

- Validation:
  - `pnpm exec eslint 'src/app/(accelerator)/accelerator/page.tsx' src/components/accelerator/accelerator-org-snapshot-strip.tsx src/components/roadmap/roadmap-calendar.tsx` ✅
  - `pnpm test:acceptance` ✅ (15 passed, 1 skipped)

## 2026-02-07 — Codex incremental pass (INC-05 readiness state visibility)
- Added explicit readiness state pill in accelerator snapshot progress header (`Building` / `Fundable` / `Verified`).
- Wiring updates:
  - `src/app/(accelerator)/accelerator/page.tsx`: pass derived `readinessStateLabel` to snapshot strip.
  - `src/components/accelerator/accelerator-org-snapshot-strip.tsx`: render state pill with semantic styling.
- Updated incremental queue status in `docs/briefs/accelerator-launch-active-worklog.md`:
  - `INC-05` moved to `in progress`.
- Validation:
  - `pnpm exec eslint 'src/app/(accelerator)/accelerator/page.tsx' src/components/accelerator/accelerator-org-snapshot-strip.tsx` ✅

## 2026-02-07 — Codex incremental pass (INC-05 admin readiness audit)
- Added admin-only readiness audit panel on `/accelerator` to expose deterministic scoring state and missing criteria.
- Panel includes:
  - current readiness state (`Building`/`Fundable`/`Verified`),
  - current score (`x/100`),
  - Fundable gap list,
  - Verified gap list.
- File:
  - `src/app/(accelerator)/accelerator/page.tsx`
- Updated incremental queue status in `docs/briefs/accelerator-launch-active-worklog.md`:
  - `INC-05` moved to `done`.
- Validation:
  - `pnpm exec eslint 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex incremental pass (INC-04 seed fixture verification, dry-run)
- Added safe `--dry-run` mode to `scripts/seed-full-account.mjs` for deterministic fixture validation without Supabase writes.
- Dry-run now reports:
  - email/role/variant/progress/onboarding preview,
  - roadmap section count,
  - seeded document count,
  - duplicate roadmap id/slug checks.
- Executed dry-run verification:
  - `node scripts/seed-full-account.mjs --dry-run true --email launch.qa@example.com --variant with_coaching --progress mixed` ✅
- Updated incremental queue status in `docs/briefs/accelerator-launch-active-worklog.md`:
  - `INC-04` moved to `in progress`.
- Validation:
  - `pnpm exec eslint scripts/seed-full-account.mjs` ✅

## 2026-02-07 — Codex incremental completion pass (INC-03 + INC-04)

### INC-04 — Full-case seed fixture consistency hardening (done)
- Expanded `scripts/seed-full-account.mjs` dry-run validation with stricter integrity checks:
  - duplicate roadmap id/slug detection,
  - required roadmap section presence validation,
  - allowed status validation (`not_started` / `in_progress` / `complete`),
  - required document key presence (`verificationLetter`),
  - basic seeded document shape checks (`name`/`path`).
- Added acceptance test for dry-run behavior:
  - `tests/acceptance/seed-full-account-dry-run.test.ts`

### INC-03 — Scroll boundary QA coverage expansion (done)
- Expanded home-canvas scroll logic acceptance coverage:
  - near-edge float handoff behavior,
  - explicit unavailable-metrics behavior (wheel blocked, swipe handoff).
- File:
  - `tests/acceptance/home-canvas-scroll-logic.test.ts`

- Validation:
  - `pnpm exec eslint scripts/seed-full-account.mjs tests/acceptance/seed-full-account-dry-run.test.ts tests/acceptance/home-canvas-scroll-logic.test.ts` ✅
  - `pnpm test:acceptance -- tests/acceptance/seed-full-account-dry-run.test.ts tests/acceptance/home-canvas-scroll-logic.test.ts` ✅

- Queue status update in `docs/briefs/accelerator-launch-active-worklog.md`:
  - `INC-03` -> done
  - `INC-04` -> done

## 2026-02-07 — Codex full acceptance sweep after incremental queue completion
- Ran full acceptance test suite after completing INC-01 through INC-05 updates.
- Result: all active acceptance tests passing.
- Command:
  - `pnpm test:acceptance` ✅
- Summary:
  - `16` files passed, `1` file skipped
  - `41` tests passed, `1` test skipped

## 2026-02-07 — Codex readiness transition acceptance coverage
- Added acceptance tests for readiness engine transitions (`Building` -> `Fundable` -> `Verified`):
  - `tests/acceptance/accelerator-readiness.test.ts`
- Coverage validates:
  - missing hard requirements stay in `Building`,
  - fundable threshold/requirements promote to `Fundable`,
  - verified mandatory artifacts + score threshold promote to `Verified`.
- Validation:
  - `pnpm exec eslint tests/acceptance/accelerator-readiness.test.ts` ✅
  - `pnpm test:acceptance -- tests/acceptance/accelerator-readiness.test.ts` ✅

## 2026-02-07 — Codex next incremental queue extension
- Extended incremental queue in `docs/briefs/accelerator-launch-active-worklog.md` with next items:
  - `INC-06`: browser smoke on home-canvas pricing handoff,
  - `INC-07`: seed-script dry-run CI guardrail,
  - `INC-08`: readiness checklist deep-link refinement.

## 2026-02-07 — Codex readiness checklist deep-link refinement (INC-08 start)
- Updated readiness checklist link generation so `Complete formation lessons` now routes to the next incomplete Formation module dynamically, instead of a static module-1 fallback.
- File:
  - `src/app/(accelerator)/accelerator/page.tsx`
- Validation:
  - `pnpm exec eslint 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex incremental completion pass (INC-07 + INC-08)

### INC-08 — Readiness checklist deep-link refinement (done)
- Added shared resolver utility for readiness checklist CTA generation:
  - `src/lib/accelerator/readiness-checklist.ts`
- Updated accelerator overview to use shared resolver and dynamic deep links:
  - `Complete formation lessons` -> next incomplete Formation module link
  - `Complete core roadmap sections` -> next incomplete core roadmap section link
- File updated:
  - `src/app/(accelerator)/accelerator/page.tsx`
- Added acceptance coverage for mapping behavior, fallbacks, dedupe, and cap:
  - `tests/acceptance/readiness-checklist.test.ts`

### INC-07 — Seed validation guardrail command + docs (done)
- Added package script:
  - `pnpm seed:validate` -> `node scripts/seed-full-account.mjs --dry-run true`
- Updated workflow runbook utilities to include seed fixture validation command:
  - `docs/agent/workflow-quality.md`
- Dry-run command confirmed passing.

- Validation:
  - `pnpm exec eslint src/lib/accelerator/readiness-checklist.ts 'src/app/(accelerator)/accelerator/page.tsx' tests/acceptance/readiness-checklist.test.ts` ✅
  - `pnpm test:acceptance -- tests/acceptance/readiness-checklist.test.ts tests/acceptance/seed-full-account-dry-run.test.ts` ✅
  - `pnpm seed:validate` ✅

- Queue status update in `docs/briefs/accelerator-launch-active-worklog.md`:
  - `INC-07` -> done
  - `INC-08` -> done

## 2026-02-07 — Codex incremental completion pass (INC-06 behavior contract)
- Added explicit home-canvas section behavior resolver:
  - `src/components/public/home-canvas-behavior.ts`
  - pricing is the only scrollable section (`pan-y`), all others are non-scrollable (`pan-x`).
- Updated `/home-canvas` preview to use shared behavior contract instead of inline `activeSection === "pricing"` checks:
  - `src/components/public/home-canvas-preview.tsx`
- Added acceptance coverage for section behavior contract:
  - `tests/acceptance/home-canvas-behavior.test.ts`
- Existing scroll handoff tests remain green and now validate against this explicit behavior layer:
  - `tests/acceptance/home-canvas-scroll-logic.test.ts`
- Validation:
  - `pnpm exec eslint src/components/public/home-canvas-behavior.ts src/components/public/home-canvas-preview.tsx tests/acceptance/home-canvas-behavior.test.ts` ✅
  - `pnpm test:acceptance -- tests/acceptance/home-canvas-behavior.test.ts tests/acceptance/home-canvas-scroll-logic.test.ts` ✅

- Queue status update in `docs/briefs/accelerator-launch-active-worklog.md`:
  - `INC-06` -> done

## 2026-02-07 — Codex incremental completion pass (INC-26 roadmap ordering + notifications cleanup)
- Added shared accelerator module ordering helper:
  - `src/lib/accelerator/module-order.ts`
  - Enforces deterministic sequencing:
    - Formation core modules first (`naming-your-nfp`, `nfp-registration`, `filing-1023`),
    - add-on electives (`financial-handbook`, `due-diligence`, `retention-and-security`) after core path.
- Wired roadmap timeline card ordering to shared helper:
  - `src/components/roadmap/roadmap-rail-card.tsx`
- Removed unnecessary archive query path from notifications list action (UI is inbox-only):
  - `src/app/actions/notifications.ts`
- Fixed accelerator snapshot lessons metric so it no longer falls back to deliverables when lesson totals are unavailable:
  - `src/components/accelerator/accelerator-org-snapshot-strip.tsx`
- Added regression coverage for ordering contract:
  - `tests/acceptance/accelerator-module-order.test.ts`

- Validation:
  - `pnpm test:acceptance -- tests/acceptance/accelerator-module-order.test.ts` ✅
  - `pnpm lint` ✅

## 2026-02-07 — Codex follow-up pass (INC-27 ordering unification)
- Removed duplicate module ordering logic from accelerator overview page and switched server-side grouping sort to shared helper:
  - `src/app/(accelerator)/accelerator/page.tsx`
  - now uses `sortAcceleratorModules` from `src/lib/accelerator/module-order.ts`
- Outcome: Formation-first/electives-last ordering is now single-sourced across both page composition and roadmap card rendering.

- Validation:
  - `pnpm test:acceptance` ✅ (`21` passed files, `1` skipped; `71` passed tests, `1` skipped)
  - `pnpm lint` ✅

## 2026-02-07 — Codex QA follow-up (snapshot + RLS)
- Additional validation run after INC-27:
  - `pnpm test:snapshots` ✅
  - `pnpm test:rls` ❌ blocked by network/DNS (`getaddrinfo ENOTFOUND vswzhuwjtgzrkxknrmxu.supabase.co`)

## 2026-02-07 — Codex micro pass (roadmap title copy)
- Updated accelerator roadmap surface title from `Accelerator Progress` to `The Framework`.
- File:
  - `src/components/roadmap/roadmap-outline-card.tsx`
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-outline-card.tsx` ✅

## 2026-02-07 — Codex micro pass (accelerator right-rail roadmap list)
- Replaced accelerator overview right-rail top card content from module list to roadmap section navigation.
- New top rail content now matches Strategic Roadmap section links (`Origin Story`, `Need`, etc.) and links to `/accelerator/roadmap/<slug>`.
- Files:
  - `src/components/accelerator/accelerator-overview-right-rail.tsx`
  - `src/app/(accelerator)/accelerator/page.tsx`
- Validation:
  - `pnpm exec eslint src/components/accelerator/accelerator-overview-right-rail.tsx 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex micro pass (pin Back To Accelerator in right rail)
- Moved `Back To Accelerator` from the roadmap TOC panel body into a dedicated bottom-aligned right-rail slot.
- File:
  - `src/components/roadmap/roadmap-editor.tsx`
- Implementation detail:
  - Added `RightRailSlot` with `align="bottom"` for the button when in accelerator roadmap view.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-editor.tsx` ✅

## 2026-02-07 — Codex micro pass (remove accelerator readiness audit panel)
- Removed the `READINESS AUDIT` admin panel block from accelerator overview (the section with score/fundable/verified gaps).
- File:
  - `src/app/(accelerator)/accelerator/page.tsx`
- Cleanup:
  - Removed unused `cn` import from the same file.
- Validation:
  - `pnpm exec eslint 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex micro pass (remove lesson-count coaching copy)
- Removed the dynamic `X lessons still open` text from accelerator coaching card description.
- Cleaned up now-unused `modules` prop/plumbing from accelerator overview right rail.
- Files:
  - `src/components/accelerator/accelerator-overview-right-rail.tsx`
  - `src/app/(accelerator)/accelerator/page.tsx`
- Validation:
  - `pnpm exec eslint src/components/accelerator/accelerator-overview-right-rail.tsx 'src/app/(accelerator)/accelerator/page.tsx'` ✅

## 2026-02-07 — Codex incremental completion pass (INC-28 org chart quality + seeding scale)
- Rebuilt `/people` org chart canvas behavior and layout engine:
  - `src/components/people/org-chart-canvas.tsx`
  - Added deterministic non-overlapping hierarchical layout by category lane and reporting depth.
  - Enabled practical navigation controls: drag-to-pan, pan-on-scroll, snap-to-grid, wider zoom bounds.
  - Added top-left `Auto-layout` control and fit-view behavior tuned for large datasets.
  - Improved canvas extent handling to prevent lockups from overly tight viewport bounds.
- Added real position persistence endpoint used by drag-stop saves:
  - `src/app/api/people/position/route.ts`
  - Stores `{x,y}` positions back into `organizations.profile.org_people` with authz checks.
- Expanded seeded people volume to support stress testing and realistic org-chart density (100+):
  - `src/actions/demo-workspace.ts` (`DEMO_PEOPLE` now generated as a large deterministic hierarchy)
  - `scripts/seed-full-account.mjs` (`buildOrgPeople` now generates 100+ deterministic members across staff/board/advisory/volunteers/supporters)
  - Dry-run output now reports `org_people_seeded` count.
- Updated seed dry-run acceptance check for new output:
  - `tests/acceptance/seed-full-account-dry-run.test.ts`

- Validation:
  - `pnpm exec eslint src/components/people/org-chart-canvas.tsx src/app/api/people/position/route.ts src/actions/demo-workspace.ts scripts/seed-full-account.mjs tests/acceptance/seed-full-account-dry-run.test.ts` ✅
  - `pnpm test:acceptance -- tests/acceptance/seed-full-account-dry-run.test.ts` ✅

## 2026-02-07 — Codex micro pass (org chart cleanup + hierarchy lanes)
- Removed unrequested org chart overlays:
  - Removed top-left status `Panel` (`Recenter / X visible / Pan and zoom enabled / Edit people…`).
  - Removed `Additional team members` overflow section under the canvas.
- Updated org chart layout model in `src/components/people/org-chart-canvas.tsx`:
  - Uses all people passed from `/people` (no first-80 truncation behavior).
  - Derives a lead node from staff/leadership titles when manager links are incomplete.
  - Renders categories in clearer hierarchy:
    - Board/advisory at top.
    - Lead centered under board.
    - Staff tree descending below lead by reporting depth.
    - Volunteers below staff.
    - Supporters on the bottom foundation row.
    - Contractors/vendors grouped into side lanes on the primary staff row.
  - Keeps ReactFlow controls, fit-view behavior, and panning/zooming.
- Expanded people category taxonomy for future grouping needs in `src/lib/people/categories.ts`:
  - Added `contractors` and `vendors` categories (labels + badge/strip styles + normalization rules).

- Validation:
  - `pnpm exec eslint src/components/people/org-chart-canvas.tsx src/lib/people/categories.ts` ✅
- Follow-up tweak: org-chart rows now wrap into stacked chunked rows (supporters/board/general wrap sizes) so large categories no longer render as one long horizontal line; retains hierarchy ordering and edge wiring (`src/components/people/org-chart-canvas.tsx`).
- Validation: `pnpm exec eslint src/components/people/org-chart-canvas.tsx` ✅
- UI cleanup: removed document rename inputs/buttons (`Update name`) from private documents cards; cards now show stored file name only with view/replace/delete actions (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`).
- Validation: `pnpm exec eslint src/components/organization/org-profile-card/tabs/documents-tab.tsx` ✅

## 2026-02-07 — Codex pricing lifecycle update (exact monthly totals)
- Updated Accelerator monthly lifecycle to 10-installment term so monthly totals can match one-time totals exactly:
  - `ACCELERATOR_MONTHLY_INSTALLMENT_LIMIT` changed from `6` to `10` (`src/lib/accelerator/billing.ts`).
- Updated pricing UI monthly amounts:
  - Accelerator Pro monthly: `$49.90` (10 installments = $499)
  - Accelerator Base monthly: `$34.90` (10 installments = $349)
  - (`src/components/public/pricing-surface.tsx`).
- Updated monthly plan copy to reflect the 10-payment schedule (`src/components/public/accelerator-option-card.tsx`).
- Updated acceptance tests for installment metadata/lifecycle expectations (`tests/acceptance/pricing-accelerator-checkout-metadata.test.ts`, `tests/acceptance/accelerator-billing-lifecycle.test.ts`, `tests/acceptance/stripe-webhook-route.test.ts`).
- Updated pricing/billing docs to match new installment policy (`docs/briefs/stripe-gating.md`, `docs/briefs/accelerator-billing-lifecycle-qa-matrix.md`, `docs/organize.md`).

- Validation:
  - `pnpm exec eslint src/lib/accelerator/billing.ts src/components/public/pricing-surface.tsx src/components/public/accelerator-option-card.tsx tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/accelerator-billing-lifecycle.test.ts tests/acceptance/stripe-webhook-route.test.ts` ✅
  - `pnpm test:acceptance tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/accelerator-billing-lifecycle.test.ts tests/acceptance/stripe-webhook-route.test.ts` ✅ (26 tests passed)

## 2026-02-07 — Codex ops pass (Stripe test catalog bootstrap)
- Added `scripts/setup-stripe-test-prices.sh` to create full Stripe test-mode catalog for launch pricing and write resulting `price_...` IDs into `.env.local`:
  - Organization `$20/mo`
  - Accelerator Pro `$499` one-time + `$49.90/mo`
  - Accelerator Base `$349` one-time + `$34.90/mo`
  - Electives (`Retention and Security`, `Due Diligence`, `Financial Handbook`) at `$50` one-time.
- Script also stores tier descriptions and customer memo text in product metadata for dashboard reference.
- Executed script successfully and populated local Stripe price env vars in `.env.local`.
- Added `scripts/setup-stripe-webhook.sh` to create Stripe webhook endpoints for a provided HTTPS URL and automatically update local `STRIPE_WEBHOOK_SECRET`.

- Validation:
  - `chmod +x scripts/setup-stripe-test-prices.sh scripts/setup-stripe-webhook.sh` ✅
  - `pnpm exec eslint scripts/setup-stripe-test-prices.sh scripts/setup-stripe-webhook.sh` (files ignored by ESLint config; no script lint errors emitted) ⚠️

## 2026-02-07 — Codex ops pass (temporary domain + Stripe webhook target)
- Updated local app base URL to use temporary Vercel domain for Stripe redirect/webhook consistency:
  - `NEXT_PUBLIC_SITE_URL=https://coach-house-lms.vercel.app` (`.env.local`).
- Created Stripe webhook endpoint targeting production temp domain:
  - `https://coach-house-lms.vercel.app/api/stripe/webhook`.
  - Endpoint created via `scripts/setup-stripe-webhook.sh` and local `STRIPE_WEBHOOK_SECRET` rotated in `.env.local`.
- Notes:
  - Keep `http://localhost:3000` only for local dev assumptions; deploy/runtime envs should use the Vercel URL until custom domain is connected.

## 2026-02-07 — Codex ops pass (domain rename follow-up: coachhouse.vercel.app)
- Confirmed old temporary domain `coach-house-lms.vercel.app` is no longer active (HTTP 404) and new domain `coachhouse.vercel.app` is active (HTTP 200).
- Updated local runtime base URL:
  - `NEXT_PUBLIC_SITE_URL=https://coachhouse.vercel.app` (`.env.local`).
- Rotated Stripe webhook target to new domain and refreshed signing secret in local env:
  - Created endpoint for `https://coachhouse.vercel.app/api/stripe/webhook`.
  - Removed prior webhook endpoint pointing at `coach-house-lms.vercel.app` to avoid failed retries/noise.
- Reminder: sync `NEXT_PUBLIC_SITE_URL` and `STRIPE_WEBHOOK_SECRET` in Vercel project environment variables, then redeploy.

## 2026-02-07 — Codex hotfix pass (Vercel build blockers)
- Fixed Accelerator overview TypeScript inference bug causing Vercel failure:
  - Added explicit typing for local `seed` objects in `src/app/(accelerator)/accelerator/page.tsx` to avoid implicit `any` in nullish-coalescing initializer.
- Fixed organizations profile upsert typing in people position API:
  - Cast profile payload to Supabase `Json` before upsert in `src/app/api/people/position/route.ts`.
- Fixed Stripe invoice typing compatibility with current Stripe SDK:
  - Replaced `invoice.subscription` usage with `invoice.parent?.subscription_details?.subscription` in `src/app/api/stripe/webhook/route.ts`.
- Fixed duplicate prop declaration in `src/components/app-shell.tsx` (`showLiveBadges`).
- Fixed module ordering type inference in `src/lib/accelerator/module-order.ts` by widening rank maps to `Map<string, number>`.

- Validation:
  - `pnpm exec eslint src/app/(accelerator)/accelerator/page.tsx src/app/api/people/position/route.ts src/app/api/stripe/webhook/route.ts src/components/app-shell.tsx src/lib/accelerator/module-order.ts` ✅
  - `pnpm build` ✅

## 2026-02-07 — Codex pass (root landing swap + docs consolidation + audit)
- Public root (`/`) now renders the current home-canvas surface instead of the old home2 wrapper:
  - Updated `src/app/(public)/page.tsx` to use `HomeCanvasPreview` + embedded `PricingSurface` and preserve `?section=` behavior.
- Archived previous root/home2 landing pattern for design-history reference:
  - Added `deprecated/artifacts/public-pages/root-home2-legacy.tsx`.
  - Marked `/home2` metadata title as legacy (`Home Two (Legacy)`) in `src/app/(public)/home2/page.tsx`.
- Docs consolidation:
  - Archived previous verbose launch organizer to `deprecated/docs/organize-legacy-2026-02-07.md`.
  - Replaced `docs/organize.md` with compact launch board (`Done` + `Pending` + concise triage + refactor queue).
  - Added `docs/README.md` as docs entrypoint and linked canonical launch docs.
  - Updated `docs/briefs/INDEX.md` to reference `docs/organize.md` as canonical launch board.
- Added focused engineering audit queue in `docs/organize.md`:
  - large-file split targets,
  - calendar UI unification,
  - stale `/roadmap` link cleanup,
  - public-home variant consolidation.

- Validation:
  - `pnpm exec eslint src/app/(public)/page.tsx src/app/(public)/home2/page.tsx` ✅
  - `pnpm build` ✅

## 2026-02-07 — Codex UI pass (home-canvas offerings layout tightening)
- Removed the top divider line above the home-canvas sidebar `Sign up` button (`src/components/public/home-canvas-preview.tsx`).
- Refined `Home2OfferingsSection` for the home-canvas stacked layout (`src/components/public/home2-sections.tsx`):
  - intro title/subtitle rendered above grid,
  - consistent row sizing,
  - documentation card spans upward into prior row,
  - narrowed centered max width to `760px` to match surrounding section balance.
- Validation: `pnpm exec eslint src/components/public/home-canvas-preview.tsx src/components/public/home2-sections.tsx` ✅

## 2026-02-07 — Codex auth flow pass (signup verification redirect + countdown)
- Added shared auth callback URL resolver to avoid localhost links when a non-local app URL is configured:
  - `src/components/auth/auth-callback-url.ts`
  - Prefers `NEXT_PUBLIC_SITE_URL`/browser origin that is not localhost.
- Updated signup flow (`src/components/auth/sign-up-form.tsx`):
  - uses resolver for `emailRedirectTo`,
  - success copy updated,
  - 20s countdown + automatic redirect to sign-in,
  - explicit “Go now” sign-in link.
- Updated forgot-password flow (`src/components/auth/forgot-password-form.tsx`) to use same callback URL resolver.
- Validation:
  - `pnpm exec eslint src/components/auth/auth-callback-url.ts src/components/auth/sign-up-form.tsx src/components/auth/forgot-password-form.tsx` ✅
  - `pnpm build` ✅

## 2026-02-08 — Codex auth microcopy cleanup
- Updated signup role field copy in `src/components/auth/sign-up-form.tsx`:
  - `Role type` -> `Role`
  - `Select your role type` -> `Select your role`
  - validation message `Select your role type` -> `Select your role`

## 2026-02-08 — Codex onboarding UX pass (centering + dynamic progress)
- Updated onboarding inline card layout in `src/components/onboarding/onboarding-dialog.tsx`:
  - tightened max width (`max-w-3xl`) and forced centered placement in shell.
- Replaced static step-based percent with live completion-based progress:
  - progress now tracks `orgName`, available `orgSlug`, selected `formationStatus`, `firstName`, and `lastName`.
  - added smooth numeric/bar animation as completion changes.
- Added onboarding validation for formation status selection and surfaced inline error copy.
- Follow-up tweak: reduced onboarding inline width to `max-w-[680px]` and added top offset (`pt-4 md:pt-8`) for lower visual placement on canvas (`src/components/onboarding/onboarding-dialog.tsx`).
- Onboarding placement fix: centered inline onboarding surface both horizontally and vertically by centering `data-shell-content-body` during onboarding mode in `src/components/app-shell.tsx`; removed manual top offset from onboarding card wrapper in `src/components/onboarding/onboarding-dialog.tsx`.
- Shell cleanup: introduced explicit onboarding layout mode in `src/components/app-shell.tsx` (`data-shell-mode=onboarding`) and centralized centering behavior there (`justify-center items-center gap-0`) so onboarding placement is controlled by shell mode instead of per-card offset tweaks.
- Onboarding validation UX: required-field errors now display only after attempted validation on that step (`attemptedStep` gating), preventing step-2 first/last-name errors from showing immediately on entry (`src/components/onboarding/onboarding-dialog.tsx`).
- Onboarding email security hardening (`src/components/onboarding/onboarding-dialog.tsx`, `src/app/(dashboard)/onboarding/actions.ts`):
  - replaced editable onboarding `Email` input with read-only `Account email` display (verified sign-in identity),
  - added separate optional `Public contact email (public)` field with helper copy,
  - stopped writing onboarding email into auth user metadata,
  - owner/person seed now uses `publicEmail` only for public contact email.
- Onboarding draft persistence fix (`src/components/onboarding/onboarding-dialog.tsx`): draft saves now merge with previous local draft values so step-specific unmounted fields are preserved (prevents Step 1 org values from being wiped while editing Step 2).
- Onboarding access gating (`src/components/app-shell.tsx`, `src/components/app-sidebar.tsx`, `src/app/(dashboard)/layout.tsx`): added `onboardingLocked` shell/sidebar mode so incomplete-onboarding users only see a single "Onboarding" nav item in left rail, with resources/global-search hidden until onboarding is complete.
- Validation: `pnpm exec eslint ...` ✅, `pnpm build` ✅.
- Follow-up onboarding nav/data pass:
  - Added explicit 2-step onboarding sidebar navigation in locked mode (`Step 1 · Organization`, `Step 2 · Account`) and removed single-item placeholder (`src/components/app-sidebar.tsx`).
  - Synced onboarding form step to URL query (`onboardingStep`) so left-rail step links drive the visible onboarding step and stay in sync (`src/components/onboarding/onboarding-dialog.tsx`).
  - Validation/build checks: `pnpm exec eslint ...` ✅, `pnpm build` ✅.
- Onboarding Step 2 spacing tweak (`src/components/onboarding/onboarding-dialog.tsx`): added extra vertical breathing room (`pt-2 pb-4`) to the Step 2 content block.
- Onboarding avatar upload UX polish (`src/components/onboarding/onboarding-dialog.tsx`): replaced visible file input with an overlay icon action on avatar container; hidden native file input remains wired for upload/crop/swap behavior.
- Onboarding canvas spacing tweak (`src/components/app-shell.tsx`): added explicit vertical outer padding in onboarding shell mode (`py-6 md:py-10`) so top/bottom breathing room is outside the card.
- Reverted onboarding step links per product feedback:
  - removed `Step 1 · Organization` / `Step 2 · Account` sidebar entries and restored a single onboarding nav item in locked mode (`src/components/app-sidebar.tsx`).
  - removed onboarding URL step-sync logic (`onboardingStep` query param writes/reads) from `src/components/onboarding/onboarding-dialog.tsx`.
- Onboarding outer spacing adjustment: increased onboarding shell-mode vertical padding (`py-10 md:py-16`) and reduced inline onboarding card max height (`max-h-[min(78vh,820px)]`) to enforce visible top/bottom space outside the card (`src/components/app-shell.tsx`, `src/components/onboarding/onboarding-dialog.tsx`).
- Onboarding Step 2 UX hardening (`src/components/onboarding/onboarding-dialog.tsx`, `src/components/app-shell.tsx`):
  - added non-blocking scroll-gate for Step 2 finish: submit is blocked only when content actually overflows and bottom has not yet been viewed.
  - added fading/bouncing down-arrow indicator while Step 2 requires scrolling.
  - added robust overflow detection via scroll + resize + ResizeObserver + settle timer to avoid lock/freeze edge cases.
  - mobile inline onboarding card now fills the available canvas (`h-full max-h-full` on mobile, desktop constrained), with reduced onboarding shell vertical padding on mobile.
  - aligned right-column optional fields by adding matching helper-text slots for `Phone`/`Title` rows.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx src/components/app-shell.tsx` ✅, `pnpm build` ✅.
- Onboarding scroll behavior simplification (`src/components/onboarding/onboarding-dialog.tsx`): removed Step 2 scroll-gate/indicator logic; kept reliable scrolling + footer overlap protections (`shrink-0` footer and larger Step 2 bottom scroll padding) so updates/newsletter content stays visible without blocking progression.
- Onboarding footer-clickability fix (`src/components/onboarding/onboarding-dialog.tsx`): replaced nested scroll wrappers with single `flex-1 overflow-y-auto` content container, increased Step 2 bottom scroll padding (`pb-28`), and raised footer stacking (`relative z-20`) to prevent content overlap blocking Back/Finish interactions.
- Onboarding spacing trim (`src/components/onboarding/onboarding-dialog.tsx`): reduced Step 2 bottom scroll padding from `pb-28` to `pb-16` to remove excess whitespace below updates/newsletter while preserving footer accessibility.
- Onboarding spacing normalization (`src/components/onboarding/onboarding-dialog.tsx`): removed Step 2-specific extra bottom scroll padding and tuned Step 2 block bottom padding to `pb-2` so bottom spacing matches top rhythm above the avatar card.
- Onboarding avatar action placement fix (`src/components/onboarding/onboarding-dialog.tsx`): moved camera upload button outside the avatar image clipping layer and anchored it with negative right/bottom offsets so it overlays the circle border edge without being clipped.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- Avatar upload icon placement adjustment (`src/components/onboarding/onboarding-dialog.tsx`): moved overlay control inward from `-right-2 -bottom-2` to `-right-1 -bottom-1` to keep border overlap while reducing overhang.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- Mobile onboarding fit/layout pass (`src/components/app-shell.tsx`, `src/components/onboarding/onboarding-dialog.tsx`):
  - inline onboarding is now full-bleed on mobile (`px-0 py-0` shell body, no mobile card border/radius/shadow), with desktop styling preserved.
  - onboarding-locked mobile header is compacted (shorter header row, reduced mobile chrome) to keep breadcrumb/title alignment cleaner.
  - reduced onboarding form content vertical padding to `py-0` (`px-6` retained) so parent shell spacing controls top/bottom rhythm and avoids double vertical gaps.
- Validation: `pnpm exec eslint src/components/app-shell.tsx src/components/onboarding/onboarding-dialog.tsx` ✅, `pnpm build` ✅.
- Mobile onboarding layout fix (`src/components/app-shell.tsx`, `src/components/onboarding/onboarding-dialog.tsx`):
  - reduced mobile onboarding horizontal shell padding to `px-0` in inline onboarding mode.
  - increased onboarding mobile bottom safe-area buffer to `pb-[calc(6.25rem+env(safe-area-inset-bottom))]` to prevent Step 2/footer from clipping behind bottom nav.
  - reduced onboarding card mobile horizontal padding from `px-6` to `px-4` in header/content/footer (desktop keeps `md:px-6`).
- Validation: `pnpm exec eslint src/components/app-shell.tsx src/components/onboarding/onboarding-dialog.tsx` ✅.
- Mobile canvas fit optimization (`src/components/app-shell.tsx`):
  - removed mobile canvas rounding and border (`rounded-none border-0`) so content uses full mobile canvas area.
  - reduced mobile onboarding inline bottom safe buffer from `6.25rem` to `5rem` (+ safe-area) to cut excess vertical gap while keeping clear of bottom nav.
- Validation: `pnpm exec eslint src/components/app-shell.tsx` ✅.
- Onboarding Step 2 avatar panel sizing tweak (`src/components/onboarding/onboarding-dialog.tsx`): increased vertical padding (`p-4` -> `px-4 py-5`) to make the profile upload block visibly taller without changing layout structure.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- Onboarding avatar upload panel size follow-up (`src/components/onboarding/onboarding-dialog.tsx`): increased panel vertical padding again (`px-4 py-5` -> `px-4 py-6`) to make the profile block taller.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- Onboarding Step 2 spacing + avatar block sizing (`src/components/onboarding/onboarding-dialog.tsx`):
  - normalized Step 2 outer spacing from `pt-2 pb-2` to `py-5` so top/bottom outside spacing is symmetric.
  - made the avatar upload panel consistently taller with `min-h-[10.5rem]` and centered content, while keeping existing padding.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- Onboarding Step 2 scroll gate + indicator (`src/components/onboarding/onboarding-dialog.tsx`):
  - added Step 2 scroll-state tracking (`step2NeedsScroll`, `step2ScrolledToBottom`) using scroll/resize + `ResizeObserver` so gate only applies when content overflows.
  - `Finish` now stays disabled until user reaches bottom of Step 2 content.
  - added non-interactive bottom-right chip with icon/text (`Scroll down to finish`) that appears only while Step 2 needs scroll and user is not yet at bottom.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- Onboarding draft + spacing fixes (`src/components/onboarding/onboarding-dialog.tsx`):
  - fixed Back-navigation data loss by rehydrating visible draft fields on step changes (not just initial open), so step-1 values like `orgName` persist when returning from step 2.
  - restored top/bottom rhythm for Step 1 form content (`space-y-5 py-5`) so spacing above `Organization name` is present again.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- Onboarding validation visibility fix (`src/components/onboarding/onboarding-dialog.tsx`): reset `attemptedStep` and step-level `errors` on step changes so Step 2 required-field errors do not pre-render immediately after moving from Step 1; they now appear only after attempting Finish.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- Home canvas scroll affordance update (`src/components/public/home-canvas-preview.tsx`): replaced the old `ChevronsUpDown + Scroll` pill with the onboarding-style bottom-right indicator chip using a bouncing down-arrow icon and generic copy (`Scroll down`) per UI consistency request (no "to finish" text).
- Validation: `pnpm exec eslint src/components/public/home-canvas-preview.tsx` ✅.
- Added private QA autofill utility for case-study walkthroughs:
  - new floating `Autofill page` control for allowed owner emails only (`caleb.hamernick@gmail.com`, `caleb@bandto.com`) (`src/components/dev/case-study-autofill-fab.tsx`).
  - integrated globally in app shell so it appears across authenticated platform/accelerator pages (`src/components/app-shell.tsx`).
  - autofill behavior targets visible empty fields only (inputs/textareas/selects + contenteditable), dispatches input/change events for React state sync, applies page-safe defaults (org/profile/roadmap/module copy), and includes onboarding formation-status auto-selection when missing.
- Validation: `pnpm exec eslint src/components/dev/case-study-autofill-fab.tsx src/components/app-shell.tsx` ✅, `pnpm build` ✅.
- QA autofill availability expansion (`src/components/dev/case-study-autofill-fab.tsx`, `src/components/public/home-canvas-preview.tsx`):
  - added token-gated mode (`allowToken`) so the floating autofill control can appear on public entry surfaces only after an allowed owner account has authenticated once in the same browser.
  - integrated token-gated control into `/home-canvas` surface for signup/login/pricing walkthrough autofill without exposing broadly to all users.
- Validation: `pnpm exec eslint src/components/dev/case-study-autofill-fab.tsx src/components/public/home-canvas-preview.tsx src/components/app-shell.tsx` ✅, `pnpm build` ✅.
- QA autofill entry-point coverage expansion:
  - added token-gated autofill control to auth entry surfaces (`src/components/auth/auth-screen-shell.tsx`, `src/app/(auth)/login/page.tsx`) so signup/login flows can be autofilled in the same browser once owner auth has enabled the QA token.
- Validation: `pnpm exec eslint src/components/dev/case-study-autofill-fab.tsx src/components/app-shell.tsx src/components/public/home-canvas-preview.tsx src/components/auth/auth-screen-shell.tsx 'src/app/(auth)/login/page.tsx'` ✅ (existing `@next/next/no-img-element` warning on login hero image), `pnpm build` ✅.
- QA autofill visibility fix (`src/components/dev/case-study-autofill-fab.tsx`): expanded gate to always allow authenticated localhost sessions (`localhost`/`127.0.0.1`) while preserving explicit allowlist/token behavior for non-local contexts, resolving missing button visibility during local onboarding testing.
- Validation: `pnpm exec eslint src/components/dev/case-study-autofill-fab.tsx` ✅.
- Onboarding submission loop fix (`src/components/onboarding/onboarding-dialog.tsx`):
  - preserved Step 1 organization fields for Step 2 submit by tracking `orgName`/`orgSlug` locally and posting them as hidden inputs while on Step 2, preventing server-side `missing_org_name` redirects.
  - synced org field state during draft rehydrate so Back/refresh/autofill flows keep submit payload intact.
- Onboarding error spacing tweak (`src/components/onboarding/onboarding-dialog.tsx`): added top margin to the server error banner (`mt-5`) to restore visual gap above “Enter an organization name to continue.”
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅, `pnpm build` ✅.
- Onboarding Step 2 validation UX fix (`src/components/onboarding/onboarding-dialog.tsx`): when Step 2 has prior required-field errors, form `onChange` now clears `firstName`/`lastName` errors immediately as values are entered (including autofill), and resets attempted state once both are present.
- Onboarding Step 2 copy/field cleanup (`src/components/onboarding/onboarding-dialog.tsx`): removed the `Account email` display block and retained only the optional phone field in that section.
- Validation: `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx` ✅.
- In-app paywall overlay implementation (`src/components/paywall/paywall-overlay.tsx`):
  - replaced iframe pricing embed with native modal checkout cards.
  - `paywall=elective`: renders elective module purchase cards directly in-app with `startCheckout` forms (`checkoutMode=elective`).
  - `paywall=accelerator`: renders Accelerator Pro/Base one-time checkout cards directly in-app (`checkoutMode=accelerator`).
  - retained fallback "Open pricing" external action for full plan details/monthly variants.
- Paywall routing changes to keep users in-app instead of sending to `/pricing` first:
  - accelerator gate redirect now targets app overlay query (`/my-organization?paywall=accelerator...`) in `src/app/(accelerator)/layout.tsx`.
  - module paywall redirects now target app overlay query for accelerator/elective in `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`.
  - sidebar locked-track/elective links now open app overlay query instead of `/pricing` in `src/components/app-sidebar/classes-section.tsx`.
- Stripe receipt hardening (`src/app/(public)/pricing/actions.ts`):
  - added `payment_intent_data.receipt_email` for accelerator/elective one-time checkout sessions to improve receipt email delivery consistency.
- Validation: `pnpm exec eslint src/components/paywall/paywall-overlay.tsx 'src/app/(public)/pricing/actions.ts' src/components/app-shell.tsx 'src/app/(accelerator)/layout.tsx' 'src/app/(dashboard)/class/[slug]/module/[index]/page.tsx' src/components/app-sidebar/classes-section.tsx` ✅, `pnpm build` ✅.
- Autofill URL safety fix (`src/components/dev/case-study-autofill-fab.tsx`):
  - narrowed website matcher from generic `url/site` to `website/homepage/domain/public site` signals.
  - added media-field guard (`image/logo/avatar/photo/banner/cover/thumbnail/icon`) so autofill never injects website URLs into media/image URL fields consumed by `next/image`.
  - URL input fallback now only fills when hints explicitly indicate website/homepage/domain.
- Validation: `pnpm exec eslint src/components/dev/case-study-autofill-fab.tsx` ✅.
- My Organization dashboard cleanup:
  - removed the `workspace-actions` bento card from `src/app/(dashboard)/my-organization/page.tsx` (Actions/launch-critical shortcuts block).
  - removed unused `workspaceActions` card rule from `src/components/organization/my-organization-bento-rules.ts` so layout no longer reserves that slot.
- Paywall modal layout refactor (`src/components/paywall/paywall-overlay.tsx`):
  - converted dialog container from fixed-height grid to `flex` column with `max-h` + scrolling body to eliminate large empty/stretch bands.
  - tightened header/body/footer spacing, improved card rhythm, and standardized CTA button heights.
  - added responsive footer button stack for small screens.
- Validation: `pnpm exec eslint src/components/paywall/paywall-overlay.tsx 'src/app/(dashboard)/my-organization/page.tsx' src/components/organization/my-organization-bento-rules.ts` ✅, `pnpm build` ✅.
- My Organization dashboard cleanup + calendar action fix:
  - removed `activity` bento card from `src/app/(dashboard)/my-organization/page.tsx` and removed `activity` slot rule from `src/components/organization/my-organization-bento-rules.ts`.
  - rebalanced grid after card removal by extending `programBuilder` row span to fill vacated space.
  - updated organization metrics strip to mirror accelerator snapshot metrics: `Funding goal`, `Programs`, `People` (replacing About/Programs/People percentages).
  - removed profile completion badge from org card header.
- Launch roadmap card ordering/content (`src/app/(dashboard)/my-organization/page.tsx`):
  - now sorts modules with `sortAcceleratorModules` and splits sections into `Free modules` (top) and `Paid electives` (below), with clear labels.
- Calendar card simplification (`src/app/(dashboard)/my-organization/page.tsx`):
  - removed description text (`Internal roadmap events.`), removed `NEXT EVENT` label, and removed `Google Meet` chip.
  - removed `Open calendar` button.
  - replaced redirecting `Add event` link with in-page side sheet trigger.
- New component: `src/components/organization/my-organization-add-event-sheet-button.tsx`
  - adds right-side sheet form for quick internal event creation via `createRoadmapCalendarEvent` without leaving `/my-organization`.
- Programs card cleanup (`src/components/organization/program-builder-dashboard-card.tsx`):
  - removed `Seed demo workspace` and `Seed next stage` buttons.
  - made empty state fill available card body height (`Card`/`CardContent` flex + `Empty` height).
- Validation: `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx' src/components/organization/my-organization-bento-rules.ts src/components/organization/program-builder-dashboard-card.tsx src/components/organization/my-organization-add-event-sheet-button.tsx` ✅, `pnpm build` ✅.
- Added dependency `@vercel/speed-insights` (v1.3.1) via `pnpm add`.
- Install required using existing pnpm store path due store mismatch (`/Users/calebhamernick/Library/pnpm/store/v10`).
- Landing page sidebar + navigation update (`src/components/public/home-canvas-preview.tsx`):
  - added persistent `About` nav item in the left sidebar footer linking to `https://www.coachhousesolutions.org/` (new-tab external link).
  - improved wheel-scroll section handoff to reduce accidental section skipping by adding gesture-intent accumulation and a short post-transition wheel lock.
- Landing page offerings update (`src/components/public/home2-sections.tsx`):
  - changed `What we do` card title from `Nonprofit platform` to `Platform`.
  - added new `Fiscal Sponsorship` card (external link to `https://www.coachhousesolutions.org/`).
  - updated offerings section supporting copy to include fiscal sponsorship and enabled proper external-link behavior for external cards.
- Pricing tiers refresh (`src/components/public/pricing-surface.tsx`, `src/app/(public)/pricing/page.tsx`):
  - updated platform tiers to reflect Tier 1 / Tier 2 / Tier 3 content and pricing notes.
  - added Tier 3 card (`$58/month`) with Tier-3-specific operations/support features and contact CTA.
  - updated feature-comparison table to compare Tier 1 vs Tier 2 vs Tier 3 and refreshed grouped feature rows/copy.
  - updated pricing hero/supporting metadata copy to match tier framing.
- Validation:
  - `pnpm exec eslint src/components/public/home-canvas-preview.tsx src/components/public/home2-sections.tsx src/components/public/pricing-surface.tsx 'src/app/(public)/pricing/page.tsx' tests/acceptance/home-canvas-scroll-logic.test.ts tests/acceptance/home-canvas-behavior.test.ts` ✅
  - `pnpm exec vitest run tests/acceptance/home-canvas-scroll-logic.test.ts tests/acceptance/home-canvas-behavior.test.ts tests/acceptance/pricing.test.ts` ✅
  - `pnpm lint` ✅ (existing warning in `src/app/(auth)/login/page.tsx` for `@next/next/no-img-element`)
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ❌ (pre-existing failures unrelated to this work: `tests/acceptance/admin-crud.test.ts` missing `SUPABASE_SERVICE_ROLE_KEY`, plus two failing assertions in `tests/acceptance/stripe-webhook-route.test.ts`)
  - `pnpm test:rls` ✅
  - `pnpm build` ✅
- Fiscal Sponsorship modal UX for landing offerings (`src/components/public/home2-sections.tsx`, `src/components/public/fiscal-sponsorship-dialog.tsx`):
  - converted the `Fiscal Sponsorship` offerings card from external link behavior to modal trigger behavior.
  - added reusable `FiscalSponsorshipDialog` component with a polished, scrollable information-card layout and full Part 1/Part 2 policy content.
  - preserved existing offerings card visual language while routing fiscal sponsorship clicks to an in-app dialog for better readability and context.
- Validation:
  - `pnpm exec eslint src/components/public/home2-sections.tsx src/components/public/fiscal-sponsorship-dialog.tsx` ✅
  - `pnpm build` ✅
- Pricing labels cleanup (`src/components/public/pricing-surface.tsx`, `src/app/(public)/pricing/page.tsx`):
  - removed Tier naming from pricing cards and restored/renamed plan labels (`Individual`, `Organization`, `Operations Support`).
  - updated card eyebrow/title/CTA labels and feature-heading copy to remove Tier references.
  - updated feature-breakdown column headers and supporting copy to match restored plan names.
  - updated pricing page metadata description to match restored naming.
- Validation:
  - `pnpm exec eslint src/components/public/pricing-surface.tsx 'src/app/(public)/pricing/page.tsx'` ✅
- Landing offerings badge update (`src/components/public/home2-sections.tsx`):
  - added a `Coming soon` pill to the `Community map` highlight card.
  - implemented card-level optional badge support in `Highlight` + `HighlightCard` so the pill renders consistently across split/stacked layouts.
- Validation:
  - `pnpm exec eslint src/components/public/home2-sections.tsx` ✅
- Notifications unread-indicator color update (`src/components/notifications/notifications-menu.tsx`):
  - changed unread dots from `bg-destructive` to blue (`bg-sky-500 dark:bg-sky-400`) for:
    - bell trigger badge
    - mounted bell trigger badge
    - per-notification unread dot in the inbox list
- Validation:
  - `pnpm exec eslint src/components/notifications/notifications-menu.tsx` ✅
- Notifications bell unread-cue behavior (`src/components/notifications/notifications-menu.tsx`):
  - added a separate bell cue state so opening the notifications popover clears the blue bell dot immediately.
  - kept per-notification unread dots tied to each item’s unread state so they only clear when that specific notification is clicked.
  - refresh logic now re-enables the bell cue when unread items exist while the popover is closed.
- Validation:
  - `pnpm exec eslint src/components/notifications/notifications-menu.tsx` ✅
- Added email confirmation template (`docs/briefs/email-confirmation-template.md`):
  - included subject line, preview text, HTML template with Coach House logo, and plain-text fallback.
  - used friendly/simple confirmation copy and Supabase placeholder `{{ .ConfirmationURL }}`.
- Email confirmation template branding fix (`docs/briefs/email-confirmation-template.md`):
  - replaced blue CTA/link accent with neutral app-aligned dark tone (`#111827`) to match product styling.
  - switched logo source from external site URL to app-hosted asset via Supabase template variable: `{{ .SiteURL }}/coach-house-logo-light.png`.
- Documents page redesign discovery brief added (`docs/briefs/documents-page-console-layout-adaptation.md`):
  - analyzed the provided console-style screenshot (layout, scanning model, filtering, table behavior, action placement).
  - produced a Keep/Remove/Adapt mapping specifically for Coach House document management use cases.
  - proposed updated information architecture (header, 4-card summary strip, sticky filters, status-first document table).
  - defined a category taxonomy for multi-category document management and mapped roadmap sections to document records.
  - documented roadmap-as-document status mapping (`not_started -> Missing`, `in_progress -> Draft`, `complete -> Ready`, optional `Published`).
  - included updated page/action/empty-state copy suggestions and a mobile behavior pattern.
  - outlined a phased implementation plan:
    - Phase 1: no schema migration, unify `profile.documents` + virtual roadmap docs in UI.
    - Phase 2: optional normalized `organization_documents` metadata table.
- Documents command-center redesign implemented (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`, `src/app/(dashboard)/my-organization/documents/page.tsx`):
  - retained and adapted a promo banner at top of Documents page (coach-house-specific copy + quick actions).
  - replaced single-purpose upload cards with a unified index that merges:
    - uploaded private org documents (`profile.documents` via existing `/api/account/org-documents` APIs)
    - roadmap sections as first-class document rows (`resolveRoadmapSections(profile)`).
  - added summary metric strip (total docs, roadmap docs, uploaded files, needs attention).
  - added filter/search controls (source/category/visibility/status + sort + quick toggles).
  - added status-first table layout (desktop) and stacked card layout (mobile) reusing existing UI primitives.
  - preserved existing upload/view/delete behavior and storage routes; no backend schema migration required.
  - added row-level actions:
    - uploads: view, upload/replace, delete (admin/edit mode aware)
    - roadmap rows: open roadmap editor and public roadmap link when section is public.
  - mapped roadmap statuses into document statuses:
    - `not_started -> Missing`
    - `in_progress -> Draft`
    - `complete -> Ready` (or `Published` when public)
  - widened documents page container and updated page subtitle to reflect the new filing-system purpose.
- Validation:
  - `pnpm exec eslint 'src/app/(dashboard)/my-organization/documents/page.tsx' 'src/components/organization/org-profile-card/tabs/documents-tab.tsx'` ✅
  - `pnpm build` ✅
- Documents roadmap entitlement gating fix (`src/app/(dashboard)/my-organization/documents/page.tsx`, `src/components/organization/org-profile-card/tabs/documents-tab.tsx`):
  - added accelerator entitlement check via `fetchLearningEntitlements` on `/my-organization/documents`.
  - roadmap-derived document rows are now only included when `hasAcceleratorAccess` is true.
  - for non-accelerator users, roadmap sections are excluded from data and UI:
    - no roadmap rows,
    - no roadmap source option/filter action,
    - no roadmap metric card,
    - promo/index copy now references uploaded files only.
  - kept existing upload/view/delete doc APIs unchanged.
- Validation:
  - `pnpm exec eslint 'src/app/(dashboard)/my-organization/documents/page.tsx' 'src/components/organization/org-profile-card/tabs/documents-tab.tsx'` ✅
  - `pnpm build` ✅
- Documents UI simplification + banner style alignment (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`, `src/app/(dashboard)/my-organization/documents/page.tsx`):
  - replaced the shaded/gradient documents promo card with an accelerator-style closeable banner (same visual language and dismiss button pattern).
  - added local per-user dismiss persistence for the documents banner (`localStorage` key: `documents-command-center-dismissed:v1:<userId>`).
  - removed the separate “Find documents quickly” card.
  - moved and simplified filtering controls into the top of the existing `Document index` card, directly above the table/list content.
  - kept all existing document table actions and entitlement gating behavior intact.
- Validation:
  - `pnpm exec eslint 'src/components/organization/org-profile-card/tabs/documents-tab.tsx' 'src/app/(dashboard)/my-organization/documents/page.tsx'` ✅
  - `pnpm build` ✅
- Documents policy + filter UX overhaul (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`, `src/app/(dashboard)/my-organization/documents/page.tsx`, `src/app/api/account/org-policies/route.ts`):
  - implemented first-class `Policies` in Documents with create/edit/delete support via new API route (`/api/account/org-policies`) backed by `organizations.profile.policies`.
  - policy records support structured associations:
    - board policy toggle,
    - associated program,
    - associated people (multi-select).
  - policy rows now appear in the unified document index with source `Policy` and category `Policies`.
  - changed non-finished statuses to avoid `Missing` for in-progress work:
    - roadmap `not_started -> Not started`, `in_progress -> In progress`.
    - policy `not_started -> Not started`, `in_progress -> In progress`, `complete -> Ready`.
    - `Missing` remains for required upload documents that have no file.
  - replaced multi-control filtering UI with a single minimal one-line pattern:
    - search input + one multi-select `Filters` dropdown (source/status/visibility/category + quick filters),
    - reset action,
    - removed standalone toggle buttons (`Only needs attention`, `Updated last 30 days`).
  - removed `Document index` header copy block from the index card.
  - banner cleanup:
    - changed banner icon from `Sparkles` to `FolderOpen`,
    - removed the `DOCUMENT COMMAND CENTER` eyebrow text,
    - removed banner CTA buttons (`Focus needs attention`, `Show roadmap docs`).
  - kept roadmap entitlement gating in place (roadmap items hidden when no accelerator access).
- Validation:
  - `pnpm exec eslint 'src/components/organization/org-profile-card/tabs/documents-tab.tsx' 'src/app/(dashboard)/my-organization/documents/page.tsx' 'src/app/api/account/org-policies/route.ts'` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (documents policy dialog search + select overflow fix)

- Documents policy dialog UX refinements (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`):
  - added an in-list people search field to the `Associated people` picker.
  - implemented a sticky search header inside the scrollable people list so search remains visible while browsing long lists.
  - added empty-state copy when no people match the query.
  - constrained `Program association` select trigger/content width and enabled long-label wrapping to prevent clipping/overflow outside the dialog surface.
- Validation:
  - `pnpm exec eslint src/components/organization/org-profile-card/tabs/documents-tab.tsx` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (documents table sorting + policy categories/files)

- Documents table controls (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`):
  - added sortable columns for `Status`, `Name`, `Category`, `Source`, `Visibility`, and `Last updated`.
  - added ascending/descending controls in the unified `Filters` dropdown (`Sort by` + `Direction`).
  - removed the top 4-card metrics strip from the Documents page.
  - converted document rows to multi-category support and updated category rendering/filter matching.
- Policy authoring UX (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`):
  - replaced `Board policy` checkbox with category selection/creation (preset tags + custom category add/remove).
  - added searchable associated-people picker with sticky search header.
  - added policy PDF attachment controls in the policy dialog:
    - choose/replace file,
    - clear pending selection,
    - view existing file,
    - remove existing file.
  - new-policy flow now supports selecting a file in the create dialog and uploads it after policy save.
- Policy persistence/API (`src/app/api/account/org-policies/route.ts`, `src/app/api/account/org-policies/document/route.ts`, `src/app/(dashboard)/my-organization/documents/page.tsx`):
  - policy schema now stores `categories[]` and optional `document` metadata in org profile.
  - maintained backward compatibility for legacy `board` boolean by mapping it to `categories: ["Board"]` when needed.
  - added policy document API route for signed view/upload/delete:
    - `GET /api/account/org-policies/document?id=<policyId>`
    - `POST /api/account/org-policies/document?id=<policyId>`
    - `DELETE /api/account/org-policies/document?id=<policyId>`
  - delete-policy flow now removes any attached policy file from storage to avoid orphaned objects.
- Validation:
  - `pnpm exec eslint src/components/organization/org-profile-card/tabs/documents-tab.tsx 'src/app/(dashboard)/my-organization/documents/page.tsx' src/app/api/account/org-policies/route.ts src/app/api/account/org-policies/document/route.ts` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (people page controls inline + right rail hidden)

- People page layout update (`src/components/people/people-table.tsx`, `src/app/(dashboard)/people/page.tsx`):
  - added configurable controls placement to `PeopleTableShell` with `controlsPlacement: "rail" | "inline"`.
  - switched `/people` to `controlsPlacement="inline"` so People controls render in the main content area under the `People` heading separator.
  - kept one-line horizontal control layout for inline mode (search, category select, add button) while preserving existing right-rail mode for other uses.
  - because no `RightRailSlot` is mounted on `/people` in inline mode, the right rail now closes/hides automatically.
- Validation:
  - `pnpm exec eslint src/components/people/people-table.tsx 'src/app/(dashboard)/people/page.tsx'` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (people manager assignment + add-dialog reset fixes)

- People manager assignment bugfix (`src/components/people/people-table.tsx`, `src/components/people/create-person-dialog.tsx`, `src/actions/people.ts`):
  - expanded manager assignment eligibility to include `volunteers` (previously staff-only).
  - updated People table `Reports To` cell to allow manager editing for volunteers.
  - updated create/edit person flow to show `Reports to` for eligible categories and preserve value through save.
  - server action now persists `reportsToId` for eligible categories instead of nulling non-staff unconditionally.
- Add Person stale autofill bugfix (`src/components/people/create-person-dialog.tsx`):
  - added full form reset/hydration on open/close using `initial` values.
  - closing/reopening `Add` now starts clean and no longer carries over previous entry values.
- Validation:
  - `pnpm exec eslint src/components/people/create-person-dialog.tsx src/components/people/people-table.tsx src/actions/people.ts` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (people manager assignment expanded to all categories)

- Expanded `Reports to` assignment beyond staff/volunteers to all people categories (`src/components/people/create-person-dialog.tsx`, `src/components/people/people-table.tsx`, `src/actions/people.ts`).
- Manager picker options now include all people except self (not just staff).
- Server save logic now persists `reportsToId` for all categories and guards against self-reporting.
- Validation:
  - `pnpm exec eslint src/components/people/create-person-dialog.tsx src/components/people/people-table.tsx src/actions/people.ts` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (people canvas persistence + docs/admin/table/layout updates)

- People org-chart hardening (`src/components/people/org-chart-canvas.tsx`, `src/app/api/people/position/route.ts`, `src/app/api/people/position/reset/route.ts`, `src/components/people/people-table.tsx`):
  - enabled draggable React Flow nodes when user can edit.
  - added persisted node positions with debounced/batched saves to `/api/people/position`.
  - added undo/redo controls with bounded in-memory history and reset-to-default layout action.
  - reset endpoint now supports full-layout reset (all categories) and still supports category-scoped reset.
  - updated layout behavior for canvas lanes:
    - board categories at top,
    - core org chart centered,
    - volunteers in left-side columns/rows,
    - supporters below in rows,
    - volunteers are not auto-connected unless an explicit `reportsTo` exists.
  - simplified people table row rendering path by removing heavy virtualization branch for paged table views to improve page-switch responsiveness.

- Organization Access invite row overlap fix (`src/components/account-settings/sections/organization-access-manager.tsx`):
  - adjusted invite form grid sizing/min-width behavior so `Invite` button and role select no longer overlap.

- Documents policy dialog category selector update (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`):
  - converted policy categories picker into a dropdown menu with multi-select checkboxes.
  - kept custom category creation inside the dropdown and retained selected-category removable chips below.

- Documents index column order update (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`):
  - moved `Actions` column to appear immediately after `Name` (before `Category`).

- Documents checklist expansion wiring:
  - added new document keys/types (`src/components/organization/org-profile-card/types.ts`).
  - added new checklist items in documents UI (`src/components/organization/org-profile-card/tabs/documents-tab.tsx`):
    - UEI Confirmation (SAM screenshot)
    - SAM.gov Active Status
    - Grants.gov Registration Confirmation
    - GATA Pre-Qualification
    - EIN Confirmation Letter (CP 575)
    - 990s (last 3 years)
    - Audited Financials
  - enabled upload/get/delete support for new kinds (`src/app/api/account/org-documents/route.ts`).
  - ensured server documents page reads/wires new fields (`src/app/(dashboard)/my-organization/documents/page.tsx`).

- My Organization card layout update (`src/components/organization/my-organization-bento-rules.ts`):
  - moved Calendar and Roadmap cards to a shared horizontal row above Programs.
  - moved Programs card to its own row below those two cards.

- Validation:
  - `pnpm exec eslint src/components/people/org-chart-canvas.tsx src/components/people/people-table.tsx src/app/api/people/position/route.ts src/app/api/people/position/reset/route.ts src/components/account-settings/sections/organization-access-manager.tsx src/components/organization/org-profile-card/tabs/documents-tab.tsx src/components/organization/org-profile-card/types.ts src/components/organization/my-organization-bento-rules.ts src/app/api/account/org-documents/route.ts 'src/app/(dashboard)/my-organization/documents/page.tsx'` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (active org resolution priority fix)

- Active organization resolution hardening (`src/lib/organization/active-org.ts`):
  - changed membership selection from "earliest created membership" to role-priority selection:
    - `owner` → `admin` → `staff` → `board` → `member`.
  - within the same role tier, keeps stable ordering by oldest `created_at`.
  - added role normalization safeguards for unexpected/null role values.
  - this prevents users with multiple org memberships from being silently dropped into a lower-permission org context.

- Account settings org-name lookup alignment (`src/components/account-settings/account-settings-dialog-state.ts`):
  - replaced local "first membership" lookup with `resolveActiveOrganization(...)` so the account settings dialog uses the same active-org logic as server routes and actions.

- Validation:
  - `pnpm exec eslint src/lib/organization/active-org.ts src/components/account-settings/account-settings-dialog-state.ts` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (home2 documentation card copy update)

- Updated documentation highlight card copy to match current positioning:
  - `src/components/public/home2-sections.tsx`
  - changed to: "Open Source tools, frameworks, and best practices for nonprofits."

- Validation:
  - `pnpm exec eslint src/components/public/home2-sections.tsx` ✅

## 2026-02-11 — Codex session (pricing tier sync + community card nav update)

- Pricing tier consistency pass (`src/components/public/pricing-surface.tsx`):
  - aligned Individual/Organization/Operations card bullets with current tier notes.
  - clarified roadmap/profile behavior in tier copy and feature breakdown:
    - Strategic Roadmap is private/internal across tiers.
    - Organizational Profile is private on Individual and optionally public on paid tiers.
  - aligned fee-for-service labeling across operations support items to avoid mixed semantics.
  - normalized community wording in comparison rows to match current product language.
  - updated comparison footer note to explicitly document roadmap/profile visibility rules.

- Offerings card behavior (`src/components/public/home2-sections.tsx`):
  - made the `Community` highlight card non-clickable (removed navigation target).
  - removed interactive-only affordances for non-clickable cards (no jump hover or external arrow for static cards).

- Validation:
  - `pnpm exec eslint src/components/public/pricing-surface.tsx src/components/public/home2-sections.tsx` ✅

## 2026-02-11 — Codex session (operations checkout + pricing CTA consistency)

- Pricing checkout + CTA consistency (`src/components/public/pricing-surface.tsx`):
  - kept Operations Support on self-checkout flow (`startCheckout`) rather than contact/mailto.
  - ensured platform tier eyebrow labels remain consistently styled (same typography/casing treatment).
  - confirmed pricing CTA buttons use the same rounded-rectangle treatment across the pricing surface (`rounded-xl`) for actions like Get started, Upgrade Organization, and Continue.

- Environment wiring (`src/lib/env.ts`, `.env.example`):
  - added `STRIPE_OPERATIONS_SUPPORT_PRICE_ID` as an optional env var.
  - Operations tier now uses `STRIPE_OPERATIONS_SUPPORT_PRICE_ID` first, with fallback to `STRIPE_ORGANIZATION_PRICE_ID` when needed.

- Validation:
  - `pnpm exec eslint src/components/public/pricing-surface.tsx src/lib/env.ts` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (formation label copy update)

- Updated formation status copy on My Organization summary card:
  - `src/app/(dashboard)/my-organization/page.tsx`
  - changed approved-state label from `Approved` to `IRS Approved`.

- Validation:
  - `pnpm exec eslint 'src/app/(dashboard)/my-organization/page.tsx'` ✅

## 2026-02-11 — Codex session (tier-gated admin access controls)

- Organization access gating by pricing tier (`src/app/actions/organization-access.ts`):
  - added paid-tier entitlement check for organization team-management controls (active/trialing paid subscription on the org owner record).
  - free-tier users can still open the admin surface, but backend mutations are now blocked with an upgrade-required message for:
    - invite creation/revocation,
    - member role updates,
    - org access settings updates.
  - `listOrganizationAccessAction` now returns tier-aware UI flags: `hasPaidTeamAccess` and `canEditRoles`.

- Admin UI updates (`src/components/account-settings/sections/organization-access-manager.tsx`):
  - added a clear upgrade callout explaining free-tier limits (1 founder admin seat).
  - role editing is now explicitly gated by paid access (`canEditRoles`), while non-edit states render role badges.

- Validation:
  - `pnpm exec eslint src/app/actions/organization-access.ts src/components/account-settings/sections/organization-access-manager.tsx` ✅
  - `pnpm build` ✅

## 2026-02-11 — Codex session (admin nav upgrade pill + internal checkout flow)

- Sidebar navigation gating (`src/components/app-sidebar/nav-data.ts`, `src/components/nav-main.tsx`, `src/components/app-sidebar.tsx`, `src/components/app-shell.tsx`):
  - updated Admin nav behavior for free-tier org users:
    - Admin row is shown but non-clickable.
    - an `Upgrade` pill is rendered on the row.
    - the `Upgrade` pill opens an in-app paywall flow.
  - added `canAccessOrgAdmin` wiring through app shell/sidebar so each layout can decide whether Admin is clickable.

- Internal upgrade paywall flow (`src/components/paywall/paywall-overlay.tsx`):
  - added `paywall=organization` mode with an Organization checkout card.
  - checkout action uses existing Stripe server action (`startCheckout`) with `checkoutMode=organization`.

- Paid-access predicate reuse (`src/lib/billing/subscription-access.ts`, `src/app/actions/organization-access.ts`, `src/app/(admin)/layout.tsx`):
  - introduced shared helper `hasPaidTeamAccessFromSubscription(...)`.
  - reused helper in organization-access backend checks and admin layout nav gating to keep tier rules aligned.

- Layout wiring for nav access (`src/app/(dashboard)/layout.tsx`, `src/app/(accelerator)/layout.tsx`, `src/app/(admin)/layout.tsx`):
  - compute and pass `canAccessOrgAdmin` so free-tier org users see upgrade CTA instead of clickable Admin nav access.

- Validation:
  - `pnpm exec eslint src/lib/billing/subscription-access.ts src/app/actions/organization-access.ts src/components/app-sidebar/nav-data.ts src/components/app-sidebar.tsx src/components/app-shell.tsx src/components/nav-main.tsx src/components/paywall/paywall-overlay.tsx 'src/app/(dashboard)/layout.tsx' 'src/app/(admin)/layout.tsx' 'src/app/(accelerator)/layout.tsx'` ✅
  - `pnpm build` ✅

## 2026-02-16 — Codex session (WS2/WS3 pricing consolidation + unified paywall)

- Pricing surface consolidated to 3-tier strategy (`src/components/public/pricing-surface.tsx`):
  - removed legacy `Accelerator Pro`, `Accelerator Base`, and `Buy electives only` sections.
  - aligned tier bullets and comparison table to Free (`Individual`), `$20` (`Organization`), and `$58` (`Operations Support`).
  - updated Operations Support language to expert-network framing (hire specialists as needed) while keeping self-checkout flow.
  - kept tier-card action buttons consistently rounded-rectangle (`rounded-xl`).

- Unified in-app paywall upgrade flow (`src/components/paywall/paywall-overlay.tsx`):
  - removed accelerator/elective-specific checkout branches.
  - all gated states now drive to paid-plan upgrade checkout (`Organization`) with pricing handoff for Operations Support.
  - preserved backward-compatible reason copy when older `paywall` query values are present.

- Checkout server action simplified to paid-tier subscription model (`src/app/(public)/pricing/actions.ts`):
  - removed accelerator/elective checkout handling from `startCheckout`.
  - subscription checkout now supports:
    - Organization via `STRIPE_ORGANIZATION_PRICE_ID`
    - Operations Support via explicit `priceId` or `STRIPE_OPERATIONS_SUPPORT_PRICE_ID` fallback.
  - added checkout metadata normalization:
    - `kind: organization`
    - `plan_tier: organization | operations_support`

- Learning/paywall route link realignment:
  - `src/app/(accelerator)/layout.tsx`: paid-access redirect now uses `paywall=organization`.
  - `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`: all upgrade redirects now target organization paywall.
  - `src/components/app-sidebar/classes-section.tsx`:
    - removed elective-purchase messaging and `paywall=elective`/`paywall=accelerator` links.
    - updated copy and links to paid-plan upgrade path.
    - unified track lock model to `open | requires_paid`.

- Validation:
  - `pnpm exec eslint 'src/components/public/pricing-surface.tsx' 'src/components/paywall/paywall-overlay.tsx' 'src/app/(public)/pricing/actions.ts' 'src/components/app-sidebar/classes-section.tsx' 'src/app/(dashboard)/class/[slug]/module/[index]/page.tsx' 'src/app/(accelerator)/layout.tsx'` ✅
  - `pnpm exec eslint 'tests/acceptance/pricing.test.ts' 'tests/acceptance/pricing-accelerator-checkout-metadata.test.ts'` ✅
  - `pnpm test:acceptance tests/acceptance/pricing.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/accelerator-module-order.test.ts` ✅ (12 tests)
  - `pnpm test:acceptance tests/acceptance/accelerator-readiness.test.ts tests/acceptance/module-progress.test.ts tests/acceptance/readiness-checklist.test.ts` ✅ (8 tests)

## 2026-02-16 — Codex session (WS5 accelerator card visual cleanup)

- Removed gradient/pattern treatment from Accelerator module cards while preserving card shells/layout:
  - `src/components/accelerator/start-building-pager.tsx`
  - `src/components/accelerator/accelerator-next-module-card.tsx`
- Replaced card media fills with neutral surface background (`bg-muted/35`) to keep visual hierarchy without colored gradients.
- Strategic Roadmap visuals were left unchanged.

- Validation:
  - `pnpm exec eslint 'src/components/accelerator/start-building-pager.tsx' 'src/components/accelerator/accelerator-next-module-card.tsx'` ✅

## 2026-02-16 — Codex session (WS4 onboarding intent step + post-onboarding upgrade handoff)

- Added early intent selection step to onboarding flow (`src/components/onboarding/onboarding-dialog.tsx`):
  - expanded onboarding steps from 2 to 3: `intent` -> `org` -> `account`.
  - added centered card-grid intent selector with `Coming soon` disabled options:
    - `Build nonprofits` (available)
    - `Find nonprofits` (coming soon)
    - `Fund nonprofits` (coming soon)
    - `Support teams` (coming soon)
  - added optional role-interest selector with `Board member` disabled/coming soon.
  - persisted `intentFocus` and `roleInterest` in onboarding draft state (`onboardingDraftV2`).
  - integrated intent into progress calculation and step validation.

- Onboarding server action updates (`src/app/(dashboard)/onboarding/actions.ts`):
  - parses/validates `intentFocus` and `roleInterest` from form data.
  - enforces `Build nonprofits` as the only currently selectable onboarding focus.
  - stores onboarding intent metadata in:
    - organization profile (`onboarding_intent_focus`, `onboarding_role_interest`)
    - auth user metadata (`onboarding_intent_focus`, `onboarding_role_interest`)
  - after successful onboarding, redirects to skippable in-app upgrade flow:
    - `/my-organization?paywall=organization&plan=organization&source=onboarding`

- Welcome modal coordination (`src/components/onboarding/onboarding-welcome.tsx`):
  - suppresses auto-open welcome dialog when a paywall query is present, so post-onboarding upgrade prompt is not visually stacked/competing.

- Validation:
  - `pnpm exec eslint 'src/components/onboarding/onboarding-dialog.tsx' 'src/components/onboarding/onboarding-welcome.tsx' 'src/app/(dashboard)/onboarding/actions.ts'` ✅
  - `pnpm test:acceptance tests/acceptance/onboarding.test.ts tests/acceptance/pricing.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts` ✅ (10 tests)

## 2026-02-16 — Codex session (WS6 route walkthrough documentation)

- Added end-to-end tester route map documenting current flow and gating:
  - `docs/briefs/tester-route-walkthrough-2026-02-16.md`
  - includes signup -> onboarding intent flow -> post-onboarding paywall -> pricing/checkout -> gated routes.
- Updated brief index:
  - `docs/briefs/INDEX.md`


## 2026-02-16 — Codex session (webhook parity + admin test compatibility + tester toggle)

- Stripe webhook invoice compatibility fix (`src/app/api/stripe/webhook/route.ts`):
  - `invoice.paid` installment handler now resolves subscription ids from both invoice shapes:
    - `invoice.parent.subscription_details.subscription`
    - legacy `invoice.subscription`
  - restored monthly installment progression behavior for both test fixtures.

- Admin API route hardening for test/runtime parity (`src/app/api/admin/classes/[id]/modules/route.ts`):
  - route now uses `requireAdmin()` return value for primary server client.
  - service-role client creation is now lazy and only used on explicit RLS fallback paths.
  - avoids unnecessary `SUPABASE_SERVICE_ROLE_KEY` dependency when fallback is not needed.

- Acceptance test alignment for current schema/revalidation behavior (`tests/acceptance/admin-crud.test.ts`):
  - updated module insert assertion from `published` -> `is_published`.
  - updated revalidation assertion to match shared class revalidate targets:
    - `/classes`, `/training`, `/accelerator`, `/accelerator/roadmap`.

- Tester-mode operational toggle (non-destructive) in Organization Access:
  - backend (`src/app/actions/organization-access.ts`):
    - `listOrganizationAccessAction` now returns per-member `isTester` and `canManageTesterFlags`.
    - added `setOrganizationMemberTesterFlagAction({ memberId, isTester })`.
    - action is platform-admin only and constrained to members within the active organization.
  - UI (`src/components/account-settings/sections/organization-access-manager.tsx`):
    - added per-member `Tester` switch (visible to platform admins only).
    - switch toggles tester tools access on/off without role/subscription mutation.

- Devtools/env clarity:
  - added `NEXT_PUBLIC_ENABLE_REACT_GRAB="0"` to `.env.example` to keep React Grab explicitly opt-in in development.

- Validation:
  - `pnpm test:acceptance tests/acceptance/stripe-webhook-route.test.ts tests/acceptance/billing.test.ts` ✅
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)
  - `pnpm test:rls` ✅
  - `pnpm lint` ✅ (existing warning only: `src/app/(auth)/login/page.tsx` `@next/next/no-img-element`)

## 2026-02-16 — Codex session (devtools visibility tightening + tutorial anchor refresh + Stripe readiness brief)

- Internal tooling visibility tightened on public/auth surfaces:
  - removed `CaseStudyAutofillFab` from unauthenticated/public entry points:
    - `src/components/auth/auth-screen-shell.tsx`
    - `src/app/(auth)/login/page.tsx`
    - `src/components/public/home-canvas-preview.tsx`
  - authenticated in-app autofill remains role-gated through `resolveDevtoolsAccess` (admin/tester only).

- Tutorial anchor coverage refreshed for current UI:
  - `src/components/nav-main.tsx`: added `data-tour="nav-documents"` mapping for `/my-organization/documents`.
  - `src/components/tutorial/tutorial-manager.tsx`:
    - platform step now uses fallback selector:
      - `[data-tour="nav-accelerator"], [data-tour="nav-documents"]`
    - updated step copy to be navigation-agnostic for free/paid users.
  - `src/app/(dashboard)/my-organization/page.tsx`:
    - added `data-tour` anchors for `dashboard-overview`, `dashboard-stats`, and `dashboard-actions`.
  - `src/app/(accelerator)/accelerator/page.tsx`:
    - added `data-tour="accelerator-get-started"` anchor to overview section.

- Stripe rollout documentation added:
  - new brief: `docs/briefs/stripe-tier-readiness-2026-02-16.md`
    - captures required env vars, current checkout contract, transition matrix, and manual smoke checklist for Free/$20/$58.
  - index updated: `docs/briefs/INDEX.md`.

- Validation:
  - `pnpm exec eslint 'src/components/auth/auth-screen-shell.tsx' 'src/app/(auth)/login/page.tsx' 'src/components/public/home-canvas-preview.tsx' 'src/components/nav-main.tsx' 'src/app/(dashboard)/my-organization/page.tsx' 'src/app/(accelerator)/accelerator/page.tsx' 'src/components/tutorial/tutorial-manager.tsx'` ✅ (existing warning only for `login/page.tsx` `<img>`)
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)
  - `pnpm test:rls` ✅

## 2026-02-16 — Codex session (operations price safety + tutorial anchor parity)

- Operations pricing safety fix:
  - `src/components/public/pricing-surface.tsx`
    - removed fallback from `STRIPE_OPERATIONS_SUPPORT_PRICE_ID` -> `STRIPE_ORGANIZATION_PRICE_ID`.
    - Operations checkout form now requires an explicit operations price id.
    - when operations Stripe config is missing, render a disabled `Operations plan unavailable` CTA instead of routing into ambiguous checkout paths.
  - `src/app/(public)/pricing/actions.ts`
    - removed server-side fallback that could charge Organization pricing for Operations checkout when operations price is missing.
    - missing operations price now redirects to `/pricing?error=operations_support_unavailable`.

- Stripe local test setup check:
  - verified local `.env.local` had all Stripe keys except `STRIPE_OPERATIONS_SUPPORT_PRICE_ID`.
  - created Stripe test product/price for Operations Support (`$58/mo`) and set local `STRIPE_OPERATIONS_SUPPORT_PRICE_ID` (local env only).

- Public/internal tooling visibility hardening:
  - removed unauthenticated/public `CaseStudyAutofillFab` launchers from:
    - `src/components/auth/auth-screen-shell.tsx`
    - `src/app/(auth)/login/page.tsx`
    - `src/components/public/home-canvas-preview.tsx`
  - authenticated app still role-gated via `resolveDevtoolsAccess`.

- Tutorial anchor parity updates:
  - `src/app/(dashboard)/my-organization/page.tsx`:
    - added `data-tour="dashboard-overview"`, `data-tour="dashboard-stats"`, `data-tour="dashboard-actions"`.
  - `src/app/(accelerator)/accelerator/page.tsx`:
    - added `data-tour="accelerator-get-started"`.
  - `src/components/nav-main.tsx`:
    - mapped `/my-organization/documents` to `data-tour="nav-documents"`.
  - `src/components/tutorial/tutorial-manager.tsx`:
    - updated platform navigation step selector fallback to `[data-tour="nav-accelerator"], [data-tour="nav-documents"]`.

- Docs:
  - added `docs/briefs/stripe-tier-readiness-2026-02-16.md`.
  - updated `docs/briefs/INDEX.md`.

- Validation:
  - `pnpm exec eslint 'src/app/(public)/pricing/actions.ts' 'src/components/public/pricing-surface.tsx' 'src/components/auth/auth-screen-shell.tsx' 'src/app/(auth)/login/page.tsx' 'src/components/public/home-canvas-preview.tsx' 'src/components/nav-main.tsx' 'src/app/(dashboard)/my-organization/page.tsx' 'src/app/(accelerator)/accelerator/page.tsx' 'src/components/tutorial/tutorial-manager.tsx'` ✅ (existing `login/page.tsx` `<img>` warning only)
  - `pnpm test:acceptance tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/pricing.test.ts` ✅
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)
  - `pnpm test:rls` ✅

## 2026-02-16 — Codex session (hosted Stripe env set + logout redirect fix)

- Hosted env update (Vercel):
  - linked project `caleb-hamernicks-projects/coach-house-platform`.
  - set `STRIPE_OPERATIONS_SUPPORT_PRICE_ID` to `price_1T1YgoGifcBHlPT4wynmmrul` for:
    - `Development`
    - `Preview`
    - `Production`
  - verified with `vercel env ls`.

- Logout redirect behavior update:
  - changed post-signout destination from `/login` to `/` (Coach House home page) in all sign-out surfaces:
    - `src/components/nav-user.tsx`
    - `src/components/sign-out-button.tsx`
    - `src/components/user-menu.tsx`
  - aligned account deletion redirect to `/` as well:
    - `src/components/account-settings/account-settings-dialog-state.ts`

- Docs:
  - updated Stripe readiness brief to reflect current rule:
    - operations price id is required (no `$20` fallback for operations checkout)
    - file: `docs/briefs/stripe-tier-readiness-2026-02-16.md`

- Validation:
  - `pnpm exec eslint src/components/nav-user.tsx src/components/sign-out-button.tsx src/components/user-menu.tsx src/components/account-settings/account-settings-dialog-state.ts` ✅
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)

## 2026-02-16 — Codex session (home-canvas pricing auth handoff fix)

- Fixed embedded pricing CTA behavior so pricing cards keep users inside home-canvas auth instead of hard-redirecting to `/login`:
  - `src/components/public/pricing-surface.tsx`
  - in embedded mode:
    - Individual card routes to `/?section=signup`.
    - Organization/Operations cards route to `/?section=login`.
  - non-embedded `/pricing` behavior is unchanged (normal checkout/actions).

- Validation:
  - `pnpm exec eslint src/components/public/pricing-surface.tsx` ✅
  - `pnpm test:acceptance tests/acceptance/pricing.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts` ✅

## 2026-02-16 — Codex session (tester route + role lock + local react-grab)

- Added dedicated tester auth routes:
  - `src/app/(auth)/tester/login/page.tsx` (`/tester/login`)
  - `src/app/(auth)/tester/sign-up/page.tsx` (`/tester/sign-up`)
  - tester signup uses normal signup flow but writes `qa_tester: true` into auth metadata for tester-audience detection.

- Locked signup role options to currently supported role:
  - `src/components/auth/sign-up-form.tsx`
  - only `Founder / Executive lead` is selectable.
  - other role options remain visible but disabled with `Coming soon` labeling.
  - server validation now enforces `founder_exec`.

- Restored local react-grab behavior while keeping production safe:
  - `src/components/dev/react-grab-loader.tsx`
    - development default is enabled unless explicitly set `NEXT_PUBLIC_ENABLE_REACT_GRAB=0`.
    - production remains disabled by `NODE_ENV` guard.
  - `.env.example`
    - updated `NEXT_PUBLIC_ENABLE_REACT_GRAB` guidance and default example.

- Validation:
  - `pnpm exec eslint src/components/dev/react-grab-loader.tsx src/components/auth/sign-up-form.tsx 'src/app/(auth)/tester/login/page.tsx' 'src/app/(auth)/tester/sign-up/page.tsx'` ✅
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)

## 2026-02-16 — Codex session (react-grab fix for `/tester/sign-up`)

- Updated react-grab loader to initialize reliably on localhost routes, including auth/tester pages:
  - `src/components/dev/react-grab-loader.tsx`
  - removed `useSearchParams` dependency from the loader.
  - embed-mode detection now reads `window.location.search` directly.
  - load condition now allows localhost in addition to development by default (still disabled if `NEXT_PUBLIC_ENABLE_REACT_GRAB=0`).
  - explicit override is supported with `NEXT_PUBLIC_ENABLE_REACT_GRAB=1`.

- Validation:
  - `pnpm exec eslint src/components/dev/react-grab-loader.tsx` ✅

## 2026-02-17 — Codex session (hide `Why Us` sidebar nav item only)

- Updated home-canvas sidebar nav rendering to hide the `Why Us` item while preserving section flow and scroll sequencing:
  - `src/components/public/home-canvas-preview.tsx`
  - added `HIDDEN_SIDEBAR_NAV_IDS` and `SIDEBAR_CANVAS_NAV` so `impact` remains in `VISIBLE_CANVAS_NAV` for section transitions but is not rendered in the left nav.

- Validation:
  - `pnpm exec eslint src/components/public/home-canvas-preview.tsx` ✅

## 2026-02-17 — Codex session (hide scroll hint on non-scrollable home-canvas sections)

- Updated home-canvas scroll hint visibility to only render on scrollable sections:
  - `src/components/public/home-canvas-preview.tsx`
  - wrapped the “Scroll down” chip in `activeSectionBehavior.scrollable` so it no longer appears on non-scrollable sections like `/signup` and other fixed panels.

- Validation:
  - `pnpm exec eslint src/components/public/home-canvas-preview.tsx` ✅

## 2026-02-17 — Codex session (deprecate standalone `/pricing` and `/login` pages)

- Updated route behavior so standalone `/pricing` and `/login` are no longer directly rendered:
  - `src/app/(public)/pricing/page.tsx`
    - now redirects to `/?section=pricing`.
    - preserves non-embed query params when forwarding.
  - `src/app/(auth)/login/page.tsx`
    - now redirects to `/?section=login`.
    - safely forwards supported params (`redirect`, `error`, `plan`, `addon`) to preserve auth/paywall handoff context.

- Validation:
  - `pnpm exec eslint 'src/app/(public)/pricing/page.tsx' 'src/app/(auth)/login/page.tsx'` ✅
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)

## 2026-02-17 — Codex session (signup duplicate-email UX)

- Updated shared signup behavior to surface a clear error for existing-account responses from Supabase:
  - `src/components/auth/sign-up-form.tsx`
  - handles the obfuscated duplicate-account response pattern (`data.user.identities` empty) and shows:
    - `An account with this email already exists. Sign in instead.`
  - prevents success/countdown state in this case.
  - adds direct `Go to sign in` link on error status messages.

- Validation:
  - `pnpm exec eslint src/components/auth/sign-up-form.tsx` ✅
  - `pnpm test:acceptance tests/acceptance/onboarding.test.ts tests/acceptance/pricing.test.ts` ✅

## 2026-02-17 — Codex session (account deletion hardening + home redirect)

- Hardened account deletion flow for cleaner session teardown and routing:
  - `src/app/api/account/delete/route.ts`
    - clears active auth session (`supabase.auth.signOut()`) before admin deletion.
    - returns the same `response` object so auth cookie mutations are preserved.
    - continues deleting the auth user via `admin.auth.admin.deleteUser(user.id)`.
  - `src/components/account-settings/account-settings-dialog-state.ts`
    - improved `handleDeleteAccount` error handling and user feedback.
    - performs client sign-out best-effort after successful deletion.
    - consistently redirects to `/` and refreshes.

- Validation:
  - `pnpm exec eslint src/app/api/account/delete/route.ts src/components/account-settings/account-settings-dialog-state.ts` ✅
  - `pnpm test:acceptance tests/acceptance/onboarding.test.ts` ✅

- Follow-up queued:
  - implement secure storage cleanup during account deletion so user-owned files/assets are purged from Supabase Storage (bucket + path scoped), with server-side authz checks and failure-safe deletion ordering.

## 2026-02-17 — Codex session (delete-account confirmation + invalid-session handling)

- Added explicit delete confirmation UX requiring account email entry:
  - `src/components/account-settings/account-settings-dialog.tsx`
  - Delete action now opens a dedicated confirmation dialog.
  - user must type their current account email to enable the destructive action.
  - added pending state so delete button does not appear stuck during async deletion.

- Hardened delete handler outcomes:
  - `src/components/account-settings/account-settings-dialog-state.ts`
  - `handleDeleteAccount` now returns `Promise<boolean>` for clear success/failure flow.
  - detects invalid/stale auth session errors, signs out safely, and routes user to `/?section=login` with a clear toast.
  - successful delete still signs out and routes to `/`.

- Validation:
  - `pnpm exec eslint src/components/account-settings/account-settings-dialog.tsx src/components/account-settings/account-settings-dialog-state.ts src/app/api/account/delete/route.ts` ✅
  - `pnpm test:acceptance tests/acceptance/onboarding.test.ts tests/acceptance/pricing.test.ts` ✅

## 2026-02-17 — Codex session (onboarding layout cleanup + callback auth UX)

- Onboarding visual/layout adjustments:
  - `src/components/onboarding/onboarding-dialog.tsx`
  - removed inline onboarding card drop shadow.
  - fixed vertical centering in dashboard inline canvas by switching wrapper to a desktop flex centering container.
  - removed the optional “How are you involved?” selector block from step 1.

- Auth callback resiliency and user-friendly messaging:
  - `src/lib/supabase/auth-callback.ts`
    - added OTP token-hash verification path (`verifyOtp`) for callback links that include `token_hash`.
    - improved fallback redirects to home-canvas login (`/?section=login`) with sanitized params.
    - handles PKCE code-verifier-missing on signup confirmations by redirecting with a non-error notice (`notice=email_confirmed_sign_in`).
  - `src/components/auth/login-form.tsx`
    - maps technical auth errors to plain-language messages.
    - displays callback notices (including confirmed-email prompt).
    - preserves safe `redirect` query targets and carries them through signin/signup links.
  - `src/components/public/home-canvas-preview.tsx`
    - updated auth panel links to root section routing (`/?section=login|signup`) instead of `/home-canvas`.

- Validation:
  - `pnpm exec eslint src/components/onboarding/onboarding-dialog.tsx src/components/auth/login-form.tsx src/components/public/home-canvas-preview.tsx src/lib/supabase/auth-callback.ts` ✅
  - `pnpm test:acceptance tests/acceptance/onboarding.test.ts tests/acceptance/pricing.test.ts` ✅

## 2026-02-17 — Codex session (paywall overlay redesign: optional + full tier cards)

- Reworked in-app paywall modal to remove “Upgrade required” framing and external pricing routing:
  - `src/components/paywall/paywall-overlay.tsx`
  - heading now uses neutral/optional language (`Choose your plan` / `Plan options`).
  - onboarding source (`source=onboarding`) copy explicitly states upgrade is optional.
  - removed the “Open pricing” external route button.
  - replaced single-card upsell with full in-app 3-tier card layout:
    - Individual (Free)
    - Organization ($20/mo)
    - Operations Support ($58/mo)
  - each tier now has clearer summary bullets and direct actions (stay free, checkout organization, checkout operations).
  - footer action simplified to in-app dismiss (`Not now` / `Close`).

- Validation:
  - `pnpm exec eslint src/components/paywall/paywall-overlay.tsx` ✅
  - `pnpm test:acceptance tests/acceptance/pricing.test.ts tests/acceptance/onboarding.test.ts` ✅

- Follow-up refinement:
  - removed free-tier CTA button from the in-app paywall card.
  - free tier now shows a non-interactive status pill/copy (`Current plan` / `Your current plan`) and is not selectable.
  - Validation:
    - `pnpm exec eslint src/components/paywall/paywall-overlay.tsx` ✅
    - `pnpm test:acceptance tests/acceptance/pricing.test.ts` ✅

## 2026-02-17 — Codex session (fix Radix sheet hydration mismatch on My Organization)

- Addressed hydration mismatch caused by server/client Radix trigger id drift (`aria-controls`) on the calendar add-event sheet trigger:
  - `src/components/organization/my-organization-add-event-sheet-button.tsx`
  - added mounted-gate rendering:
    - pre-mount: render a stable disabled plain `Button` (no Radix dialog trigger attributes)
    - post-mount: render full `Sheet` + `SheetTrigger` interactive flow
  - this keeps SSR/CSR markup aligned during hydration and prevents the reported warning.

- Validation:
  - `pnpm exec eslint src/components/organization/my-organization-add-event-sheet-button.tsx` ✅
  - `pnpm test:acceptance tests/acceptance/onboarding.test.ts tests/acceptance/pricing.test.ts` ✅

## 2026-02-17 — Codex session (tutorial/onboarding refresh + tester paid-access nav fix)

- Refreshed onboarding/tutorial guidance to match current product flow:
  - `src/components/onboarding/onboarding-dialog.tsx`
    - updated Step 1 title/description copy.
    - defaulted onboarding intent to `build` (available-now path) to reduce friction.
  - `src/components/onboarding/onboarding-welcome.tsx`
    - updated welcome checklist copy to current workspace model.
    - removed stale upgrade-checklist messaging.
  - `src/components/tutorial/tutorial-manager.tsx`
    - refreshed platform/my-organization/documents tutorial step copy and targets.
    - moved my-organization tutorial to stable selectors (`dashboard-overview`, `dashboard-actions`, `nav-documents`).
  - `src/components/organization/org-profile-card/tabs/documents-tab.tsx`
    - added stable `data-tour="documents-search"` target on documents search input.

- Fixed paid tester accelerator visibility after sandbox checkout:
  - `src/app/(public)/pricing/actions.ts`
    - checkout metadata now includes both `user_id` and `org_user_id`.
    - fallback trialing record writes to `org_user_id` ownership context.
  - `src/app/(public)/pricing/success/page.tsx`
    - subscription upsert now uses `org_user_id` from metadata when present.
  - `src/app/api/stripe/webhook/route.ts`
    - subscription upserts now prefer `org_user_id` metadata, with fallback to `user_id`.
    - added metadata fallback path for checkout sessions missing `client_reference_id`.
  - `src/lib/accelerator/entitlements.ts`
    - entitlements now check active subscription for active org owner id first, then fallback to member user id for backwards compatibility with older user-scoped subscription rows.

- Validation:
  - `pnpm exec eslint 'src/app/(public)/pricing/actions.ts' 'src/app/(public)/pricing/success/page.tsx' src/app/api/stripe/webhook/route.ts src/lib/accelerator/entitlements.ts src/components/tutorial/tutorial-manager.tsx src/components/onboarding/onboarding-dialog.tsx src/components/onboarding/onboarding-welcome.tsx src/components/organization/org-profile-card/tabs/documents-tab.tsx` ✅
  - `pnpm test:acceptance tests/acceptance/pricing.test.ts tests/acceptance/onboarding.test.ts tests/acceptance/stripe-webhook-route.test.ts` ✅
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)

## 2026-02-17 — Codex session (paid tier Accelerator nav visibility hotfix)

- Root-cause fix for paid users not seeing Accelerator in nav after successful Stripe checkout:
  - DB `subscriptions` table conflict target is composite (`user_id, stripe_subscription_id`), but write paths were using `onConflict: "stripe_subscription_id"`.
  - This caused subscription upserts to fail silently in checkout success + webhook flows, leaving entitlement state unsynced.

- Updated subscription write paths to the correct conflict target:
  - `src/app/(public)/pricing/actions.ts`
  - `src/app/(public)/pricing/success/page.tsx`
  - `src/app/api/stripe/webhook/route.ts`
  - `src/lib/accelerator/entitlements.ts`
  - all now use `onConflict: "user_id,stripe_subscription_id"`.

- Added entitlement resiliency when local subscription state is missing:
  - `src/lib/accelerator/entitlements.ts`
  - if no active local subscription is found, attempts Stripe metadata lookup (`user_id` / `org_user_id`) and backfills `subscriptions` via admin client.
  - includes short in-memory cooldown to avoid repeated Stripe lookups.

- Updated acceptance assertions for new conflict target:
  - `tests/acceptance/pricing.test.ts`
  - `tests/acceptance/stripe-webhook-route.test.ts`

- Operational data repair performed:
  - backfilled missing active Stripe subscription row(s) into `subscriptions` using corrected composite conflict target.

- Validation:
  - `pnpm exec eslint 'src/lib/accelerator/entitlements.ts' 'src/app/(public)/pricing/actions.ts' 'src/app/(public)/pricing/success/page.tsx' 'src/app/api/stripe/webhook/route.ts' 'tests/acceptance/pricing.test.ts' 'tests/acceptance/stripe-webhook-route.test.ts'` ✅
  - `pnpm test:acceptance tests/acceptance/pricing.test.ts tests/acceptance/stripe-webhook-route.test.ts` ✅
  - `pnpm test:acceptance tests/acceptance/pricing-accelerator-checkout-metadata.test.ts` ✅
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)

## 2026-02-17 — Codex session (billing UX rebuild + in-app upgrade/downgrade)

- Rebuilt the in-app paywall modal from placeholder-like upsell into a full plan management surface:
  - `src/components/paywall/paywall-overlay.tsx`
  - added clear current-plan state, stronger layout hierarchy, and explicit upgrade/downgrade messaging.
  - added paid-tier switching actions in-place (`Organization` ↔ `Operations Support`) using existing checkout action.
  - added direct shortcut to `/billing` from modal footer.

- Implemented real subscription plan switching logic in checkout action (prevents duplicate subscriptions):
  - `src/app/(public)/pricing/actions.ts`
  - when active/trialing subscription exists, action now updates existing Stripe subscription item price instead of creating a second subscription.
  - persists updated subscription status/metadata to Supabase with composite conflict target (`user_id,stripe_subscription_id`).
  - keeps checkout path for first-time paid subscriptions.

- Added reusable plan-tier resolver:
  - `src/lib/billing/plan-tier.ts`
  - normalizes plan tier from subscription status + metadata (`free`, `organization`, `operations_support`).

- Wired current plan tier through app shell so paywall state is accurate for logged-in users:
  - `src/app/(dashboard)/layout.tsx`
  - `src/app/(accelerator)/layout.tsx`
  - `src/components/app-shell.tsx`

- Replaced billing placeholder page with a real billing management screen:
  - `src/app/(dashboard)/billing/page.tsx`
  - now shows current plan summary, renewal info, side-by-side plan cards, and one-click upgrade/downgrade actions.

- Billing portal action aligned to active org context:
  - `src/app/(dashboard)/billing/actions.ts`
  - resolves `orgId` first (with safe fallback in test/mocked contexts) before looking up Stripe customer.

- Validation:
  - `pnpm exec eslint 'src/app/(public)/pricing/actions.ts' 'src/components/paywall/paywall-overlay.tsx' 'src/components/app-shell.tsx' 'src/app/(dashboard)/layout.tsx' 'src/app/(accelerator)/layout.tsx' 'src/app/(dashboard)/billing/page.tsx' 'src/app/(dashboard)/billing/actions.ts' 'src/lib/billing/plan-tier.ts'` ✅
  - `pnpm test:acceptance` ✅ (21 passed, 1 skipped)

## 2026-02-17 — Codex session (organization route defaults + nav naming + onboarding slug clarity)

- Migrated user-facing default workspace route references from `/my-organization` to `/organization` across app navigation/auth/paywall/search/redirect surfaces while keeping compatibility pages in place:
  - added/kept route aliases:
    - `src/app/(dashboard)/organization/page.tsx` -> re-export of `../my-organization/page`
    - `src/app/(dashboard)/organization/documents/page.tsx` -> re-export of `../../my-organization/documents/page`
  - updated nav + shell default links and auth fallbacks to point at `/organization`.

- Sidebar now supports dynamic org naming in primary nav item:
  - `src/components/app-sidebar/nav-data.ts`
  - `src/components/app-sidebar.tsx`
  - `src/components/app-shell.tsx`
  - main item title now uses `organizationName` when available, fallback label is `Organization`.

- Onboarding slug safety + clarity updates:
  - reserved slug lists now include `organization` (while retaining `my-organization`) in:
    - `src/components/onboarding/onboarding-dialog.tsx`
    - `src/app/(dashboard)/onboarding/actions.ts`
    - `src/app/api/public/organizations/slug-available/route.ts`
    - `src/components/organization/org-profile-card/tabs/company-tab/constants.ts`
  - added helper copy in onboarding org step clarifying that display name and public URL slug are separate.

- Added local Stripe branding assets and reusable badge component (official asset source) and integrated into billing/paywall:
  - `public/brand/stripe/powered-by-stripe-black.svg`
  - `public/brand/stripe/powered-by-stripe-white.svg`
  - `src/components/billing/stripe-powered-badge.tsx`
  - `src/app/(dashboard)/billing/page.tsx`
  - `src/components/paywall/paywall-overlay.tsx`

- Validation:
  - `pnpm exec eslint src/proxy.ts src/lib/supabase/auth-callback.ts src/components/app-shell.tsx src/components/app-sidebar.tsx src/components/app-sidebar/nav-data.ts src/components/nav-main.tsx src/components/auth/login-form.tsx src/components/auth/sign-up-form.tsx src/components/auth/update-password-form.tsx 'src/app/(auth)/sign-up/page.tsx' 'src/app/(auth)/tester/sign-up/page.tsx' 'src/app/(auth)/tester/login/page.tsx' 'src/app/(auth)/update-password/page.tsx' 'src/app/(dashboard)/onboarding/actions.ts' src/components/onboarding/onboarding-dialog.tsx src/app/api/public/organizations/slug-available/route.ts src/components/organization/org-profile-card/tabs/company-tab/constants.ts 'src/app/(dashboard)/organization/page.tsx' 'src/app/(dashboard)/organization/documents/page.tsx' 'src/app/(dashboard)/my-organization/page.tsx' 'src/app/(dashboard)/layout.tsx' 'src/app/(accelerator)/layout.tsx'` ✅
  - `pnpm exec tsc --noEmit` ❌ (pre-existing repository errors unrelated to this route pass remain in pricing/auth typing + acceptance test typing stubs).

## 2026-02-17 — Codex session (strict completion sweep: routes, onboarding/tutorial, billing QA, TS+tests)

- Route consistency and naming cleanup toward `/organization`:
  - finalized user-facing defaults/redirects on `/organization` and `/organization/documents` while preserving compatibility route aliases.
  - sidebar main nav now uses dynamic org name when available, fallback label `Organization`.
  - updated language strings from “My Organization” -> “Organization” across error states, join/admin helpers, and roadmap guidance.
  - files (representative):
    - `src/components/nav-main.tsx`
    - `src/components/tutorial/tutorial-manager.tsx`
    - `src/components/onboarding/onboarding-welcome.tsx`
    - `src/components/global-search.tsx`
    - `src/app/(dashboard)/@breadcrumbs/my-organization/page.tsx`
    - `src/app/(dashboard)/@breadcrumbs/organization/page.tsx` (new)

- Onboarding slug + display-name clarity:
  - kept display name vs public slug as separate concepts and added helper copy in onboarding.
  - ensured `organization` is reserved across slug validators.
  - files:
    - `src/components/onboarding/onboarding-dialog.tsx`
    - `src/app/(dashboard)/onboarding/actions.ts`
    - `src/app/api/public/organizations/slug-available/route.ts`
    - `src/components/organization/org-profile-card/tabs/company-tab/constants.ts`

- TypeScript hardening and test reliability fixes:
  - fixed `startCheckout` control-flow narrowing for plan price fallback redirect path.
  - refactored signup role selection to local controlled state while preserving “only Founder/Executive available” behavior and removing RHF generic/type conflicts.
  - normalized Stripe `current_period_end` typing cast in entitlements sync.
  - fixed webhook acceptance tests to use `NextRequest` and explicit `afterEach` import.
  - files:
    - `src/app/(public)/pricing/actions.ts`
    - `src/components/auth/sign-up-form.tsx`
    - `src/lib/accelerator/entitlements.ts`
    - `tests/acceptance/stripe-webhook-route.test.ts`

- Acceptance/snapshot suite updates for route rename:
  - updated expectations from `/my-organization` -> `/organization`.
  - files:
    - `tests/acceptance/pricing.test.ts`
    - `tests/acceptance/onboarding.test.ts`
    - `tests/acceptance/readiness-checklist.test.ts`
    - `src/stories/breadcrumb.stories.tsx` (snapshot text parity)

- Performance pass:
  - added short-lived server cache for common published-only sidebar tree fetch to reduce repeated layout query work during authenticated route transitions.
  - file:
    - `src/lib/academy.ts`

- Validation:
  - `pnpm exec eslint src/lib/academy.ts` ✅
  - `pnpm exec tsc --noEmit` ✅
  - `pnpm test:acceptance tests/acceptance/pricing.test.ts tests/acceptance/pricing-accelerator-checkout-metadata.test.ts tests/acceptance/stripe-webhook-route.test.ts` ✅
  - `pnpm test:acceptance` ✅ (71 passed, 1 skipped)
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅ (after `pnpm snapshots:update` for breadcrumb rename)
  - `pnpm test:rls` ✅
  - `pnpm build` ✅
  - `pnpm check:perf` ❌ (existing budget script issues: missing legacy route key `/(dashboard)/dashboard/page` and `/admin` first-load bundle over budget).

## 2026-02-17 — Codex hotfix (unstable_cache + cookies runtime error)

- Fixed `/accelerator` runtime error caused by calling cookie-backed `createSupabaseServerClient()` inside `unstable_cache` scope in sidebar tree fetch.
- Updated `src/lib/academy.ts`:
  - `fetchSidebarTreeUncached` now accepts an optional `clientOverride`.
  - cached published sidebar loader now always uses `createSupabaseAdminClient()` (no cookies) and returns cached result.
  - cache path is only used when `SUPABASE_SERVICE_ROLE_KEY` is present; otherwise it safely falls back to uncached per-request path.
- Validation:
  - `pnpm exec eslint src/lib/academy.ts` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex UI tweak (accelerator readiness checklist feed styling)

- Confirmed `NEXT TO REACH FUNDABLE` content is dynamic:
  - driven from `resolveAcceleratorReadiness(...)` missing criteria in `src/app/(accelerator)/accelerator/page.tsx`.
  - mapped via `buildReadinessChecklist(...)` and hidden automatically when target/checklist are empty.
- Restyled readiness block into a mini checklist feed in `src/components/accelerator/accelerator-org-snapshot-strip.tsx`:
  - per-item iconography by task type (formation, roadmap, funding/program, legal/docs).
  - compact feed rows with hover affordance, right chevron, and sequence index.
  - added item count pill for quick scan.
- Validation:
  - `pnpm exec eslint src/components/accelerator/accelerator-org-snapshot-strip.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex UI alignment fix (accelerator roadmap module card media)

- Restored requested design behavior for `RoadmapOutlineCard` module tiles in accelerator:
  - removed module media gradient/pattern treatment (had drifted back in).
  - kept existing card shell, status pill, and centered icon container.
- File:
  - `src/components/roadmap/roadmap-rail-card.tsx`
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex CTA layout tweak (accelerator continue row)

- Updated accelerator snapshot CTA row layout in `src/components/accelerator/accelerator-org-snapshot-strip.tsx`:
  - moved `CONTINUE` label to the left side,
  - removed trailing chevron icon container,
  - moved module title + icon block to the right side.
- Validation:
  - `pnpm exec eslint src/components/accelerator/accelerator-org-snapshot-strip.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex roadmap card visual tweak (active highlight + strategic icon)

- Removed persistent active highlight treatment on accelerator roadmap deliverable cards in `RoadmapRailCard` snake-grid mode (eliminated active border/ring + `aria-current` marker from card link).
- Switched center icon for accelerator roadmap deliverable cards to strategic roadmap icon (`WaypointsIcon`) so cards no longer render section-specific icons like BookOpen for this surface.
- File:
  - `src/components/roadmap/roadmap-rail-card.tsx`
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex experiment (replace module media gradient with FlutedGlass shader)

- Added Paper Design shaders package:
  - `@paper-design/shaders-react`
- Added local texture asset (no hotlink runtime dependency):
  - `public/textures/fluted-glass-flowers.webp` (downloaded from paper.design sample image)
- Updated accelerator roadmap module cards to use `FlutedGlass` as media background replacement in `RoadmapRailCard`:
  - `src/components/roadmap/roadmap-rail-card.tsx`
  - mounted via `next/dynamic` with `ssr: false` to avoid SSR/hydration issues for WebGL shader component.
  - kept existing centered icon container + status badge overlays.
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex stability fix (roadmap card media flicker from per-card WebGL shader)

- Root cause: per-card `FlutedGlass` WebGL mounts caused context churn/instability with many cards, producing intermittent blink/partial overlay application.
- Replaced per-card runtime WebGL shader in roadmap module media with deterministic CSS fluted treatment layered over the shared local image, so every card renders consistently.
- File:
  - `src/components/roadmap/roadmap-rail-card.tsx`
- Validation:
  - `pnpm exec eslint src/components/roadmap/roadmap-rail-card.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex bugfix (module completion progress + next lesson routing)

- Fixed stale module completion summary and incorrect next-lesson navigation on module completion screen.
- Root cause:
  - completion summary was derived from current module position, not actual completed module count.
  - next lesson URL used array position (`+2`) instead of stable module `idx`, which can route to the wrong module when indexes are non-contiguous.
- Updated files:
  - `src/components/training/module-detail.tsx`
    - compute/set completed module set once.
    - derive next lesson href from `nextModule.idx` with safe fallback.
    - pass `completedModuleCount` and `isCurrentModuleCompleted` to stepper.
  - `src/components/training/module-detail/module-stepper.tsx`
    - replaced positional completion metric with completion-count metric.
    - progress bar + label now show completed modules out of total.
    - preserves optimistic +1 on completion screen when current module was just completed.
  - `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`
    - include `idx` in class module payload passed into detail component.
- Validation:
  - `pnpm eslint 'src/components/training/module-detail.tsx' 'src/components/training/module-detail/module-stepper.tsx' 'src/app/(dashboard)/class/[slug]/module/[index]/page.tsx'` ✅
  - `pnpm test:acceptance` ✅

## 2026-02-17 — Codex UI fix (sidebar organization name overflow handling)

- Updated sidebar primary nav item rendering to support long organization names without clipping/breaking layout.
- File:
  - `src/components/nav-main.tsx`
- Changes:
  - organization nav row can grow vertically (`h-auto` + `min-h-8`).
  - organization label now wraps with 2-line clamp and word breaking.
  - non-organization rows retain single-line truncate behavior.
- Validation:
  - `pnpm eslint src/components/nav-main.tsx` ✅

## 2026-02-17 — Codex tester UX improvement (Autofill page first-use guide + undo)

- Upgraded tester `Autofill page` behavior in `src/components/dev/case-study-autofill-fab.tsx`:
  - added hover tooltip explaining purpose and behavior.
  - added first-use confirmation dialog with tester-focused usage guidance.
  - added per-run page snapshot + `Undo` action (via toast) to restore changed values if autofill was accidental.
  - clears undo snapshot on route change to avoid cross-page restores.
- Validation:
  - `pnpm eslint src/components/dev/case-study-autofill-fab.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex onboarding fix (uploaded photo now seeds org logo)

- Root cause: onboarding avatar upload only populated `profiles.avatar_url` and owner `org_people.image`; it did not set organization `logoUrl`, so org header/logo surfaces kept showing the `LOGO` placeholder.
- Updated:
  - `src/app/(dashboard)/onboarding/actions.ts`
  - when onboarding avatar exists and org `logoUrl` is currently empty, onboarding now seeds `organizations.profile.logoUrl` with the uploaded avatar URL.
  - existing org logos are preserved (no overwrite).
- Validation:
  - `pnpm eslint 'src/app/(dashboard)/onboarding/actions.ts'` ✅
  - `pnpm test:acceptance tests/acceptance/onboarding.test.ts` ✅

## 2026-02-17 — Codex autofill mapping fix (program/editor field accuracy)

- Addressed incorrect autofill value mapping (including tagline/subtitle collisions) and low-fill coverage in editor/program contexts.
- Updated `src/components/dev/case-study-autofill-fab.tsx`:
  - added explicit `tagline` and program-specific sample values (`programTitle`, `programSubtitle`, status/type/format/frequency/duration, numeric budget/staff/goal fields).
  - tightened matcher regexes with word boundaries to avoid accidental substring matches (e.g., `subtitle` hitting `title`).
  - made fieldset legend a fallback-only hint source (prevents cross-section hint contamination).
  - added numeric/date/month input handling for program wizard fields.
- Validation:
  - `pnpm eslint src/components/dev/case-study-autofill-fab.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex autofill + profile form polish (socials, boilerplate, website label, icon centering)

- Improved tester autofill data quality and field precision in `src/components/dev/case-study-autofill-fab.tsx`:
  - added explicit sample values for representative, EIN, socials, newsletter, website domain, and boilerplate.
  - replaced generic long-text fallback with realistic nonprofit boilerplate copy.
  - added direct field-name mapping for key org profile fields (`rep`, `ein`, `publicUrl`, socials, `boilerplate`, address fields, etc.) to prevent incorrect cross-matches.
  - expanded URL handling to correctly populate social URL fields.
- Updated Presence section copy in `src/components/organization/org-profile-card/tabs/company-tab/edit-sections/presence.tsx`:
  - `Website URL` -> `Website`
  - placeholder changed to `google.com`
  - helper text clarifies this is the organization website, not Coach House public profile URL.
- Fixed icon vertical alignment in icon-input rows by updating `InputWithIcon` in `src/components/organization/org-profile-card/shared.tsx`.
- Validation:
  - `pnpm eslint src/components/dev/case-study-autofill-fab.tsx src/components/organization/org-profile-card/tabs/company-tab/edit-sections/presence.tsx src/components/organization/org-profile-card/shared.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex UI alignment fix (icon centering + desktop form-row alignment)

- Fixed remaining icon alignment issue for icon-prefixed inputs by changing icon positioning to full-height vertical centering in:
  - `src/components/organization/org-profile-card/shared.tsx` (`InputWithIcon`)
- Fixed desktop form/title alignment drift by normalizing `FormRow` to a stable 2-column template and top alignment:
  - `src/components/organization/org-profile-card/shared.tsx` (`FormRow`)
  - uses `md:grid-cols-[minmax(180px,240px)_minmax(0,1fr)]` with `md:items-start`.
- Validation:
  - `pnpm eslint src/components/organization/org-profile-card/shared.tsx src/components/dev/case-study-autofill-fab.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex view-mode polish (stable field alignment + upgraded link presentation)

- Fixed view-mode alignment drift where field blocks could appear vertically centered in mixed-height rows.
- Updated:
  - `src/components/organization/org-profile-card/shared.tsx`
    - `ProfileField` now anchors content to start (`content-start self-start`) for consistent title-to-content spacing.
  - `src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx`
    - section grids now explicitly use `md:items-start` in view mode.
- Replaced plain icon + underlined URL presentation with a structured link card style:
  - `src/components/organization/org-profile-card/shared.tsx` (`BrandLink`)
  - each link now renders as a bordered row with icon badge, hostname title, secondary path text, and external-link affordance.
- Validation:
  - `pnpm eslint src/components/organization/org-profile-card/shared.tsx src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex UX update (FieldText read-more expansion)

- Added inline `Read more / Read less` behavior for long text fields in view mode.
- File:
  - `src/components/organization/org-profile-card/shared.tsx` (`FieldText`)
- Behavior:
  - multiline fields collapse after ~280 chars by default.
  - single-line fields collapse after ~140 chars by default.
  - users can expand/collapse in-place without leaving the section.
- Validation:
  - `pnpm eslint src/components/organization/org-profile-card/shared.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-17 — Codex spacing tweak (Brand Kit logo field)

- Increased vertical spacing between the `Logo` label and its image/link block in view mode.
- File:
  - `src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx`
- Change:
  - wrapped logo `BrandLink` with `pt-1.5` to move the image container lower under the label.
- Validation:
  - `pnpm eslint src/components/organization/org-profile-card/tabs/company-tab/display-sections.tsx` ✅

## 2026-02-18 — Codex performance pass (faster main-nav route transitions)

- Optimized server-side work on main dashboard routes to reduce nav switch latency.

### Batched avatar URL signing
- Added shared helper:
  - `src/lib/people/display-images.ts`
- Replaced per-person `createSignedUrl(...)` calls with one batched `createSignedUrls(...)` call per page render.
- Applied in:
  - `src/app/(dashboard)/people/page.tsx`
  - `src/app/(dashboard)/my-organization/page.tsx`

### Parallelized expensive `/organization` page fetches
- `src/app/(dashboard)/my-organization/page.tsx`
- Parallelized independent queries with `Promise.all(...)`:
  - programs list
  - roadmap calendar events
  - accelerator progress summary

### Removed unnecessary explicit dynamic flags on main nav pages
- Removed `export const dynamic = "force-dynamic"` from:
  - `src/app/(dashboard)/people/page.tsx`
  - `src/app/(dashboard)/my-organization/page.tsx`
  - `src/app/(dashboard)/my-organization/documents/page.tsx`
- These routes remain user-dynamic via auth/cookies, but no longer force the strictest dynamic path unnecessarily.

### Validation
- `pnpm eslint 'src/lib/people/display-images.ts' 'src/app/(dashboard)/people/page.tsx' 'src/app/(dashboard)/my-organization/page.tsx' 'src/app/(dashboard)/my-organization/documents/page.tsx'` ✅
- `pnpm exec tsc --noEmit` ✅
- `pnpm test:acceptance` ✅ (71 passed, 1 skipped)

## 2026-02-18 — Codex QA fix (`/people` autofill now opens Add Person flow)

- Fixed tester `Autofill page` behavior on `/people` where it previously no-op'd because no editable form fields are visible until the Add Person sheet opens.
- Updated:
  - `src/components/dev/case-study-autofill-fab.tsx`
- Changes:
  - Added `/people` fallback flow to:
    - open the **Add Person** sheet automatically,
    - advance step-by-step through `Continue`,
    - prefill visible inputs on each step,
    - stop before submit so testers can review and click `Add Person` manually.
  - Added safer field skipping for search/filter controls so autofill targets forms, not list filters.
  - Improved success toast copy on `/people` to clarify next action.
  - Preserved undo snapshot behavior for autofilled sheet fields.
- Validation:
  - `pnpm eslint src/components/dev/case-study-autofill-fab.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-18 — Codex UI tweak (Verified checkpoint pinned to strip endpoint)

- Moved the `Verified checkpoint` marker on Accelerator snapshot progress strip to the far-right endpoint of the bar.
- File:
  - `src/components/accelerator/accelerator-org-snapshot-strip.tsx`
- Implementation:
  - switched marker positioning from dynamic `left: ${verified}%` with `-translate-x-1/2` to fixed endpoint anchor `right-0` with `translate-x-1/2`.
  - this keeps the marker centered on the 100% endpoint.
- Validation:
  - `pnpm eslint src/components/accelerator/accelerator-org-snapshot-strip.tsx` ✅

## 2026-02-18 — Codex UX copy tweak (snapshot progress pill now percentage)

- Updated the Accelerator snapshot progress pill to show numeric percent instead of readiness word labels.
- File:
  - `src/components/accelerator/accelerator-org-snapshot-strip.tsx`
- Details:
  - pill text now renders `progressPercent` as `${progress}%`.
  - readiness state is retained as the pill color treatment and tooltip title (`Readiness: Building/Fundable/Verified`).
- Validation:
  - `pnpm eslint src/components/accelerator/accelerator-org-snapshot-strip.tsx` ✅

## 2026-02-18 — Codex alignment polish (verified marker flush-right)

- Adjusted the `Verified checkpoint` marker position so it no longer overhangs the progress strip by half its width.
- File:
  - `src/components/accelerator/accelerator-org-snapshot-strip.tsx`
- Change:
  - removed `translate-x-1/2` from the verified marker class while keeping `right-0`.
  - result: marker right edge now aligns flush with the strip endpoint, matching right-aligned progress pill edge.
- Validation:
  - `pnpm eslint src/components/accelerator/accelerator-org-snapshot-strip.tsx` ✅

## 2026-02-18 — Codex pricing-sync pass (My Organization `Formation Status` card)

- Updated `launch-roadmap` card to align with current 3-tier model and remove outdated tier language.
- File:
  - `src/app/(dashboard)/my-organization/page.tsx`
- Changes:
  - replaced legacy `Free modules` + `Paid electives` sections with a unified roadmap module list.
  - added plan-aware messaging:
    - free plan: shows formation modules + upgrade prompt for additional accelerator modules.
    - paid plans: shows included modules across formation + accelerator preview.
  - card description updated to reflect formation + accelerator progress in one place.
  - free-plan primary CTA now routes to in-app upgrade paywall (`?paywall=organization&plan=organization...`) instead of generic continue.
  - added plan-tier resolution from active org subscription (`resolvePricingPlanTier`) for card behavior.
- Validation:
  - `pnpm eslint 'src/app/(dashboard)/my-organization/page.tsx'` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-18 — Codex layout contract pass (Programs card fixed frame + stable empty state)

- Standardized the `Programs` dashboard card display contract so empty and populated states keep the same frame behavior across screen sizes.
- File:
  - `src/components/organization/program-builder-dashboard-card.tsx`
- Changes:
  - introduced explicit card frame constraints:
    - `min-h-[460px] md:min-h-[500px] xl:min-h-[540px]`
    - `max-h-[760px]`
    - `overflow-hidden` with full-height flex layout.
  - made content region fixed/scroll-contained:
    - card content uses `flex-1 min-h-0 overflow-hidden`.
    - populated state grid now fills full card height (`h-full min-h-0`).
    - left list panel and right detail panel use internal `overflow-y-auto` so long content scrolls inside the card, not by stretching the card.
  - empty state now fills the same content frame (`h-full w-full`) to match populated-state dimensions.
  - class merge order updated so this card’s sizing contract wins over incoming min-height utility classes.
- Validation:
  - `pnpm eslint src/components/organization/program-builder-dashboard-card.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-18 — Codex follow-through (stable frame contract for Calendar + Formation cards)

- Continued from interrupted layout-consistency work by applying the same fixed-frame pattern used on Programs to support cards on My Organization.
- Files:
  - `src/app/(dashboard)/my-organization/page.tsx`
  - `src/components/organization/my-organization-bento-rules.ts`
- Changes:
  - Added shared support-card frame/content classes in My Organization page:
    - `DASHBOARD_SUPPORT_CARD_FRAME_CLASS`
    - `DASHBOARD_SUPPORT_CARD_CONTENT_CLASS`
  - Applied fixed frame + overflow contract to:
    - `calendar` card
    - `launch-roadmap` (Formation Status) card
  - Anchored Calendar action row (`Add event`) to bottom via `mt-auto` for consistent vertical rhythm.
  - Formation Status card now uses internal scroll area for module list content so card height stays stable while CTA/footer remains anchored.
  - Updated bento rule description for launch roadmap card to remove outdated temporary wording.
- Validation:
  - `pnpm eslint 'src/app/(dashboard)/my-organization/page.tsx' src/components/organization/my-organization-bento-rules.ts` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-18 — Codex modal positioning fix (Program Wizard centered on desktop)

- Fixed Program Wizard dialog positioning so it opens centered on larger screens.
- File:
  - `src/components/programs/program-wizard.tsx`
- Root cause:
  - desktop layout used `sm:inset-6`, which anchored the dialog to viewport edges rather than true center coordinates.
- Change:
  - kept mobile bottom-sheet behavior (`left/right=0`, `bottom=0`, no translate).
  - switched `sm+` to explicit centered modal positioning:
    - `sm:left-1/2 sm:top-1/2 sm:right-auto sm:bottom-auto`
    - `sm:-translate-x-1/2 sm:-translate-y-1/2`
    - retained large modal dimensions (`sm:h-[90svh]`, responsive width cap).
- Validation:
  - `pnpm eslint src/components/programs/program-wizard.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-18 — Codex UX polish (Program Wizard copy + Autofill layering)

- Improved awkward Program Wizard opener copy in step 1:
  - `src/components/programs/program-wizard.tsx`
  - `Name it` → `Program name`
  - `What is this program, in plain language?` → `Give this program a clear name and one-sentence summary.`
  - header eyebrow `Program builder` → `Program setup`
- Fixed Autofill control being hidden behind dialogs:
  - `src/components/dev/case-study-autofill-fab.tsx`
  - raised floating control z-index from `z-40` to `z-[70]` so it remains clickable above `Dialog` overlays/content (`z-50`).
- Validation:
  - `pnpm eslint src/components/programs/program-wizard.tsx src/components/dev/case-study-autofill-fab.tsx` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-18 — Codex calendar nav restore (My Organization card)

- Restored previous/next month chevron controls in the My Organization calendar card.
- File:
  - `src/app/(dashboard)/my-organization/page.tsx`
- Changes:
  - added month query parsing (`month=YYYY-MM`) and formatting helpers.
  - added query-preserving month navigation helper so existing params are retained when paging months.
  - added left/right chevron icon buttons with accessible labels (`Show <Month Year>`).
  - calendar now anchors to selected month when `month` query is present.

## 2026-02-18 — Codex Formation card status polish (electives marked optional)

- Updated Formation Status card badges so elective modules display `Optional` instead of `Not started` when untouched.
- File:
  - `src/app/(dashboard)/my-organization/page.tsx`
- Changes:
  - added module-aware badge label/class helpers.
  - elective + `not_started` now renders as `Optional` with neutral-info styling.
  - completed/in-progress modules retain existing labels/colors.
- Validation:
  - `pnpm eslint 'src/app/(dashboard)/my-organization/page.tsx'` ✅
  - `pnpm exec tsc --noEmit` ✅

## 2026-02-18 — Codex release preflight + production deploy

- Ran full preflight on current working tree before deploy:
  - `pnpm exec tsc --noEmit` ✅
  - `pnpm lint` ✅
  - `pnpm test:snapshots` ✅
  - `pnpm test:acceptance` ✅ (71 passed, 1 skipped)
  - `pnpm test:rls` ✅
  - `pnpm build` ✅
- Deployed production via Vercel:
  - `npx vercel deploy --prod --yes` ✅
  - deployment URL: `https://coach-house-platform-75b1qy1nq-caleb-hamernicks-projects.vercel.app`
  - aliased URL: `https://coach-house-platform.vercel.app`
- Post-deploy smoke status checks:
  - `200 /`
  - `200 /home-canvas`
  - `200 /organization`
  - `200 /people`
  - `307 /accelerator` (auth/paywall redirect expected)
  - `200 /pricing`
  - `200 /tester/sign-up`
