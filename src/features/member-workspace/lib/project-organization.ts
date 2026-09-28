import type { MemberWorkspaceProjectOrganizationOption } from "../types"

export const COACH_HOUSE_ORGANIZATION_NAME = "Coach House Solutions Group"
export const NO_PROJECT_ORGANIZATION = "unassigned"

export function defaultProjectOrganizationId(options: MemberWorkspaceProjectOrganizationOption[]) {
  return options.find((option) => ["coach house", COACH_HOUSE_ORGANIZATION_NAME.toLowerCase()].includes(option.name.trim().toLowerCase()))?.orgId
}
