import { describe, expect, it } from "vitest"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import {
  computeMemberWorkspaceProjectFilterCounts,
  filterMemberWorkspaceProjects,
} from "@/features/member-workspace/components/projects/member-workspace-project-filters"
import { getMemberWorkspaceProjectBoardColumnOrder } from "@/features/member-workspace/components/projects/member-workspace-project-board-view"
import {
  applyViewOptionsToParams,
  DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS,
  paramsToViewOptions,
} from "@/features/member-workspace/components/projects/member-workspace-project-view-options"

function createProject(
  overrides: Partial<PlatformAdminDashboardLabProject>,
): PlatformAdminDashboardLabProject {
  return {
    id: overrides.id ?? "project-1",
    name: overrides.name ?? "Project",
    taskCount: overrides.taskCount ?? 0,
    progress: overrides.progress ?? 0,
    startDate: overrides.startDate ?? new Date("2026-04-01T00:00:00.000Z"),
    endDate: overrides.endDate ?? new Date("2026-04-30T00:00:00.000Z"),
    status: overrides.status ?? "planned",
    priority: overrides.priority ?? "medium",
    tags: overrides.tags ?? [],
    members: overrides.members ?? [],
    client: overrides.client,
    typeLabel: overrides.typeLabel,
    durationLabel: overrides.durationLabel,
    tasks: overrides.tasks ?? [],
  }
}

describe("member workspace project filters", () => {
  it("matches members exactly instead of by substring", () => {
    const projects = [
      createProject({
        id: "project-ann",
        name: "Ann Project",
        members: ["Ann"],
      }),
      createProject({
        id: "project-joanne",
        name: "Joanne Project",
        members: ["Joanne"],
      }),
    ]

    const filteredProjects = filterMemberWorkspaceProjects({
      filters: [{ key: "Member", value: "Ann" }],
      projects,
      viewOptions: DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS,
    })

    expect(filteredProjects.map((project) => project.id)).toEqual(["project-ann"])
  })

  it("keeps facet counts stable by excluding the active category filter from that facet", () => {
    const projects = [
      createProject({
        id: "project-1",
        status: "planned",
        priority: "high",
        members: ["Paula"],
        tags: ["onboarding"],
      }),
      createProject({
        id: "project-2",
        status: "active",
        priority: "high",
        members: ["Paula"],
        tags: ["onboarding"],
      }),
      createProject({
        id: "project-3",
        status: "completed",
        priority: "low",
        members: ["Joel"],
        tags: ["documents"],
      }),
    ]

    const counts = computeMemberWorkspaceProjectFilterCounts({
      filters: [{ key: "Status", value: "Planned" }],
      projects,
      viewOptions: DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS,
    })

    expect(counts.status).toMatchObject({
      planned: 1,
      active: 1,
      completed: 1,
    })
    expect(counts.priority).toMatchObject({
      high: 1,
    })
  })

  it("respects showClosedProjects when computing filtered results and counts", () => {
    const projects = [
      createProject({
        id: "project-open",
        status: "active",
        members: [],
      }),
      createProject({
        id: "project-closed",
        status: "completed",
        members: [],
      }),
    ]

    const viewOptions = {
      ...DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS,
      showClosedProjects: false,
    }

    const filteredProjects = filterMemberWorkspaceProjects({
      filters: [],
      projects,
      viewOptions,
    })
    const counts = computeMemberWorkspaceProjectFilterCounts({
      filters: [],
      projects,
      viewOptions,
    })

    expect(filteredProjects.map((project) => project.id)).toEqual(["project-open"])
    expect(counts.status).toMatchObject({
      active: 1,
    })
    expect(counts.status?.completed).toBeUndefined()
  })

  it("parses and serializes view options through URL params", () => {
    const params = new URLSearchParams(
      "view=board&order=date&closed=hide&properties=title,assignee",
    )

    const viewOptions = paramsToViewOptions(params)

    expect(viewOptions).toEqual({
      ...DEFAULT_MEMBER_WORKSPACE_PROJECT_VIEW_OPTIONS,
      viewType: "board",
      ordering: "date",
      showClosedProjects: false,
      properties: ["title", "assignee"],
    })

    const nextParams = applyViewOptionsToParams(new URLSearchParams(), viewOptions)

    expect(nextParams.toString()).toBe(
      "view=board&order=date&closed=hide&properties=title%2Cassignee",
    )
  })

  it("includes closed board columns only when showClosedProjects is enabled", () => {
    expect(getMemberWorkspaceProjectBoardColumnOrder(false)).toEqual([
      "backlog",
      "planned",
      "active",
    ])

    expect(getMemberWorkspaceProjectBoardColumnOrder(true)).toEqual([
      "backlog",
      "planned",
      "active",
      "completed",
      "cancelled",
    ])
  })
})
