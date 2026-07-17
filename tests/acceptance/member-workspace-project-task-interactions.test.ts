import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

function readProjectComponent(fileName: string) {
  return readFileSync(
    join(
      process.cwd(),
      "src/features/member-workspace/components/projects",
      fileName
    ),
    "utf8"
  )
}

describe("member workspace project task interactions", () => {
  it("persists workstream status changes and rolls back failed optimistic updates", () => {
    const workstreamSource = readFileSync(
      join(
        process.cwd(),
        "src/features/platform-admin-dashboard/upstream/components/projects/WorkstreamTab.tsx"
      ),
      "utf8"
    )
    const detailTabsSource = readProjectComponent(
      "member-workspace-project-detail-tabs.tsx"
    )

    expect(detailTabsSource).toContain(
      "onUpdateTaskStatus={updateTaskStatusAction}"
    )
    expect(workstreamSource).toContain(
      "const result = await onUpdateTaskStatus(taskId, nextStatus)"
    )
    expect(workstreamSource).toContain("setTaskStatus(previousStatus)")
    expect(workstreamSource).toContain("toast.error(result.error)")
    expect(workstreamSource).toContain("disabled={!canToggle}")
    expect(workstreamSource).toContain("WORKSTREAM BREAKDOWN")
    expect(workstreamSource).not.toContain("WORKSTEAM BREAKDOWN")
  })

  it("requires confirmation before either task delete control mutates data", () => {
    const editorSource = readProjectComponent(
      "member-workspace-project-tasks-editor.tsx"
    )
    const dialogSource = readProjectComponent(
      "member-workspace-project-task-delete-dialog.tsx"
    )

    expect(editorSource).toContain("<MemberWorkspaceProjectTaskDeleteDialog")
    expect(dialogSource).toContain("<AlertDialog")
    expect(dialogSource).toContain(
      "<AlertDialogTitle>Delete task?</AlertDialogTitle>"
    )
    expect(dialogSource).toContain("This cannot")
    expect(dialogSource).toContain("be undone.")
    expect(editorSource).toContain(
      "onClick={() => setPendingDeleteTaskId(task.id)}"
    )
    expect(editorSource).toContain("? () => setPendingDeleteTaskId(task.id)")
    expect(dialogSource).toContain("await deleteTaskAction(task.id)")
    expect(dialogSource).toContain("event.preventDefault()")
    expect(editorSource).not.toContain(
      "onClick={() => handleDeleteTask(task.id)}"
    )
    expect(editorSource).not.toContain(
      "onDelete={() => handleDeleteTask(task.id)}"
    )
  })
})
