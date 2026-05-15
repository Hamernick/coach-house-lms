import {
  clearMemberWorkspaceStarterDataAction,
  createMemberWorkspaceProjectAction,
  loadMemberWorkspaceProjectsPage,
  MemberWorkspaceProjectsPage,
  updateMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectScheduleAction,
  updateMemberWorkspaceProjectStatusAction,
} from "@/features/member-workspace"
import { requireMemberWorkspacePageAccess } from "@/lib/workspace/member-workspace-access"

export default async function ProjectsPage() {
  await requireMemberWorkspacePageAccess("projects")

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
      clearStarterDataAction={clearMemberWorkspaceStarterDataAction}
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
