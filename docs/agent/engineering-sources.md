# Engineering Sources (Guardrails Baseline)

Primary references used to define enforceable guardrails in this repo.

## Architecture + Server/Client boundaries

- Next.js App Router docs: https://nextjs.org/docs/app
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components

Why we use this:
- Confirms App Router route conventions and server-first defaults.
- Supports our contract to keep heavy logic server-side and keep client boundaries close to interactive leaves.

## Import boundary enforcement

- ESLint `no-restricted-imports`: https://eslint.org/docs/latest/rules/no-restricted-imports
- Nx module boundary rationale: https://nx.dev/features/enforce-module-boundaries

Why we use this:
- Confirms import restriction patterns as an enforcement mechanism.
- Reinforces architecture-level dependency constraints to avoid cross-layer drift.

## Visual regression testing

- Playwright visual comparisons (`toHaveScreenshot`): https://playwright.dev/docs/test-snapshots

Why we use this:
- Provides deterministic screenshot-baseline workflow and CI comparison behavior.

## Scaffolding and consistency

- Nx code generation overview: https://nx.dev/features/generate-code

Why we use this:
- Supports generator-based scaffolding as a standard way to enforce structure and reduce ad hoc drift.

## CI branch quality gates

- GitHub required status checks troubleshooting: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks
- GitHub protected branches and required status checks: https://docs.github.com/enterprise/admin/guides/developer-workflow/about-protected-branches-and-required-status-checks

Why we use this:
- Confirms required checks as merge blockers and operational details for reliable CI enforcement.

## Code ownership enforcement

- GitHub CODEOWNERS documentation: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners

Why we use this:
- Enables deterministic review ownership over core system surfaces (`src/components/ui/**`, `docs/agent/**`, and workflow config).
