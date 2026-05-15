# FiscalSponsorship Feature

## Ownership
- Domain logic: `src/features/fiscal-sponsorship/lib/**`
- Server actions/queries: `src/features/fiscal-sponsorship/server/**`
- UI components: `src/features/fiscal-sponsorship/components/**`
- Hooks/controllers: `src/features/fiscal-sponsorship/hooks/**`

## Rules
- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/fiscal-sponsorship.test.ts`.
- Add acceptance tests for user-visible behavior before merging.

## Prototype Notes
- The current prototype uses static data and placeholder PDFs under
  `public/fiscal-sponsorship/placeholders/**`.
- Signature routing is represented as a DocuSeal-ready flow, but no DocuSeal API
  calls or webhook handling are live yet.
- The intended real version should generate application/agreement/re-grant
  documents from persisted applicant data, route the signable PDFs, and store
  executed PDFs plus audit metadata in Documents.
