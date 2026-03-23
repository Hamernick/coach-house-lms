"use client"

import type { Node } from "reactflow"

import type {
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorTutorialCallout,
  WorkspaceAcceleratorTutorialInteractionPolicy,
} from "@/features/workspace-accelerator-card"
import { resolveWorkspaceAcceleratorCollapsedCardSize } from "@/features/workspace-accelerator-card/components/workspace-accelerator-card-panel-support"
import type {
  WorkspaceCanvasTutorialNodeData,
  WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

import { resolveWorkspaceCardNodeStyle } from "../../workspace-board-layout"
import type {
  WorkspaceBoardAcceleratorStepNodeData,
  WorkspaceBoardNodeData,
} from "../../workspace-board-node"
import { workspaceNodeClassName } from "../../workspace-board-node-class-name"
import type {
  WorkspaceBoardAcceleratorState,
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
  WorkspaceJourneyGuideState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceTrackerState,
  WorkspaceVaultViewMode,
} from "../../workspace-board-types"
import type { WorkspaceCardShortcutItemModel } from "../shortcuts/workspace-card-shortcut-model"
import {
  WORKSPACE_CANVAS_V2_CARD_IDS,
  WORKSPACE_CANVAS_V2_DOCK_CARD_IDS,
  WORKSPACE_CANVAS_V2_CARD_CONTRACT,
  type WorkspaceCanvasV2CardId,
} from "../contracts/workspace-card-contract"
import {
  resolveOrgCardSize,
} from "./workspace-canvas-surface-v2-positioning"
import { reconcileWorkspaceCanvasV2Nodes } from "./workspace-canvas-surface-v2-reconcile"

export { reconcileWorkspaceCanvasV2Nodes } from "./workspace-canvas-surface-v2-reconcile"

export {
  WORKSPACE_CANVAS_V2_CARD_IDS,
  WORKSPACE_CANVAS_V2_DOCK_CARD_IDS,
  type WorkspaceCanvasV2CardId,
} from "../contracts/workspace-card-contract"

const NOOP_ON_VAULT_VIEW_MODE_CHANGE = (_next: WorkspaceVaultViewMode) => {}

export type WorkspaceCanvasNodeData =
  | WorkspaceBoardNodeData
  | WorkspaceBoardAcceleratorStepNodeData
  | WorkspaceCanvasTutorialNodeData
export type WorkspaceCanvasNode = Node<WorkspaceCanvasNodeData>

export const WORKSPACE_CANVAS_V2_VAULT_MODE: WorkspaceVaultViewMode = "dropzone"

export function isWorkspaceCanvasV2CardId(value: string): value is WorkspaceCanvasV2CardId {
  return WORKSPACE_CANVAS_V2_CARD_IDS.includes(value as WorkspaceCanvasV2CardId)
}

function resolveContractCardSize({
  cardId,
  nodes,
}: {
  cardId: WorkspaceCanvasV2CardId
  nodes: WorkspaceBoardState["nodes"]
}): WorkspaceCardSize {
  const contract = WORKSPACE_CANVAS_V2_CARD_CONTRACT[cardId]
  const fallback = contract.defaultSize
  const nodeSize = nodes.find((node) => node.id === cardId)?.size
  if (!nodeSize) return fallback
  return contract.allowedSizes.some((size) => size === nodeSize)
    ? nodeSize
    : fallback
}

export function resolveWorkspaceCanvasAcceleratorCardSize({
  nodes,
  acceleratorRuntimeSnapshot,
}: {
  nodes: WorkspaceBoardState["nodes"]
  acceleratorRuntimeSnapshot?: WorkspaceAcceleratorCardRuntimeSnapshot | null
}): WorkspaceCardSize {
  const persistedSize = resolveContractCardSize({
    cardId: "accelerator",
    nodes,
  })

  if (acceleratorRuntimeSnapshot?.isModuleViewerOpen === true) {
    return "lg"
  }

  return resolveWorkspaceAcceleratorCollapsedCardSize({
    currentSize: persistedSize,
    previousCollapsedSize: null,
  })
}

export function buildWorkspaceCanvasV2CardDataLookup({
  allowEditing,
  presentationMode,
  acceleratorState,
  communications,
  tracker,
  nodes,
  seed,
  organizationEditorData,
  onSizeChange,
  onCommunicationsChange,
  onTrackerChange,
  onAcceleratorStateChange,
  onInitialOnboardingSubmit,
  vaultViewMode,
  onVaultViewModeChange,
  acceleratorStepNodeVisible,
  onOpenAcceleratorStepNode,
  onHideAcceleratorStepNode,
  onAcceleratorRuntimeChange,
  onAcceleratorRuntimeActionsChange,
  acceleratorRuntimeSnapshot,
  acceleratorTutorialCallout,
  acceleratorTutorialInteractionPolicy,
  onAcceleratorTutorialActionComplete,
  journeyGuideState,
  onFocusCard,
  onOpenCard,
  onCardMeasuredHeightChange,
  organizationShortcutItems,
  organizationMapButtonCallout,
  onOrganizationMapButtonTutorialComplete,
  tutorialStepId,
}: {
  allowEditing: boolean
  presentationMode: boolean
  acceleratorState: WorkspaceBoardAcceleratorState
  communications: WorkspaceCommunicationsState
  tracker: WorkspaceTrackerState
  nodes: WorkspaceBoardState["nodes"]
  seed: WorkspaceSeedData
  organizationEditorData: WorkspaceOrganizationEditorData
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceTrackerState) => void
  onAcceleratorStateChange: (next: WorkspaceBoardAcceleratorState) => void
  onInitialOnboardingSubmit: (form: FormData) => Promise<void>
  vaultViewMode: WorkspaceVaultViewMode
  onVaultViewModeChange: (next: WorkspaceVaultViewMode) => void
  acceleratorStepNodeVisible: boolean
  onOpenAcceleratorStepNode: (stepId?: string | null) => void
  onHideAcceleratorStepNode: () => void
  onAcceleratorRuntimeChange: (
    snapshot: WorkspaceAcceleratorCardRuntimeSnapshot,
  ) => void
  onAcceleratorRuntimeActionsChange: WorkspaceBoardNodeData["onAcceleratorRuntimeActionsChange"]
  acceleratorRuntimeSnapshot?: WorkspaceAcceleratorCardRuntimeSnapshot | null
  acceleratorTutorialCallout?: WorkspaceAcceleratorTutorialCallout | null
  acceleratorTutorialInteractionPolicy?: WorkspaceAcceleratorTutorialInteractionPolicy | null
  onAcceleratorTutorialActionComplete?: () => void
  journeyGuideState: WorkspaceJourneyGuideState
  onFocusCard: (cardId: WorkspaceCardId) => void
  onOpenCard: (cardId: WorkspaceCardId) => void
  onCardMeasuredHeightChange?: (
    cardId: WorkspaceCardId,
    size: WorkspaceCardSize,
    height: number,
  ) => void
  organizationShortcutItems: WorkspaceCardShortcutItemModel[]
  organizationMapButtonCallout?: WorkspaceBoardNodeData["organizationMapButtonCallout"]
  onOrganizationMapButtonTutorialComplete?: WorkspaceBoardNodeData["onOrganizationMapButtonTutorialComplete"]
  tutorialStepId?: WorkspaceCanvasTutorialStepId | null
}): Record<WorkspaceCardId, WorkspaceBoardNodeData> {
  const baseData = {
    canEdit: allowEditing,
    presentationMode,
    communications,
    tracker,
    acceleratorState,
    seed,
    organizationEditorData,
    onCommunicationsChange,
    onTrackerChange,
    onAcceleratorStateChange,
    onFocusCard,
    onOpenCard,
    isCanvasFullscreen: false,
    tutorialStepId: tutorialStepId ?? null,
  } as const

  const orgSize = resolveOrgCardSize(nodes)
  const roadmapSize = resolveContractCardSize({
    cardId: "roadmap",
    nodes,
  })

  return {
    "organization-overview": {
      ...baseData,
      cardId: "organization-overview",
      size: orgSize,
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      organizationShortcutItems,
      organizationMapButtonCallout: organizationMapButtonCallout ?? null,
      onOrganizationMapButtonTutorialComplete,
      isJourneyTarget: journeyGuideState.targetCardId === "organization-overview",
      onSizeChange: (_cardId, nextSize) => onSizeChange("organization-overview", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) =>
            onCardMeasuredHeightChange("organization-overview", size, height)
        : undefined,
    },
    programs: {
      ...baseData,
      cardId: "programs",
      size: resolveContractCardSize({
        cardId: "programs",
        nodes,
      }),
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "programs",
      onSizeChange: (_cardId, nextSize) => onSizeChange("programs", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) => onCardMeasuredHeightChange("programs", size, height)
        : undefined,
    },
    roadmap: {
      ...baseData,
      cardId: "roadmap",
      size: roadmapSize,
      vaultViewMode,
      isJourneyTarget: journeyGuideState.targetCardId === "roadmap",
      onSizeChange: (_cardId, nextSize) => onSizeChange("roadmap", nextSize),
      onVaultViewModeChange,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) => onCardMeasuredHeightChange("roadmap", size, height)
        : undefined,
    },
    accelerator: {
      ...baseData,
      cardId: "accelerator",
      size: resolveWorkspaceCanvasAcceleratorCardSize({
        nodes,
        acceleratorRuntimeSnapshot,
      }),
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      journeyGuideState,
      isJourneyTarget: journeyGuideState.targetCardId === "accelerator",
      onSizeChange: (_cardId, nextSize) => onSizeChange("accelerator", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      acceleratorStepNodeVisible,
      onOpenAcceleratorStepNode,
      onHideAcceleratorStepNode,
      onAcceleratorRuntimeChange,
      onAcceleratorRuntimeActionsChange,
      acceleratorTutorialCallout,
      acceleratorTutorialInteractionPolicy,
      onAcceleratorTutorialActionComplete,
      onWorkspaceOnboardingSubmit: onInitialOnboardingSubmit,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) => onCardMeasuredHeightChange("accelerator", size, height)
        : undefined,
    },
    "brand-kit": {
      ...baseData,
      cardId: "brand-kit",
      size: resolveContractCardSize({
        cardId: "brand-kit",
        nodes,
      }),
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "brand-kit",
      onSizeChange: (_cardId, nextSize) => onSizeChange("brand-kit", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) => onCardMeasuredHeightChange("brand-kit", size, height)
        : undefined,
    },
    "economic-engine": {
      ...baseData,
      cardId: "economic-engine",
      size: resolveContractCardSize({
        cardId: "economic-engine",
        nodes,
      }),
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "economic-engine",
      onSizeChange: (_cardId, nextSize) => onSizeChange("economic-engine", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) =>
            onCardMeasuredHeightChange("economic-engine", size, height)
        : undefined,
    },
    calendar: {
      ...baseData,
      cardId: "calendar",
      size: resolveContractCardSize({
        cardId: "calendar",
        nodes,
      }),
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "calendar",
      onSizeChange: (_cardId, nextSize) => onSizeChange("calendar", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) => onCardMeasuredHeightChange("calendar", size, height)
        : undefined,
    },
    communications: {
      ...baseData,
      cardId: "communications",
      size: resolveContractCardSize({
        cardId: "communications",
        nodes,
      }),
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "communications",
      onSizeChange: (_cardId, nextSize) => onSizeChange("communications", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) =>
            onCardMeasuredHeightChange("communications", size, height)
        : undefined,
    },
    deck: {
      ...baseData,
      cardId: "deck",
      size: "md",
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "deck",
      onSizeChange,
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) => onCardMeasuredHeightChange("deck", size, height)
        : undefined,
    },
    atlas: {
      ...baseData,
      cardId: "atlas",
      size: resolveContractCardSize({
        cardId: "atlas",
        nodes,
      }),
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "atlas",
      onSizeChange: (_cardId, nextSize) => onSizeChange("atlas", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
      onMeasuredHeightChange: onCardMeasuredHeightChange
        ? (size, height) => onCardMeasuredHeightChange("atlas", size, height)
        : undefined,
    },
  }
}

export function buildWorkspaceCanvasV2CardNode({
  cardId,
  position,
  data,
  allowEditing,
  tutorialDraggable = false,
}: {
  cardId: WorkspaceCardId
  position: { x: number; y: number }
  data: WorkspaceBoardNodeData
  allowEditing: boolean
  tutorialDraggable?: boolean
}): WorkspaceCanvasNode {
  const zIndex = tutorialDraggable ? 30 : 0
  return {
    id: cardId,
    type: "workspace",
    position,
    zIndex,
    draggable: allowEditing || tutorialDraggable,
    selectable: false,
    dragHandle: ".workspace-card-drag-handle",
    className: workspaceNodeClassName(data.size, cardId),
    style: resolveWorkspaceCardNodeStyle(data.size, cardId),
    data,
  }
}

export function resolveWorkspaceCanvasRenderNodes({
  nodes,
  visibleCardIds,
  boardNodeLookup,
  cardDataLookup,
  orgNodePositionFromBoard,
  allowEditing,
  acceleratorStepNodeData,
  tutorialNodeData,
  tutorialCardPositionOverrides,
  tutorialDraggableCardIds,
}: {
  nodes: WorkspaceCanvasNode[]
  visibleCardIds: WorkspaceCanvasV2CardId[]
  boardNodeLookup: Map<WorkspaceCardId, WorkspaceBoardState["nodes"][number]>
  cardDataLookup: Record<WorkspaceCardId, WorkspaceBoardNodeData>
  orgNodePositionFromBoard: { x: number; y: number }
  allowEditing: boolean
  acceleratorStepNodeData: WorkspaceCanvasNode | null
  tutorialNodeData: WorkspaceCanvasNode | null
  tutorialCardPositionOverrides: Partial<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  > | null
  tutorialDraggableCardIds: WorkspaceCanvasV2CardId[]
}) {
  const nextNodes = reconcileWorkspaceCanvasV2Nodes({
    previous: nodes,
    visibleCardIds,
    boardNodeLookup,
    cardDataLookup,
    orgNodePositionFromBoard,
    allowEditing,
    acceleratorStepNodeData,
    tutorialNodeData,
    tutorialDraggableCardIds,
    tutorialCardPositionOverrides,
  })
  const tutorialNodeState =
    tutorialNodeData?.type === "workspace-tutorial"
      ? (tutorialNodeData.data as WorkspaceCanvasTutorialNodeData)
      : null
  const suppressedNodeIdSet = new Set(
    tutorialNodeState?.suppressedNodeIds ?? [],
  )

  return suppressedNodeIdSet.size === 0
    ? nextNodes
    : nextNodes.filter(
        (node) =>
          node.id === "workspace-canvas-tutorial" ||
          !suppressedNodeIdSet.has(node.id),
      )
}
