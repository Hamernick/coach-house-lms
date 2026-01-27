# Roles & Permissions (Profiles + Platform Admin)
Status: Done
Owner:
Priority: P0
Target release: Launch

---

## Purpose
- Replace the legacy “student” naming in `profiles.role` with product-accurate role terminology.
- Establish a clear, extensible roles structure that supports:
  - A “super user” (platform admin) who can see/admin everything for testing.
  - Future app roles (board members, org collaborators) without breaking RLS.

## Current State
- `public.user_role` enum: `('member', 'admin')`.
- `profiles.role` defaults to `member`.
- Admin access checks are based on `profiles.role === 'admin'` and `public.is_admin()`.
- Admin UI uses “Member” labels and filters.
- RLS policies reference `public.is_admin()`; per-org roles are deferred to a later schema change.

## Scope
In scope (P0):
- Rename the default non-admin role from `student` → `member` (or equivalent).
- Update app/admin UI + types + tests accordingly.
- Keep `admin` behavior unchanged (still the “super user”).

Out of scope (for launch):
- True org multi-user permissions model (membership table, invites, per-org roles).
- Board-member login role and per-org access controls (will need schema design).

## UX Flow
- N/A (mostly schema + naming).

## UI Requirements
- Admin Users pages:
  - Show “Member” instead of “Student” in dropdowns/filters.

## Data & Architecture
- Tables / fields touched:
  - `profiles.role` (enum value rename)
- RLS / permissions:
  - Ensure policies that enforce a fixed role on insert/update still function after rename.
  - Confirm `public.is_admin()` keeps working.

## Integrations
- Supabase RLS policies + `public.is_admin()` helper function.

## Security & Privacy
- Make sure no policy accidentally allows role escalation.

## Performance
- N/A.

## Accessibility
- N/A.

## Analytics & Tracking
- N/A.

## Edge Cases
- Existing profiles with role `student` should seamlessly read as `member` post-migration.
- Admin role changes in `/admin/users/*` should keep working.

## Migration / Backfill
- Migration should rename enum value, then adjust any policy checks that reference the literal old value.

## Acceptance Criteria
- No UI or DB references to “student” remain for user roles.
- Admin remains able to access `/admin` and view all Accelerator content.
- `pnpm test:rls` passes.

## Test Plan
- `pnpm test:rls`
- `pnpm test:acceptance` (admin users pages + auth flows)
- Manual: promote existing user to admin and confirm access.

## Rollout Plan
- Apply migration.
- Run RLS + acceptance tests.
- Update docs/organize.md “Done” section and RUNLOG.

## Dependencies
- None.

## Open Questions
- Do we want additional platform roles now (`staff`, `coach`) or defer until we have requirements?
- Should “board member” be a profile role, or a separate per-org membership role?

## Moonshot
- Introduce `org_memberships` with per-org roles (owner/admin/member/board) and update all RLS accordingly.
