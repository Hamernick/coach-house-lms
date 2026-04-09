import {
  createMemberWorkspaceTaskAction,
  loadMemberWorkspaceTasksPage,
  MemberWorkspaceTasksPage,
  resetMemberWorkspaceStarterProjectsAction,
  updateMemberWorkspaceTaskOrderAction,
  updateMemberWorkspaceTaskAction,
  updateMemberWorkspaceTaskStatusAction,
} from "@/features/member-workspace"

export default async function MyTasksPage() {
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
      resetStarterProjectsAction={resetMemberWorkspaceStarterProjectsAction}
      updateTaskStatusAction={updateMemberWorkspaceTaskStatusAction}
      createTaskAction={createMemberWorkspaceTaskAction}
      updateTaskAction={updateMemberWorkspaceTaskAction}
      updateTaskOrderAction={updateMemberWorkspaceTaskOrderAction}
      scope={scope}
      assigneeOptions={assigneeOptions}
      projectOptions={projectOptions}
    />
  )
}
