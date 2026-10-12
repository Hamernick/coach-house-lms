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

## Public entry

`/documentation/fiscal-sponsorship` houses requirements and inline signup, draft and submission UI. `/fiscalsponsorship` permanently redirects there. Applicants use builder intent; `fund` remains donor intent. Public visits only read account state. Explicit Start/resume uses the authenticated, owner-only `start_public_fiscal_intake` RPC, preserving existing profiles and safely reusing one intake project. Existing draft and submission actions still enforce access and revision checks. No Workspace entitlement is granted.

Requires migration `20261010090000_public_fiscal_intake.sql` before intake starts work against a deployed database. It has isolated database coverage in `pnpm test:rls:fiscal`; production is not migrated by local tests. Full free-tier profile/navigation and document-upload access review remains tracked in the homepage product journey plan. Completing information does not approve sponsorship or promise funding.
