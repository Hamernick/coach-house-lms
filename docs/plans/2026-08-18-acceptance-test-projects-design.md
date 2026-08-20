# Acceptance Test Projects Design

Date: 2026-08-18

Status: approved for implementation as PR 3 of the quality-gate optimization
sequence.

## Goal

Classify the complete acceptance suite into focused Vitest projects without
removing, skipping, or silently reassigning coverage. Keep
`pnpm test:acceptance` as the required union of every project.

Clean `origin/main` baseline:

- 414 test files;
- 2,155 tests, including one intentional skip; and
- 248 seconds in the current contended local environment.

## Decision

Commit a generated, reviewable manifest with four mutually exclusive groups:

1. `behavior`: focused behavior with zero or one application-module import;
2. `contract`: repository-source readers that import no application or mocked
   server-runtime module;
3. `cli`: tests that invoke child processes; and
4. `integration`: behavior spanning at least two application modules.

A deterministic TypeScript-syntax parser owns classification and validates
that:

- every `tests/acceptance/**/*.test.ts` file appears exactly once;
- every manifest entry still exists;
- entries and groups are sorted;
- checked-in categories match the documented rules; and
- manifest drift fails before any acceptance project runs.

The full acceptance command runs the manifest check and then the complete
manifest union through the existing single-project scheduler and global setup.
Focused commands run the same check before selecting one of the four projects.
This keeps the required gate's proven scheduling behavior while exposing safe,
faster development lanes.

## Setup Isolation

`behavior`, `integration`, and `cli` retain the existing acceptance setup so
their Next.js, Supabase, admin, logger, and Stripe mocks are unchanged.

The focused `contract` project receives no global setup file. Its classifier
only admits tests that read repository files and import no application module or
mocked Next.js, Supabase, Stripe, admin, or server-only runtime, so source-only
feedback does not initialize unrelated server mocks. If a contract later imports
one of those modules, manifest validation fails and requires an explicit reviewed
reclassification.

The required full union retains the original global setup. A draft that ran all
four projects together repeatedly pushed existing five-second dynamic-import
tests past their timeout after lint and snapshot work. Retaining the original
full scheduler avoids introducing that local reliability regression.

## Alternatives Rejected

- Renaming or moving all 414 files would create large, conflict-prone churn.
- Runtime-only classification would keep the file split invisible in review and
  could silently change project membership.
- Changed-file-only execution would weaken the required merge gate and is out of
  scope.

## Planned Files

- `scripts/sync-acceptance-projects.mjs`: classify, generate, and validate.
- `tests/acceptance/projects.json`: checked project membership.
- `vitest.config.ts`: checked full union with the original scheduler and setup.
- `vitest.projects.config.ts`: four focused projects with shared worker bounds.
- `package.json`: full, focused, check, and manifest-update commands.
- `tests/acceptance/acceptance-test-projects.test.ts`: parity and setup contracts.
- `docs/agent/workflow-quality.md`: command and coverage contract.
- `docs/plans/2026-08-18-quality-gate-optimization.md`: PR 3 status.
- `docs/runlog/2026-08.md`: implementation and validation handoff.

## Acceptance Criteria

- The manifest contains every acceptance file exactly once.
- The full command reports 414 files and 2,155 tests unless this PR adds its own
  focused regression file; any resulting increase must be explained exactly.
- Running all four focused commands produces the same file/test union as the
  full command.
- The focused contract project runs without
  `tests/acceptance/test-utils.ts`.
- No existing acceptance file is edited solely to make the split pass.
- The canonical local and hosted quality gates remain required.

## Rollback

Restore the single-project Vitest configuration and original package command.
The manifest, generator, and focused commands can then be removed without
changing application or test behavior.
