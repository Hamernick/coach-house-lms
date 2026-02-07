# Launch Organizer (Concise)

Updated: 2026-02-07

Purpose: single launch board with clear `Done` and `Pending` checklists.

Legacy full notes: `deprecated/docs/organize-legacy-2026-02-07.md`

## Canonical Docs
- `docs/organize.md` (this file): launch status board
- `docs/briefs/accelerator-launch-active-worklog.md`: active execution queue
- `docs/briefs/INDEX.md`: brief relevance/status map
- `docs/RUNLOG.md`: chronological implementation log

## Pending (P0)
- [ ] Set Vercel prod envs: Supabase, Stripe keys, price IDs, coaching links, `NEXT_PUBLIC_SITE_URL=https://coachhouse.vercel.app`.
- [ ] Confirm Stripe webhook target + secret in prod: `/api/stripe/webhook`.
- [ ] Apply all Supabase migrations in production.
- [ ] Run launch gates: `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls`.
- [ ] Run prod smoke pass: auth, onboarding, `/my-organization`, `/accelerator`, checkout, webhook fulfillment, coaching CTA links.
- [ ] Calendar parity pass: unify accelerator module calendar UI/spacing with `/my-organization` calendar pattern.
- [ ] Finalize docs security pass: CSP/headers, webhook/auth rate limits, storage/public bucket review.
- [ ] Fill `docs/DB_SCHEMA.md` from current migrations.

## Pending (P1)
- [ ] Finalize formation/fundable/verified criteria implementation against uploaded evidence.
- [ ] Complete coaching entitlement UX rules (free sessions -> discounted/full links).
- [ ] Complete roadmap/module polish backlog (continue flow, editor quirks, re-entry edge cases).
- [ ] Finish org chart hierarchy UX (dense layouts, drag stability, clear category grouping).
- [ ] Remove or archive remaining legacy dashboard/admin surfaces not used in v1.

## Engineering Refactor Queue (from current audit)
- [ ] Split large files into smaller feature units: `src/components/programs/program-wizard.tsx` (~1374), `src/components/training/module-detail/assignment-form.tsx` (~974), `src/components/onboarding/onboarding-dialog.tsx` (~958), `src/components/roadmap/roadmap-editor.tsx` (~902), `src/app/(dashboard)/my-organization/page.tsx` (~824).
- [ ] Unify calendar UI/component contract: `/my-organization` uses a bespoke mini calendar while roadmap/accelerator uses `RoadmapCalendar`; extract a shared card/surface layer.
- [ ] Remove stale `/roadmap` links (`/roadmap` root is no longer a route) and standardize to `/accelerator/roadmap` or `/roadmap/[slug]` where appropriate.
- [ ] Consolidate public home variants (`/home`, `/home2`, `/home-canvas`) behind one canonical surface and mark legacy routes explicitly.

## Done (recent)
- [x] `/` now serves the home-canvas experience (with pricing panel + section query behavior).
- [x] Prior root/home2 landing variant archived at `deprecated/artifacts/public-pages/root-home2-legacy.tsx`.
- [x] Stripe pricing lifecycle updated to exact totals (`$49.90 x10`, `$34.90 x10`) and tests/docs updated.
- [x] Stripe test catalog bootstrap script added (`scripts/setup-stripe-test-prices.sh`).
- [x] Stripe webhook setup script added (`scripts/setup-stripe-webhook.sh`).
- [x] Domain/webhook switched to `coachhouse.vercel.app` and old webhook removed.
- [x] Main branch deploy blockers fixed (TypeScript/build pass) and pushed (`fb077bb`).

## Docs Relevance Triage
Keep active:
- `docs/briefs/accelerator-launch-active-worklog.md` (2026-02-07)
- `docs/briefs/accelerator-launch-mvp-sprint.md` (2026-02-07)
- `docs/briefs/accelerator-launch-system-unification.md` (2026-02-07)
- `docs/briefs/accelerator-readiness-criteria-and-journey.md` (2026-02-07)
- `docs/briefs/stripe-gating.md` (2026-02-07)
- `docs/briefs/INDEX.md` (2026-02-07)

Archive candidates (likely stale; review before deletion):
- `docs/updates_edits.md` (2026-01-12)
- `docs/PERFORMANCE-PLAN.md` (2025-12-29)
- `docs/Pilot Program Design Questions.md` (2025-12-29)

## Next Cleanup Rule
- Keep new launch decisions in `docs/organize.md`.
- Keep implementation details in `docs/RUNLOG.md`.
- Keep feature specs in briefs only when still active.
- Archive superseded docs in `deprecated/docs/` instead of deleting.
