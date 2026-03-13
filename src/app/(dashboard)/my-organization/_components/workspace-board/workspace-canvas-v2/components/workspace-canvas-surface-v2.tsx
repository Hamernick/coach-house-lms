"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  type ReactFlowInstance,
  useNodesState,
} from "reactflow"
import "reactflow/dist/style.css"

import {
  buildAcceleratorStepNodeData,
} from "../../workspace-board-flow-surface-accelerator-graph-composition"

import { resolveWorkspaceCanvasOrgNodePosition } from "../adapters/workspace-canvas-from-board-state"
import { useWorkspaceCanvasCameraController } from "../runtime/workspace-canvas-camera-controller"
import { useWorkspaceCanvasConnectionsController } from "../runtime/workspace-canvas-connections-controller"
import { useWorkspaceCanvasLifecycleLogs } from "../runtime/workspace-canvas-lifecycle-logs"
import { useWorkspaceCanvasAcceleratorRuntime } from "./workspace-canvas-surface-v2-accelerator-runtime"
import {
  resolveAcceleratorTutorialCallout,
  useWorkspaceAcceleratorTutorialActionComplete,
} from "./workspace-canvas-surface-v2-accelerator-tutorial"
import {
  WORKSPACE_CANVAS_V2_ACCELERATOR_FOCUS_OPTIONS,
  WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
  WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
  WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
  handleWorkspaceReactFlowError,
} from "./workspace-canvas-surface-v2-config"
import {
  useWorkspaceCardReadinessMap,
} from "./workspace-canvas-surface-v2-hooks"
import {
  useWorkspaceCanvasNodeDragStop,
  useWorkspaceTutorialAwareShortcutItems,
  useWorkspaceTutorialSceneFitRequest,
} from "./workspace-canvas-surface-v2-controller-hooks"
import { buildInitialWorkspaceCanvasNodes } from "./workspace-canvas-surface-v2-node-builders"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import { WorkspaceCanvasSurfaceV2View } from "./workspace-canvas-surface-v2-view"
import {
  WORKSPACE_CANVAS_V2_CARD_IDS,
  WORKSPACE_CANVAS_V2_VAULT_MODE,
  type WorkspaceCanvasNode,
  type WorkspaceCanvasNodeData,
  type WorkspaceCanvasV2CardId,
  buildWorkspaceCanvasV2CardDataLookup,
  isWorkspaceCanvasV2CardId,
  reconcileWorkspaceCanvasV2Nodes,
} from "./workspace-canvas-surface-v2-helpers"
import { resolveWorkspaceCanvasV2InitialPositionLookup } from "./workspace-canvas-surface-v2-positioning"
import { useWorkspaceCanvasTutorialScene } from "./workspace-canvas-surface-v2-tutorial"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
} from "../../workspace-board-types"

export function WorkspaceCanvasSurfaceV2({
  boardState,
  allowEditing,
  presentationMode,
  seed,
  organizationEditorData,
  layoutFitRequestKey,
  acceleratorFocusRequestKey,
  focusCardRequest,
  journeyGuideState,
  onSizeChange,
  onCommunicationsChange,
  onTrackerChange,
  onAcceleratorStateChange,
  onOpenAcceleratorStepNode,
  onCloseAcceleratorStepNode,
  onTutorialPrevious,
  onTutorialNext,
  onTutorialShortcutOpened,
  onFocusCard,
  onPersistNodePosition,
  onConnectCards,
  onDisconnectConnection,
  onDisconnectAllConnections,
  onToggleCardVisibility,
}: WorkspaceCanvasSurfaceV2Props) {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null)
  const [isFlowReady, setIsFlowReady] = useState(false)
  const [vaultViewMode, setVaultViewMode] = useState(WORKSPACE_CANVAS_V2_VAULT_MODE)
  const [acceleratorStepNodePositionOverride, setAcceleratorStepNodePositionOverride] =
    useState<{ x: number; y: number } | null>(null)
  const orgNodePositionFromBoard = useMemo(
    () => resolveWorkspaceCanvasOrgNodePosition(boardState.nodes),
    [boardState.nodes],
  )
  const initialPositionLookupRef = useRef<
    Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
  >(
    resolveWorkspaceCanvasV2InitialPositionLookup(
      boardState.nodes,
      orgNodePositionFromBoard,
    ),
  )
  const {
    tutorialActive,
    tutorialSelectedCardId,
    tutorialNodeData,
    tutorialEdgeTargetId,
    tutorialSceneFitPadding,
    emptyStateMessage,
    handleTutorialNodeDragStop,
  } = useWorkspaceCanvasTutorialScene({
    boardState,
    allowEditing,
    onPrevious: onTutorialPrevious,
    onNext: onTutorialNext,
  })
  const boardNodeLookup = useMemo(
    () => new Map(boardState.nodes.map((node) => [node.id, node])),
    [boardState.nodes],
  )
  const visibleCardIds = useMemo<WorkspaceCanvasV2CardId[]>(
    () =>
      WORKSPACE_CANVAS_V2_CARD_IDS.filter(
        (cardId) => !boardState.hiddenCardIds.includes(cardId),
      ),
    [boardState.hiddenCardIds],
  )
  const acceleratorCardVisible = visibleCardIds.includes("accelerator")
  const visibleCardIdSet = useMemo(
    () => new Set<WorkspaceCanvasV2CardId>(visibleCardIds),
    [visibleCardIds],
  )
  const acceleratorWorkspaceNode = boardNodeLookup.get("accelerator") ?? null
  const acceleratorWorkspaceNodeId = useMemo(
    () =>
      acceleratorWorkspaceNode && isWorkspaceCanvasV2CardId(acceleratorWorkspaceNode.id)
        ? acceleratorWorkspaceNode.id
        : null,
    [acceleratorWorkspaceNode],
  )
  const acceleratorStepNodeVisible = boardState.acceleratorUi?.stepOpen === true
  const readinessMap = useWorkspaceCardReadinessMap({ seed, boardState })
  const shortcutItems = useWorkspaceTutorialAwareShortcutItems({
    boardState,
    visibleCardIds,
    tutorialActive,
    tutorialSelectedCardId,
    focusCardRequest,
    journeyGuideState,
    onToggleCardVisibility,
    onFocusCard,
    onTutorialShortcutOpened,
  })
  const acceleratorTutorialCallout = useMemo(
    () =>
      resolveAcceleratorTutorialCallout({
        tutorialActive,
        tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
        openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
      }),
    [
      boardState.onboardingFlow.openedTutorialStepIds,
      boardState.onboardingFlow.tutorialStepIndex,
      tutorialActive,
    ],
  )
  const {
    acceleratorRuntimeSnapshot,
    handleAcceleratorRuntimeChange,
    handleAcceleratorRuntimeActionsChange,
    handleOpenStepNode,
    handleHideStepNode,
    handlePreviousStep,
    handleNextStep,
    handleCompleteStep,
  } = useWorkspaceCanvasAcceleratorRuntime({
    activeStepId: boardState.accelerator.activeStepId,
    onOpenAcceleratorStepNode,
    onCloseAcceleratorStepNode,
    tutorialCallout: acceleratorTutorialCallout,
    onTutorialActionComplete: onTutorialShortcutOpened,
  })
  const handleAcceleratorTutorialActionComplete =
    useWorkspaceAcceleratorTutorialActionComplete({
      onTutorialNext,
      onTutorialShortcutOpened,
    })
  useEffect(() => {
    if (!acceleratorCardVisible || !acceleratorStepNodeVisible) {
      setAcceleratorStepNodePositionOverride(null)
    }
  }, [acceleratorCardVisible, acceleratorStepNodeVisible])
  const acceleratorStepNodeData = useMemo<WorkspaceCanvasNode | null>(() => {
    const node = buildAcceleratorStepNodeData({
      acceleratorRuntimeSnapshot,
      acceleratorStepNodePositionOverride,
      acceleratorStepNodeVisible,
      autoLayoutMode: boardState.autoLayoutMode,
      allowEditing,
      acceleratorWorkspaceNode,
      isCanvasFullscreen: false,
      presentationMode,
      onPrevious: handlePreviousStep,
      onNext: handleNextStep,
      onComplete: handleCompleteStep,
      onClose: handleHideStepNode,
      tutorialCallout: null,
    })
    return node as WorkspaceCanvasNode | null
  }, [
    acceleratorRuntimeSnapshot,
    acceleratorStepNodePositionOverride,
    acceleratorStepNodeVisible,
    boardState.autoLayoutMode,
    allowEditing,
    acceleratorWorkspaceNode,
    presentationMode,
    handlePreviousStep,
    handleNextStep,
    handleCompleteStep,
    handleHideStepNode,
  ])
  const cardDataLookup = useMemo(() => buildWorkspaceCanvasV2CardDataLookup({
    allowEditing,
    presentationMode,
    acceleratorState: boardState.accelerator,
    communications: boardState.communications,
    tracker: boardState.tracker,
    nodes: boardState.nodes,
    seed,
    organizationEditorData,
    onSizeChange,
    onCommunicationsChange,
    onTrackerChange,
    onAcceleratorStateChange,
    vaultViewMode,
    onVaultViewModeChange: setVaultViewMode,
    acceleratorStepNodeVisible,
    onOpenAcceleratorStepNode: handleOpenStepNode,
    onHideAcceleratorStepNode: handleHideStepNode,
    onAcceleratorRuntimeChange: handleAcceleratorRuntimeChange,
    onAcceleratorRuntimeActionsChange: handleAcceleratorRuntimeActionsChange,
    acceleratorTutorialCallout,
    onAcceleratorTutorialActionComplete: handleAcceleratorTutorialActionComplete,
    journeyGuideState,
    onFocusCard,
    organizationShortcutItems: shortcutItems,
  }), [
    allowEditing,
    boardState.accelerator,
    boardState.communications,
    boardState.nodes,
    boardState.tracker,
    acceleratorStepNodeVisible,
    handleAcceleratorRuntimeActionsChange,
    handleAcceleratorRuntimeChange,
    handleHideStepNode,
    handleOpenStepNode,
    journeyGuideState,
    acceleratorTutorialCallout,
    onAcceleratorStateChange,
    onCommunicationsChange,
    onFocusCard,
    onSizeChange,
    onTrackerChange,
    organizationEditorData,
    presentationMode,
    shortcutItems,
    handleAcceleratorTutorialActionComplete,
    seed,
    vaultViewMode,
  ])

  const initialNodes = useMemo<WorkspaceCanvasNode[]>(
    () =>
      buildInitialWorkspaceCanvasNodes({
        visibleCardIds,
        boardNodeLookup,
        initialPositionLookupRef,
        cardDataLookup,
        allowEditing,
        acceleratorStepNodeData,
        tutorialNodeData,
      }),
    [
      acceleratorStepNodeData,
      allowEditing,
      boardNodeLookup,
      cardDataLookup,
      tutorialNodeData,
      visibleCardIds,
    ],
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkspaceCanvasNodeData>(initialNodes)
  const visibleNodeIds = useMemo(() => nodes.map((node) => node.id), [nodes])
  const tutorialSceneFitRequest = useWorkspaceTutorialSceneFitRequest({
    tutorialActive,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    visibleCardIds,
    openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
    sceneFitPadding: tutorialSceneFitPadding,
  })
  const handleFlowInit = useCallback((instance: ReactFlowInstance) => {
    flowInstanceRef.current = instance
    setIsFlowReady(true)
  }, [])
  useWorkspaceCanvasCameraController({
    flowInstanceRef,
    isFlowReady,
    visibleNodeIds,
    layoutFitRequestKey,
    acceleratorFocusRequestKey,
    focusCardRequest,
    sceneFitRequest: tutorialSceneFitRequest,
    layoutFitOptions: WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
    sceneFitOptions: WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
    acceleratorFocusOptions: WORKSPACE_CANVAS_V2_ACCELERATOR_FOCUS_OPTIONS,
    focusCardOptions: WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
  })
  useEffect(() => {
    setNodes((previous) =>
      reconcileWorkspaceCanvasV2Nodes({
        previous,
        visibleCardIds,
        boardNodeLookup,
        cardDataLookup,
        orgNodePositionFromBoard,
        allowEditing,
        acceleratorStepNodeData,
        tutorialNodeData,
      }),
    )
  }, [
    allowEditing,
    boardNodeLookup,
    cardDataLookup,
    acceleratorStepNodeData,
    orgNodePositionFromBoard,
    setNodes,
    tutorialActive,
    tutorialNodeData,
    visibleCardIds,
  ])
  const {
    edges,
    edgeContextMenuState,
    closeEdgeContextMenu,
    handleConnect,
    handleIsValidConnection,
    handleEdgeDoubleClick,
    handleEdgeContextMenu,
    handleContextDisconnectEdge,
    handleContextDisconnectFromSource,
    handleContextDisconnectToTarget,
    handleContextDisconnectAll,
  } = useWorkspaceCanvasConnectionsController({
    allowEditing,
    connections: boardState.connections,
    visibleCardIdSet,
    presentationMode,
    readinessMap,
    acceleratorStepNodeVisible: Boolean(
      acceleratorStepNodeData && acceleratorWorkspaceNodeId,
    ),
    autoLayoutMode: boardState.autoLayoutMode,
    acceleratorWorkspaceNodeId,
    tutorialEdgeTargetId,
    onConnectCards,
    onDisconnectConnection,
    onDisconnectAllConnections,
  })
  useWorkspaceCanvasLifecycleLogs(nodes.length)
  const handleNodeDragStop = useWorkspaceCanvasNodeDragStop({
    allowEditing,
    boardNodeLookup,
    onPersistNodePosition,
    setAcceleratorStepNodePositionOverride,
    onTutorialNodeDragStop: handleTutorialNodeDragStop,
  })
  return (
    <WorkspaceCanvasSurfaceV2View
      nodes={nodes}
      edges={edges}
      allowEditing={allowEditing}
      presentationMode={presentationMode}
      edgeContextMenuState={edgeContextMenuState}
      shortcutItems={shortcutItems}
      emptyStateMessage={emptyStateMessage}
      onNodesChange={onNodesChange}
      onNodeDragStop={handleNodeDragStop}
      onConnect={handleConnect}
      isValidConnection={handleIsValidConnection}
      onEdgeDoubleClick={handleEdgeDoubleClick}
      onEdgeContextMenu={handleEdgeContextMenu}
      onError={handleWorkspaceReactFlowError}
      onInit={handleFlowInit}
      onCloseEdgeContextMenu={closeEdgeContextMenu}
      onDisconnectEdge={handleContextDisconnectEdge}
      onDisconnectFromSource={handleContextDisconnectFromSource}
      onDisconnectToTarget={handleContextDisconnectToTarget}
      onDisconnectAll={handleContextDisconnectAll}
    />
  )
}
