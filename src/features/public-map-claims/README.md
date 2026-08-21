# Public Map Claims

## Ownership

- Domain logic: `src/features/public-map-claims/lib/**`
- Server actions/queries: `src/features/public-map-claims/server/**`
- UI components: `src/features/public-map-claims/components/**`
- Hooks/controllers: `src/features/public-map-claims/hooks/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/public-map-claims.test.ts`.
- Add acceptance tests for user-visible behavior before merging.

## Runtime configuration

- `PUBLIC_MAP_CLAIM_OWNER_USER_ID`: required in production. Must identify a
  developer in `platform_staff_members` who owns an organization workspace.
- `PUBLIC_MAP_CLAIM_RISK_SECRET`: required in production. Use an independent,
  rotating random secret; never reuse an auth or Supabase credential.

The first delivered claim atomically creates a dedicated `Public Map Claims`
project for the configured owner. Requests remain durable and visible in the
admin queue if delivery is unavailable.

## Data handling

- Claimant details stay in the admin-only claim table and detail view.
- Task titles, notifications, URLs, logs, and rate-limit keys contain no claim
  PII.
- Mark spam requests for deletion after 30 days. Anonymize or delete resolved
  claimant details after the approved retention window is defined before
  production enablement.
- Approval never grants membership, changes ownership, or publishes a listing
  automatically.
