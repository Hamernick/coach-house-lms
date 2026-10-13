"use client"

import { Position, type Edge, type Node } from "reactflow"

import type {
  WorkspaceAcceleratorCardRuntimeSnapshot,
  WorkspaceAcceleratorStepKind,
} from "@/features/workspace-accelerator-card"

import {
  resolveWorkspaceAcceleratorStepEdgeHandles,
  resolveWorkspaceAcceleratorStepPlacement,
} from "./workspace-board-accelerator-step-layout"
import {
  resolveCardDimensions,
  resolveWorkspaceCardNodeStyle,
} from "./workspace-board-layout"
import { WORKSPACE_ONBOARDING_GUIDE_NODE_ID } from "./workspace-board-flow-surface-onboarding-guide"
import type { WorkspaceBoardOnboardingNodeData } from "./workspace-board-onboarding-guide-node"
import { workspaceNodeClassName } from "./workspace-board-node-class-name"
import type {
  WorkspaceBoardAcceleratorStepNodeData,
  WorkspaceBoardNodeData,
} from "./workspace-board-node"
import type {
  WorkspaceBoardState,
  WorkspaceAutoLayoutMode,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceVaultViewMode,
} from "./workspace-board-types"

export const ACCELERATOR_STEP_NODE_ID = "accelerator-active-step-node"
export const ACCELERATOR_STEP_EDGE_ID = "edge-accelerator-to-active-step"
export const ONBOARDING_GUIDE_EDGE_ID = "edge-workspace-onboarding-guide-target"

export type WorkspaceFlowNodeData =
  | WorkspaceBoardNodeData
  | WorkspaceBoardAcceleratorStepNodeData
  | WorkspaceBoardOnboardingNodeData
export type WorkspaceFlowNode = Node<WorkspaceFlowNodeData>

type AcceleratorStepNodeDimensions = { width: number; height: number }
const COMPACT_ASSIGNMENT_FIELD_TYPES = new Set([
  "select",
  "short_text",
  "multi_select",
  "slider",
])

export const ACCELERATOR_STEP_NODE_DIMENSIONS: Record<
  | WorkspaceAcceleratorStepKind
  | "default"
  | "assignmentCompact"
  | "assignmentExpanded"
  | "assignmentWithBudget",
  AcceleratorStepNodeDimensions
> = {
  default: { width: 520, height: 360 },
  lesson: { width: 520, height: 360 },
  video: { width: 600, height: 440 },
  resources: { width: 540, height: 360 },
  assignmentCompact: { width: 580, height: 340 },
  assignment: { width: 760, height: 420 },
  assignmentExpanded: { width: 920, height: 560 },
  assignmentWithBudget: { width: 1180, height: 720 },
  deck: { width: 520, height: 520 },
  complete: { width: 560, height: 360 },
}

function resolveAcceleratorStepNodeDimensions(
  stepKind: WorkspaceAcceleratorStepKind,
  assignmentFields: Array<{ type: string }>
) {
  if (stepKind === "assignment") {
    const hasBudgetTableField = assignmentFields.some(
      (field) => field.type === "budget_table"
    )
    if (hasBudgetTableField) {
      return ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentWithBudget
    }

    const hasCompactAssignmentShape =
      assignmentFields.length > 0 &&
      assignmentFields.length <= 2 &&
      assignmentFields.every((field) =>
        COMPACT_ASSIGNMENT_FIELD_TYPES.has(field.type)
      )
    if (hasCompactAssignmentShape) {
      return ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentCompact
    }

    const hasExpandedAssignmentField = assignmentFields.some(
      (field) =>
        field.type === "long_text" || field.type === "custom_program"
    )

    if (hasExpandedAssignmentField) {
      return ACCELERATOR_STEP_NODE_DIMENSIONS.assignmentExpanded
    }

    return ACCELERATOR_STEP_NODE_DIMENSIONS.assignment
  }
  return (
    ACCELERATOR_STEP_NODE_DIMENSIONS[stepKind] ??
    ACCELERATOR_STEP_NODE_DIMENSIONS.default
  )
}

export function buildAcceleratorStepNodeData({
  acceleratorRuntimeSnapshot,
  acceleratorStepNodePositionOverride,
  acceleratorStepNodeVisible,
  autoLayoutMode,
  allowEditing,
  acceleratorWorkspaceNode,
  isCanvasFullscreen,
  presentationMode,
  onPrevious,
  onNext,
  onComplete,
  onClose,
}: {
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
  acceleratorStepNodePositionOverride: { x: number; y: number } | null
  acceleratorStepNodeVisible: boolean
  autoLayoutMode: WorkspaceAutoLayoutMode
  allowEditing: boolean
  acceleratorWorkspaceNode: WorkspaceBoardState["nodes"][number] | null
  isCanvasFullscreen: boolean
  presentationMode: boolean
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
  onClose: () => void
}): WorkspaceFlowNode | null {
  const runtimeStep = acceleratorRuntimeSnapshot?.currentStep
  if (!runtimeStep) return null
  if (!acceleratorWorkspaceNode) return null
  if (!acceleratorStepNodeVisible || isCanvasFullscreen) return null

  const sourceDimensions = resolveCardDimensions(
    acceleratorWorkspaceNode.size,
    acceleratorWorkspaceNode.id
  )
  const stepDimensions = resolveAcceleratorStepNodeDimensions(
    runtimeStep.stepKind,
    runtimeStep.moduleContext?.assignmentFields ?? []
  )
  const placement = resolveWorkspaceAcceleratorStepPlacement(autoLayoutMode)
  const positionX =
    placement === "above"
      ? acceleratorWorkspaceNode.x +
        (sourceDimensions.width - stepDimensions.width) / 2
      : acceleratorWorkspaceNode.x + sourceDimensions.width + 56
  const positionY =
    placement === "above"
      ? acceleratorWorkspaceNode.y - stepDimensions.height - 56
      : acceleratorWorkspaceNode.y +
        Math.max(0, (sourceDimensions.height - stepDimensions.height) / 2)
  const position = acceleratorStepNodePositionOverride ?? {
    x: positionX,
    y: positionY,
  }

  return {
    id: ACCELERATOR_STEP_NODE_ID,
    type: "accelerator-step",
    position,
    draggable: allowEditing && !isCanvasFullscreen,
    dragHandle:
      allowEditing && !isCanvasFullscreen
        ? ".accelerator-step-node-drag-handle"
        : undefined,
    selectable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    className: "h-auto select-none",
    style: {
      width: stepDimensions.width,
      minHeight: stepDimensions.height,
    },
    data: {
      step: runtimeStep,
      placement,
      stepIndex: Math.max(
        acceleratorRuntimeSnapshot.currentModuleStepIndex,
        0
      ),
      stepTotal: Math.max(
        acceleratorRuntimeSnapshot.currentModuleStepTotal,
        1
      ),
      canGoPrevious: acceleratorRuntimeSnapshot.canGoPrevious,
      canGoNext: acceleratorRuntimeSnapshot.canGoNext,
      completed: acceleratorRuntimeSnapshot.isCurrentStepCompleted,
      moduleCompleted: acceleratorRuntimeSnapshot.isCurrentModuleCompleted,
      onPrevious,
      onNext,
      onComplete,
      onClose,
      presentationMode,
    },
  }
}

export function buildWorkspaceEdges({
  connections,
  visibleEdgeCardIds,
  edgeStyle,
  acceleratorStepNodeData,
  acceleratorWorkspaceNode,
  autoLayoutMode,
  onboardingGuideNodeData,
  onboardingTargetWorkspaceNode,
  presentationMode,
}: {
  connections: WorkspaceBoardState["connections"]
  visibleEdgeCardIds: Set<WorkspaceCardId>
  edgeStyle: { strokeWidth: number; opacity: number }
  acceleratorStepNodeData: WorkspaceFlowNode | null
  acceleratorWorkspaceNode: WorkspaceBoardState["nodes"][number] | null
  autoLayoutMode: WorkspaceAutoLayoutMode
  onboardingGuideNodeData: WorkspaceFlowNode | null
  onboardingTargetWorkspaceNode: WorkspaceBoardState["nodes"][number] | null
  presentationMode: boolean
}): Edge[] {
  const baseEdges: Edge[] = connections
    .filter(
      (edge) =>
        visibleEdgeCardIds.has(edge.source) && visibleEdgeCardIds.has(edge.target)
    )
    .map((edge) => ({
      ...edge,
      type: "smoothstep",
      animated: false,
      style: edgeStyle,
    }))

  if (acceleratorStepNodeData && acceleratorWorkspaceNode) {
    const handleIds = resolveWorkspaceAcceleratorStepEdgeHandles(autoLayoutMode)
    baseEdges.push({
      id: ACCELERATOR_STEP_EDGE_ID,
      source: acceleratorWorkspaceNode.id,
      target: ACCELERATOR_STEP_NODE_ID,
      sourceHandle: handleIds.sourceHandle,
      targetHandle: handleIds.targetHandle,
      type: "smoothstep",
      animated: true,
      style: {
        ...edgeStyle,
        stroke: "rgba(148, 163, 184, 0.72)",
        strokeWidth: presentationMode ? 1.2 : 1.5,
        strokeDasharray: "4 4",
      },
    })
  }

  if (onboardingGuideNodeData && onboardingTargetWorkspaceNode) {
    baseEdges.push({
      id: ONBOARDING_GUIDE_EDGE_ID,
      source: WORKSPACE_ONBOARDING_GUIDE_NODE_ID,
      target: onboardingTargetWorkspaceNode.id,
      type: "smoothstep",
      animated: true,
      style: {
        ...edgeStyle,
        stroke: "rgba(56, 189, 248, 0.74)",
        strokeWidth: presentationMode ? 1.2 : 1.6,
        strokeDasharray: "5 4",
      },
    })
  }

  return baseEdges
}

export function buildWorkspaceNodes({
  visibleWorkspaceNodes,
  acceleratorStepNodeData,
  onboardingGuideNodeData,
  allowEditing,
  isCanvasFullscreen,
  presentationMode,
  communications,
  tracker,
  accelerator,
  vaultViewMode,
  seed,
  organizationEditorData,
  onSizeChange,
  onCommunicationsChange,
  onTrackerChange,
  onVaultViewModeChange,
  onAcceleratorStateChange,
  acceleratorStepNodeVisible,
  onOpenAcceleratorStepNode,
  onHideAcceleratorStepNode,
  onAcceleratorRuntimeChange,
  onAcceleratorRuntimeActionsChange,
  onToggleCanvasFullscreen,
}: {
  visibleWorkspaceNodes: WorkspaceBoardState["nodes"]
  acceleratorStepNodeData: WorkspaceFlowNode | null
  onboardingGuideNodeData: WorkspaceFlowNode | null
  allowEditing: boolean
  isCanvasFullscreen: boolean
  presentationMode: boolean
  communications: WorkspaceBoardState["communications"]
  tracker: WorkspaceBoardState["tracker"]
  accelerator: WorkspaceBoardState["accelerator"]
  vaultViewMode: WorkspaceVaultViewMode
  seed: WorkspaceSeedData
  organizationEditorData: WorkspaceOrganizationEditorData
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceBoardState["tracker"]) => void
  onVaultViewModeChange: (next: WorkspaceVaultViewMode) => void
  onAcceleratorStateChange: (next: WorkspaceBoardState["accelerator"]) => void
  acceleratorStepNodeVisible: boolean
  onOpenAcceleratorStepNode: (stepId?: string | null) => void
  onHideAcceleratorStepNode: () => void
  onAcceleratorRuntimeChange: (
    snapshot: WorkspaceAcceleratorCardRuntimeSnapshot
  ) => void
  onAcceleratorRuntimeActionsChange: (
    actions: {
      goPrevious: () => void
      goNext: () => void
      markCurrentStepComplete: () => void
    }
  ) => void
  onToggleCanvasFullscreen: (cardId: WorkspaceCardId) => void
}): WorkspaceFlowNode[] {
  const workspaceNodes: WorkspaceFlowNode[] = visibleWorkspaceNodes.map(
    (node) => {
      const acceleratorRuntimeData =
        node.id === "accelerator"
          ? {
              acceleratorStepNodeVisible,
              onOpenAcceleratorStepNode,
              onHideAcceleratorStepNode,
              onAcceleratorRuntimeChange,
              onAcceleratorRuntimeActionsChange,
            }
          : {}

      return {
        id: node.id,
        type: "workspace",
        position: { x: node.x, y: node.y },
        draggable: allowEditing && !isCanvasFullscreen,
        selectable: false,
        dragHandle: allowEditing ? ".workspace-card-drag-handle" : undefined,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        className: workspaceNodeClassName(node.size, node.id),
        style: resolveWorkspaceCardNodeStyle(node.size, node.id),
        data: {
          cardId: node.id,
          size: node.size,
          canEdit: allowEditing,
          presentationMode,
          communications,
          tracker,
          vaultViewMode,
          acceleratorState: accelerator,
          seed,
          organizationEditorData,
          onSizeChange,
          onCommunicationsChange,
          onTrackerChange,
          onVaultViewModeChange,
          onAcceleratorStateChange,
          onToggleCanvasFullscreen,
          ...acceleratorRuntimeData,
        },
      }
    }
  )

  if (onboardingGuideNodeData) {
    workspaceNodes.push(onboardingGuideNodeData)
  }

  if (acceleratorStepNodeData) {
    workspaceNodes.push(acceleratorStepNodeData)
  }

  return workspaceNodes
}
