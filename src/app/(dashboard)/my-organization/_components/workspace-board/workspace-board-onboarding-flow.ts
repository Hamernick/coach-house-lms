import {
  WORKSPACE_CANVAS_TUTORIAL_MANAGED_CARD_IDS,
  buildWorkspaceCanvasTutorialCompletionHiddenCardIds,
  clampWorkspaceCanvasTutorialStepIndex,
  resolveWorkspaceCanvasTutorialStepCount,
  resolveWorkspaceCanvasTutorialTrimmedStepIds,
  resolveWorkspaceCanvasTutorialVisibleCardIds,
} from "@/features/workspace-canvas-tutorial"
import { buildAutoLayoutNodesForMode } from "./workspace-board-auto-layout-modes"
import { buildDefaultWorkspaceConnections } from "./workspace-board-layout"
import { resolveCardDimensions, roundToSnap } from "./workspace-board-layout-config"
import type {
  WorkspaceBoardOnboardingFlowState,
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceOnboardingStage,
} from "./workspace-board-types"
import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"
import { normalizeWorkspaceHiddenCardIds } from "./workspace-board-hidden-cards"
import {
  getNextOnboardingStage,
  getPreviousOnboardingStage,
  isOnboardingStage,
  normalizeCompletedFromStage,
  resolveWorkspaceOnboardingStageFromSearchParam,
  stageRank,
  WORKSPACE_ONBOARDING_STAGE_DEFINITIONS,
  WORKSPACE_ONBOARDING_STAGE_ORDER,
  type WorkspaceOnboardingStageDefinition,
} from "./workspace-board-onboarding-stages"

export {
  getNextOnboardingStage,
  getPreviousOnboardingStage,
  resolveWorkspaceOnboardingStageFromSearchParam,
  WORKSPACE_ONBOARDING_STAGE_DEFINITIONS,
  WORKSPACE_ONBOARDING_STAGE_ORDER,
}
export type { WorkspaceOnboardingStageDefinition }

const WORKSPACE_TUTORIAL_MANAGED_CARD_ID_SET = new Set<WorkspaceCardId>(
  WORKSPACE_CANVAS_TUTORIAL_MANAGED_CARD_IDS,
)

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

function resolveTutorialSnapshotFlowState(
  flowState: WorkspaceBoardOnboardingFlowState,
) {
  const tutorialStepIndex = clampWorkspaceCanvasTutorialStepIndex(
    flowState.tutorialStepIndex,
  )

  return {
    ...flowState,
    active: true,
    tutorialStepIndex,
    openedTutorialStepIds: resolveWorkspaceCanvasTutorialTrimmedStepIds(
      tutorialStepIndex,
      flowState.openedTutorialStepIds,
    ),
    acknowledgedTutorialStepIds: resolveWorkspaceCanvasTutorialTrimmedStepIds(
      tutorialStepIndex,
      flowState.acknowledgedTutorialStepIds,
    ),
  }
}

function resolveTutorialSnapshotHiddenCardIds(
  existingHiddenCardIds: WorkspaceCardId[],
  flowState: WorkspaceBoardOnboardingFlowState,
) {
  const nextVisibleCardIdSet = new Set<WorkspaceCardId>(
    resolveWorkspaceCanvasTutorialVisibleCardIds(
      flowState.tutorialStepIndex,
      flowState.openedTutorialStepIds,
    ) as WorkspaceCardId[],
  )
  const managedHiddenCardIds = WORKSPACE_CANVAS_TUTORIAL_MANAGED_CARD_IDS.filter(
    (cardId) => !nextVisibleCardIdSet.has(cardId),
  )
  const unmanagedHiddenCardIds = existingHiddenCardIds.filter(
    (cardId) => !WORKSPACE_TUTORIAL_MANAGED_CARD_ID_SET.has(cardId),
  )

  return normalizeWorkspaceHiddenCardIds([
    ...managedHiddenCardIds,
    ...unmanagedHiddenCardIds,
  ], {
    enforceFixedVisibleCards: false,
  })
}

export function applyWorkspaceTutorialSnapshot(
  boardState: WorkspaceBoardState,
  flowState: WorkspaceBoardOnboardingFlowState,
): WorkspaceBoardState {
  if (!flowState.active) {
    return {
      ...boardState,
      onboardingFlow: flowState,
    }
  }

  const nextFlowState = resolveTutorialSnapshotFlowState(flowState)
  const nextHiddenCardIds = resolveTutorialSnapshotHiddenCardIds(
    boardState.hiddenCardIds,
    nextFlowState,
  )
  const acceleratorHidden = nextHiddenCardIds.includes("accelerator")

  return {
    ...boardState,
    onboardingFlow: nextFlowState,
    hiddenCardIds: nextHiddenCardIds,
    visibility: {
      allCardsHiddenExplicitly: false,
    },
    acceleratorUi: boardState.acceleratorUi
      ? {
          ...boardState.acceleratorUi,
          stepOpen: acceleratorHidden ? false : boardState.acceleratorUi.stepOpen,
        }
      : boardState.acceleratorUi,
  }
}

export function buildRestartedWorkspaceTutorialBoardState(
  boardState: WorkspaceBoardState,
) {
  return applyWorkspaceTutorialSnapshot(boardState, {
    ...buildDefaultWorkspaceOnboardingFlowState(),
    active: true,
    updatedAt: new Date().toISOString(),
  })
}

function ensureWorkspaceTutorialCompletionConnections(
  connections: WorkspaceBoardState["connections"],
) {
  const nextConnections = new Map(
    connections.map((connection) => [
      `${connection.source}->${connection.target}`,
      connection,
    ]),
  )

  for (const connection of buildDefaultWorkspaceConnections()) {
    const key = `${connection.source}->${connection.target}`
    if (!nextConnections.has(key)) {
      nextConnections.set(key, connection)
    }
  }

  return Array.from(nextConnections.values())
}

const WORKSPACE_TUTORIAL_COMPLETION_LEFT_X = 96
const WORKSPACE_TUTORIAL_COMPLETION_TOP_Y = 192
const WORKSPACE_TUTORIAL_COMPLETION_COLUMN_GAP = 72

function buildWorkspaceTutorialCompletionNodes({
  existingNodes,
  hiddenCardIds,
  connections,
}: {
  existingNodes: WorkspaceBoardState["nodes"]
  hiddenCardIds: WorkspaceBoardState["hiddenCardIds"]
  connections: WorkspaceBoardState["connections"]
}) {
  const autoLayoutNodes = buildAutoLayoutNodesForMode({
    mode: "dagre-tree",
    existingNodes,
    hiddenCardIds,
    connections,
  })

  const nodeById = new Map(autoLayoutNodes.map((node) => [node.id, node] as const))
  const roadmapNode = nodeById.get("roadmap")
  const organizationNode = nodeById.get("organization-overview")
  const programsNode = nodeById.get("programs")
  const acceleratorNode = nodeById.get("accelerator")

  if (!roadmapNode || !organizationNode || !programsNode || !acceleratorNode) {
    return autoLayoutNodes
  }

  const roadmapDimensions = resolveCardDimensions(roadmapNode.size, "roadmap")
  const acceleratorDimensions = resolveCardDimensions(
    acceleratorNode.size,
    "accelerator",
  )
  const organizationDimensions = resolveCardDimensions(
    organizationNode.size,
    "organization-overview",
  )
  const roadmapX = roundToSnap(WORKSPACE_TUTORIAL_COMPLETION_LEFT_X)
  const topY = roundToSnap(WORKSPACE_TUTORIAL_COMPLETION_TOP_Y)
  const acceleratorX = roundToSnap(
    roadmapX +
      roadmapDimensions.width +
      WORKSPACE_TUTORIAL_COMPLETION_COLUMN_GAP,
  )
  const organizationX = roundToSnap(
    acceleratorX +
      acceleratorDimensions.width +
      WORKSPACE_TUTORIAL_COMPLETION_COLUMN_GAP,
  )
  const programsX = roundToSnap(
    organizationX +
      organizationDimensions.width +
      WORKSPACE_TUTORIAL_COMPLETION_COLUMN_GAP,
  )

  const completionPositionByCardId = new Map<
    WorkspaceCardId,
    { x: number; y: number }
  >([
    ["roadmap", { x: roadmapX, y: topY }],
    ["accelerator", { x: acceleratorX, y: topY }],
    ["organization-overview", { x: organizationX, y: topY }],
    ["programs", { x: programsX, y: topY }],
  ])

  return autoLayoutNodes.map((node) => {
    const override = completionPositionByCardId.get(node.id)
    if (!override) return node
    return {
      ...node,
      x: roundToSnap(override.x),
      y: roundToSnap(override.y),
    }
  })
}

export function buildCompletedWorkspaceTutorialBoardState(
  boardState: WorkspaceBoardState,
) {
  const completionAutoLayoutMode = "dagre-tree" as const
  const nextHiddenCardIds = buildWorkspaceCanvasTutorialCompletionHiddenCardIds()
  const nextConnections = ensureWorkspaceTutorialCompletionConnections(
    boardState.connections,
  )
  const compactCompletionNodes = boardState.nodes.map((node) =>
    node.id === "accelerator" && node.size === "lg"
      ? { ...node, size: "sm" as const }
      : node,
  )
  const nextState: WorkspaceBoardState = {
    ...boardState,
    autoLayoutMode: completionAutoLayoutMode,
    onboardingFlow: {
      ...boardState.onboardingFlow,
      active: false,
      tutorialStepIndex: resolveWorkspaceCanvasTutorialStepCount() - 1,
      openedTutorialStepIds: [],
      acknowledgedTutorialStepIds: [],
      updatedAt: new Date().toISOString(),
    },
    connections: nextConnections,
    hiddenCardIds: nextHiddenCardIds,
    visibility: {
      allCardsHiddenExplicitly: false,
    },
    nodes: compactCompletionNodes,
  }

  return {
    ...nextState,
    nodes: buildWorkspaceTutorialCompletionNodes({
      existingNodes: compactCompletionNodes,
      hiddenCardIds: nextHiddenCardIds,
      connections: nextConnections,
    }),
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
