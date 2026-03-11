# Coach House System Map

Current baseline for active product surfaces, ownership boundaries, and cleanup passes. This is the operating map for future hardening work, not a speculative roadmap.

## Route Families

- `src/app/(public)/**`
  - marketing shell, homepage sections, public pricing entry, `/find`, public organization detail
- `src/app/(auth)/**`
  - sign in, sign up, recovery, team login
- `src/app/(dashboard)/**`
  - workspace, people, documents, roadmap, onboarding, organization editing
- `src/app/(accelerator)/**`
  - curriculum delivery, lessons, accelerator overview
- `src/app/(admin)/**`
  - org admin and internal operator shell
  - `/admin` is organization access
  - `/admin/platform` is internal-only Supabase platform operations
- `src/app/(internal)/**`
  - compatibility/hidden internal routes only
  - `/internal/supabase` now redirects to `/admin/platform`
- `src/app/api/**`
  - server mutation/query boundaries for search, Stripe, Supabase proxying, uploads, onboarding, etc.

## Feature Ownership

- `src/features/**`
  - feature-owned business logic and reusable UI modules
  - route files should stay composition-first and prefer feature entrypoints
- `src/components/**`
  - shared app shell, navigation, public UI, common composed components
- `src/lib/**`
  - framework-safe helpers, integration utilities, shared server/client contracts
- `supabase/**`
  - schema, RLS tests, SQL policies, migration source of truth

## Search Surfaces

- Public map search
  - `src/components/public/public-map-index/search-card.tsx`
  - destination: public map index + org detail state
- Global product search
  - `src/components/global-search.tsx`
  - server source: `src/app/api/search/route.ts`
- Search hardening follow-up
  - remove stale result routing
  - unify ranking contracts
  - audit rate limiting and query guards

## Persisted Form Boundaries

- Auth/account flows
  - Supabase auth + profile hydration
- Onboarding
  - workspace onboarding draft + persisted org/profile/billing state
- Workspace tools
  - org profile, documents, roadmap, calendar previews, accelerator progress
- Billing
  - Stripe checkout route + webhook reconciliation

Every persisted form should resolve to one of:

- a server action,
- an `app/api/**` handler,
- a feature server entrypoint consumed by a route.

Anything outside that contract should be treated as cleanup debt in the next pass.

## Admin and Internal Operations

- `/admin`
  - customer/org admin surface
- `/admin/platform`
  - true platform-admin-only operations surface
  - wraps the generated Supabase Platform Kit managers inside the main app shell
- `/internal/**`
  - compatibility and staff-only routes guarded by `requireAdmin`

## Archive and Legacy Policy

- Root archive location: `deprecated/**`
- Active code must not import any `deprecated` path segment
- Guardrail command: `pnpm check:deprecated-imports`
- Route-local `deprecated` folders are temporary staging only and should be folded into `deprecated/**` during cleanup passes

## Known Compatibility Shims

- `/pricing`
  - legacy redirect shim to `/?section=pricing`
- `/internal/supabase`
  - compatibility redirect to `/admin/platform`

Track and remove shims only after inbound links and user flows have been updated.

## Next Cleanup Pass Targets

- form inventory with explicit persistence ownership
- dead-end CTA audit
- search normalization and routing cleanup
- legacy route/component archive sweep
- legal/privacy/security inventory
