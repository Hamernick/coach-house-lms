import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { selectFiscalReviewerRecipientIds } from "@/features/fiscal-sponsorship/lib/reviewer-recipients"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("fiscal sponsorship coach milestones", () => {
  it("notifies developers and assigned coaches only", () => {
    expect(
      selectFiscalReviewerRecipientIds({
        assignments: [
          { coach_user_id: "coach-assigned" },
          { coach_user_id: "coach-actor" },
        ],
        excludeUserId: "coach-actor",
        staff: [
          { access_level: "developer", user_id: "developer" },
          { access_level: "coach", user_id: "coach-assigned" },
          { access_level: "coach", user_id: "coach-unassigned" },
          { access_level: "coach", user_id: "coach-actor" },
        ],
      })
    ).toEqual(["developer", "coach-assigned"])
  })

  it("routes review milestones to assigned reviewers", () => {
    const notifications = readSource(
      "src/features/fiscal-sponsorship/server/workflow-notifications.ts"
    )
    const signingActions = readSource(
      "src/features/fiscal-sponsorship/server/native-signing-actions.ts"
    )

    expect(notifications).toContain("organization_coach_assignments")
    expect(notifications).toContain("loadFiscalReviewerRecipientIds")
    expect(notifications).toContain("fiscal_sponsorship_application_submitted")
    expect(notifications).toContain("fiscal_sponsorship_document_connected")
    expect(notifications).toContain("fiscal_sponsorship_applicant_signed")
    expect(notifications).toContain("`/fiscal-sponsorship/sign/${packetId}`")
    expect(notifications).toContain(
      '"/my-organization?focus=fiscal-sponsorship"'
    )
    expect(notifications).toContain("member_email")
    expect(notifications).toContain("primaryApplicantEmail")
    expect(notifications).toContain(
      "`/organizations/${application.project_id}`"
    )
    expect(signingActions).toContain("notifyFiscalApplicantSigned")
  })

  it("limits review and countersign actions to assigned coaches", () => {
    const workflowSupport = readSource(
      "src/features/fiscal-sponsorship/server/workflow-support.ts"
    )
    const authorization = readSource(
      "src/features/fiscal-sponsorship/lib/authorization.ts"
    )
    const workflowActions = readSource(
      "src/features/fiscal-sponsorship/server/workflow-actions.ts"
    )
    const agreementActions = readSource(
      "src/features/fiscal-sponsorship/server/workflow-agreement-actions.ts"
    )
    const signingContext = readSource(
      "src/features/fiscal-sponsorship/server/native-signing-context.ts"
    )
    const organizationPage = readSource(
      "src/app/(dashboard)/organizations/[id]/page.tsx"
    )

    expect(workflowSupport).toContain(
      "canManageFiscalSponsorshipForOrganization"
    )
    expect(authorization).toContain("organization_coach_assignments")
    expect(authorization).toContain('accessLevel === "developer"')
    expect(authorization).toContain('accessLevel !== "coach"')
    expect(workflowActions).toContain(
      "canManageFiscalSponsorshipForOrganization"
    )
    expect(workflowActions).toContain(
      '!["submitted", "in_review"].includes(loaded.application.status)'
    )
    expect(agreementActions).toContain(
      "canManageFiscalSponsorshipForOrganization"
    )
    expect(signingContext).toContain(
      "canManageFiscalSponsorshipForOrganization"
    )
    expect(organizationPage).toContain("organizationCoachAssignments.some")
  })
})
