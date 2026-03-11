# Cleanup Foundation Audit — 2026-03-10

This pass establishes the baseline for systematic cleanup. It does not try to solve search, legal, security, or every legacy surface at once.

## Completed In This Pass

- promoted the Supabase Platform Kit surface into the visible admin shell at `/admin/platform`
- added an admin-only sidebar entry for `Platform`
- converted `/internal/supabase` into a compatibility redirect instead of a hidden detached launcher
- formalized the root archive contract in `deprecated/README.md`
- added `pnpm check:deprecated-imports` and wired it into `check:prepush` and `check:quality`
- documented the active system map in `docs/system-map.md`

## Immediate Structural Truths

- The repo already has a usable generated Supabase Platform Kit footprint under `src/components/supabase-manager/**`.
- There are two admin concepts:
  - org admin inside `(admin)` layout
  - true platform admin enforced by `requireAdmin`
- Legacy/archive handling already exists under `deprecated/**`, but enforcement was documentation-only before this pass.

## Follow-Up Pass Order

### Pass 2 — Forms and Data Wiring

- inventory every major form and CTA
- classify each surface as:
  - persisted correctly
  - draft-only by design
  - dead/incomplete/broken
- add explicit ownership for each DB write boundary

### Pass 3 — Search Hardening

- audit public map search, global search, and any leftover legacy search surfaces
- verify routing targets, ranking, empty states, and abuse limits
- remove stale accelerator or deprecated page result destinations

### Pass 4 — Internal Admin Expansion

- validate `/admin/platform` against actual operator workflows
- add role/audit expectations for internal tooling
- keep the Platform Kit surface as close to stock as possible

### Pass 5 — Legal / Privacy / Security

- create data inventory
- draft Terms of Service and Privacy Policy from actual system behavior
- audit RLS/authz, secrets, uploads, scraping defenses, rate limiting, and webhook guarantees

### Pass 6 — Performance / Scale / Operability

- hot-path review for workspace canvas, search, and heavy client components
- bundle and route profiling
- operator runbooks and incident/debug docs

### Pass 7 — Stack Auth Evaluation

- only after the current auth/admin/security baseline is stable
- evaluate coexistence with Supabase instead of assuming a rewrite

## Current Cleanup Watchlist

- route-local `deprecated` folders still exist in some app trees and should be consolidated into the root archive when touched
- compatibility shims remain live where they protect existing links
- there is still no complete repo-wide form persistence inventory
- search is functional but not yet normalized under one documented contract
- legal/privacy docs do not yet exist

## Success Criteria For The Next Pass

- a developer can answer, for every important form:
  - where submission goes
  - what table/action it writes to
  - what success and failure states are expected
  - whether the route can dead-end or silently fail
