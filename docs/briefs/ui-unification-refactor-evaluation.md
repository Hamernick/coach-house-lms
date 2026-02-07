# UI Unification Refactor Evaluation

Date: 2026-02-06  
Scope: evaluate current UI entropy and define a practical unification plan without blocking shipping.

## Executive Summary

The product works, but the UI system is split across multiple visual dialects:

- Marketing (`/`, `/home2`, `/home-canvas`) is expressive, motion-heavy, and card-first.
- App surfaces (`/my-organization`, `/roadmap`, `/accelerator`) are shell-first and utility-dense.
- Prototype/demo artifacts remained in-tree and increased noise for future work.

Result: perceived inconsistency, duplicated styling decisions, and slower iteration.

## Findings

## 1) Visual Language Drift

- Typography is mixed (`Inter`, `Sora`, `Space_Grotesk`, `Fraunces`) depending on route/component.
- Card geometry varies widely (`rounded-2xl`, `rounded-[26px]`, `rounded-[32px]`) without a tier system.
- Motion styles are mixed (Framer Motion transitions, CSS utility animations, scroll-reveal effects) with no shared motion scale.

Impact: pages feel designed independently rather than as one product.

## 2) Token Discipline Is Partial

- Shell tokens exist (`--shell-*`) and are strong in app layouts.
- Marketing components often use direct classes and one-off values in parallel with tokens.

Impact: hard to keep spacing, surfaces, and interaction states consistent.

## 3) Surface Architecture Is Fragmented

- Active shell components are strong (`src/components/app-shell.tsx`, `src/components/ui/sidebar/**`).
- Legacy/prototype surfaces existed in active tree (`dashboard-01-demo`, old shadcn demo component).

Impact: contributors have too many references and can pick the wrong baseline.

## 4) Documentation Is Inconsistent

- Canonical log is `docs/RUNLOG.md`, but legacy references still pointed to lowercase `docs/runlog.md` or root `runlog.md`.

Impact: drift in process and onboarding context.

## Refactor Goals

- One visual system across marketing + app (same tokens, radius scale, spacing cadence, motion rules).
- One shell model for authenticated experiences.
- One component decision path (use existing primitives first, then extend).
- One source of truth for logs and UI governance docs.

## Proposed Plan (Phased)

1. Baseline and freeze (1 day)
- Freeze new stylistic one-offs.
- Snapshot current key screens (public home, pricing, dashboard, roadmap, accelerator, admin).

2. Token unification (2 to 3 days)
- Define explicit scales in `src/app/globals.css` for:
  - typography tokens
  - radius tokens
  - spacing tokens
  - motion durations/easing
- Replace one-off values on top-level layout components first.

3. Shell convergence (2 days)
- Treat `src/components/app-shell.tsx` + `src/components/ui/sidebar/**` as canonical.
- Remove shell-level divergence in route-specific wrappers.

4. Marketing convergence (2 to 4 days)
- Keep expressive style, but bind it to shared tokens.
- Normalize CTA/button/card variants to shared primitives.

5. Cleanup and guardrails (1 day)
- Continue archiving non-runtime prototypes under `deprecated/**`.
- Add a short PR checklist section: typography/radius/token/motion compliance.

## Success Criteria

- No new direct pixel/radius/color one-offs in layout primitives.
- Public + app pages share a documented token scale.
- Dashboard shell and marketing header/components feel intentionally related.
- Reduced UI churn in RUNLOG entries (fewer one-off polish patches).

## File Targets (First Pass)

- `src/app/globals.css`
- `src/components/app-shell.tsx`
- `src/components/ui/sidebar/layout.tsx`
- `src/components/public/home2-sections.tsx`
- `src/components/public/public-header.tsx`
- `docs/agent/ui-rubric.md`

## Risks

- Over-refactoring can stall feature velocity.
- Marketing polish may regress if tokenization is done without visual QA.

Mitigation: phase by surface, keep PRs small, and validate against captured screenshots each step.
