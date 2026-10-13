import {
  clearMemberWorkspaceStarterDataAction,
  createMemberWorkspaceTaskAction,
  loadMemberWorkspaceTasksPage,
  MemberWorkspaceTasksPage,
  updateMemberWorkspaceTaskOrderAction,
  updateMemberWorkspaceTaskAction,
  updateMemberWorkspaceTaskStatusAction,
} from "@/features/member-workspace"
import { requireMemberWorkspacePageAccess } from "@/lib/workspace/member-workspace-access"

export default async function TasksPage() {
  await requireMemberWorkspacePageAccess("tasks")

  const {
    taskGroups,
    storageMode,
    starterTaskCount,
    hasAnyOrgTasks,
    canResetStarterData,
    canManageTasks,
    scope,
    assigneeOptions,
    projectOptions,
  } = await loadMemberWorkspaceTasksPage()

  return (
    <MemberWorkspaceTasksPage
      initialTaskGroups={taskGroups}
      storageMode={storageMode}
      starterTaskCount={starterTaskCount}
      hasAnyOrgTasks={hasAnyOrgTasks}
      canResetStarterData={canResetStarterData}
      canManageTasks={canManageTasks}
      clearStarterDataAction={clearMemberWorkspaceStarterDataAction}
      updateTaskStatusAction={
        canManageTasks ? updateMemberWorkspaceTaskStatusAction : undefined
      }
      createTaskAction={canManageTasks ? createMemberWorkspaceTaskAction : undefined}
      updateTaskAction={canManageTasks ? updateMemberWorkspaceTaskAction : undefined}
      updateTaskOrderAction={
        canManageTasks ? updateMemberWorkspaceTaskOrderAction : undefined
      }
      scope={scope}
      assigneeOptions={assigneeOptions}
      projectOptions={projectOptions}
    />
  )
}
