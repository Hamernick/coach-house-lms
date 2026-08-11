# LegalConsent Feature

## Ownership

- Domain logic: `src/features/legal-consent/lib/**`
- Server actions/queries: `src/features/legal-consent/server/**`
- UI components: `src/features/legal-consent/components/**`
- Hooks/controllers: `src/features/legal-consent/hooks/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/legal-consent.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
