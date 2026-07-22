export type OrganizationKanbanVisibilityMode = "visible" | "hidden"

export type OrganizationKanbanVisibilityData = {
  available: boolean
  hiddenOrganizationIds: string[]
}

export type UpdateOrganizationKanbanVisibilityInput = {
  organizationId: string
  hidden: boolean
}

export type UpdateOrganizationKanbanVisibilityResult =
  | { ok: true; organizationId: string; hidden: boolean }
  | { error: string }

export type UpdateOrganizationKanbanVisibilityAction = (
  input: UpdateOrganizationKanbanVisibilityInput
) => Promise<UpdateOrganizationKanbanVisibilityResult>
