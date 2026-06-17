import {
  clearMemberWorkspaceStarterDataAction,
  createMemberWorkspaceProjectAction,
  loadMemberWorkspaceProjectsPage,
  MemberWorkspaceProjectsPage,
  updateMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectScheduleAction,
  updateMemberWorkspaceProjectStatusAction,
} from "@/features/member-workspace"
import { requireAdmin } from "@/lib/admin/auth"

export default async function OrganizationsPage() {
  await requireAdmin()

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
      createProjectAction={
        canCreateProjects ? createMemberWorkspaceProjectAction : undefined
      }
      updateProjectAction={
        canCreateProjects ? updateMemberWorkspaceProjectAction : undefined
      }
      updateProjectScheduleAction={
        canCreateProjects
          ? updateMemberWorkspaceProjectScheduleAction
          : undefined
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
