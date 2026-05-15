import { describe, expect, it } from "vitest"

import {
  buildStarterOrganizationProjects,
  mapOrganizationProjectToViewModel,
} from "@/features/member-workspace/server/project-starter-data"
import {
  MEMBER_WORKSPACE_STARTER_VERSION,
  resolveMemberWorkspaceStorageMode,
} from "@/features/member-workspace/server/starter-data"

describe("member workspace project starter data", () => {
  it("builds starter project inserts with org and actor ownership", () => {
    const projects = buildStarterOrganizationProjects({
      orgId: "org-1",
      actorId: "user-1",
    })

    expect(projects).toHaveLength(1)
    expect(projects[0]).toMatchObject({
      org_id: "org-1",
      name: "Projects preview",
      client_name: "Organization",
      type_label: "Preview",
      created_by: "user-1",
      updated_by: "user-1",
      created_source: "starter_seed",
      starter_seed_version: MEMBER_WORKSPACE_STARTER_VERSION,
    })
    expect(projects[0]?.name).not.toMatch(/fintech|internal|crm|acme/i)
  })

  it("maps persisted project rows into the shared project card view model", () => {
    const mapped = mapOrganizationProjectToViewModel({
      id: "project-1",
      org_id: "org-1",
      name: "Project",
      status: "active",
      priority: "high",
      progress: 45,
      start_date: "2024-01-10",
      end_date: "2024-01-20",
      client_name: "Coach House",
      type_label: "Pilot",
      duration_label: "2 weeks",
      tags: ["pilot"],
      member_labels: ["Joel"],
      task_count: 6,
      created_source: "starter_seed",
      starter_seed_key: "seed-1",
      starter_seed_version: 1,
      created_by: "user-1",
      updated_by: "user-1",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    })

    expect(mapped).toMatchObject({
      id: "project-1",
      name: "Project",
      status: "active",
      priority: "high",
      client: "Coach House",
      typeLabel: "Pilot",
      durationLabel: "2 weeks",
      tags: ["pilot"],
      members: ["Joel"],
      taskCount: 6,
    })
    expect(mapped.startDate.toISOString()).toBe("2024-01-10T00:00:00.000Z")
    expect(mapped.endDate.toISOString()).toBe("2024-01-20T00:00:00.000Z")
  })

  it("summarizes starter/custom storage mode", () => {
    expect(resolveMemberWorkspaceStorageMode([])).toBe("empty")
    expect(
      resolveMemberWorkspaceStorageMode([{ created_source: "starter_seed" }]),
    ).toBe("starter")
    expect(resolveMemberWorkspaceStorageMode([{ created_source: "user" }])).toBe("custom")
    expect(
      resolveMemberWorkspaceStorageMode([
        { created_source: "starter_seed" },
        { created_source: "user" },
      ]),
    ).toBe("mixed")
  })
})
