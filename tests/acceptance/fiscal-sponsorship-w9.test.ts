import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

import { PDFDocument } from "pdf-lib"
import { describe, expect, it } from "vitest"

import {
  FISCAL_SPONSORSHIP_W9_TEMPLATE,
  getFiscalSponsorshipW9CertificationText,
  redactFiscalSponsorshipW9Fields,
  validateFiscalSponsorshipW9Fields,
  type FiscalSponsorshipW9Fields,
} from "@/features/fiscal-sponsorship/lib/w9-field-manifest"
import { buildFiscalSponsorshipW9Pdf } from "@/features/fiscal-sponsorship/lib/w9-pdf"

const fields: FiscalSponsorshipW9Fields = {
  accountNumber: "CH-AB12CD34",
  address: "123 North State Street",
  businessName: "",
  city: "Chicago",
  exemptPayeeCode: "",
  fatcaExemptionCode: "",
  foreignPartnersOwnersBeneficiaries: false,
  llcClassification: "",
  name: "Sample Community Arts Initiative",
  otherClassification: "",
  postalCode: "60601",
  state: "IL",
  subjectToBackupWithholding: false,
  taxClassification: "individual",
  tin: "123-45-6789",
  tinType: "ssn",
}

describe("fiscal sponsorship W-9 completion", () => {
  it("pins the current official template and validates taxpayer fields", () => {
    const templateBytes = readFileSync("public/fiscal-sponsorship/form-w-9.pdf")
    const templateSha256 = createHash("sha256")
      .update(templateBytes)
      .digest("hex")

    expect(FISCAL_SPONSORSHIP_W9_TEMPLATE.revision).toBe("March 2024")
    expect(templateSha256).toBe(FISCAL_SPONSORSHIP_W9_TEMPLATE.sha256)
    expect(validateFiscalSponsorshipW9Fields(fields)).toEqual({})
    expect(getFiscalSponsorshipW9CertificationText(false)).toContain(
      "Under penalties of perjury"
    )
    expect(getFiscalSponsorshipW9CertificationText(false)).toContain(
      "I am not subject to backup withholding"
    )
    expect(
      validateFiscalSponsorshipW9Fields({ ...fields, tin: "1234" })
    ).toMatchObject({ tin: "Enter a nine-digit SSN, ITIN, or EIN." })
  })

  it("generates a flattened signed PDF without retaining raw TIN metadata", async () => {
    const result = await buildFiscalSponsorshipW9Pdf({
      fields,
      signature: {
        method: "typed",
        signedAt: "2026-07-27T14:05:00.000Z",
        signerName: "Caleb Hamernick",
        value: "Caleb Hamernick",
      },
    })
    const document = await PDFDocument.load(result.bytes)
    const redacted = redactFiscalSponsorshipW9Fields(fields)

    expect(result.bytes.length).toBeGreaterThan(100_000)
    expect(result.sha256).toHaveLength(64)
    expect(document.getPageCount()).toBe(6)
    expect(document.getForm().getFields()).toHaveLength(0)
    expect(redacted).not.toHaveProperty("tin")
    expect(redacted.tinLast4).toBe("6789")
  })

  it("enforces assigned-signer access, private storage, review, and immutability", () => {
    const actions = readFileSync(
      "src/features/fiscal-sponsorship/server/w9-actions.ts",
      "utf8"
    )
    const sessionSupport = readFileSync(
      "src/features/fiscal-sponsorship/server/w9-session-support.ts",
      "utf8"
    )
    const agreementActions = readFileSync(
      "src/features/fiscal-sponsorship/server/workflow-agreement-actions.ts",
      "utf8"
    )
    const migration = readFileSync(
      "supabase/migrations/20260727130000_complete_fiscal_sponsorship_signing.sql",
      "utf8"
    )

    expect(sessionSupport).toContain("resolveFiscalApplicantSigner")
    expect(sessionSupport).toContain(
      "context.user.id !== signerResult.signer.id"
    )
    expect(actions).toContain("redactFiscalSponsorshipW9Fields(fields)")
    expect(actions).toContain("certificationSha256")
    expect(actions).toContain("FISCAL_SPONSORSHIP_SIGNING_BUCKET")
    expect(actions).not.toContain("field_values: fields")
    expect(agreementActions).toContain(
      "Accept the applicant’s completed W-9 before preparing an agreement."
    )
    expect(migration).toContain("reject_executed_fiscal_tax_form_mutation")
    expect(migration).toContain("Executed fiscal tax forms are immutable")
    expect(migration).toContain("om.role in ('owner', 'admin', 'staff')")
  })

  it("offers the assigned applicant direct W-9 completion in the workbench", () => {
    const summary = readFileSync(
      "src/features/fiscal-sponsorship/server/workflow-summary.ts",
      "utf8"
    )
    const workbench = readFileSync(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-project-workbench-required-documents.tsx",
      "utf8"
    )

    expect(summary).toContain("canCompleteW9")
    expect(summary).toContain("application.primary_email")
    expect(workbench).toContain("Complete W-9")
    expect(workbench).toContain("New W-9")
    expect(workbench).toContain("/fiscal-sponsorship/w9/${projectId}")
  })
})
