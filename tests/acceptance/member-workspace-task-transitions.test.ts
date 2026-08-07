import "./test-utils"

import { readFileSync } from "node:fs"
import { join } from "node:path"

import { beforeEach, describe, expect, it, vi } from "vitest"

const { createSupabaseAdminClientMock } = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

import {
  createMemberWorkspaceTaskTransition,
  deleteMemberWorkspaceTaskTransition,
  reorderMemberWorkspaceTasksTransition,
  updateMemberWorkspaceTaskTransition,
} from "@/features/member-workspace/server/task-transition-support"

describe("member workspace task transitions", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset()
  })

  it("creates the task, assignment, and project count through one RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { ok: true, projectId: "project-1", taskId: "task-1" },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(
      createMemberWorkspaceTaskTransition({
        actorId: "user-1",
        assigneeId: "user-2",
        description: "Confirm requirements.",
        endDate: "2026-08-08",
        priority: "high",
        projectId: "project-1",
        startDate: "2026-08-06",
        status: "todo",
        tagLabel: "Fiscal",
        taskType: "task",
        title: "Review Form B",
        workstreamName: "Fiscal sponsorship",
      })
    ).resolves.toEqual({ ok: true, taskId: "task-1" })

    expect(rpc).toHaveBeenCalledWith("create_organization_task_transition", {
      p_actor_id: "user-1",
      p_assignee_id: "user-2",
      p_description: "Confirm requirements.",
      p_end_date: "2026-08-08",
      p_priority: "high",
      p_project_id: "project-1",
      p_start_date: "2026-08-06",
      p_status: "todo",
      p_tag_label: "Fiscal",
      p_task_type: "task",
      p_title: "Review Form B",
      p_workstream_name: "Fiscal sponsorship",
    })
  })

  it("keeps task, assignee, and count writes in one restricted transaction", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260805233500_atomic_organization_task_creation.sql"
      ),
      "utf8"
    )

    expect(sql).toContain("for update;")
    expect(sql).toContain("insert into public.organization_tasks")
    expect(sql).toContain("insert into public.organization_task_assignees")
    expect(sql).toContain("update public.organization_projects")
    expect(sql).toContain("select count(*)::integer")
    expect(sql).toContain('"organization_tasks_insert"')
    expect(sql).toContain('"organization_task_assignees_insert"')
    expect(sql).toContain("from public, anon, authenticated")
    expect(sql).toContain("to service_role;")
  })

  it("updates task details, assignment, and project move through one RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ok: true,
        previousProjectId: "project-1",
        projectId: "project-2",
        taskId: "task-1",
      },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(
      updateMemberWorkspaceTaskTransition({
        actorId: "user-1",
        assigneeId: "user-2",
        description: "Confirm requirements.",
        endDate: "2026-08-08",
        expectedOrgId: "org-1",
        expectedProjectId: "project-1",
        priority: "high",
        projectId: "project-2",
        startDate: "2026-08-06",
        status: "in-progress",
        tagLabel: "Fiscal",
        taskId: "task-1",
        taskType: "task",
        title: "Review Form B",
        workstreamName: "Fiscal sponsorship",
      })
    ).resolves.toEqual({
      ok: true,
      previousProjectId: "project-1",
      projectId: "project-2",
      taskId: "task-1",
    })

    expect(rpc).toHaveBeenCalledWith(
      "update_organization_task_transition",
      expect.objectContaining({
        p_actor_id: "user-1",
        p_assignee_id: "user-2",
        p_expected_org_id: "org-1",
        p_expected_project_id: "project-1",
        p_project_id: "project-2",
        p_task_id: "task-1",
      })
    )
  })

  it("locks task and projects before moving assignment and counts", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260805234500_atomic_organization_task_updates.sql"
      ),
      "utf8"
    )

    expect(sql.match(/for update;/g)).toHaveLength(2)
    expect(sql).toContain("update public.organization_tasks")
    expect(sql).toContain("delete from public.organization_task_assignees")
    expect(sql).toContain("insert into public.organization_task_assignees")
    expect(sql).toContain("update public.organization_projects project")
    expect(sql).toContain("select count(*)::integer")
    expect(sql).toContain('"organization_tasks_update"')
    expect(sql).toContain('"organization_task_assignees_update"')
    expect(sql).toContain('"organization_task_assignees_delete"')
    expect(sql).toContain("from public, anon, authenticated")
    expect(sql).toContain("to service_role;")
  })

  it("deletes the task and repairs its project count through one RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { ok: true, projectId: "project-1", taskId: "task-1" },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(
      deleteMemberWorkspaceTaskTransition({
        actorId: "user-1",
        expectedOrgId: "org-1",
        expectedProjectId: "project-1",
        taskId: "task-1",
      })
    ).resolves.toEqual({
      ok: true,
      projectId: "project-1",
      taskId: "task-1",
    })

    expect(rpc).toHaveBeenCalledWith("delete_organization_task_transition", {
      p_actor_id: "user-1",
      p_expected_org_id: "org-1",
      p_expected_project_id: "project-1",
      p_task_id: "task-1",
    })
  })

  it("locks task and project before deleting and recalculating count", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260805235500_atomic_organization_task_deletion.sql"
      ),
      "utf8"
    )

    expect(sql.match(/for update;/g)).toHaveLength(2)
    expect(sql).toContain("v_task.org_id is distinct from p_expected_org_id")
    expect(sql).toContain("delete from public.organization_tasks")
    expect(sql).toContain("update public.organization_projects project")
    expect(sql).toContain("select count(*)::integer")
    expect(sql).toContain('"organization_tasks_delete"')
    expect(sql).toContain("from public, anon, authenticated")
    expect(sql).toContain("to service_role;")
  })

  it("reorders the exact task set through one RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { ok: true, projectId: "project-1" },
      error: null,
    })
    createSupabaseAdminClientMock.mockReturnValue({ rpc })

    await expect(
      reorderMemberWorkspaceTasksTransition({
        actorId: "user-1",
        expectedOrgId: "org-1",
        orderedTaskIds: ["task-2", "task-1"],
        projectId: "project-1",
      })
    ).resolves.toEqual({ ok: true, projectId: "project-1" })

    expect(rpc).toHaveBeenCalledWith("reorder_organization_tasks_transition", {
      p_actor_id: "user-1",
      p_expected_org_id: "org-1",
      p_ordered_task_ids: ["task-2", "task-1"],
      p_project_id: "project-1",
    })
  })

  it("locks and verifies the complete task set before one bulk update", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260805235900_atomic_organization_task_reordering.sql"
      ),
      "utf8"
    )

    expect(sql.match(/for update;/g)).toHaveLength(2)
    expect(sql).toContain("v_current_task_ids is distinct from")
    expect(sql).toContain("with ordinality")
    expect(sql).toContain("update public.organization_tasks task")
    expect(sql).toContain("from public, anon, authenticated")
    expect(sql).toContain("to service_role;")
  })
})
