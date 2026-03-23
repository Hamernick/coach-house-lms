import type { OrgProgram } from "@/components/organization/org-profile-card/types"
import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card"
import {
  buildWorkspaceCanvasTutorialCompletionHiddenCardIds,
  resolveWorkspaceCanvasTutorialStepCount,
} from "@/features/workspace-canvas-tutorial"
import type { WorkspaceBoardState } from "../_components/workspace-board/workspace-board-types"
import {
  applyWorkspaceOnboardingStageOverride,
  buildRestartedWorkspaceTutorialBoardState,
  buildCompletedWorkspaceTutorialBoardState,
  resolveWorkspaceOnboardingStageFromSearchParam,
} from "../_components/workspace-board/workspace-board-onboarding-flow"
import { createSupabaseServerClient } from "@/lib/supabase"

type WorkspaceSeedWithAcceleratorBoardState = {
  boardState: WorkspaceBoardState
}

function doCardIdSetsMatch(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((value) => rightSet.has(value))
}

function hasCompletedWorkspaceTutorial(boardState: WorkspaceBoardState) {
  const completionHiddenCardIds = buildWorkspaceCanvasTutorialCompletionHiddenCardIds()
  const finalStepIndex = resolveWorkspaceCanvasTutorialStepCount() - 1

  return (
    boardState.onboardingFlow.active === false &&
    boardState.onboardingFlow.tutorialStepIndex >= finalStepIndex &&
    doCardIdSetsMatch(boardState.hiddenCardIds, completionHiddenCardIds)
  )
}

const WORKSPACE_PROGRAM_SELECT = [
  "id",
  "title",
  "subtitle",
  "description",
  "location",
  "location_type",
  "location_url",
  "team_ids",
  "image_url",
  "duration_label",
  "features",
  "status_label",
  "goal_cents",
  "raised_cents",
  "is_public",
  "created_at",
  "start_date",
  "end_date",
  "address_city",
  "address_state",
  "address_country",
  "cta_label",
  "cta_url",
  "wizard_snapshot",
].join(", ")

const WORKSPACE_PROGRAM_LEGACY_SELECT = [
  "id",
  "title",
  "subtitle",
  "location",
  "image_url",
  "duration_label",
  "features",
  "status_label",
  "goal_cents",
  "raised_cents",
  "is_public",
  "created_at",
  "start_date",
  "end_date",
].join(", ")

export async function fetchWorkspacePrograms({
  supabase,
  orgId,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  orgId: string
}) {
  const primaryResult = await supabase
    .from("programs")
    .select(WORKSPACE_PROGRAM_SELECT)
    .eq("user_id", orgId)
    .order("created_at", { ascending: false })

  if (!primaryResult.error) {
    return (primaryResult.data ?? []) as OrgProgram[]
  }

  const legacyResult = await supabase
    .from("programs")
    .select(WORKSPACE_PROGRAM_LEGACY_SELECT)
    .eq("user_id", orgId)
    .order("created_at", { ascending: false })

  if (legacyResult.error) {
    console.error("workspace programs query failed", {
      orgId,
      primaryMessage: primaryResult.error.message,
      legacyMessage: legacyResult.error.message,
    })
    return []
  }

  return ((legacyResult.data ?? []) as OrgProgram[]).map((program) => ({
    ...program,
    wizard_snapshot: null,
  }))
}

export function countWorkspaceDocuments(profile: Record<string, unknown>) {
  const documentsRoot =
    profile.documents && typeof profile.documents === "object"
      ? (profile.documents as Record<string, unknown>)
      : {}
  const uploadCount = Object.values(documentsRoot).filter((entry) => {
    if (!entry || typeof entry !== "object") return false
    const path = (entry as { path?: unknown }).path
    return typeof path === "string" && path.trim().length > 0
  }).length
  const policyCount = (Array.isArray(profile.policies) ? profile.policies : []).filter(
    (entry) => {
      if (!entry || typeof entry !== "object") return false
      const document = (entry as { document?: unknown }).document
      if (!document || typeof document !== "object") return false
      const path = (document as { path?: unknown }).path
      return typeof path === "string" && path.trim().length > 0
    },
  ).length

  return uploadCount + policyCount
}

export function resolveOrganizationProfileComplete(initialProfile: {
  name?: string | null
  description?: string | null
  tagline?: string | null
  formationStatus?: string | null
  mission?: string | null
  vision?: string | null
  need?: string | null
}) {
  const storyFieldCount = [
    initialProfile.description,
    initialProfile.tagline,
    initialProfile.mission,
    initialProfile.vision,
    initialProfile.need,
  ].filter((value) => typeof value === "string" && value.trim().length > 0).length

  return (
    typeof initialProfile.name === "string" &&
    initialProfile.name.trim().length > 0 &&
    (Boolean(initialProfile.formationStatus) || storyFieldCount >= 2)
  )
}

export function hydrateWorkspaceSeedAcceleratorState<
  TSeed extends WorkspaceSeedWithAcceleratorBoardState,
>(workspaceSeed: TSeed, acceleratorTimeline: WorkspaceAcceleratorCardStep[]) {
  const hasPersistedAcceleratorState =
    Boolean(workspaceSeed.boardState.accelerator.activeStepId) ||
    workspaceSeed.boardState.accelerator.completedStepIds.length > 0
  const hasTimeline = acceleratorTimeline.length > 0
  if (!hasTimeline || hasPersistedAcceleratorState) return workspaceSeed

  const completedStepIds = acceleratorTimeline
    .filter((step) => step.status === "completed")
    .map((step) => step.id)
  const activeStep =
    acceleratorTimeline.find((step) => step.status === "in_progress") ??
    acceleratorTimeline.find((step) => step.status !== "completed") ??
    acceleratorTimeline[0] ??
    null

  return {
    ...workspaceSeed,
    boardState: {
      ...workspaceSeed.boardState,
      accelerator: {
        activeStepId: activeStep?.id ?? null,
        completedStepIds,
      },
    },
  }
}

export function applyWorkspaceOnboardingStageToSeed<
  TSeed extends WorkspaceSeedWithAcceleratorBoardState,
>(
  workspaceSeed: TSeed,
  onboardingStageOverride: ReturnType<
    typeof resolveWorkspaceOnboardingStageFromSearchParam
  >,
) {
  if (!onboardingStageOverride) return workspaceSeed
  return {
    ...workspaceSeed,
    boardState: applyWorkspaceOnboardingStageOverride(
      workspaceSeed.boardState,
      onboardingStageOverride,
    ),
  }
}

export function applyWorkspaceTutorialActivationToSeed<
  TSeed extends WorkspaceSeedWithAcceleratorBoardState,
>(
  workspaceSeed: TSeed,
  {
    initialOnboardingRequired,
    workspaceOnboardingActive,
    workspaceOnboardingCompletedAt = null,
  }: {
    initialOnboardingRequired: boolean
    workspaceOnboardingActive: boolean
    workspaceOnboardingCompletedAt?: string | null
  },
) {
  if (workspaceOnboardingCompletedAt) {
    if (hasCompletedWorkspaceTutorial(workspaceSeed.boardState)) {
      return workspaceSeed
    }

    return {
      ...workspaceSeed,
      boardState: buildCompletedWorkspaceTutorialBoardState(
        workspaceSeed.boardState,
      ),
    }
  }
  if (initialOnboardingRequired || !workspaceOnboardingActive) return workspaceSeed
  if (hasCompletedWorkspaceTutorial(workspaceSeed.boardState)) {
    return {
      ...workspaceSeed,
      boardState: buildRestartedWorkspaceTutorialBoardState(
        workspaceSeed.boardState,
      ),
    }
  }
  if (workspaceSeed.boardState.onboardingFlow.active) return workspaceSeed

  return {
    ...workspaceSeed,
    boardState: {
      ...workspaceSeed.boardState,
      onboardingFlow: {
        ...workspaceSeed.boardState.onboardingFlow,
        active: true,
        updatedAt: new Date().toISOString(),
      },
    },
  }
}
