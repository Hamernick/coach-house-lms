export const WORKSPACE_PATH = "/workspace"
export const MY_ORGANIZATION_PATH = "/my-organization"
export const WORKSPACE_ROADMAP_PATH = `${WORKSPACE_PATH}/roadmap`
export const WORKSPACE_ACCELERATOR_PATH = `${WORKSPACE_PATH}/accelerator`

export type WorkspaceEditorTab = "company" | "programs" | "people"

export function getWorkspaceEditorPath({
  tab,
  programId,
}: {
  tab: WorkspaceEditorTab
  programId?: string | null
}) {
  const params = new URLSearchParams({
    view: "editor",
    tab,
  })

  if (programId?.trim()) {
    params.set("programId", programId.trim())
  }

  return `${WORKSPACE_PATH}?${params.toString()}`
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
