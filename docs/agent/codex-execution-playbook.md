# Codex Execution Playbook

Use these prompt templates for deterministic, non-breaking implementation passes.

## Always-On Execution Contract

- Applies by default whenever Codex is working on UI, feature, or product development.
- Do not wait for extra prompting to follow these steps:
  1. Ensure local hooks are configured in active clones (`pnpm setup:hooks` once per clone).
  2. If this is a new feature, scaffold first via `pnpm scaffold:feature <kebab-name>`.
3. Keep route files in `src/app/**` composition-only; place domain logic in feature/lib/server layers.
4. Reuse shared UI primitives (shadcn/ui + local wrappers) instead of introducing one-off controls.
5. Validate via `pnpm check:quality` before considering work complete.
6. Log exact changes and validation in `docs/RUNLOG.md`.
- Only skip implementation behavior when the user explicitly requests planning, brainstorming, or analysis-only output.

## 1) Refactor Pass Template

```md
Goal: [single concrete objective]
Scope: [explicit folders/files]
Non-goals: [what not to touch]

Constraints:
- Follow AGENTS.md + docs/agent/**
- No route/path changes
- No API response shape changes
- Prefer shadcn/ui primitives over custom one-off UI
- Keep files <= 500 LOC unless allowlisted
- Respect lint structure/complexity gates (`max-lines`, `max-lines-per-function`, `complexity`) for `src/**`
- Respect route entrypoint contract gate (`pnpm check:routes`) before requesting review
- Respect feature-slice contract gate (`pnpm check:features`) before requesting review
- Respect scaffold-contract sync gate (`pnpm check:feature-scaffold`) before requesting review
- Respect threshold regression gate (`pnpm check:thresholds`) before requesting review
- Respect import boundary gate (`pnpm check:boundaries`) before requesting review
- Respect workspace storage boundary gate (`pnpm check:workspace-storage`) before requesting review
- Do not introduce pure re-export same-name shim files (`foo.tsx` next to `foo/`); use `foo/index.ts` instead unless explicitly allowlisted

Execution:
1. Show a 3-7 step plan.
2. Implement in small batches.
3. Run: pnpm lint && pnpm check:structure && pnpm check:routes && pnpm check:features && pnpm check:feature-scaffold && pnpm check:thresholds && pnpm check:boundaries && pnpm check:workspace-storage && pnpm test:snapshots && pnpm test:acceptance && pnpm test:rls
4. If UI/runtime changes, run pnpm build && pnpm test:visual && pnpm check:perf.
5. Append a RUNLOG entry.

Output:
- Files changed
- Risk notes
- Validation results
- Clear next batch (if any)
```

## 2) UI Consistency Pass Template

```md
Goal: Replace drifted controls with system components.

Rules:
- Default to `@/components/ui/button` for actions.
- Raw `<button>` allowed only for semantic controls (sortable headers, roving-tabindex, drag handles) where primitive Button semantics are not a fit.
- Preserve aria labels, keyboard behavior, and disabled/loading behavior.
- Avoid visual one-offs unless backed by a reusable variant.

Validation:
- Lint and acceptance tests must pass.
- Visual regression tests must pass for touched public surfaces (`pnpm test:visual`).
- Call out remaining raw button exceptions by file path.
```

## 3) Scale-Readiness Pass Template

```md
Goal: Improve scale safety without feature churn.

Required checks:
- CI parity with required gates
- Structure guards enforced
- Import boundaries enforced
- Visual regression gate enforced
- Performance budgets aligned to real route keys
- No broken test gates

Deliver:
- What blocks scale today
- Exact fixes applied
- Remaining gaps with severity (high/medium/low)
```

## 4) Feature Implementation Template

```md
Goal: Build feature <name> without introducing structural drift.

Execution:
1. Scaffold base: pnpm scaffold:feature <kebab-name>
2. Keep business logic in src/features/<name>/lib and server actions in src/features/<name>/server.
3. Keep route files composition-only wrappers in src/app/**.
4. Validate with pnpm check:quality.
```

## Stop Rules

- Do not invent follow-up work once current objective and validation gates are complete.
- Open new tasks only when:
  - a required gate fails,
  - a contract rule is violated, or
  - the user explicitly expands scope.
- Do not raise structural/complexity thresholds unless the user explicitly requests it and the change is logged in `docs/RUNLOG.md`.
