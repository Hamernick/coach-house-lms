# Supabase Security + Lints Cleanup (Launch)
Status: In Review
Owner:
Priority: P0
Target release: Launch

---

## Purpose
- Eliminate launch-blocking Supabase security scan findings (especially anything that can bypass RLS or leak cross-tenant data).
- Reduce noise so real issues stand out during launch hardening.

## Current State
- Supabase scan + lints reports:
  - **Security Definer View**: `public.search_index` (fixed in `supabase/migrations/20260114210000_security_scan_fixes.sql`).
  - **Function Search Path Mutable**: `public.handle_updated_at` (fixed in `supabase/migrations/20260114210000_security_scan_fixes.sql`).
  - **Auth RLS Initialization Plan**: 33 policy findings from the Supabase lints CSV (fix prepared in `supabase/migrations/20260115193000_fix_auth_rls_initplan_policies.sql`).
  - **Multiple Permissive Policies**: 190 findings from the Supabase lints CSV, across 17 tables (fix prepared in `supabase/migrations/20260115194500_consolidate_rls_policies.sql`).
  - **Unindexed Foreign Keys**: 4 info findings (fix prepared in `supabase/migrations/20260115200000_add_missing_fk_indexes.sql`).
  - **Unused Index**: 5 info findings (likely “not used yet”; defer dropping indexes until post-launch usage data exists).
  - **Auth DB Connections (absolute)**: 1 info finding (Supabase Auth server setting; update in dashboard post-launch).

## Scope
In scope (P0):
- Make `public.search_index` respect querying user’s RLS / avoid leaking data.
- Set a stable `search_path` for `public.handle_updated_at`.
- Reduce Supabase lints noise by addressing the two remaining warning categories from the lints CSV (initplan + multiple permissive policies).
- Apply minimal FK index additions for the remaining INFO lints.

Out of scope (for launch):
- Broad schema refactors beyond the 17 tables flagged in the CSV.
- Rewriting `public.is_admin()` implementation (keep as-is for launch).
- Removing “unused” indexes before we have production query patterns.

## UX Flow
- N/A (DB + security hardening only).

## UI Requirements
- N/A.

## Data & Architecture
- Tables / views touched:
  - `public.search_index` (view)
  - `public.handle_updated_at` (trigger function)
- RLS / permissions:
  - Ensure `search_index` does not bypass RLS for authenticated users.
  - Prefer restricting direct view access (RPC should be the public interface).

## Integrations
- Supabase Postgres + PostgREST exposure rules (privileges on views matter).

## Security & Privacy
- Sensitive data handling:
  - `search_index` currently unions data from `organizations`, `programs`, etc. Any bypass would leak other orgs’ private profile/program content.
- Sanitization / validation:
  - N/A.
- Logging and audit notes:
  - N/A.

## Performance
- Defer “per-row auth function in policies” and “multiple permissive policies” to P1 unless we see real latency.

## Accessibility
- N/A.

## Analytics & Tracking
- N/A.

## Edge Cases
- Ensure search continues to work after tightening view privileges (RPC path still functional).

## Migration / Backfill
- Apply migrations:
  - `supabase/migrations/20260114210000_security_scan_fixes.sql`
  - `supabase/migrations/20260115193000_fix_auth_rls_initplan_policies.sql`
  - `supabase/migrations/20260115194500_consolidate_rls_policies.sql`
  - `supabase/migrations/20260115200000_add_missing_fk_indexes.sql`

## Acceptance Criteria
- Supabase scan no longer flags `public.search_index` as a SECURITY DEFINER view.
- Supabase scan no longer flags `public.handle_updated_at` for mutable `search_path`.
- Supabase lints CSV no longer reports `auth_rls_initplan` for the listed policies.
- Supabase lints CSV no longer reports `multiple_permissive_policies` for the listed tables.
- Search results still work via `/api/search` (RPC path + fallback path).

## Test Plan
- Run `pnpm test:rls` after migration changes.
- Smoke: query `/api/search?q=...` as a normal user and as an admin.
- (Optional) Attempt to query `public.search_index` directly via API as `authenticated` and verify it is either blocked or RLS-safe.

## Rollout Plan
- Apply migrations to target Supabase env.
- Re-run Supabase scan + lints export.

## Dependencies
- Postgres version must support `security_invoker` views (Supabase default should).

## Open Questions
- Do we want `search_index` accessible directly at all, or only via RPC?
- Should `search_global` remain `security definer` or be made invoker after we confirm privileges?

## Moonshot
- Build a “security scan dashboard” page for internal ops with status + links to fixes.
