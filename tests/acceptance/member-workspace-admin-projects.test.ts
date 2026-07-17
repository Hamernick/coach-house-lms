import { describe, expect, it, vi } from "vitest"

import { ensureCanonicalAdminProjects } from "@/features/member-workspace/server/admin-projects"
import type { MemberWorkspaceAdminOrganizationSummary } from "@/features/member-workspace/types"

describe("ensureCanonicalAdminProjects", () => {
  it("refreshes organization metadata without overwriting coach-managed project state", async () => {
    const organization: MemberWorkspaceAdminOrganizationSummary = {
      orgId: "org-1",
      canonicalProjectId: "project-1",
      name: "Community Builders",
      ownerName: "Paula Founder",
      ownerAvatarUrl: null,
      publicSlug: "community-builders",
      organizationStatus: "approved",
      isPublic: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-04-14T00:00:00.000Z",
      acceleratorProgress: 42,
      setupProgress: 68,
      setupCompletedCount: 8,
      setupTotalCount: 10,
      missingSetupCount: 2,
      memberCount: 3,
      tags: ["organization", "approved"],
      members: [
        {
          userId: "owner-1",
          name: "Paula Founder",
          email: "paula@example.com",
          avatarUrl: null,
          headline: null,
          organizationRole: "owner",
          platformRole: null,
          isOwner: true,
        },
      ],
      setupItems: [
        { id: "mission", label: "Add mission statement", complete: true },
        {
          id: "roadmap-program",
          label: "Complete roadmap: Program",
          complete: false,
        },
      ],
      profile: {},
    }

    const initialSelectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: "project-1",
              org_id: "org-1",
              canonical_org_id: "org-1",
              project_kind: "organization_admin",
              name: "Acme Corp",
              description: "Coach-authored operating notes",
              status: "planned",
              priority: "low",
              progress: 12,
              start_date: "2026-01-01",
              end_date: "2026-01-14",
              client_name: "Acme Corp",
              type_label: "Pending setup",
              duration_label: "1 member",
              tags: ["dummy"],
              member_labels: ["Jason D"],
              task_count: 1,
              created_source: "system",
              starter_seed_key: null,
              starter_seed_version: null,
              created_by: "org-1",
              updated_by: "org-1",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-01T00:00:00.000Z",
            },
          ],
          error: null,
        })
      ),
    }

    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    }

    const refreshedSelectQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      returns: vi.fn(() =>
        Promise.resolve({
          data: [
            {
              id: "project-1",
              org_id: "org-1",
              canonical_org_id: "org-1",
              project_kind: "organization_admin",
              name: "Community Builders",
              description: "Coach-authored operating notes",
              status: "planned",
              priority: "low",
              progress: 68,
              start_date: "2026-01-01",
              end_date: "2026-01-14",
              client_name: "/community-builders",
              type_label: "Approved nonprofit",
              duration_label: "1 member",
              tags: ["organization", "approved"],
              member_labels: ["Jason D"],
              task_count: 1,
              created_source: "system",
              starter_seed_key: null,
              starter_seed_version: null,
              created_by: "org-1",
              updated_by: "org-1",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-04-14T00:00:00.000Z",
            },
          ],
          error: null,
        })
      ),
    }

    let organizationProjectsCalls = 0
    const supabase = {
      from: vi.fn((table: string) => {
        if (table !== "organization_projects") {
          throw new Error(`Unexpected table query: ${table}`)
        }

        organizationProjectsCalls += 1
        if (organizationProjectsCalls === 1) return initialSelectQuery
        if (organizationProjectsCalls === 2) return updateQuery
        if (organizationProjectsCalls === 3) return refreshedSelectQuery
        throw new Error(
          `Unexpected organization_projects call #${organizationProjectsCalls}`
        )
      }),
    }

    const result = await ensureCanonicalAdminProjects({
      organizations: [organization],
      supabase: supabase as never,
    })

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Community Builders",
        progress: 68,
        client_name: "/community-builders",
        type_label: "Approved nonprofit",
        tags: ["organization", "approved"],
      })
    )
    const updatePayload = updateQuery.update.mock.calls[0]?.[0]
    expect(updatePayload).not.toHaveProperty("description")
    expect(updatePayload).not.toHaveProperty("status")
    expect(updatePayload).not.toHaveProperty("priority")
    expect(updatePayload).not.toHaveProperty("start_date")
    expect(updatePayload).not.toHaveProperty("end_date")
    expect(updatePayload).not.toHaveProperty("duration_label")
    expect(updatePayload).not.toHaveProperty("member_labels")
    expect(updatePayload).not.toHaveProperty("task_count")
    expect(updateQuery.eq).toHaveBeenCalledWith("id", "project-1")
    expect(result).toEqual([
      expect.objectContaining({
        id: "project-1",
        name: "Community Builders",
        client_name: "/community-builders",
      }),
    ])
  })
})
