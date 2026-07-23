export const WORKSPACE_PATH = "/workspace"
export const MY_ORGANIZATION_PATH = "/my-organization"
export const WORKSPACE_ROADMAP_PATH = `${WORKSPACE_PATH}/roadmap`
export const WORKSPACE_ACCELERATOR_PATH = `${WORKSPACE_PATH}/accelerator`
export const ORGANIZATION_DOCUMENTS_PATH = "/organization/documents"

export type WorkspaceEditorTab = "company" | "programs" | "people"

export function getWorkspaceEditorPath({
  tab,
  programId,
  focus,
}: {
  tab: WorkspaceEditorTab
  programId?: string | null
  focus?: string | null
}) {
  const params = new URLSearchParams({
    view: "editor",
    tab,
  })

  if (programId?.trim()) {
    params.set("programId", programId.trim())
  }

  if (focus?.trim()) {
    params.set("focus", focus.trim())
  }

  return `${WORKSPACE_PATH}?${params.toString()}`
}

export function getOrganizationDocumentsPath({
  focus,
}: {
  focus?: string | null
} = {}) {
  const normalizedFocus = focus?.trim()
  if (!normalizedFocus) return ORGANIZATION_DOCUMENTS_PATH
  const params = new URLSearchParams({ focus: normalizedFocus })
  return `${ORGANIZATION_DOCUMENTS_PATH}?${params.toString()}`
}

export function getWorkspaceRoadmapSectionPath(slug: string) {
  const normalizedSlug = slug.trim()
  return normalizedSlug
    ? `${WORKSPACE_ROADMAP_PATH}/${normalizedSlug}`
    : WORKSPACE_ROADMAP_PATH
}

export function getWorkspaceAcceleratorPaywallPath(source = "accelerator") {
  const params = new URLSearchParams({
    paywall: "organization",
    plan: "organization",
    upgrade: "accelerator-access",
    source,
  })

  return `${WORKSPACE_PATH}?${params.toString()}`
}

export function getMemberWorkspacePaywallPath(source = "member-workspace") {
  const params = new URLSearchParams({
    paywall: "organization",
    plan: "organization",
    upgrade: "member-workspace-access",
    source,
  })

  return `${WORKSPACE_PATH}?${params.toString()}`
}
