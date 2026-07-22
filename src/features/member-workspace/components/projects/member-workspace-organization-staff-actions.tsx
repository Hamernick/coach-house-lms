"use client"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import {
  OrganizationCoachAssignmentControl,
  type OrganizationCoachAssignmentAction,
  type OrganizationCoachOption,
} from "@/features/organization-coach-assignments"
import {
  OrganizationKanbanVisibilityControl,
  type OrganizationKanbanVisibilityMode,
} from "@/features/organization-kanban-visibility"

export function MemberWorkspaceOrganizationStaffActions({
  canManageCoachAssignments,
  canUnassignCoachAssignments,
  coachOptions,
  kanbanVisibilityMode,
  onOrganizationVisibilityChange,
  pendingVisibilityOrganizationIds,
  project,
  updateCoachAssignmentAction,
}: {
  canManageCoachAssignments: boolean
  canUnassignCoachAssignments: boolean
  coachOptions: OrganizationCoachOption[]
  kanbanVisibilityMode: OrganizationKanbanVisibilityMode
  onOrganizationVisibilityChange?: (
    organizationId: string,
    hidden: boolean
  ) => void
  pendingVisibilityOrganizationIds: string[]
  project: PlatformAdminDashboardLabProject
  updateCoachAssignmentAction?: OrganizationCoachAssignmentAction
}) {
  const organizationId = project.organizationId
  if (project.projectKind !== "organization_admin" || !organizationId) {
    return null
  }

  return (
    <>
      <OrganizationCoachAssignmentControl
        assignment={project.organizationCoachAssignment ?? null}
        canManage={canManageCoachAssignments}
        coachOptions={coachOptions}
        organizationId={organizationId}
        organizationName={project.name}
        updateAssignmentAction={updateCoachAssignmentAction}
        canUnassign={canUnassignCoachAssignments}
        compact
      />
      {onOrganizationVisibilityChange ? (
        <OrganizationKanbanVisibilityControl
          hidden={kanbanVisibilityMode === "hidden"}
          onChange={(hidden) =>
            onOrganizationVisibilityChange(organizationId, hidden)
          }
          organizationName={project.name}
          pending={pendingVisibilityOrganizationIds.includes(organizationId)}
        />
      ) : null}
    </>
  )
}
