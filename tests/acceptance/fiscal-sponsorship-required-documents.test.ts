import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("fiscal sponsorship required documents", () => {
  it("keeps required documents keyed, dynamic, and review-note aware", () => {
    const requiredDocuments = readSource(
      "src/features/fiscal-sponsorship/lib/required-documents.ts"
    )
    const requiredDocumentWorkbench = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-project-workbench-required-documents.tsx"
    )
    const requiredDocumentConnectPanel = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-required-document-connect-panel.tsx"
    )
    const projectWorkbench = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-project-workbench.tsx"
    )
    const projectWorkbenchDocuments = readSource(
      "src/features/fiscal-sponsorship/components/fiscal-sponsorship-project-workbench-documents.tsx"
    )
    const projectWorkbenchData = readSource(
      "src/features/fiscal-sponsorship/lib/project-workbench-data.ts"
    )
    const projectWorkbenchDataHelpers = readSource(
      "src/features/fiscal-sponsorship/lib/project-workbench-data-helpers.ts"
    )
    const types = readSource("src/features/fiscal-sponsorship/types.ts")
    const requiredDocumentKeys = [
      "tax_id_confirmation",
      "governing_documents",
      "formation_or_good_standing",
      "budget_support",
      "fundraising_materials",
      "insurance",
      "grant_request_support",
      "grantee_report",
      "closeout_report",
      "additional_info",
    ]

    expect(
      Array.from(
        requiredDocuments.matchAll(/key: "([^"]+)"/g),
        (match) => match[1]
      )
    ).toEqual(requiredDocumentKeys)
    expect(requiredDocuments).toContain("legalEntityTypes")
    expect(requiredDocuments).toContain("stage")
    expect(requiredDocuments).toContain(
      "filterFiscalSponsorshipRequiredDocuments"
    )
    for (const key of requiredDocumentKeys) {
      expect(requiredDocuments).toContain(`key: "${key}"`)
      expect(types).toContain(`| "${key}"`)
    }

    expect(types).toContain("connectFiscalSponsorshipDocumentAssetAction")
    expect(requiredDocumentWorkbench).toContain("visibleRequirements.map")
    expect(requiredDocumentWorkbench).toContain("Not required")
    expect(requiredDocumentWorkbench).toContain(
      "data-fiscal-sponsorship-required-document={requirement.key}"
    )
    expect(requiredDocumentWorkbench).toContain(
      "connectFiscalSponsorshipDocumentAssetAction"
    )
    expect(requiredDocumentConnectPanel).toContain(
      "await connectDocumentAssetAction({"
    )
    expect(requiredDocumentWorkbench).not.toContain(
      'import { connectFiscalSponsorshipDocumentAsset } from "../actions"'
    )
    expect(projectWorkbench).toContain(
      "connectFiscalSponsorshipDocumentAssetAction={"
    )

    expect(requiredDocumentWorkbench).toContain(
      "reviewFiscalSponsorshipDocumentAction"
    )
    expect(requiredDocumentWorkbench).toContain("const canReviewDocuments")
    expect(requiredDocumentWorkbench).toContain("Textarea")
    expect(requiredDocumentWorkbench).toContain("reviewNotes")
    expect(requiredDocumentWorkbench).toContain("reviewDecisionRequiresNote")
    expect(requiredDocumentWorkbench).toContain(
      "Add a review note before requesting changes."
    )
    expect(requiredDocumentWorkbench).toContain("notes: notes || null")
    expect(requiredDocumentWorkbench).toContain('decision: "accepted"')
    expect(requiredDocumentWorkbench).toContain('decision: "needs_info"')
    expect(requiredDocumentWorkbench).toContain('decision: "rejected"')

    expect(projectWorkbench).toContain(
      "documents={data.workflowSummary?.requiredDocuments ?? []}"
    )
    expect(projectWorkbenchData).toContain('id: "generated-agreement"')
    expect(projectWorkbenchData).toContain('id: "executed-agreement"')
    expect(projectWorkbenchData).toContain('id: "audit-certificate"')
    expect(projectWorkbenchDocuments).not.toContain(
      "reviewFiscalSponsorshipDocumentAction"
    )
    expect(projectWorkbenchDocuments).not.toContain("Needs info")

    for (const source of [
      projectWorkbench,
      projectWorkbenchDocuments,
      requiredDocumentWorkbench,
      projectWorkbenchData,
      projectWorkbenchDataHelpers,
    ]) {
      expect(source.toLowerCase()).not.toMatch(/\b(sample|prototype|dummy)\b/)
      expect(source.toLowerCase()).not.toMatch(
        /\bplaceholder (pdf|document|file|asset)\b/
      )
    }
  })
})
