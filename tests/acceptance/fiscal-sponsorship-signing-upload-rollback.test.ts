import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

describe("native signing upload rollback", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "src/features/fiscal-sponsorship/server/native-signing-actions.ts"
    ),
    "utf8"
  )

  it("removes the applicant PDF only when finalization fails", () => {
    const applicantSource = source
      .split("async function completeApplicantSignature")[1]
      .split("async function completeCoachSignature")[0]

    expect(applicantSource).toContain("if (error) {")
    expect(applicantSource).toContain("removePrivatePdfs([storagePath])")
    expect(applicantSource.indexOf("if (error) {")).toBeLessThan(
      applicantSource.indexOf("notifyFiscalApplicantSigned")
    )
  })

  it("removes the first Coach House upload if the second upload fails", () => {
    const coachSource = source
      .split("async function completeCoachSignature")[1]
      .split("export async function completeFiscalSponsorshipSignature")[0]

    expect(coachSource).toContain("const uploadedPaths: string[] = []")
    expect(coachSource).toContain("uploadedPaths.push(executedPath)")
    expect(coachSource).toContain("uploadedPaths.push(auditPath)")
    expect(coachSource).toContain("await removePrivatePdfs(uploadedPaths)")
  })

  it("does not remove committed documents for malformed response parsing", () => {
    const coachSource = source
      .split("async function completeCoachSignature")[1]
      .split("export async function completeFiscalSponsorshipSignature")[0]
    const malformedResponseBlock = coachSource.split(
      'if (!data || typeof data !== "object" || Array.isArray(data))'
    )[1]

    expect(malformedResponseBlock).not.toContain("removePrivatePdfs")
  })
})
