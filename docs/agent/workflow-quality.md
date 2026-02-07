# Workflow And Quality Contract

## Ground Rules

- `AGENTS.md` + `docs/agent/**` are the active repository contract.
- For deeper implementation details, cross-reference `/docs`.
- Keep changes small and deterministic.

## Agent Workflow

1. Plan: list files to touch and propose diffs.
2. Implement: write code/migrations/docs in the correct directories.
3. Validate: run required checks and core smoke tests.
4. Deliver: include screenshots (light/dark/mobile) and state-coverage notes in PRs when UI changes.
5. Log: append a concise entry to `docs/RUNLOG.md` for every ad-hoc/Codex session:
   what changed, what worked, what did not, and where to continue.

## Required Validation Gates

- `pnpm lint`
- `pnpm test:snapshots`
- `pnpm test:acceptance`
- `pnpm test:rls`

## Testing And QA

- Test framework: Vitest (acceptance + snapshot suites).
- After migration/policy edits, run RLS tests.
- Update snapshots via `pnpm snapshots:update` when intended.
- Mirror CI locally:
  - `pnpm lint && pnpm test:snapshots && pnpm test:acceptance`
- Add targeted edge cases for touched behavior.

## File And Module Layout

- `src/app/(public|auth|dashboard)/**`
- `src/app/admin/**`
- `src/app/billing/**`
- `src/components/**`
- `src/lib/**`
- `src/hooks/**`
- `supabase/**` (schema, policies, tests)
- `public/**`
- `docs/**`

## CI/CD And Environment

- Single environment: `prod` (Supabase + Stripe test/live modes).
- Migrations must be versioned and reversible.
- GitHub Actions should run typecheck, lint, build, preview deploy checks.
- Feature flags are required for risky rollouts.

## Git And PR Workflow

- Branch format: `feat/<slug>`, `fix/<slug>`, or `chore/<slug>`.
- Commit messages use present tense.
- PR title format: `[STEP SNN] <title>`.
- Include checklist, linked issue, UI artifacts, and reproducibility notes.

## Build And Dev Commands

- Install: `pnpm install`
- Dev: `pnpm dev` (`http://localhost:3000`)
- Build/start: `pnpm build` then `pnpm start`
- Utilities:
  - `pnpm check:perf`
  - `pnpm db:push`
  - `pnpm create:admin`
  - `pnpm seed:validate` (dry-run fixture validation for full-account seed)
  - `pnpm verify:settings`

## Agent Tooling Notes

- `mcp.json` provisions filesystem/shell/ripgrep/git MCP servers via `npx`.
- Install `rg` locally so ripgrep-backed search works.
- Approve MCP servers in your client before long runs.
