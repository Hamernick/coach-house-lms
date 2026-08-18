# Workflow And Quality Contract

## Ground Rules

- `AGENTS.md` + `docs/agent/**` are the active repository contract.
- For deeper implementation details, cross-reference `/docs`.
- Keep changes small and deterministic.

## New Chat Worktree Checkpoint

On the first turn of every new chat, before changing files:

1. Read the continuation log, then inspect `git branch --show-current`, `git status --short --branch`, `git branch -vv`, and `git worktree list`.
2. Display a concise startup report with the current branch and upstream, clean/dirty state, staged/unstaged/untracked summary, relevant open branches or worktrees, overlap with the requested files, and any known commit, push, PR, or deployment status. Summarize; do not dump the full worktree.
3. If the user's prompt has not already chosen a strategy, recommend the safest option and ask whether to continue the current branch, use a named existing branch/worktree, or create a clean isolated `feat/*`, `fix/*`, or `chore/*` branch/worktree from current `origin/main`.
4. Do not create or switch branches, move existing changes, or write task files until the user chooses. Read-only inspection may continue.
5. Preserve dirty worktrees. Prefer an isolated worktree when the requested change must later ship independently or overlaps unrelated staged, unstaged, or untracked work.

## Agent Workflow

1. Plan: list files to touch and propose diffs.
2. Implement: write code/migrations/docs in the correct directories.
3. Validate: run required checks and core smoke tests.
4. Deliver: include screenshots (light/dark/mobile) and state-coverage notes in PRs when UI changes.
5. Log: append a concise entry to the current monthly log linked from `docs/RUNLOG.md` for every ad-hoc/Codex session:
   what changed, what worked, what did not, and where to continue.

## Required Validation Gates

- `pnpm lint`
- `pnpm check:npm-supply-chain`
- `pnpm check:large-files`
- `pnpm check:structure`
- `pnpm check:routes`
- `pnpm check:features`
- `pnpm check:feature-scaffold`
- `pnpm check:thresholds`
- `pnpm check:boundaries`
- `pnpm check:deprecated-imports`
- `pnpm check:workspace-storage`
- `pnpm check:interaction-locks`
- `pnpm check:react-grab`
- `pnpm check:raw-buttons`
- `pnpm check:workspace-surfaces`
- `pnpm test:snapshots`
- `pnpm test:visual`
- `pnpm test:acceptance`
- `pnpm test:rls`
- `pnpm build`
- `pnpm check:perf`

## Testing And QA

- Test framework: Vitest (acceptance + snapshot suites).
- After migration/policy edits, run RLS tests.
- Update snapshots via `pnpm snapshots:update` when intended.
- Mirror CI locally:
  - `pnpm check:quality`
- Local `check:quality` and `check:prepush` write stage timings and acceptance
  inventory to ignored `test-results/quality-gate/*.json` artifacts.
- Add targeted edge cases for touched behavior.
- Visual baselines:
  - Update intentionally changed screenshots with `pnpm test:visual:update`.

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
- `pnpm check:quality` is the canonical local gate and runs every required stage
  serially with timing evidence.
- GitHub Actions runs the same stage manifest in parallel static, acceptance,
  RLS, build, and visual lanes; the aggregate `quality` job must require all
  five results.
- CI should install Playwright Chromium only in the visual lane and enforce
  visual regression checks.
- Branch protection should require the aggregate `quality` job before merge.
- Enable CODEOWNERS review enforcement for protected branches.
- Feature flags are required for risky rollouts.

## Git And PR Workflow

- Branch format: `feat/<slug>`, `fix/<slug>`, or `chore/<slug>`.
- Commit messages use present tense.
- PR title format: `[STEP SNN] <title>`.
- Include checklist, linked issue, UI artifacts, and reproducibility notes.

## Build And Dev Commands

- Install: `pnpm install`
- Setup hooks (once): `pnpm setup:hooks`
- Dev: `pnpm dev` (`http://localhost:3000`)
- Build/start: `pnpm build` then `pnpm start`
- Utilities:
  - `pnpm check:structure`
  - `pnpm check:routes`
  - `pnpm check:features`
  - `pnpm check:feature-scaffold`
  - `pnpm check:thresholds`
  - `pnpm check:boundaries`
  - `pnpm check:workspace-storage`
  - `pnpm check:interaction-locks`
  - `pnpm check:react-grab`
  - `pnpm check:raw-buttons`
  - `pnpm check:workspace-surfaces`
  - `pnpm check:prepush`
  - `pnpm test:visual`
  - `pnpm test:visual:update`
  - `pnpm check:perf`
  - `pnpm check:quality`
  - `pnpm check:quality:static`
  - `pnpm check:quality:acceptance`
  - `pnpm check:quality:rls`
  - `pnpm check:quality:build`
  - `pnpm check:quality:visual`
  - `pnpm scaffold:feature <feature-name>`
  - `pnpm db:push`
  - `pnpm create:admin`
  - `pnpm seed:validate` (dry-run fixture validation for full-account seed)
  - `pnpm verify:settings`

## Agent Tooling Notes

- `mcp.json` provisions filesystem/shell/ripgrep/git MCP servers via `npx`.
- Install `rg` locally so ripgrep-backed search works.
- Approve MCP servers in your client before long runs.
