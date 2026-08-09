"use client"

import { useEffect, useMemo, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  buildFiscalSponsorshipProjectWorkbenchData,
  FiscalSponsorshipProjectWorkbench,
  type FiscalSponsorshipProjectWorkflowSummary,
  type FiscalSponsorshipProjectWorkflowSummaryDocument,
} from "@/features/fiscal-sponsorship"

type FiscalRoleJourney =
  | "applicant"
  | "assigned-coach"
  | "sponsor-operator"
  | "denied"

const ROLE_OPTIONS: Array<{ id: FiscalRoleJourney; label: string }> = [
  { id: "applicant", label: "Applicant" },
  { id: "assigned-coach", label: "Assigned coach" },
  { id: "sponsor-operator", label: "Sponsor operator" },
  { id: "denied", label: "Denied role" },
]

const ACCEPTED_W9: FiscalSponsorshipProjectWorkflowSummaryDocument = {
  assetId: "asset-w9",
  documentKey: "tax_id_confirmation",
  downloadHref: "/api/fiscal-sponsorship/documents/document-w9?download=1",
  generatedAt: "2026-08-06T12:00:00.000Z",
  id: "document-w9",
  kind: "tax_form",
  reviewNotes: null,
  reviewedAt: "2026-08-06T12:05:00.000Z",
  reviewStatus: "accepted",
  status: "executed",
  storagePath: "org-1/project-1/w9.pdf",
  title: "Signed IRS Form W-9",
  uploadedAt: "2026-08-06T12:00:00.000Z",
  version: 1,
  viewHref: "/api/fiscal-sponsorship/documents/document-w9",
}

function createWorkflowSummary(
  role: Exclude<FiscalRoleJourney, "denied">
): FiscalSponsorshipProjectWorkflowSummary {
  const sponsorOperator = role === "sponsor-operator"
  const applicationStatus = sponsorOperator
    ? "approved"
    : role === "assigned-coach"
      ? "submitted"
      : "draft"

  return {
    applicationId: "application-1",
    applicationStatus,
    canCompleteW9: role === "applicant",
    events: [
      {
        actorId: "applicant-1",
        applicationId: "application-1",
        createdAt: "2026-08-06T12:00:00.000Z",
        eventType: "application_saved",
        id: "event-1",
        metadata: {},
        summary: "Applicant saved the fiscal sponsorship application.",
      },
    ],
    latestAgreementDocument: null,
    latestAuditCertificateDocument: null,
    latestExecutedAgreementDocument: null,
    latestSignaturePacket: null,
    legalEntityType: "individual",
    requiredDocuments: sponsorOperator ? [ACCEPTED_W9] : [],
    reviewNotes: null,
    reviewedAt: sponsorOperator ? "2026-08-06T12:10:00.000Z" : null,
    submittedAt:
      role === "assigned-coach" || sponsorOperator
        ? "2026-08-06T12:05:00.000Z"
        : null,
  }
}

function buildRoleData(role: Exclude<FiscalRoleJourney, "denied">) {
  return buildFiscalSponsorshipProjectWorkbenchData({
    applicationPrefill: {
      applicantFullName: "Maya Johnson",
      applicantFirstName: "Maya",
      applicantLastName: "Johnson",
      primaryEmail: "maya@example.org",
      projectName: "Neighborhood Arts Access",
    },
    organization: {
      memberCount: 3,
      name: "Community Arts Collaborative",
      ownerName: "Maya Johnson",
      setupCompletedCount: 12,
      setupTotalCount: 12,
    },
    project: {
      assigneeCount: 2,
      description: "Free neighborhood arts programming.",
      fileCount: 2,
      id: "project-1",
      locationLabel: "Chicago, Illinois",
      name: "Neighborhood Arts Access",
      statusLabel: "Active",
    },
    workflowSummary: createWorkflowSummary(role),
  })
}

function ApplicantEditorFixture({ onSave }: { onSave: () => void }) {
  return (
    <section
      aria-label="Fiscal sponsorship application editor"
      className="bg-muted/50 mt-3 rounded-xl border p-4"
    >
      <p className="text-sm font-medium">Application editor available</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Maya can continue her saved application without review controls.
      </p>
      <Button className="mt-3 rounded-full" size="sm" onClick={onSave}>
        Save draft
      </Button>
    </section>
  )
}

export function FiscalSponsorshipRoleJourneyFixture() {
  const [hydrated, setHydrated] = useState(false)
  const [role, setRole] = useState<FiscalRoleJourney>("applicant")
  const [lastAction, setLastAction] = useState("No action yet")
  const data = useMemo(
    () => (role === "denied" ? null : buildRoleData(role)),
    [role]
  )

  useEffect(() => setHydrated(true), [])

  function selectRole(nextRole: FiscalRoleJourney) {
    setRole(nextRole)
    setLastAction("No action yet")
  }

  return (
    <main
      className="bg-background min-h-svh p-4 sm:p-8"
      data-fiscal-sponsorship-role-journey-fixture=""
    >
      <output
        className="sr-only"
        data-testid="role-journey-hydrated"
        data-hydrated={hydrated ? "true" : "false"}
      >
        {hydrated ? "Ready" : "Loading"}
      </output>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="space-y-3">
          <div>
            <h1 className="text-xl font-semibold">Fiscal role journeys</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Browser-only verification using the production fiscal workbench.
            </p>
          </div>
          <nav
            aria-label="Fiscal role journey"
            className="flex flex-wrap gap-2"
          >
            {ROLE_OPTIONS.map((option) => (
              <Button
                key={option.id}
                aria-pressed={role === option.id}
                className="rounded-full"
                size="sm"
                type="button"
                variant={role === option.id ? "default" : "outline"}
                onClick={() => selectRole(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </nav>
        </header>

        <output
          className="bg-muted/40 rounded-xl border px-4 py-3 text-sm"
          data-testid="role-journey-result"
        >
          {lastAction}
        </output>

        {role === "denied" ? (
          <Alert variant="destructive">
            <AlertTitle>Fiscal sponsorship unavailable</AlertTitle>
            <AlertDescription>
              You are not assigned to this fiscal sponsorship project.
            </AlertDescription>
          </Alert>
        ) : data ? (
          <FiscalSponsorshipProjectWorkbench
            data={data}
            editApplicationDisabled={role !== "applicant"}
            generateFiscalSponsorshipAgreementAction={
              role === "sponsor-operator"
                ? async () => {
                    setLastAction("Agreement prepared by sponsor operator")
                    return {
                      applicationId: "application-1",
                      assetId: "asset-agreement",
                      documentId: "document-agreement",
                      ok: true,
                    }
                  }
                : undefined
            }
            renderApplicationEditor={
              role === "applicant"
                ? ({ open }) =>
                    open ? (
                      <ApplicantEditorFixture
                        onSave={() => setLastAction("Applicant draft saved")}
                      />
                    ) : null
                : undefined
            }
            reviewFiscalSponsorshipApplicationAction={
              role === "assigned-coach"
                ? async () => {
                    setLastAction("Application approved by assigned coach")
                    return { applicationId: "application-1", ok: true }
                  }
                : undefined
            }
          />
        ) : null}
      </div>
    </main>
  )
}
