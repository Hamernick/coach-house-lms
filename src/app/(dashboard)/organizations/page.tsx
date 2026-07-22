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
import {
  loadOrganizationCoachAssignmentData,
  setOrganizationCoachScopeEnabledAction,
  updateOrganizationCoachAssignmentAction,
} from "@/features/organization-coach-assignments"

export default async function OrganizationsPage() {
  const staff = await requirePlatformCapability("organizations", {
    loginRedirect: "/organizations",
  })

  const pageData = await loadMemberWorkspaceProjectsPage()
  const coachAssignmentData = await loadOrganizationCoachAssignmentData({
    organizationIds: pageData.organizationOptions.map(({ orgId }) => orgId),
  })
  const projects = pageData.projects.map((project) => ({
    ...project,
    organizationCoachAssignment: project.organizationId
      ? (coachAssignmentData.assignmentsByOrganizationId.get(
          project.organizationId
        ) ?? null)
      : null,
  }))
  const {
    storageMode,
    canResetStarterData,
    starterProjectCount,
    canCreateProjects,
    scope,
    organizationOptions,
    assigneeOptions,
    workstreamCategories,
  } = pageData

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
      coachOptions={coachAssignmentData.coachOptions}
      canManageCoachAssignments={
        coachAssignmentData.available && staff.accessLevel === "developer"
      }
      updateCoachAssignmentAction={
        coachAssignmentData.available && staff.accessLevel === "developer"
          ? updateOrganizationCoachAssignmentAction
          : undefined
      }
      coachScopeStatus={coachAssignmentData.scopeStatus}
      setCoachScopeAction={
        staff.accessLevel === "developer"
          ? setOrganizationCoachScopeEnabledAction
          : undefined
      }
      showAssignedOrganizationsEmpty={
        staff.accessLevel === "coach" &&
        coachAssignmentData.scopeStatus.assignedOnlyEnabled &&
        organizationOptions.length === 0
      }
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
