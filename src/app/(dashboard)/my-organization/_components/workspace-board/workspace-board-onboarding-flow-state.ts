import {
  isOnboardingStage,
  normalizeCompletedFromStage,
  stageRank,
  WORKSPACE_ONBOARDING_STAGE_ORDER,
} from "./workspace-board-onboarding-stages"
import type {
  WorkspaceBoardOnboardingFlowState,
  WorkspaceBoardState,
  WorkspaceOnboardingStage,
} from "./workspace-board-types"
import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"

export function buildDefaultWorkspaceOnboardingFlowState(): WorkspaceBoardOnboardingFlowState {
  return {
    active: false,
    stage: 2,
    tutorialStepIndex: 0,
    openedTutorialStepIds: [],
    acknowledgedTutorialStepIds: [],
    completedStages: [],
    updatedAt: new Date().toISOString(),
  }
}

export function areWorkspaceOnboardingFlowStatesEqual(
  left: WorkspaceBoardOnboardingFlowState,
  right: WorkspaceBoardOnboardingFlowState,
) {
  const sameCompletedStageCount =
    left.completedStages.length === right.completedStages.length
  const sameCompletedStageItems =
    sameCompletedStageCount &&
    left.completedStages.every((stage, index) => stage === right.completedStages[index])
  const sameOpenedTutorialStepCount =
    left.openedTutorialStepIds.length === right.openedTutorialStepIds.length
  const sameOpenedTutorialStepItems =
    sameOpenedTutorialStepCount &&
    left.openedTutorialStepIds.every(
      (stepId, index) => stepId === right.openedTutorialStepIds[index],
    )
  const sameAcknowledgedTutorialStepCount =
    left.acknowledgedTutorialStepIds.length ===
    right.acknowledgedTutorialStepIds.length
  const sameAcknowledgedTutorialStepItems =
    sameAcknowledgedTutorialStepCount &&
    left.acknowledgedTutorialStepIds.every(
      (stepId, index) => stepId === right.acknowledgedTutorialStepIds[index],
    )

  return (
    left.active === right.active &&
    left.stage === right.stage &&
    left.tutorialStepIndex === right.tutorialStepIndex &&
    sameCompletedStageItems &&
    sameOpenedTutorialStepItems &&
    sameAcknowledgedTutorialStepItems
  )
}

function normalizeTutorialStepIds(
  value: unknown,
): WorkspaceCanvasTutorialStepId[] {
  if (!Array.isArray(value)) return []

  const stepIds = value
    .map((stepId) => {
      if (stepId === "documents") return "roadmap"
      return stepId
    })
    .filter(
      (stepId): stepId is WorkspaceCanvasTutorialStepId =>
        typeof stepId === "string" && stepId.trim().length > 0,
    )

  return Array.from(new Set(stepIds))
}

export function normalizeWorkspaceOnboardingFlowState(
  value: unknown,
): WorkspaceBoardOnboardingFlowState {
  const fallback = buildDefaultWorkspaceOnboardingFlowState()
  if (!value || typeof value !== "object") return fallback

  const record = value as Partial<WorkspaceBoardOnboardingFlowState> & {
    completedTutorialStepIds?: unknown
  }
  const stage = isOnboardingStage(record.stage) ? record.stage : fallback.stage
  const completedStages = Array.isArray(record.completedStages)
    ? record.completedStages.filter(isOnboardingStage)
    : []
  const completedStageSet = new Set<WorkspaceOnboardingStage>(completedStages)
  const normalizedCompletedStages = WORKSPACE_ONBOARDING_STAGE_ORDER.filter((entry) =>
    completedStageSet.has(entry),
  )
  const legacyCompletedTutorialStepIds = normalizeTutorialStepIds(
    record.completedTutorialStepIds,
  )

  return {
    active: Boolean(record.active),
    stage,
    tutorialStepIndex:
      typeof record.tutorialStepIndex === "number" &&
      Number.isFinite(record.tutorialStepIndex)
        ? Math.max(0, Math.trunc(record.tutorialStepIndex))
        : 0,
    openedTutorialStepIds: normalizeTutorialStepIds(record.openedTutorialStepIds),
    acknowledgedTutorialStepIds: normalizeTutorialStepIds(
      record.acknowledgedTutorialStepIds ?? legacyCompletedTutorialStepIds,
    ),
    completedStages: normalizedCompletedStages,
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim().length > 0
        ? record.updatedAt
        : fallback.updatedAt,
  }
}

export function applyWorkspaceOnboardingStageOverride(
  boardState: WorkspaceBoardState,
  requestedStage: WorkspaceOnboardingStage | null,
): WorkspaceBoardState {
  if (!requestedStage) return boardState

  const current = normalizeWorkspaceOnboardingFlowState(boardState.onboardingFlow)
  const currentRank = stageRank(current.stage)
  const requestedRank = stageRank(requestedStage)
  const highestCompletedRank = current.completedStages.reduce((maxRank, stage) => {
    const rank = stageRank(stage)
    return rank > maxRank ? rank : maxRank
  }, -1)

  if (highestCompletedRank >= requestedRank) {
    return boardState
  }

  // Prevent stage regressions when the URL keeps an old onboarding_stage value.
  if (current.active && currentRank > requestedRank) {
    return {
      ...boardState,
      onboardingFlow: {
        ...current,
        tutorialStepIndex: current.tutorialStepIndex,
        openedTutorialStepIds: current.openedTutorialStepIds,
        acknowledgedTutorialStepIds: current.acknowledgedTutorialStepIds,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  const completedStageSet = new Set<WorkspaceOnboardingStage>([
    ...current.completedStages,
    ...normalizeCompletedFromStage(requestedStage),
  ])
  const completedStages = WORKSPACE_ONBOARDING_STAGE_ORDER.filter((entry) =>
    completedStageSet.has(entry),
  )

  return {
    ...boardState,
    onboardingFlow: {
      active: true,
      stage: requestedStage,
      tutorialStepIndex: current.tutorialStepIndex,
      openedTutorialStepIds: current.openedTutorialStepIds,
      acknowledgedTutorialStepIds: current.acknowledgedTutorialStepIds,
      completedStages,
      updatedAt: new Date().toISOString(),
    },
  }
}
