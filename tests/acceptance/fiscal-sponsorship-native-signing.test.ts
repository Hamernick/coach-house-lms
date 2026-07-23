import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

import {
  FISCAL_SPONSORSHIP_FORM_B_RECTS,
  FISCAL_SPONSORSHIP_FORM_B_TEMPLATE,
  validateFiscalSponsorshipFormBFields,
} from "@/features/fiscal-sponsorship/lib/form-b-field-manifest"
import { buildFiscalSponsorshipFormBPdf } from "@/features/fiscal-sponsorship/lib/form-b-pdf"

const fields = {
  applicationDate: "2026-07-16",
  applicantFullName: "Caleb Hamernick",
  legalEntityName: "Sample Community Arts Initiative",
  legalEntityType: "Illinois Not-for-Profit Corporation",
  mailingCity: "Chicago",
  mailingPostalCode: "60601",
  mailingState: "IL",
  mailingStreetAddress: "123 North State Street",
  mailingStreetAddress2: "Suite 400",
  phoneNumber: "(312) 555-0199",
  primaryEmail: "caleb@example.org",
  projectId: "CH-AB12CD34",
  projectName: "Neighborhood Arts Access Program",
}

describe("native fiscal sponsorship signing", () => {
  it("keeps signing authenticated, resumable, sequential, and in app", () => {
    const page = readFileSync(
      "src/features/fiscal-sponsorship/components/signing/fiscal-sponsorship-signing-page.tsx",
      "utf8"
    )
    const context = readFileSync(
      "src/features/fiscal-sponsorship/server/native-signing-context.ts",
      "utf8"
    )
    const fields = readFileSync(
      "src/features/fiscal-sponsorship/components/signing/fiscal-sponsorship-signing-fields.tsx",
      "utf8"
    )
    const chrome = readFileSync(
      "src/features/fiscal-sponsorship/components/signing/fiscal-sponsorship-signing-chrome.tsx",
      "utf8"
    )
    const summary = readFileSync(
      "src/features/fiscal-sponsorship/server/workflow-summary.ts",
      "utf8"
    )
    const actions = readFileSync(
      "src/features/fiscal-sponsorship/server/native-signing-actions.ts",
      "utf8"
    )

    expect(page).toContain("saveFiscalSponsorshipSigningDraft")
    expect(page).toContain("beforeunload")
    expect(page).toContain('value="typed"')
    expect(page).toContain('value="drawn"')
    expect(fields).toContain("I consent to electronic records")
    expect(fields).toContain("I am authorized to sign")
    expect(page).toContain('name="signerTitle"')
    expect(chrome).toContain('aria-live="polite"')
    expect(context).toContain('packet.status === "sent"')
    expect(context).toContain('packet.status === "applicant_signed"')
    expect(actions).toContain("verifyApplicantSourceIntegrity")
    expect(actions).toContain("source_document_sha256")
    expect(summary).toContain("/fiscal-sponsorship/sign/${signaturePacket.id}")
  })

  it("finalizes each signer step through a service-only transaction", () => {
    const migration = readFileSync(
      "supabase/migrations/20260716150000_add_native_fiscal_sponsorship_signing.sql",
      "utf8"
    )

    expect(migration).toContain(
      "finalize_fiscal_sponsorship_applicant_signature"
    )
    expect(migration).toContain("finalize_fiscal_sponsorship_coach_signature")
    expect(migration).toContain("for update")
    expect(migration).toContain("pg_advisory_xact_lock")
    expect(migration).toContain("to service_role")
    expect(migration).toContain("from public, anon, authenticated")
  })

  it("keeps the versioned Form B manifest within all four pages", () => {
    const templateBytes = readFileSync(
      "public/fiscal-sponsorship/form-b-fiscal-sponsorship-agreement.pdf"
    )
    expect(FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.sha256).toHaveLength(64)
    expect(FISCAL_SPONSORSHIP_FORM_B_TEMPLATE.version).toBe(2)
    expect(templateBytes.byteLength).toBeLessThanOrEqual(1_100 * 1_024)
    for (const rect of Object.values(FISCAL_SPONSORSHIP_FORM_B_RECTS)) {
      expect(rect.page).toBeGreaterThanOrEqual(0)
      expect(rect.page).toBeLessThan(4)
      expect(rect.x).toBeGreaterThanOrEqual(0)
      expect(rect.x + rect.width).toBeLessThanOrEqual(593.04)
      expect(rect.top).toBeGreaterThanOrEqual(0)
      expect(rect.top + rect.height).toBeLessThanOrEqual(839.04)
    }
  })

  it("validates required and constrained fields", () => {
    expect(validateFiscalSponsorshipFormBFields(fields)).toEqual({})
    expect(
      validateFiscalSponsorshipFormBFields({ ...fields, primaryEmail: "bad" })
    ).toMatchObject({ primaryEmail: "Enter a valid email address." })
  })

  it("renders applicant and Coach House signatures into the verified PDF", async () => {
    const input = {
      fields,
      applicantSignature: {
        method: "typed",
        signatureSha256: "a".repeat(64),
        signedAt: "2026-07-16T14:05:00.000Z",
        signerEmail: "caleb@example.org",
        signerName: "Caleb Hamernick",
        signerTitle: "Executive Director",
        value: "Caleb Hamernick",
      },
      coachHouseSignature: {
        method: "typed",
        signatureSha256: "b".repeat(64),
        signedAt: "2026-07-16T15:10:00.000Z",
        signerEmail: "admin@coachhouse.app",
        signerName: "Coach House Admin",
        signerTitle: "Authorized Representative",
        value: "Coach House Admin",
      },
    } as const
    const result = await buildFiscalSponsorshipFormBPdf(input)
    await new Promise((resolve) => setTimeout(resolve, 1_100))
    const repeated = await buildFiscalSponsorshipFormBPdf(input)

    expect(result.bytes.length).toBeGreaterThan(1_000_000)
    expect(result.sha256).toHaveLength(64)
    expect(repeated.sha256).toBe(result.sha256)
  })
})
