"use client"

import { FiscalGuestEmailStatus } from "./fiscal-guest-email-status"
import { buildFiscalSponsorshipProjectWorkbenchData } from "../lib/project-workbench-data"
import type { FiscalSponsorshipApplicationRecord, FiscalSponsorshipProjectWorkflowSummary } from "../types"
import { reviewFiscalSponsorshipApplication } from "../actions"
import { FiscalSponsorshipProjectWorkbench } from "./fiscal-sponsorship-project-workbench"
import { FiscalGuestApplicationDetails } from "./fiscal-guest-application-details"

export function FiscalGuestProjectWorkbench({
  projectId, projectName, application, workflow, emailDelivery,
}: {
  emailDelivery?: { recipient: string; status: string; queuedAt: string; occurredAt: string | null }[] | null
  projectId: string
  projectName: string
  application: FiscalSponsorshipApplicationRecord
  workflow: FiscalSponsorshipProjectWorkflowSummary
}) {
  const data = buildFiscalSponsorshipProjectWorkbenchData({
    project: { id: projectId, name: projectName, description: application.projectDescription,
      locationLabel: application.projectLocation },
    organization: { name: application.applicantFullName || "Guest applicant", ownerName: application.applicantFullName },
    workflowSummary: { ...workflow, canCompleteW9: false },
  })
  data.metrics = data.metrics.filter((metric) => metric.id !== "team")
  return (
    <>
      <FiscalGuestEmailStatus deliveries={emailDelivery} />
      <FiscalSponsorshipProjectWorkbench
        className="max-w-none shadow-none"
        data={data}
        applicationActionLabel="View"
        renderApplicationEditor={({ open }) => open ? <FiscalGuestApplicationDetails application={application} /> : null}
        reviewFiscalSponsorshipApplicationAction={reviewFiscalSponsorshipApplication}
      />
    </>
  )
}
