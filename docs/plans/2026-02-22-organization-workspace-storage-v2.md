# Organization Workspace Storage V2 (Table-Backed)

## Goal

Migrate workspace board state and collaboration invites off `organizations.profile` JSON keys into dedicated relational tables with RLS, without breaking existing organizations that still have legacy profile-stored data.

## Schema Changes

- Added `organization_workspace_boards`:
  - `org_id` (PK, FK -> `organizations.user_id`)
  - `state` (`jsonb`) for serialized board state
  - `updated_by` (FK -> `profiles.id`)
  - UTC `created_at` / `updated_at`
- Added `organization_workspace_invites`:
  - `id` (text PK)
  - `org_id` (FK -> `organizations.user_id`)
  - `user_id`, `created_by` (FKs -> `profiles.id`)
  - invite metadata (`user_name`, `user_email`, `expires_at`, `revoked_at`, `duration_value`, `duration_unit`)
  - UTC `created_at` / `updated_at`
- Added indexes for org/member lookups and active invite filtering.
- Added update triggers (`public.handle_updated_at`).
- Added RLS policies:
  - board reads: all org members
  - board writes: owner/admin/staff
  - invite reads: all org members
  - invite writes: owner/admin/staff/board

## Rollout Strategy

- Existing profile-backed board state is backfilled into the new board table via migration.
- Existing profile-backed invite rows are backfilled into `organization_workspace_invites` via migration.
- Runtime app paths are cut over to table-only storage.

## App Layer Updates

- `workspace-state.ts` now exposes:
  - table row normalization for invites,
  - board value normalization.
- `workspace-actions.ts` now:
  - persists board state to `organization_workspace_boards`,
  - persists invites to `organization_workspace_invites`.
- `page.tsx` (`view=workspace`) now hydrates board/invites from workspace tables only.
- RLS suite includes explicit policy checks for workspace board/invite tables.

## Validation Requirements

- Must pass `pnpm check:quality`.
- Must preserve existing workspace UX behavior and permissions for owner/admin/staff/board/member roles.

## Status

- Migration and runtime cutover are complete.
- Legacy workspace profile-key cleanup migration added:
  - `supabase/migrations/20260222201500_cleanup_workspace_profile_keys.sql`
