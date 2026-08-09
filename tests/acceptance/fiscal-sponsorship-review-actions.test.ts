import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  canManageFiscalSponsorshipForOrganization: vi.fn(),
  insertFiscalEvent: vi.fn(),
  loadFiscalApplicationForProject: vi.fn(),
  notifyFiscalApplicationReviewed: vi.fn(),
  notifyFiscalDocumentReviewed: vi.fn(),
  resolveProjectAndContext: vi.fn(),
  revalidateFiscalApplicationRoutes: vi.fn(),
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
    mocks.updateFiscalApplicationStatus.mockResolvedValue({ ok: true })
  })

  it.each([
    ["approved", null],
    ["needs_info", "Clarify the budget assumptions."],
    ["declined", "The project is outside the program scope."],
  ] as const)(
    "persists and notifies an application %s decision",
    async (decision, notes) => {
      const insertReview = vi.fn().mockResolvedValue({ error: null })
      const supabase = {
        from: vi.fn((table: string) => {
          if (table !== "fiscal_sponsorship_reviews") {
            throw new Error(`Unexpected table: ${table}`)
          }
          return { insert: insertReview }
        }),
      }
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

      expect(insertReview).toHaveBeenCalledWith(
        expect.objectContaining({
          application_id: "application-1",
          decision,
          notes,
          org_id: "org-1",
          project_id: "project-1",
          reviewed_by: "coach-1",
        })
      )
      expect(mocks.updateFiscalApplicationStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: "application-1",
          patch: expect.objectContaining({
            review_notes: notes,
            status: decision,
          }),
        })
      )
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
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { document_key: "budget_support", id: "document-1" },
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
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

      expect(documentQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          review_notes: notes,
          review_status: decision,
          reviewed_by: "coach-1",
        })
      )
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
