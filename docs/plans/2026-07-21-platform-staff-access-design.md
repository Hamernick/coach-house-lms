# Platform Staff Access Design

## Goal

Separate internal Coach House tooling access from customer subscriptions and organization membership roles.

## Roles

- `developer`: full internal access.
- `coach`: Workspace, Find, Organizations, and organization detail only.
- No platform staff record: existing regular or paid-user behavior.

Coaches initially see all Organizations. Organization-to-coach assignment and row scoping are the next phase.

## Architecture

Use a dedicated `platform_staff_members` table keyed by Supabase Auth user ID. Keep platform roles out of organization membership and customer subscription state. A centralized capability matrix resolves allowed internal surfaces. Server authorization reads the staff record and guards pages and mutations; navigation reflects the same capabilities but is never the security boundary.

`public.is_admin()` remains the broad RLS gate and resolves only `developer`. Coaches receive no broad database-admin privilege. Explicit coach access is added only to the Organizations server path. This preserves least privilege and gives the future organization-assignment model a stable staff identity to reference.

## Migration

Backfill existing admins as developers, then assign these verified accounts to coach:

- `paula@coachhousesolutions.org`
- `fs@coachhousesolutions.org`
- `joel@amorejustchicago.org`

Preserve `caleb@bandto.com` as developer. Provisioning accepts an explicit platform access level and keeps legacy profile roles synchronized during the transition.

## Verification

- Capability unit coverage for developer, coach, and regular users.
- Route/source contracts for Organizations coach access and developer-only tools.
- Navigation coverage proving coaches see only Workspace, Find, and Organizations.
- RLS coverage proving coaches do not satisfy `public.is_admin()`.
- Provisioner tests for both access levels and fail-closed behavior.

## Deployment Boundary

Deploy the backward-compatible application authorization first, then apply the migration that creates staff records and assigns live coach roles. The application falls back to legacy admin access while the table is absent, so no coach is stranded between releases.
