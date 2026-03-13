"use client"

import type { Node } from "reactflow"

import type {
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorTutorialCallout,
} from "@/features/workspace-accelerator-card"
import type { WorkspaceCanvasTutorialNodeData } from "@/features/workspace-canvas-tutorial"

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
  vaultViewMode,
  onVaultViewModeChange,
  acceleratorStepNodeVisible,
  onOpenAcceleratorStepNode,
  onHideAcceleratorStepNode,
  onAcceleratorRuntimeChange,
  onAcceleratorRuntimeActionsChange,
  acceleratorTutorialCallout,
  onAcceleratorTutorialActionComplete,
  journeyGuideState,
  onFocusCard,
  organizationShortcutItems,
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
  vaultViewMode: WorkspaceVaultViewMode
  onVaultViewModeChange: (next: WorkspaceVaultViewMode) => void
  acceleratorStepNodeVisible: boolean
  onOpenAcceleratorStepNode: (stepId?: string | null) => void
  onHideAcceleratorStepNode: () => void
  onAcceleratorRuntimeChange: (
    snapshot: WorkspaceAcceleratorCardRuntimeSnapshot,
  ) => void
  onAcceleratorRuntimeActionsChange: WorkspaceBoardNodeData["onAcceleratorRuntimeActionsChange"]
  acceleratorTutorialCallout?: WorkspaceAcceleratorTutorialCallout | null
  onAcceleratorTutorialActionComplete?: () => void
  journeyGuideState: WorkspaceJourneyGuideState
  onFocusCard: (cardId: WorkspaceCardId) => void
  organizationShortcutItems: WorkspaceCardShortcutItemModel[]
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
    isCanvasFullscreen: false,
  } as const

  const orgSize = resolveOrgCardSize(nodes)
  const vaultSize = resolveContractCardSize({
    cardId: "vault",
    nodes,
  })

  return {
    "organization-overview": {
      ...baseData,
      cardId: "organization-overview",
      size: orgSize,
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      organizationShortcutItems,
      isJourneyTarget: journeyGuideState.targetCardId === "organization-overview",
      onSizeChange: (_cardId, nextSize) => onSizeChange("organization-overview", nextSize),
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
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
    },
    vault: {
      ...baseData,
      cardId: "vault",
      size: vaultSize,
      vaultViewMode,
      isJourneyTarget: journeyGuideState.targetCardId === "vault",
      onSizeChange: (_cardId, nextSize) => onSizeChange("vault", nextSize),
      onVaultViewModeChange,
    },
    accelerator: {
      ...baseData,
      cardId: "accelerator",
      size: resolveContractCardSize({
        cardId: "accelerator",
        nodes,
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
      onAcceleratorTutorialActionComplete,
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
    },
    deck: {
      ...baseData,
      cardId: "deck",
      size: "md",
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "deck",
      onSizeChange,
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
    },
    atlas: {
      ...baseData,
      cardId: "atlas",
      size: "md",
      vaultViewMode: WORKSPACE_CANVAS_V2_VAULT_MODE,
      isJourneyTarget: journeyGuideState.targetCardId === "atlas",
      onSizeChange,
      onVaultViewModeChange: NOOP_ON_VAULT_VIEW_MODE_CHANGE,
    },
  }
}

export function buildWorkspaceCanvasV2CardNode({
  cardId,
  position,
  data,
  allowEditing,
}: {
  cardId: WorkspaceCardId
  position: { x: number; y: number }
  data: WorkspaceBoardNodeData
  allowEditing: boolean
}): WorkspaceCanvasNode {
  return {
    id: cardId,
    type: "workspace",
    position,
    draggable: allowEditing,
    selectable: false,
    dragHandle: ".workspace-card-drag-handle",
    className: workspaceNodeClassName(data.size, cardId),
    style: resolveWorkspaceCardNodeStyle(data.size, cardId),
    data,
  }
}
