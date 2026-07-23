import { describe, expect, it, vi } from "vitest"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import { loadFiscalSponsorshipProjectListStatuses } from "@/features/member-workspace/server/fiscal-sponsorship-project-list-status"

function buildProject(
  id: string,
  organizationId: string
): PlatformAdminDashboardLabProject {
  return {
    id,
    organizationId,
    name: id,
    taskCount: 0,
    progress: 0,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: new Date("2026-01-02T00:00:00.000Z"),
    status: "active",
    priority: "medium",
    tags: [],
    members: [],
    tasks: [],
  }
}

function buildQuery(data: unknown[], error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    returns: vi.fn(() => Promise.resolve({ data, error })),
  }
}

describe("member workspace fiscal sponsorship list status", () => {
  it("combines eligibility signals with existing application workflow state", async () => {
    const applicationsQuery = buildQuery([
      { project_id: "project-in-progress", status: "submitted" },
      { project_id: "project-active", status: "countersigned" },
      { project_id: "project-declined", status: "declined" },
    ])
    const organizationsQuery = buildQuery([
      {
        user_id: "org-eligible",
        ein: "12-3456789",
        profile: {
          mission: "Support neighborhood-led public benefit programs.",
          address_street: "100 Main St",
          address_city: "Chicago",
          address_state: "IL",
          address_postal: "60601",
          address_country: "US",
        },
      },
    ])
    const programsQuery = buildQuery([
      {
        user_id: "org-eligible",
        title: "Community pantry",
        subtitle: null,
        description: "Provides food access for neighborhood residents.",
        location: "Chicago",
        location_type: "in_person",
        address_city: "Chicago",
        address_state: "IL",
        address_country: "US",
        features: ["Food access"],
        goal_cents: 500000,
        wizard_snapshot: { fundingSource: "Individual donations" },
      },
    ])
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "fiscal_sponsorship_applications") {
          return applicationsQuery
        }
        if (table === "organizations") return organizationsQuery
        if (table === "programs") return programsQuery
        throw new Error(`Unexpected table: ${table}`)
      }),
    }

    const statuses = await loadFiscalSponsorshipProjectListStatuses({
      projects: [
        buildProject("project-eligible", "org-eligible"),
        buildProject("project-in-progress", "org-progress"),
        buildProject("project-active", "org-active"),
        buildProject("project-declined", "org-declined"),
      ],
      supabase: supabase as never,
    })

    expect(Object.fromEntries(statuses)).toEqual({
      "project-eligible": "eligible",
      "project-in-progress": "in_progress",
      "project-active": "active",
      "project-declined": "not_eligible",
    })
  })

  it("omits fiscal statuses when the supporting schema is unavailable", async () => {
    const missingApplicationsQuery = buildQuery([], { code: "42P01" })
    const emptyQuery = buildQuery([])
    const supabase = {
      from: vi.fn((table: string) =>
        table === "fiscal_sponsorship_applications"
          ? missingApplicationsQuery
          : emptyQuery
      ),
    }

    const statuses = await loadFiscalSponsorshipProjectListStatuses({
      projects: [buildProject("project-1", "org-1")],
      supabase: supabase as never,
    })

    expect(statuses.size).toBe(0)
  })
})
