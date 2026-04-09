import { describe, expect, it } from "vitest"

import {
  filterPlatformAdminDashboardLabProjects,
  groupPlatformAdminDashboardLabProjectsByStatus,
  parsePlatformAdminDashboardLabSection,
  parsePlatformAdminDashboardLabViewType,
  platformAdminDashboardLabProjects,
} from "@/features/platform-admin-dashboard/lib/platform-admin-dashboard-lab"

describe("platform-admin-dashboard feature contract", () => {
  it("falls back to safe defaults for invalid route state", () => {
    expect(parsePlatformAdminDashboardLabSection("not-a-section")).toBe(
      "projects",
    )
    expect(parsePlatformAdminDashboardLabViewType("not-a-view")).toBe("list")
  })

  it("filters donor projects by query, status, and priority", () => {
    const projects = filterPlatformAdminDashboardLabProjects(
      platformAdminDashboardLabProjects,
      {
        query: "fintech",
        status: "active",
        priority: "high",
      },
    )

    expect(projects).toHaveLength(1)
    expect(projects[0]?.name).toContain("Fintech")
  })

  it("groups filtered projects into stable status buckets", () => {
    const grouped = groupPlatformAdminDashboardLabProjectsByStatus(
      platformAdminDashboardLabProjects.slice(0, 4),
    )

    expect(grouped.backlog).toHaveLength(1)
    expect(grouped.planned).toHaveLength(0)
    expect(grouped.active).toHaveLength(3)
    expect(grouped.completed).toHaveLength(0)
  })
})
