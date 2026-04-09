import {
  createMemberWorkspaceProjectAction,
  loadMemberWorkspaceProjectsPage,
  MemberWorkspaceProjectsPage,
  resetMemberWorkspaceStarterProjectsAction,
  updateMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectScheduleAction,
  updateMemberWorkspaceProjectStatusAction,
} from "@/features/member-workspace"

export default async function ProjectsPage() {
  const {
    projects,
    storageMode,
    canResetStarterData,
    starterProjectCount,
    canCreateProjects,
    scope,
    organizationOptions,
    assigneeOptions,
  } = await loadMemberWorkspaceProjectsPage()

  return (
    <MemberWorkspaceProjectsPage
      projects={projects}
      storageMode={storageMode}
      canResetStarterData={canResetStarterData}
      starterProjectCount={starterProjectCount}
      resetStarterProjectsAction={resetMemberWorkspaceStarterProjectsAction}
      createProjectAction={canCreateProjects ? createMemberWorkspaceProjectAction : undefined}
      updateProjectAction={canCreateProjects ? updateMemberWorkspaceProjectAction : undefined}
      updateProjectScheduleAction={
        canCreateProjects ? updateMemberWorkspaceProjectScheduleAction : undefined
      }
      updateProjectStatusAction={
        canCreateProjects ? updateMemberWorkspaceProjectStatusAction : undefined
      }
      canCreateProjects={canCreateProjects}
      scope={scope}
      organizationOptions={organizationOptions}
      assigneeOptions={assigneeOptions}
    />
  )
}
