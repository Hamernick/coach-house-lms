# Quality Gate Optimization Plan

Date: 2026-08-18

Status: PRs 1-2 implemented on `chore/quality-gate-optimization-20260818`.
PRs 3-8 remain sequenced follow-up work. No required coverage is removed.

## Decision

Keep every current quality signal, but stop treating one serial command and one
catch-all acceptance suite as the only way to execute them.

The work should ship as small, reversible pull requests. First add timing proof,
then shorten CI through orchestration, then reduce test-process and source-contract
overhead. Do not introduce affected-only CI until dependency coverage for
source-reading contract tests is explicit.

## Current Evidence

The latest successful `main` run at commit `390c4caf` completed the quality gate
in `4m05s` and the full job, including setup, in `5m03s`. Five recent successful
quality gates ranged from `4m05s` to `6m14s`.

Latest clean stage timings:

| Stage                                   | Wall time |
| --------------------------------------- | --------: |
| Lint                                    |       53s |
| Structural guardrails                   |       16s |
| Snapshot verification                   |        2s |
| Acceptance                              |       52s |
| Focused RLS plus optional connected RLS |        8s |
| Production build                        |       70s |
| Visual regression                       |       41s |
| Performance budgets                     |       <1s |

The current acceptance suite contains 414 files, about 2,150 tests, and about
85,000 lines. Of those files, 175 read repository source directly, seven invoke
child processes, and the two largest resource-map CLI suites make 41 process
calls. `resource-map-data-engine.test.ts` is 3,815 lines and contains 27 of
those calls.

A local acceptance run under severe workstation contention took `7m24s`. The
machine had a load average above 100 on 16 logical CPUs. Fixed eight-worker
execution then produced several five-second timeouts that do not occur on clean
CI. This proves that local contention is part of the reported 12-15 minute
experience, while the suite's current scheduling and subprocess design amplify
it.

## Non-Negotiables

- Keep full lint, guardrails, snapshots, acceptance, focused PostgreSQL RLS,
  build, visual regression, and performance budgets required before merge.
- Keep one required branch-protection check named `quality`.
- Never replace full CI with changed-file-only testing.
- Preserve real PostgreSQL execution for signup, fiscal, Finance, and page-health
  security boundaries.
- Preserve the complete visual matrix and failure artifacts.
- Do not delete a test until its protected behavior is mapped to a surviving
  behavioral test, contract guard, or integration test.
- Keep each pull request independently revertible.

## Success Metrics

Measure five successful runs before and after each orchestration change.

| Metric                                     | Target |
| ------------------------------------------ | -----: |
| Clean CI quality p50                       |   <=3m |
| Clean CI quality p95                       |   <=4m |
| Idle local full-gate p50                   |   <=6m |
| Acceptance CI p50                          |  <=45s |
| Acceptance flake rate across 20 clean runs |    <1% |
| Deterministic required-suite skips         |      0 |
| Required coverage removed                  |      0 |

Local measurements are valid only when system load and competing Next.js,
Playwright, TypeScript, and Vitest processes are recorded.

## Pull Request Series

### PR 1: Record gate timing and suite composition

Implementation status: included in the first mergeable wave.

Add a small quality runner that preserves the current command order while
recording command name, start, finish, result, and wall time. Emit a concise
console summary and a JSON artifact in CI.

Also record acceptance file/test counts, source-reading file count, child-process
call count, and skipped-suite count. This becomes the regression baseline for
later PRs.

Validation:

- the runner exits on the same first failure as `pnpm check:quality`;
- all existing commands and environment contracts remain unchanged;
- timing output contains no environment values, secrets, or test fixtures; and
- direct and wrapped quality runs have the same result on two clean runs.

Rollback: restore the existing package script; no test organization changes.

### PR 2: Parallelize independent CI lanes

Implementation status: included in the first mergeable wave.

Split GitHub Actions into these jobs:

1. `static`: supply-chain, large-file, lint, structural guardrails, snapshots.
2. `acceptance`: the complete Vitest acceptance suite.
3. `rls`: all deterministic focused PostgreSQL RLS suites.
4. `build`: the production Next.js build and performance budgets.
5. `visual`: Playwright Chromium installation and the complete visual suite.
6. `quality`: an aggregate job that succeeds only when every required lane
   succeeds.

Install Chromium only in `visual`. Keep `pnpm check:quality` as the canonical
local command. Preserve current failure artifacts and concurrency cancellation.

Expected result: CI wall time becomes the slowest lane plus setup, rather than
the sum of every lane. Based on the current timings, the first target is 2-3
minutes without changing test content.

Rollback: revert workflow orchestration; local scripts remain valid.

### PR 3: Classify acceptance work without reducing it

Implementation status: implemented on
`chore/acceptance-test-projects-20260818`; the checked manifest preserves exact
union parity, and clean hosted timing remains required before review.

Create explicit Vitest projects or configs for:

- `behavior`: imported functions, routes, components, and rendered output;
- `contract`: repository source, migration, documentation, and ownership rules;
- `cli`: subprocess-level command entrypoint proof; and
- `integration`: broader multi-module behavior.

The existing `pnpm test:acceptance` must still run the union of all projects.
Add focused commands for development, but do not make CI selective.

Move the heavy global mocks out of projects that do not import application
server modules. Use project-specific setup files so source-only contracts do
not initialize Supabase, Stripe, Next.js, and admin mocks.

Rollback: retain the original unified config until union parity is proven by
file manifest and test count.

### PR 4: Consolidate brittle source contracts

Start with the public-map marker hook, where three suites currently inspect the
same source file and assert internal function names or statement order. Replace
that overlap with:

- behavioral proof that organization fallback markers render;
- behavioral proof that marker artwork exists before source publication; and
- one structural guard that the archived clustering path is not imported.

Then inventory the remaining 175 source-reading files. Merge duplicate ownership,
class-name, migration-string, and script-composition assertions only when their
behavior map is explicit. Prefer AST/import-graph guards over raw substring
checks for architectural rules.

This PR is primarily a reliability improvement; do not claim large runtime
savings from assertion consolidation alone.

Rollback: restore the prior focused contracts if the replacement misses a
documented invariant.

### PR 5: Remove resource-map subprocess amplification

Refactor resource-map command scripts into importable cores with thin CLI
adapters:

```text
CLI argv -> parse options -> core operation(dependencies) -> result -> format
```

Test parsing, normalization, ingestion, freshness, and orchestration in-process.
Keep subprocess smoke coverage for help output, exit codes, dry-run safety, and
one representative end-to-end path per command family.

Split `resource-map-data-engine.test.ts` by connector, parsing, quality,
orchestration, and persistence responsibility so Vitest can schedule independent
files. Target no more than six resource-map subprocess calls across the full
acceptance suite.

Validation must prove identical stdout, stderr, exit code, dry-run defaults,
write authorization, and record output for current fixtures.

Rollback: CLI adapters remain compatible with the existing scripts throughout
the refactor.

### PR 6: Reuse the production build for visual regression

Trial Playwright against `VISUAL_REGRESSION_ROUTES=1 pnpm start --port 3000`
after the required production build instead of starting `next dev` and compiling
again.

Accept the change only if:

- all visual fixture routes remain inaccessible without the explicit flag;
- all current screenshots match or have a separately approved visual rationale;
- retries and failure artifacts behave identically; and
- the production server starts reliably on clean CI.

If the build artifact cannot be shared safely across jobs, use a scoped build
artifact or keep visual and build together. Do not trade determinism for a small
speed gain.

Rollback: restore the current Playwright `webServer.command`.

### PR 7: Clarify and reuse RLS execution

Rename the guaranteed local PostgreSQL proof and optional connected Supabase
proof so CI output states exactly what ran. A skipped connected suite must not
look like a completed deterministic requirement.

Extract the duplicated temporary-PostgreSQL bootstrap used by the signup,
fiscal, Finance, and page-health suites. Evaluate one shared temporary cluster
per RLS job, while preserving database isolation between suites through separate
databases or full resets.

Keep connected Supabase proof as a separately configured job when credentials
and an approved isolated environment exist.

Rollback: each focused RLS command remains directly runnable during migration.

### PR 8: Add a contention-safe local lane

After PRs 1-7 provide timing evidence, add a local developer command that:

- records system load and available CPUs;
- uses a bounded worker count when the workstation is already busy;
- runs focused projects first for fast feedback; and
- still finishes with the complete required suite before push when requested.

Do not silently lower workers in CI. Do not skip tests based only on Git diff
until source-contract dependencies are machine-readable.

## Recommended Order

Ship PRs 1 and 2 first because they reduce waiting without changing coverage.
Then ship PRs 3-5 as the acceptance reliability and local-runtime wave. Trial
PR 6 independently. Complete PR 7 before describing connected RLS as a required
CI proof. Use PR 8 only after measured worker data exists.

## Expected Outcome

The gate remains strict but becomes easier to understand:

- CI reports which category failed instead of hiding it in one serial command;
- independent work executes concurrently;
- local source contracts avoid unnecessary server mock initialization;
- CLI behavior remains covered without dozens of Node process launches;
- visual tests exercise a production build when safe; and
- RLS output distinguishes deterministic local proof from connected proof.

No production behavior, database state, deployment, or branch-protection setting
changes as part of this proposal document.
