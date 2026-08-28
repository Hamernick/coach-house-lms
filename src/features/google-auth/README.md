# Google Auth Feature

Adds feature-flagged Google Identity Services sign-in and signup to the shared
auth forms. Google signup verifies the ID token and nonce server-side,
preprovisions the Supabase user with current legal and onboarding metadata, and
then links the Google identity through Supabase. Google login does not bypass
the signup consent gate for new users.

## Runtime configuration

- `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<public Google OAuth web client ID>`
- Supabase Google provider configured with the same client ID and its secret

Keep the feature disabled until the database migration, application code,
Google client, and Supabase provider configuration are deployed together.

## Ownership

- Domain logic: `src/features/google-auth/lib/**`
- Server actions/queries: `src/features/google-auth/server/**`
- UI components: `src/features/google-auth/components/**`
- Hooks/controllers: `src/features/google-auth/hooks/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/google-auth.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
