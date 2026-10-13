import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { withSaveFeedback, WORKSPACE_MUTATION_EVENT } from "@/lib/with-save-feedback"
import { savedProject, upsertSavedProject } from "@/features/member-workspace/lib/saved-project"
import { savedTask, upsertPersonalTask, upsertProjectTask } from "@/features/member-workspace/lib/saved-task"
import { toProjectTask } from "@/features/member-workspace/lib/task-view-model"
import { getProjectDetailsById } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import type { MemberWorkspaceCreateProjectFormInput, MemberWorkspaceCreateTaskInput } from "@/features/member-workspace/types"

const toast = vi.hoisted(() => ({ loading: vi.fn(), success: vi.fn(), error: vi.fn() }))
vi.mock("@/lib/toast", () => ({ toast }))
const messages = { pending: "Saving task…", success: "Task updated" }
const organizations = [{ orgId: "coach-house", name: "Coach House Solutions Group" }]
const people = [{ id: "me", name: "My name", avatarUrl: null }, { id: "other", name: "Other coach", avatarUrl: null }]
const projectInput: MemberWorkspaceCreateProjectFormInput = { name: "New project", status: "planned", priority: "medium" }
const taskInput: MemberWorkspaceCreateTaskInput = { projectId: "project", title: "New task", status: "todo", startDate: "2026-09-28", endDate: "2026-10-18", assigneeUserId: "me" }

describe("save feedback and immediate confirmed state", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    toast.loading.mockReturnValue("save-toast")
    vi.stubGlobal("window", new EventTarget())
  })
  afterEach(() => vi.unstubAllGlobals())

  it("shows saving immediately and confirms only after persistence returns", async () => {
    let finish!: (value: { ok: true; taskId: string }) => void
    const saved = vi.fn()
    window.addEventListener(WORKSPACE_MUTATION_EVENT, saved)
    const pending = withSaveFeedback(() => new Promise<{ ok: true; taskId: string }>(resolve => { finish = resolve }), messages)
    expect(toast.loading).toHaveBeenCalledWith("Saving task…")
    expect(toast.success).not.toHaveBeenCalled()
    expect(saved).not.toHaveBeenCalled()
    finish({ ok: true, taskId: "task" })
    await expect(pending).resolves.toEqual({ ok: true, taskId: "task" })
    expect(toast.success).toHaveBeenCalledWith("Task updated", { id: "save-toast" })
    expect(saved).toHaveBeenCalledOnce()
  })

  it.each(["validation", "network", "unavailable"])("replaces the saving toast with an error for %s failures", async kind => {
    const saved = vi.fn()
    window.addEventListener(WORKSPACE_MUTATION_EVENT, saved)
    const result = await withSaveFeedback(async () => {
      if (kind === "network") throw new Error("Network failed")
      if (kind === "validation") return { error: "Choose a project" }
      return undefined
    }, messages)
    expect(result).toHaveProperty("error")
    expect(toast.error).toHaveBeenCalledWith(expect.any(String), { id: "save-toast" })
    expect(toast.success).not.toHaveBeenCalled()
    expect(saved).not.toHaveBeenCalled()
  })

  it("prepends saved projects once without waiting for a route refresh", () => {
    const previous = savedProject("old", projectInput, undefined, organizations)
    const created = savedProject("new", { ...projectInput, orgId: null }, undefined, organizations)
    const rows = upsertSavedProject([previous], created)
    expect(rows.map(row => row.id)).toEqual(["new", "old"])
    expect(created).toMatchObject({ organizationUnassigned: true, startDate: null, endDate: null })
    expect(created.client).toBeUndefined()
    expect(upsertSavedProject(rows, { ...created, name: "Edited" }).map(row => row.name)).toEqual(["Edited", "New project"])
    expect(previous.name).toBe("New project")
  })

  it("preserves existing project task counts, ownership and recurrence while applying edits", () => {
    const old = { ...savedProject("project", { ...projectInput, recurrence: "monthly" }, undefined, organizations), taskCount: 8, progress: 50 }
    const updated = savedProject("project", { ...projectInput, name: "Renamed", endDate: "2026-10-18" }, old, organizations)
    expect(updated).toMatchObject({ name: "Renamed", taskCount: 8, progress: 50, recurrence: "monthly", organizationId: "coach-house" })
    expect(updated.endDate?.toISOString()).toBe("2026-10-18T00:00:00.000Z")
  })

  it("adds personal tasks immediately, retains due dates and updates without duplicates", () => {
    const groups = upsertPersonalTask([], "task", taskInput, "Project", people, "me")
    expect(groups[0].tasks[0]).toMatchObject({ title: "New task", endDate: "2026-10-18", assignee: { id: "me" } })
    expect(toProjectTask(groups[0].tasks[0]).endDate?.getDate()).toBe(18)
    const updated = upsertPersonalTask(groups, "task", { ...taskInput, title: "Edited" }, "Project", people, "me")
    expect(updated[0].tasks).toHaveLength(1)
    expect(updated[0].tasks[0].title).toBe("Edited")
    expect(groups[0].tasks[0].title).toBe("New task")
    expect(() => JSON.stringify(updated)).not.toThrow()
  })

  it("moves edited tasks between groups and removes assignments belonging to somebody else", () => {
    const groups = upsertPersonalTask([], "task", taskInput, "Project", people, "me")
    const moved = upsertPersonalTask(groups, "task", { ...taskInput, projectId: "different" }, "Different project", people, "me")
    expect(moved.map(group => group.projectId)).toEqual(["different"])
    expect(moved[0].tasks[0].projectName).toBe("Different project")
    expect(upsertPersonalTask(moved, "task", { ...taskInput, assigneeUserId: "other" }, "Project", people, "me")).toEqual([])
  })

  it("updates project task lists, timeline and progress together", () => {
    const project = { ...getProjectDetailsById("project-1"), workstreams: [], timelineTasks: [] }
    const task = savedTask("task", { ...taskInput, status: "done" }, project.name, people)
    const updated = upsertProjectTask(project, task)
    expect(updated.workstreams[0].tasks[0].name).toBe("New task")
    expect(updated.time.progressPercent).toBe(100)
    expect(updated.source?.taskCount).toBe(1)
    expect(updated.timelineTasks[0].status).toBe("done")
    const edited = upsertProjectTask(updated, { ...task, name: "Renamed", workstreamName: "New workstream", status: "todo" })
    expect(edited.workstreams).toHaveLength(1)
    expect(edited.workstreams[0].name).toBe("New workstream")
    expect(edited.time.progressPercent).toBe(0)
    expect(edited.timelineTasks).toHaveLength(1)
  })
})
