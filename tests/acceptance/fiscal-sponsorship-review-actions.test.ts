import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  canManageFiscalSponsorshipForOrganization: vi.fn(),
  insertFiscalEvent: vi.fn(),
  loadFiscalApplicationForProject: vi.fn(),
  notifyFiscalApplicationReviewed: vi.fn(),
  notifyFiscalDocumentReviewed: vi.fn(),
  resolveProjectAndContext: vi.fn(),
  revalidateFiscalApplicationRoutes: vi.fn(),
  transitionFiscalApplicationReview: vi.fn(),
  transitionFiscalDocumentReview: vi.fn(),
  updateFiscalApplicationStatus: vi.fn(),
}))

vi.mock(
  "@/features/fiscal-sponsorship/server/workflow-support",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/fiscal-sponsorship/server/workflow-support")
    >()),
    canManageFiscalSponsorshipForOrganization:
      mocks.canManageFiscalSponsorshipForOrganization,
    insertFiscalEvent: mocks.insertFiscalEvent,
    loadFiscalApplicationForProject: mocks.loadFiscalApplicationForProject,
    resolveProjectAndContext: mocks.resolveProjectAndContext,
    revalidateFiscalApplicationRoutes: mocks.revalidateFiscalApplicationRoutes,
    updateFiscalApplicationStatus: mocks.updateFiscalApplicationStatus,
  })
)

vi.mock(
  "@/features/fiscal-sponsorship/server/workflow-transition-support",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/fiscal-sponsorship/server/workflow-transition-support")
    >()),
    transitionFiscalApplicationReview: mocks.transitionFiscalApplicationReview,
    transitionFiscalDocumentReview: mocks.transitionFiscalDocumentReview,
  })
)

vi.mock(
  "@/features/fiscal-sponsorship/server/workflow-notifications",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/fiscal-sponsorship/server/workflow-notifications")
    >()),
    notifyFiscalApplicationReviewed: mocks.notifyFiscalApplicationReviewed,
    notifyFiscalDocumentReviewed: mocks.notifyFiscalDocumentReviewed,
  })
)

import {
  reviewFiscalSponsorshipApplication,
  reviewFiscalSponsorshipDocument,
} from "@/features/fiscal-sponsorship/server/workflow-actions"

const application = {
  id: "application-1",
  org_id: "org-1",
  primary_email: "applicant@example.com",
  project_id: "project-1",
  project_name: "Community kitchen",
  status: "submitted",
  updated_at: "2026-08-08T00:00:00.000Z",
}

function buildReviewContext(supabase: { from: ReturnType<typeof vi.fn> }) {
  return {
    activeOrg: { orgId: "staff-1", role: "member" },
    profileAudience: { platformAccessLevel: "coach" },
    project: { id: "project-1", org_id: "org-1" },
    supabase,
    user: { id: "coach-1" },
  }
}

describe("fiscal sponsorship review actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.canManageFiscalSponsorshipForOrganization.mockResolvedValue(true)
    mocks.insertFiscalEvent.mockResolvedValue(undefined)
    mocks.loadFiscalApplicationForProject.mockResolvedValue({ application })
    mocks.notifyFiscalApplicationReviewed.mockResolvedValue(undefined)
    mocks.notifyFiscalDocumentReviewed.mockResolvedValue(undefined)
    mocks.transitionFiscalApplicationReview.mockResolvedValue({
      ok: true,
      transitioned: true,
    })
    mocks.transitionFiscalDocumentReview.mockResolvedValue({
      documentId: "document-1",
      ok: true,
      transitioned: true,
    })
    mocks.updateFiscalApplicationStatus.mockResolvedValue({ ok: true })
  })

  it.each([
    ["approved", null],
    ["needs_info", "Clarify the budget assumptions."],
    ["declined", "The project is outside the program scope."],
  ] as const)(
    "persists and notifies an application %s decision",
    async (decision, notes) => {
      const supabase = { from: vi.fn() }
      mocks.resolveProjectAndContext.mockResolvedValue(
        buildReviewContext(supabase)
      )

      await expect(
        reviewFiscalSponsorshipApplication({
          decision,
          notes,
          projectId: "project-1",
        })
      ).resolves.toEqual({ ok: true, applicationId: "application-1" })

      expect(mocks.transitionFiscalApplicationReview).toHaveBeenCalledWith({
        actorId: "coach-1",
        applicationId: "application-1",
        decision,
        expectedUpdatedAt: "2026-08-08T00:00:00.000Z",
        notes,
      })
      expect(mocks.notifyFiscalApplicationReviewed).toHaveBeenCalledWith({
        actorId: "coach-1",
        application,
        decision,
      })
      expect(mocks.revalidateFiscalApplicationRoutes).toHaveBeenCalledWith(
        "project-1"
      )
    }
  )

  it("blocks review decisions after the application leaves review", async () => {
    const supabase = { from: vi.fn() }
    mocks.resolveProjectAndContext.mockResolvedValue(
      buildReviewContext(supabase)
    )
    mocks.loadFiscalApplicationForProject.mockResolvedValue({
      application: { ...application, status: "approved" },
    })

    await expect(
      reviewFiscalSponsorshipApplication({
        decision: "declined",
        notes: "Late change",
        projectId: "project-1",
      })
    ).resolves.toEqual({
      error: "Only a submitted application can be reviewed.",
    })

    expect(supabase.from).not.toHaveBeenCalled()
    expect(mocks.updateFiscalApplicationStatus).not.toHaveBeenCalled()
  })

  it.each([
    ["accepted", null],
    ["needs_info", "Upload the current version."],
    ["rejected", "This file belongs to another project."],
    ["not_required", null],
  ] as const)(
    "persists and notifies a document %s decision",
    async (decision, notes) => {
      const documentQuery = {
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            asset_id: "asset-1",
            document_key: "budget_support",
            id: "document-1",
            kind: "budget_support",
            mime: "application/pdf",
            review_notes: null,
            review_status: "pending",
            status: "uploaded",
            title: "Budget support",
            updated_at: "2026-08-08T00:00:00.000Z",
          },
          error: null,
        }),
        select: vi.fn().mockReturnThis(),
      }
      const supabase = {
        from: vi.fn((table: string) => {
          if (table !== "fiscal_sponsorship_documents") {
            throw new Error(`Unexpected table: ${table}`)
          }
          return documentQuery
        }),
      }
      mocks.resolveProjectAndContext.mockResolvedValue(
        buildReviewContext(supabase)
      )

      await expect(
        reviewFiscalSponsorshipDocument({
          decision,
          documentId: "document-1",
          notes,
          projectId: "project-1",
        })
      ).resolves.toEqual({ ok: true, documentId: "document-1" })

      expect(mocks.transitionFiscalDocumentReview).toHaveBeenCalledWith({
        actorId: "coach-1",
        applicationId: "application-1",
        decision,
        documentId: "document-1",
        expectedUpdatedAt: "2026-08-08T00:00:00.000Z",
        notes,
      })
      expect(mocks.notifyFiscalDocumentReviewed).toHaveBeenCalledWith({
        actorId: "coach-1",
        application,
        decision,
        documentId: "document-1",
        documentKey: "budget_support",
      })
      expect(mocks.revalidateFiscalApplicationRoutes).toHaveBeenCalledWith(
        "project-1"
      )
    }
  )
})
