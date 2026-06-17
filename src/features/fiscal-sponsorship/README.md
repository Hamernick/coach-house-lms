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

## Workflow Notes

- The admin prototype still uses static step data for interaction testing, but
  production surfaces should use persisted application, document, signature, and
  event state.
- The real workflow can now create DocuSeal signing submissions and accept signed
  DocuSeal webhooks at `/api/webhooks/docuseal`. Completed DocuSeal webhooks
  store the executed agreement and available audit certificate in
  `project-assets`, register them as project assets, and link them back to the
  signature packet.
- The organization detail workbench resolves DocuSeal submitter signing URLs
  from stored provider payloads and exposes the private project-asset viewer and
  download URLs for generated, executed, and audit documents. Keep signing in
  DocuSeal unless a future requirement explicitly needs in-app PDF annotation.
- Fiscal document uploads reuse `project-assets` and are classified through
  `fiscal_sponsorship_documents.document_key` for tax, formation, budget,
  fundraising, insurance, grant request, and additional-information support.
- The intended real version should generate application/agreement/grant request
  documents from persisted applicant data, route signable documents through
  DocuSeal, and store executed files plus audit metadata in Documents.
