NEXTJS_RUNBOOK.md — Instructions-only

Goal: Instant-feeling Next.js (App Router) + shadcn LMS via correct caching, streaming, minimal client JS, and solid DX.
Mode: Execute steps sequentially in CLI; no code in this runbook. Each step links to canonical docs.

Stack baseline: Next.js 16.0.1 with React 19.1.0. Dev + prod builds use Turbopack; align guidance with this baseline before adopting new tooling.

## Checklist Status (2025-10-22)

- [x] 0) Preflight & Baseline — `npm run build` + `npm run check:perf` run under Turbopack. Current first-load JS over budget: `/dashboard` 1472.9 KB (target 750 KB), `/admin` 641.8 KB (target 400 KB). Track remediation in Step 7.
- [x] 1) TypeScript & Lint Hardening — strict mode is enabled in `tsconfig.json` and Next’s lint rules are active.
- [x] 2) Global Performance Configuration — `reactStrictMode` on, powered-by header disabled, and `modularizeImports` keeps lucide imports tree-shaken under Turbopack.
- [ ] 3) Caching Model (Static-by-Default) — audit partially logged; re-verify after recent content refactors.
- [ ] 4) Data Fetching Strategy (RSC-first) — client fetch remnants pending catalog.
- [ ] 5) Streaming UX — loading states exist for class/module dashboards; verify remaining segments before closing.
- [ ] 6) Navigation & Prefetch — confirm prefetch strategy + disabled cases.
- [ ] 7) Client JS Budget & Code-Splitting — ongoing. Current `/dashboard` first-load JS: 738.7 KB (under the 750 KB cap) after deferring Sonner and replacing Radix-driven nav elements; `/admin` remains 608.7 KB and needs further trimming.
- [ ] 8) Fonts — assess next/font rollout (currently mixed usage).
- [ ] 9) Images — final pass to confirm `next/image` coverage (legacy admin assets remain).
- [x] 10) Edge vs. Node Runtimes — runtime assignments documented; revisit after Supabase client consolidation.
- [ ] 11) Route Handlers & Revalidation Hooks — mutation audit largely complete; cross-check new programs endpoints.
- [ ] 12) Analyzer Pass & Acceptance Gates — rerun once budgets back under caps; add Turbopack profile snapshots.
- [ ] 13) Optional: Partial Prerendering (PPR) — blocked pending Turbopack readiness + component cache review.


0) Preflight & Baseline


Confirm App Router setup and create a clean build to baseline bundle sizes.
Run `npm run build` followed by `npm run check:perf` to snapshot current bundle budgets before modifying code.
Docs: App Router Getting Started nextjs.org+1



1) TypeScript & Lint Hardening


Enable strict TS and core web vitals lint rules; fix any violations before continuing.
Docs: Installation & project setup (TS/ESLint) nextjs.org



2) Global Performance Configuration


Review framework-level perf options (minification, static asset headers, import optimization).
Docs: Getting Started index, configuration overview nextjs.org



3) Caching Model (Static-by-Default)


Audit each route: prefer static with revalidation; mark truly dynamic routes explicitly.
Marketing surfaces (e.g., `/pricing`) should lean on ISR, while authed dashboards stay `cache: "no-store"` to respect Supabase session reads.
Record per-route caching decisions in `/docs/runlog.md` and include revalidate intervals for `/pricing`, `/community`, and any other static marketing pages so the perf budget stays enforceable.


Adopt tag-based revalidation for CMS/data updates.
Docs: Caching & Revalidating (guide) nextjs.org
Docs: Caching & Revalidating (getting started) nextjs.org
Deep dive: Maintainer discussion on App Router caching heuristics GitHub
Verify every mutation triggers at least one precise tag: audit `src/app/(admin)/admin/classes/actions.ts`, `src/app/(dashboard)/my-organization/programs/actions.ts`, `src/app/api/admin/classes/[id]/modules/route.ts`, and `src/app/api/modules/[id]/assignment-submission/route.ts` so class, module, and program dashboards refresh immediately after writes.



4) Data Fetching Strategy (RSC-first)


Move reads to Server Components; keep client components interactive only.
Reuse the typed Supabase helpers in `src/lib/supabase/**` so server and client callers stay consistent and session-aware.


Use the framework’s caching and revalidation semantics for fetch.
Docs: Data fetching, caching, revalidating (App Router) v14/13 references nextjs.org+1
Catalog legacy client-side fetches (marketing/community loaders) and migrate them to server helpers so they inherit shared caching, tagging, and Supabase session handling.



5) Streaming UX


Add loading UIs per segment; wrap slow subtrees with Suspense for progressive rendering.
Ensure every critical segment ships a sibling `loading.tsx` (dashboard shell, class detail, module detail) with skeletons that mirror the final layout.
Docs: Loading UI & Streaming (API/file convention) nextjs.org
Learn: Streaming module in official tutorial nextjs.org
Alt doc mirror: Loading UI & Streaming overview nextjs.im



6) Navigation & Prefetch


Ensure link prefetch remains enabled; prefetch critical routes for perceived speed on slow networks.
Docs: Linking and Navigating (prefetching, client transitions) nextjs.org



7) Client JS Budget & Code-Splitting


Identify heavy client-only widgets (charts/editors/maps); lazy-load them; avoid wildcard imports.
Wrap Mapbox in `src/components/community/community-map.tsx` behind `next/script` or a guarded dynamic import so the marketing build excludes map code until interaction.


Verify per-page JS stays within your target budget using the analyzer output.
Docs: Getting Started (performance concepts) nextjs.org



8) Fonts


Switch to next/font for zero network font requests and no layout shift; prefer variable fonts.
Docs: Font Optimization (App Router Getting Started) nextjs.org
Docs: Optimizing Fonts (build-time, local/google) nextjs.org
Learn: Optimizing fonts lesson nextjs.org
Background: next/font rationale (Vercel blog) Vercel



9) Images


Replace legacy <img> with the framework image component; set responsive sizes for above-the-fold vs. below-the-fold media.
Learn: Optimizing images lesson (paired with fonts) nextjs.org



10) Edge vs. Node Runtimes


Prefer Edge for read-heavy, compute-light routes; fall back to Node when incompatible dependencies exist.
Docs: App Router (runtime capabilities overview) nextjs.org
Evaluate `/src/app/(public)/community/page.tsx` and other marketing pages for Edge runtime eligibility; document any Node holds (e.g., Supabase admin mutations) directly in the route file comments.
Record runtime decisions in `/docs/runlog.md`: marketing/community stay on Edge with static data fetchers; Node-only for admin dashboards, Supabase-authenticated routes, and any handler relying on Node APIs (Stripe webhooks, file uploads).



11) Route Handlers & Revalidation Hooks


Centralize mutations in Route Handlers and trigger revalidation by tag after writes.
Docs: Caching & Revalidating (mechanics and APIs) nextjs.org+1
Backfill revalidation calls for class/module wizard flows and assignment submission handlers so student dashboards, admin tables, and marketing shells receive fresh data without manual refresh.



12) Analyzer Pass & Acceptance Gates


Rebuild with analysis; verify:


Every route has loading UI and/or Suspense.


Fonts via next/font; no external font CSS.


Images use the image component with sizes.


Per-page client JS within budget; largest chunk reduced vs. baseline.
After the build completes, run `npm run check:perf` so the automated budget script validates `/dashboard` and `/admin` bundle sizes.
Docs: Getting Started (build/analyze entry points) nextjs.org





13) Optional: Partial Prerendering (PPR)


Evaluate PPR for routes with stable shells and dynamic islands to further reduce TTFB.
Docs: App Router (feature index; check current status from Getting Started hub) nextjs.org+1



14) Learning Tracks & External References


Official learn course sections on streaming and optimization for a hands-on pass. nextjs.org+1


Third-party explainer on streaming concepts (use as a mental model only). DEV Community



15) What to Execute, Step-by-Step (no code)


Baseline a clean build and open the analyzer output. nextjs.org


Enforce strict TS and lint; resolve issues. nextjs.org
Run `npm run lint -- --cache` until warnings are zero; remove legacy wizard directives and unused test helpers that surface during the cached lint sweep.


Align global config for performance (minification, headers, import optimization). nextjs.org


Convert routes to static with revalidation where possible; list truly dynamic routes and why. nextjs.org


Centralize data fetching server-side; adopt tag-based revalidation. nextjs.org+1


Add loading UIs per segment; wrap heavy subtrees in Suspense. nextjs.org+1


Identify heavy client components; lazy-load and trim imports; re-analyze bundle. nextjs.org


Migrate fonts to the built-in system; confirm no layout shift. nextjs.org+1


Migrate images to the image component with responsive sizes. nextjs.org


Review navigation prefetch and slow-network patterns. nextjs.org


Assign Edge runtime where applicable; retest. nextjs.org


Rebuild; confirm acceptance gates met; document deltas.



Primary hub (bookmark): Next.js App Router Getting Started nextjs.org


16) Advanced Caching & Revalidation (Do This Exactly)


Use fetch with next: { revalidate, tags } for all server reads. Tag responses by data domain (e.g., "classes", "modules:ID").


Trigger revalidateTag/revalidatePath after writes in Route Handlers/Server Actions. Keep tags small and specific.
Docs: Caching, Tags, Revalidation nextjs.org+1


Wrap pure, expensive lookups in cache() at module scope (RSC only). Memoize by stable inputs; do not use in client.
Docs: Data caching helpers (cache()) nextjs.org



17) Server Actions for Writes


Prefer Server Actions (use server) for mutations. Validate inputs, write, then revalidateTag on affected domains.


Use optimistic UI on the client; never expose secrets in actions. Co-locate small actions with components to reduce JS.
Docs: Server Actions (App Router) nextjs.org



18) Images: LCP-first Settings


Use next/image everywhere; set sizes for responsive layouts. Mark the LCP image priority and set fetchPriority="high".


Blur placeholder for above-the-fold media; reserve space to avoid CLS; avoid layout fill without explicit container size.
Docs: Image Optimization (App Router) nextjs.org



19) Link Prefetch Tuning


Leave prefetch on by default. Manually prefetch critical flows (router.prefetch) after idle/visibility.


Disable prefetch for large, rarely visited routes to avoid network flood on slow links.
Docs: Linking & Navigating (prefetch) nextjs.org



20) Third‑Party Scripts (next/script)


Load scripts with correct strategy (beforeInteractive/afterInteractive/lazyOnload). Inline tiny configs only.


Isolate heavy 3P where possible (e.g., Worker/Partytown) and defer until interaction. Remove unused SDKs.
Docs: next/script, Third‑party best practices nextjs.org



21) Static Params & Partial Prerendering


Use generateStaticParams to prebuild common dynamic paths; combine with ISR for freshness.


Evaluate PPR for stable shells + dynamic islands; measure TTFB and LCP deltas before enabling globally.
Docs: generateStaticParams, PPR nextjs.org+1



22) Middleware Cost & Guardrails


Keep middleware tiny (string checks, URL rewrites only). Avoid fetching or importing heavy libs in middleware.


Prefer Route Handlers + headers/cookies over middleware when possible. Measure added latency.
Docs: Middleware (Edge) nextjs.org



23) Concrete Budgets & Gates (Enforce)


LCP ≤ 2.5s on mid‑range mobile; TTI ≤ 4s; per‑route JS ≤ 150KB gzip (initial), ≤ 250KB total.


Require: loading.tsx per segment; next/font only; next/image only; analyzer regression check in CI.


Record budgets in PRs and docs/changelog; fail CI on regressions.
Automated guard: `scripts/check-performance-budgets.mjs` enforces uncompressed first-load budgets (currently 750KB for `/dashboard`, 400KB for `/admin`, roughly aligning with the 150KB/80KB gzip targets).


24) Repo Tooling Quick Reference


Mirror CI locally with `npm run lint`, `npm run test:snapshots`, `npm run test:acceptance`, and `npm run test:rls` whenever Next.js behavior changes.


Use `npm run check:perf` after each `next build` to surface bundle regressions; update `scripts/check-performance-budgets.mjs` if route keys change.


Log notable findings (bundle deltas, caching decisions, regressions) in `docs/RUNLOG.md` so future runs start from a known baseline.

25) Legacy Refactor Edge Cases (Keep This List Updated)


Supabase return typing | Call `.maybeSingle<T>()` / `.returns<T>()` whenever the query shape shrinks or joins; avoid `as` casts. Applies to admin classes, billing, community queries, dashboard cards, modules service, user admin lists.


Server actions | `LessonCreationWizard` always receives a `(FormData) => Promise<{ id?: string; error?: string }>` handler. Wrap class/module editors to fan out to `createClassWizardAction(formData)` or `updateClassWizardAction(classId, payload)` as needed.


Program wizard schema gaps | Local `ProgramRecord` + permissive action payloads keep the wizard working while Supabase types catch up. Normalize nullable fields when hydrating UI state.


Component API drift | Remove legacy props (`BrandLink icon`, `SelectTrigger required`), normalise option arrays, and guard optional titles (ProgramCard, ProgramCard wizard) to satisfy stricter components.


Media & mapping | Replace raw `<img>` tags with `next/image`; for Mapbox toggles use `disableRotation()` instead of the removed `enableRotation(false)`.


Editor interoperability | Tiptap 3 no longer accepts the boolean second arg in `setContent`; call `editor.commands.setContent(value)` only.


Generated schema & shared types | Schema files must import via `../json` / `../enums` and expose table types through `tables/index.ts` so the top-level Supabase types compile.


Record this checklist in `docs/RUNLOG.md` when you fix a new edge case so future refactors start with verified patterns.


26) Lightning-Speed Operational Checklist


Measure & budget | Export `reportWebVitals` to log metrics, wire RUM (Vercel Analytics/Sentry), keep `scripts/check-performance-budgets.mjs` aligned with observed data, and snapshot builds with `next build --profile`.


Static-first strategy | For marketing/SEO routes (`/`, `/pricing`, `/community`, `/[org]` when public) set `revalidate`/`generateStaticParams`, precompute metadata, and document caching choices in `docs/RUNLOG.md`.


Data fetching & caching | Tag every server fetch (`fetch` with `{ next: { revalidate, tags } }`), centralize Supabase reads in helpers, and prefer `revalidateTag` over broad `revalidatePath` in mutations.


Streaming UX | Ensure each slow segment has `loading.tsx` + Suspense wrappers; adopt placeholder data or progressive rendering for dashboard cards, community map/list, admin wizard fetches.


Client JS diet | Run `next build --analyze`, lazy-load heavy widgets (charts/maps/editors) with `dynamic()`, prune unused shadcn/ui modules, and validate per-route JS budgets after each change.


Fonts & media | Use `next/font` for all typography (with fallbacks) and `next/image` with accurate `sizes`, `priority`, and `loading` hints; preload favicons/icons when not handled by the font stack.


Partial prerendering | Evaluate PPR for `/dashboard`, `/admin/classes/[id]`, `/class/[slug]` shells; measure TTFB/LCP before enabling; combine with `dynamic = "force-dynamic"` only where unavoidable.


Runtime assignment | Explicitly set `export const runtime` (`"edge"` vs `"nodejs"`), keep marketing/community read-only routes on Edge, and document Node-only reasons (Supabase admin, Stripe) in code + run log.


Route handlers & mutations | Validate inputs (Zod), execute via server actions/route handlers, wrap Supabase writes safely, emit precise `revalidateTag`/`revalidatePath`, and guard Stripe webhooks with idempotent keys.


Prefetch & navigation | Leave link prefetch on, manually `router.prefetch` high-value flows post-idle, and use optimistic UI (`useTransition`) for client actions (program wizard autosave, publish toggles).


Middleware & headers | Keep middleware minimal, add security headers (CSP, Referrer-Policy) via `next.config.js` or route handlers, and avoid heavy imports/fetches in middleware.


Observability | Add `instrumentation.ts` OpenTelemetry hooks, route logs through a structured logger, and monitor cache hit rates, revalidation counts, and web-vital regressions.
