import {
  applyWorkspaceOnboardingStageOverride,
  resolveWorkspaceOnboardingStageFromSearchParam,
} from "../_components/workspace-board/workspace-board-onboarding-flow"
import { buildDefaultWorkspaceConnections } from "../_components/workspace-board/workspace-board-layout"
import type { WorkspaceBoardState } from "../_components/workspace-board/workspace-board-types"
import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card"
import {
  buildWorkspaceCanvasTutorialCompletionHiddenCardIds,
  resolveWorkspaceCanvasTutorialStepCount,
} from "@/features/workspace-canvas-tutorial"

export type WorkspaceSeedWithAcceleratorBoardState = {
  boardState: WorkspaceBoardState
}

function areOrderedCardIdsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function hasCompletedWorkspaceTutorial(boardState: WorkspaceBoardState) {
  const completionHiddenCardIds = buildWorkspaceCanvasTutorialCompletionHiddenCardIds()
  const finalStepIndex = resolveWorkspaceCanvasTutorialStepCount() - 1

  return (
    boardState.onboardingFlow.active === false &&
    boardState.onboardingFlow.tutorialStepIndex >= finalStepIndex &&
    areOrderedCardIdsEqual(boardState.hiddenCardIds, completionHiddenCardIds)
  )
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
    workspaceTutorialRequested,
    workspaceOnboardingCompletedAt,
  }: {
    initialOnboardingRequired: boolean
    workspaceOnboardingActive: boolean
    workspaceTutorialRequested: boolean
    workspaceOnboardingCompletedAt: string | null
  },
) {
  if (initialOnboardingRequired) return workspaceSeed
  if (workspaceOnboardingCompletedAt) return workspaceSeed
  if (hasCompletedWorkspaceTutorial(workspaceSeed.boardState)) return workspaceSeed

  const shouldActivateTutorial =
    workspaceOnboardingActive || workspaceTutorialRequested

  if (!shouldActivateTutorial) return workspaceSeed

  const connectionMap = new Map(
    workspaceSeed.boardState.connections.map((connection) => [
      `${connection.source}->${connection.target}`,
      connection,
    ]),
  )
  for (const connection of buildDefaultWorkspaceConnections()) {
    const key = `${connection.source}->${connection.target}`
    if (!connectionMap.has(key)) {
      connectionMap.set(key, connection)
    }
  }

  return {
    ...workspaceSeed,
    boardState: {
      ...workspaceSeed.boardState,
      connections: Array.from(connectionMap.values()),
      onboardingFlow: {
        ...workspaceSeed.boardState.onboardingFlow,
        active: true,
        updatedAt: new Date().toISOString(),
      },
    },
  }
}
