# OnboardingReview Feature

## Manual review

From the isolated worktree with Node 22 and installed dependencies:

```sh
node src/features/onboarding-review/server/start-local-review.mjs
```

Open http://localhost:3014/dev/onboarding-review. The launcher uses ports 3014/3015, refuses local environment files, and supplies local-only provider settings. It does not inherit live credentials. Keep the separate localhost:3000 app running.

Choose one of 14 scenarios. Complete the existing forms, reload to verify saved local state, and use **Reset scenario** to repeat. Select a formation status and wait for URL availability before Continue. `review-taken` simulates a collision; `review-error` simulates an availability failure. Paid checkout is explicitly simulated. Scenario state stays in this browser's local storage.

This verifies local interactions, not authenticated persistence, email, Google callbacks, Stripe, uploads, or real workspace navigation. The production action's acceptance tests cover document preservation and entitlement enforcement. Follow the [recovery/review plan](../../../docs/plans/2026-10-01-onboarding-recovery-and-review.md) for dedicated-account checks before release.

## Ownership

- Domain logic: `src/features/onboarding-review/lib/**`
- Server actions/queries: `src/features/onboarding-review/server/**`
- UI components: `src/features/onboarding-review/components/**`
- Hooks/controllers: `src/features/onboarding-review/hooks/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/onboarding-review.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
