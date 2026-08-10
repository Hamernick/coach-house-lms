import {
  getOrganizationDocumentsPath,
  getWorkspaceEditorPath,
  getWorkspaceRoadmapSectionPath,
  WORKSPACE_ROADMAP_PATH,
} from "./routes"

export const WORKSPACE_FOUNDATION_ROLLOUT_ENABLED_ENV =
  "WORKSPACE_FOUNDATION_ROLLOUT_ENABLED"
export const WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS_ENV =
  "WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS"
export const WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS_ENV =
  "WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS"

type WorkspaceFoundationRolloutEnvironment = Partial<
  Record<
    | typeof WORKSPACE_FOUNDATION_ROLLOUT_ENABLED_ENV
    | typeof WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS_ENV
    | typeof WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS_ENV,
    string | undefined
  >
>

function parseIdentifierAllowlist(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function isWorkspaceFoundationRolloutEnabled({
  environment,
  orgId,
  userId,
}: {
  environment?: WorkspaceFoundationRolloutEnvironment
  orgId: string
  userId: string
}) {
  const rolloutEnvironment = environment ?? {
    WORKSPACE_FOUNDATION_ROLLOUT_ENABLED:
      process.env.WORKSPACE_FOUNDATION_ROLLOUT_ENABLED,
    WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS:
      process.env.WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS,
    WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS:
      process.env.WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS,
  }

  if (rolloutEnvironment.WORKSPACE_FOUNDATION_ROLLOUT_ENABLED !== "1") {
    return false
  }

  const normalizedOrgId = orgId.trim().toLowerCase()
  const normalizedUserId = userId.trim().toLowerCase()
  if (!normalizedOrgId || !normalizedUserId) return false

  const organizationAllowlist = parseIdentifierAllowlist(
    rolloutEnvironment.WORKSPACE_FOUNDATION_ROLLOUT_ORG_IDS
  )
  const userAllowlist = parseIdentifierAllowlist(
    rolloutEnvironment.WORKSPACE_FOUNDATION_ROLLOUT_USER_IDS
  )

  return (
    organizationAllowlist.has("*") ||
    userAllowlist.has("*") ||
    organizationAllowlist.has(normalizedOrgId) ||
    userAllowlist.has(normalizedUserId)
  )
}

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | null
) {
  const normalized = value?.trim()
  if (normalized) params.set(key, normalized)
}

function buildLegacyAcceleratorPath({
  group,
  moduleId,
  stepId,
}: {
  group: string | null
  moduleId: string | null
  stepId: string | null
}) {
  const params = new URLSearchParams()
  appendOptionalParam(params, "group", group)
  appendOptionalParam(params, "module", moduleId)
  appendOptionalParam(params, "step", stepId)
  const query = params.toString()
  return query ? `/accelerator?${query}` : "/accelerator"
}

export function resolveWorkspaceFoundationLegacyDestination({
  acceleratorGroup,
  acceleratorModuleId,
  acceleratorStepId,
  drawer,
  focus,
  organizationTab,
  programId,
  roadmapSection,
  view,
}: {
  acceleratorGroup: string | null
  acceleratorModuleId: string | null
  acceleratorStepId: string | null
  drawer: string
  focus: string
  organizationTab: string
  programId: string
  roadmapSection: string | null
  view: string
}): string | null {
  if (view === "accelerator" || drawer === "accelerator") {
    return buildLegacyAcceleratorPath({
      group: acceleratorGroup,
      moduleId: acceleratorModuleId,
      stepId: acceleratorStepId,
    })
  }
  if (drawer === "documents" || organizationTab === "documents") {
    return getOrganizationDocumentsPath({ focus })
  }
  if (drawer === "roadmap" || organizationTab === "roadmap") {
    return roadmapSection?.trim()
      ? getWorkspaceRoadmapSectionPath(roadmapSection)
      : WORKSPACE_ROADMAP_PATH
  }
  if (drawer === "people") {
    return getWorkspaceEditorPath({ tab: "people", focus })
  }
  if (drawer === "organization") {
    const allowedTabs = new Set(["company", "programs", "people"])
    const tab = allowedTabs.has(organizationTab)
      ? (organizationTab as "company" | "programs" | "people")
      : programId
        ? "programs"
        : "company"
    return getWorkspaceEditorPath({
      tab,
      programId: tab === "programs" ? programId : null,
      focus,
    })
  }
  return null
}
