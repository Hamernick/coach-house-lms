export type OrganizationCoachOption = {
  id: string
  name: string
  email: string | null
  avatarUrl: string | null
}

export type OrganizationCoachAssignment = {
  organizationId: string
  coach: OrganizationCoachOption
  assignedBy: string | null
  updatedAt: string
}

export type OrganizationCoachAssignmentData = {
  available: boolean
  assignmentsByOrganizationId: Map<string, OrganizationCoachAssignment>
  coachOptions: OrganizationCoachOption[]
}

export type UpdateOrganizationCoachAssignmentInput = {
  organizationId: string
  coachUserId: string | null
}

export type UpdateOrganizationCoachAssignmentResult =
  | { ok: true; organizationId: string; coachUserId: string | null }
  | { error: string }

export type OrganizationCoachAssignmentAction = (
  input: UpdateOrganizationCoachAssignmentInput
) => Promise<UpdateOrganizationCoachAssignmentResult>
