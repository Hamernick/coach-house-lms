# Organization Coach Assignments

## Goal

Let developers assign one primary coach to each organization from `/organizations` while preserving current coach access until assignment coverage is complete.

## Release Sequence

1. Ship the assignment table, server authorization, loaders, and UI.
2. Populate assignments through the developer-only controls.
3. In a separate release, filter coach organization access to assigned organizations.

This sequence avoids hiding all organizations from coaches before mappings exist.

## Data Contract

`organization_coach_assignments` stores one row per organization:

- `organization_id` primary key and foreign key to `organizations.user_id`
- `coach_user_id` foreign key to `platform_staff_members.user_id`
- `assigned_by` foreign key to `profiles.id`
- UTC `created_at` and `updated_at`

The server validates that the selected staff member has `access_level = 'coach'`. RLS lets authenticated platform staff read assignments and permits only developers to insert, update, or delete them. Foreign keys used for lookups and cascades are indexed.

## Server Flow

Independent organization, coach-option, assignment, project, and workstream reads run in parallel where dependencies permit. A server action authenticates and authorizes every mutation, validates UUID inputs, verifies the organization and coach, then atomically upserts or deletes the assignment. Both `/organizations` and the organization detail route are revalidated after success.

Only minimal assignment fields cross the RSC boundary: organization id, coach id, display name, avatar, and email.

## UI

A shared accessible popover picker appears on canonical organization cards and organization detail pages for developers. The trigger shows the assigned coach or `Unassigned`; coaches see the current assignment as read-only. The picker uses native buttons, visible focus, keyboard navigation, 44px mobile targets, pending feedback, long-text truncation, and an empty state. Assignment changes use `useTransition`, optimistic local display, rollback on failure, and a toast result.

## Verification

- acceptance coverage for mapping, validation, authorization, mutation, and UI contracts
- RLS coverage for staff reads, developer writes, coach write denial, and one-row-per-organization behavior
- lint, schema types, route/feature/boundary/threshold checks, build, visuals, and production probes
