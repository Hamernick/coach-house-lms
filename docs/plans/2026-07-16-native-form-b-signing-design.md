# Native Form B Signing

## Outcome

Coach House signs the supplied Form B inside the authenticated app without a DocuSeal account. The applicant reviews editable prefill and signs first. A platform super-admin reviews the locked applicant document and countersigns second. The system stores private PDFs, immutable signature evidence, consent, UTC timestamps, and SHA-256 hashes in Supabase.

## Source Document

- File: `public/fiscal-sponsorship/form-b-fiscal-sponsorship-agreement.pdf`
- Version: `2`
- SHA-256: `21245b9560f49a42e981e1c3335e2186f70978e8b34c3e09f4112b199ac77c42`
- Format: four image-backed PDF 1.7 pages, 593.04 × 839.04 points
- AcroForm fields: none
- Extractable text: corrective vector text on pages 1, 2, and 4 only

The renderer verifies the source hash before writing any field or signature. A changed source requires a new manifest version and coordinate review.

## Flow

1. A super-admin approves the existing fiscal sponsorship application.
2. `Generate agreement` creates a filled Form B PDF from application and organization data.
3. `Send for signature` creates a native packet and assigns the organization owner as applicant signer.
4. The applicant opens `/fiscal-sponsorship/sign/[packetId]`, edits permitted fields, confirms them, consents, and uses a typed or drawn signature.
5. Applicant fields lock. Packet status becomes `applicant_signed`; application status becomes `signed`.
6. A super-admin opens the same authenticated route, reviews the exact applicant-signed PDF, consents, and countersigns.
7. Packet status becomes `completed`; application status becomes `countersigned`.
8. The app stores and exposes hash-verified downloads for the executed PDF and execution certificate.

```text
generated -> sent -> applicant_signed -> completed
                applicant             super-admin
```

Corrections after the applicant signs require voiding and generating a new packet. Signed applicant content is never edited in place.

## Form B Fields

Page 1 fields are defined in `form-b-field-manifest.ts` using verified PDF-point rectangles:

- Project ID
- Applicant full name
- Application date
- Mailing address, two lines
- Phone number
- Primary email
- Legal entity name
- Legal entity type
- Project, program, or initiative name

Page 4 includes complete grantee and Sponsor execution blocks for legal entity, authorized signature, printed name, title, and date. The generated opening paragraph replaces the source placeholder with the confirmed legal entity name.

## Data and Storage

Migration `20260716150000_add_native_fiscal_sponsorship_signing.sql` adds:

- private `fiscal-signing` Storage bucket;
- template, field-snapshot, locking, revision, and file-hash columns on fiscal documents;
- assigned signer IDs, ordered signature timestamps, revisions, consent, and document hashes on signature packets;
- RLS-protected autosave drafts;
- immutable signature-evidence rows;
- mutation-rejection triggers for signature evidence and fiscal events;
- service-role-only, row-locked finalization functions for both signer steps.

Private paths are scoped by organization, project, application, and packet. Authenticated clients have no direct Storage mutation policy. Server actions authorize the user first, then use the service role for private file persistence. Downloads pass through an authenticated route that recalculates and verifies the stored SHA-256 before returning bytes.

Each signing transition locks the packet and application document-version namespace, checks the latest autosave revision, and commits the signature evidence, versioned document rows, packet status, application status, and audit event in one database transaction. Applicant completion also downloads and verifies the originally generated agreement against its stored and packet hashes before accepting a signature.

## Evidence

Each signature records:

- authenticated profile ID;
- signer role, name, title, and email snapshot;
- typed or drawn method and normalized signature payload;
- consent text, version, and SHA-256;
- SHA-256 of the exact document presented for that signature;
- signature-evidence SHA-256;
- UTC signing timestamp;
- user-agent metadata.

The separate execution certificate lists both signer timestamps and signature hashes, template hash, executed-PDF hash, packet ID, application ID, and project ID.

## Access Rules

- Applicant: assigned organization owner only.
- Countersigner: platform super-admin only.
- Applicant may sign only while packet status is `sent`.
- Super-admin may sign only while packet status is `applicant_signed`.
- Applicant fields become read-only after the first signature.
- Unrelated authenticated users cannot read drafts or signature evidence.
- Legacy DocuSeal packet and webhook code remains for already-created legacy packets; new packets use `provider = 'native'`.

## UX

- Desktop: PDF preview beside the signing form.
- Mobile: signing form first, followed by the full document preview.
- Debounced autosave with Saving, Saved, failure, and stale-session states.
- Unsaved-change browser warning.
- Typed signature is the keyboard-accessible method; drawn signature supports mouse, touch, and trackpad.
- Inline validation focuses the first invalid field.
- Explicit document confirmation, electronic consent, and signing-authority checkboxes.
- Completed state provides executed agreement and execution certificate downloads.

## Required Legal Review Before Production Use

Counsel should approve version 2 as the operative agreement. It fixes the earlier Section 17 cross-reference, defines the Effective Date as the last signature, labels page 1 as `Application Date`, and includes complete title/signature/date fields for both parties. The sponsor legal name, Illinois status, tax-exemption language, and all substantive terms still require counsel confirmation.

These are source-document decisions, not signing-system defects. The app must not silently rewrite legal terms without an approved template revision.

## Verification

- Acceptance tests validate template hash, field bounds, field validation, sequential state checks, in-app routes, autosave, consent, typed/drawn signatures, and PDF generation.
- Rendered page 1 and page 4 fixtures are visually inspected at 2.5× source resolution.
- RLS tests cover assigned signer access, unrelated-user denial, admin access, and direct evidence mutation denial.
- Release requires `pnpm check:quality` and an authenticated applicant/admin browser pass against a migrated Supabase environment.
