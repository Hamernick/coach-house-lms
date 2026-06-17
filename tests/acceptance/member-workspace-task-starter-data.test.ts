import { describe, expect, it } from "vitest"

import {
  buildStarterOrganizationTaskAssignees,
  buildStarterOrganizationTasks,
  mapTaskRowsToGroups,
} from "@/features/member-workspace/server/task-starter-data"

describe("member workspace task starter data", () => {
  it("builds starter tasks for seeded starter projects", () => {
    const tasks = buildStarterOrganizationTasks({
      orgId: "org-1",
      actorId: "user-1",
      projectIdByStarterKey: new Map([
        ["1", "project-db-1"],
      ]),
    })

    expect(tasks).toHaveLength(3)
    expect(tasks[0]).toMatchObject({
      org_id: "org-1",
      project_id: "project-db-1",
      title: "Review the sample project",
      created_by: "user-1",
      updated_by: "user-1",
      created_source: "starter_seed",
    })
    expect(tasks[0]?.starter_seed_key).toContain(":")
    expect(tasks.map((task) => task.title).join(" ")).not.toMatch(
      /fintech|internal|crm|acme/i,
    )
  })

  it("builds task assignees from seeded starter tasks", () => {
    const assignees = buildStarterOrganizationTaskAssignees({
      orgId: "org-1",
      actorId: "user-1",
      assigneeUserId: "user-2",
      taskIdByStarterKey: new Map([
        ["1:1-1", "task-db-1"],
        ["1:1-2", "task-db-2"],
      ]),
    })

    expect(assignees.length).toBeGreaterThan(0)
    expect(assignees[0]).toMatchObject({
      org_id: "org-1",
      task_id: "task-db-1",
      user_id: "user-2",
      created_by: "user-1",
    })
  })

  it("groups mapped task items by project", () => {
    const groups = mapTaskRowsToGroups([
      {
        id: "task-1",
        projectId: "project-1",
        projectName: "Alpha",
        projectClient: "Org",
        title: "First task",
        taskType: "task",
        status: "todo",
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        canUpdate: true,
      },
      {
        id: "task-2",
        projectId: "project-1",
        projectName: "Alpha",
        projectClient: "Org",
        title: "Second task",
        taskType: "bug",
        status: "done",
        startDate: "2026-01-03",
        endDate: "2026-01-04",
        canUpdate: true,
      },
      {
        id: "task-3",
        projectId: "project-2",
        projectName: "Beta",
        projectClient: null,
        title: "Third task",
        taskType: "improvement",
        status: "in-progress",
        startDate: "2026-01-03",
        endDate: "2026-01-05",
        canUpdate: true,
      },
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({
      projectId: "project-1",
      projectName: "Alpha",
    })
    expect(groups[0]?.tasks).toHaveLength(2)
  })
})
