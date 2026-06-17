# Fiscal Sponsorship Prefill Walkthrough

Status: active  
Owner: Caleb + Codex  
Last touched: 2026-06-16

## Goal

Superadmins need a realistic end-to-end test organization that proves the fiscal sponsorship walkthrough uses saved data to prefill real document surfaces. The product should never AI-generate agreements, grant requests, PDFs, or support documents. It should collect, reuse, and confirm data.

## Canonical Route

- Handbook viewer: `/fiscal-sponsorship/handbook`
- Do not add a `/fiscal-sponsorship` landing page unless there is a specific product reason later.
- `/organizations` and `/organizations/[id]` are platform-admin-only operator routes.
- Regular users should enter fiscal sponsorship from the existing workspace/sidebar flow.

## Test Fixture

Use `scripts/seed-full-account.mjs --case-study fiscal-sponsorship` for the deterministic walkthrough fixture.

Default case-study targets:

- Organization name: `testing123 Southside Community Table`
- Project name: `Southside Community Table`
- Role: `admin` unless explicitly overridden
- Case-study key: `fiscal-sponsorship`

The fixture should populate:

- Superadmin profile and approved organization profile.
- Programs/team data with a fiscal sponsorship launch program.
- Strategic roadmap sections with real answers, including people, budget, fundraising, and next actions.
- All organization document slots used by the Documents tab.
- A standard organization project visible to superadmins.
- Project tasks, notes, quick links, support assets, fiscal application data, and keyed fiscal support documents.

The fixture intentionally should not pre-create the generated agreement or DocuSeal packet. Superadmins should test those real actions from the submitted application state.

## Document Boundary

Document flows should work like this:

1. Read saved user, organization, program, budget, and document data.
2. Prefill known fields in the application, agreement, grant request, or PDF editing surface.
3. Make prefilled fields editable and visibly confirmable.
4. Let the user add missing data inline.
5. Save the confirmed data back to the source workflow.
6. Sign/send/store through the real DocuSeal/project-assets workflow.

Do not write UI copy or code paths that imply the app invents agreement language with AI. AI can help classify, summarize, or assist internal review later only if the source-of-truth document remains a deterministic template plus user-confirmed data.

## UI Criteria

- Ultra-minimal Apple/shadcn feel: calm, dense, high contrast, clear hierarchy, little ornament.
- No marketing landing page treatment inside the workflow.
- Use side drawers, tabs, compact tables, menus, and familiar shadcn controls.
- Keep route and role boundaries obvious without adding instructional blocks.
- Prefer inline progress cues over large status panels.
- For program/document conventions:
  - Subtle green dot means complete, prefilled, or confirmed.
  - Subtle orange dot means needed, missing, or requires confirmation.
  - Neutral dot means optional or not yet applicable.
- Avoid cards inside cards; use cards only for repeated items, modals, or genuinely framed tools.

## Journey

Superadmin:

1. Open `/organizations`.
2. Select the `testing123 Southside Community Table` organization.
3. Open the fiscal sponsorship workbench on the organization project.
4. Review the submitted application and required document queue.
5. Approve or request changes.
6. Generate the prefilled Model C agreement from saved data.
7. Send the DocuSeal packet and verify signer/document actions.

Regular user:

1. Open the workspace/sidebar flow.
2. Open fiscal sponsorship from the workspace card.
3. Review prefilled application fields.
4. Add missing data, attach supporting files, submit for review, sign, and save.
