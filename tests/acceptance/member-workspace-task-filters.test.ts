import { describe, expect, it } from "vitest"

import {
  computeTaskFilterCounts,
  filterTasksByChips,
} from "@/features/platform-admin-dashboard/upstream/components/tasks/task-helpers"
import type { ProjectTask } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"

const TASKS: ProjectTask[] = [
  {
    id: "task-1",
    name: "Review intake",
    status: "todo",
    assignee: { id: "user-ann", name: "Ann Lee", avatarUrl: "/ann.png" },
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    dueLabel: "02/04/2026",
    priority: "high",
    tag: "Feature",
    projectId: "project-1",
    projectName: "Alpha",
    workstreamId: "alpha-general",
    workstreamName: "General",
  },
  {
    id: "task-2",
    name: "Finalize docs",
    status: "in-progress",
    assignee: { id: "user-joanne", name: "Joanne Hart", avatarUrl: "/joanne.png" },
    startDate: new Date("2026-04-02T00:00:00.000Z"),
    dueLabel: "03/04/2026",
    priority: "medium",
    tag: "Bug",
    projectId: "project-1",
    projectName: "Alpha",
    workstreamId: "alpha-general",
    workstreamName: "General",
  },
  {
    id: "task-3",
    name: "Ship update",
    status: "done",
    startDate: new Date("2026-04-03T00:00:00.000Z"),
    dueLabel: "04/04/2026",
    priority: "high",
    tag: "Feature",
    projectId: "project-2",
    projectName: "Beta",
    workstreamId: "beta-general",
    workstreamName: "General",
  },
]

describe("member workspace task filters", () => {
  it("matches members exactly instead of substring matching", () => {
    const result = filterTasksByChips(TASKS, [
      { key: "Member", value: "Ann Lee" },
    ])

    expect(result.map((task) => task.id)).toEqual(["task-1"])
  })

  it("applies status, priority, tag, and member filters together", () => {
    const result = filterTasksByChips(TASKS, [
      { key: "Status", value: "Todo" },
      { key: "Priority", value: "High" },
      { key: "Tag", value: "feature" },
      { key: "Member", value: "Ann Lee" },
    ])

    expect(result.map((task) => task.id)).toEqual(["task-1"])
  })

  it("computes faceted counts from the real filtered task set", () => {
    const counts = computeTaskFilterCounts(TASKS, [
      { key: "Tag", value: "feature" },
    ])

    expect(counts.status).toEqual({
      todo: 1,
      done: 1,
    })
    expect(counts.members).toEqual({
      "ann lee": 1,
      current: 1,
      "no-member": 1,
    })
  })
})
