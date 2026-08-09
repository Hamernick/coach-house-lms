import {
  clearMemberWorkspaceStarterDataAction,
  createPlatformAdminWorkstreamCategoryAction,
  createMemberWorkspaceProjectAction,
  deletePlatformAdminWorkstreamCategoryAction,
  loadMemberWorkspaceProjectsPage,
  MemberWorkspaceProjectsPage,
  restorePlatformAdminWorkstreamDefaultsAction,
  updatePlatformAdminProjectWorkstreamAction,
  updatePlatformAdminWorkstreamCategoryAction,
  updateMemberWorkspaceProjectAction,
  updateMemberWorkspaceProjectScheduleAction,
  updateMemberWorkspaceProjectStatusAction,
} from "@/features/member-workspace"
import { requirePlatformCapability } from "@/lib/admin/auth"

export default async function OrganizationsPage() {
  await requirePlatformCapability("organizations", {
    loginRedirect: "/organizations",
  })

  const {
    projects,
    storageMode,
    canResetStarterData,
    starterProjectCount,
    canCreateProjects,
    scope,
    organizationOptions,
    assigneeOptions,
    workstreamCategories,
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
      workstreamCategories={workstreamCategories}
      createWorkstreamCategoryAction={
        createPlatformAdminWorkstreamCategoryAction
      }
      updateWorkstreamCategoryAction={
        updatePlatformAdminWorkstreamCategoryAction
      }
      deleteWorkstreamCategoryAction={
        deletePlatformAdminWorkstreamCategoryAction
      }
      restoreWorkstreamDefaultsAction={
        restorePlatformAdminWorkstreamDefaultsAction
      }
      updateProjectWorkstreamAction={updatePlatformAdminProjectWorkstreamAction}
    />
  )
}
