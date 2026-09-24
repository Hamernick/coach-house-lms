# Open Work Index

Updated 2026-09-24. Use with `AGENTS.md`, `docs/RUNLOG.md`, and the [workstream inventory](../plans/2026-09-24-workstream-inventory.md). Git details are a point-in-time audit, not a release claim.

## Confirmed closed

Public Documentation / S02 shipped and closed. Caleb confirmed PRs #247, #248, and #249 merged. Do not reopen this lane, repeat production checks, or resume the old menu investigation. #249 changed test isolation only; production onboarding logic was unchanged.

## Active and unresolved lanes

| Lane | Source | Next gate |
| --- | --- | --- |
| AppShell / mobile navigation | `feat/app-shell-mobile-navigation-20260922` at `d1e4b1a1` | Review shared shell and mobile behavior on current main; run scoped browser/regression checks. |
| Public profiles / Marketplace people | `feat/public-profiles-marketplace-people-20260922` at `6b3be0b6` | Integrate list/detail routes; review privacy, handles, empty and error states. |
| Workspace Particles / Objectives — high priority | `feat/workspace-particles-objective-resume-20260922` at `c855aea6` | Resolve product concept and UI/UX; review canvas/drawer/mobile behavior before release assessment. Passing tests do not establish readiness. |
| Google Calendar | `feat/google-calendar-resume-20260922` at `508b8df0` | Isolate provider setup and verify the approved live OAuth/Calendar flow. |
| Public Find / resource-map UI | Root recovery `0a1895fc`, launch reference `f15ce510`, Find branches | Build exact candidate manifest from current main; review public behavior and data boundaries. |
| Resource acquisition scripts | Root recovery `0a1895fc` | Identify private scripts only; keep raw intake and tokens outside public paths. |
| Organization / Documents leftovers | Root recovery plus Documents worktrees | Compare with shipped Documents work before declaring any residual change. |
| Account / settings / profile refinements | Root recovery plus profile/settings worktrees | Identify unshipped hunks against current main; separate shared shell ownership. |

The first four are isolated local code lanes, not current release branches. The latter four are discovery lanes without approved file manifests. Work one lane at a time. See the [execution plan](../plans/2026-09-24-workstream-execution.md) for bounded tasks.

## Preservation and release rules

- Keep all existing worktrees and local branches. Recovery snapshots are preservation only; never push or release them wholesale.
- The root recovery branch `chore/local-development-20260907` is clean at `189e0df7` but has 147 commits ahead and 11 behind current `origin/main` by ancestry. Its broad diff is not a list of unshipped features; compare exact files and hunks before reuse.
- The closed Documentation production worktree has an unstaged runlog edit and an untracked closeout plan. Preserve both. The launch-clean worktree has an untracked legacy media file with six previously detected token-like URLs. Do not read, print, stage, commit, or publish that file.
- Shared ownership needs explicit review: AppShell with Particles/Calendar, public profiles with Documentation routes, and the common `tests/acceptance/projects.json` manifest. Append new runlog entries on the chosen branch; do not copy historical runlog versions over current main.
- For code work, start a fresh lane from current `origin/main` or deliberately replay scoped commits after file/hunk comparison. Run focused checks while editing. Hosted `quality`, code-owner review, and branch protection govern shipping. Provider setup, live data, deployment, and code readiness have separate gates.

## Resume

1. Read `AGENTS.md`, `docs/RUNLOG.md`, the latest current monthly log entries, this index, and the inventory.
2. Inspect branch, upstream, dirt, relevant worktrees, and current `origin/main` before writes.
3. Select one lane and follow its bounded execution packet. Stop on ambiguous ownership, secret exposure, or a cross-lane dependency.
