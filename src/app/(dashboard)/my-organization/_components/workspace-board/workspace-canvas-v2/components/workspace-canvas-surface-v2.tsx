"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { type ReactFlowInstance } from "reactflow"
import "reactflow/dist/style.css"

import { buildAcceleratorStepNodeData } from "../../workspace-board-flow-surface-accelerator-graph-composition"
import { resolveWorkspaceCanvasOrgNodePosition } from "../adapters/workspace-canvas-from-board-state"
import { useWorkspaceCanvasCameraController } from "../runtime/workspace-canvas-camera-controller"
import { useWorkspaceCanvasConnectionsController } from "../runtime/workspace-canvas-connections-controller"
import { useWorkspaceCanvasLifecycleLogs } from "../runtime/workspace-canvas-lifecycle-logs"
import { useWorkspaceCanvasAcceleratorRuntime } from "./workspace-canvas-surface-v2-accelerator-runtime"
import { useWorkspaceAcceleratorTutorialActionComplete } from "./workspace-canvas-surface-v2-accelerator-tutorial"
import {
  WORKSPACE_CANVAS_V2_ACCELERATOR_FOCUS_OPTIONS,
  WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
  WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
  WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
  handleWorkspaceReactFlowError,
} from "./workspace-canvas-surface-v2-config"
import {
  resolveAcceleratorWorkspaceNodeId,
  useResetAcceleratorStepNodePositionOverride,
  useWorkspaceCanvasVisibleCardIds,
  useWorkspaceCardReadinessMap,
  useWorkspaceTutorialMeasurements,
} from "./workspace-canvas-surface-v2-hooks"
import { useWorkspaceCanvasNodeDragStop, useWorkspaceTutorialAwareShortcutItems } from "./workspace-canvas-surface-v2-controller-hooks"
import { useWorkspaceCanvasRenderState } from "./workspace-canvas-surface-v2-render-state"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import { WorkspaceCanvasSurfaceV2View } from "./workspace-canvas-surface-v2-view"
import { useWorkspaceCanvasViewportControls } from "./workspace-canvas-surface-v2-viewport-controls"
import { WORKSPACE_CANVAS_V2_VAULT_MODE, type WorkspaceCanvasV2CardId } from "./workspace-canvas-surface-v2-helpers"
import { resolveWorkspaceCanvasV2InitialPositionLookup } from "./workspace-canvas-surface-v2-positioning"
import { useWorkspaceTutorialNodeState } from "./workspace-canvas-surface-v2-tutorial-node-state"
import { useWorkspaceCanvasTutorialScene } from "./workspace-canvas-surface-v2-tutorial"
import {
  buildVisibleWorkspaceCanvasCardIdSet,
  buildWorkspaceCanvasBoardNodeLookup,
  resolveWorkspaceCanvasAcceleratorNode,
  resolveWorkspaceCanvasTutorialSurfaceProps,
  useWorkspaceCanvasSurfaceCardDataLookup,
} from "./workspace-canvas-surface-v2-support-helpers"
import {
  useWorkspaceAcceleratorStepNodeData,
  useWorkspaceAcceleratorTutorialCallout,
  useWorkspaceAcceleratorTutorialInteractionPolicy,
  useWorkspaceTutorialActionHandlers,
  useWorkspaceTutorialCardPositionOverrides,
  useWorkspaceTutorialDockingState,
} from "./workspace-canvas-surface-v2-support"
import type { WorkspaceBoardState, WorkspaceCardId } from "../../workspace-board-types"

export function WorkspaceCanvasSurfaceV2({
  boardState,
  allowEditing,
  presentationMode,
  seed,
  organizationEditorData,
  layoutFitRequestKey,
  acceleratorFocusRequestKey,
  tutorialRestartRequestKey,
  onInitialOnboardingSubmit,
  focusCardRequest,
  tutorialCompletionExitRequest,
  journeyGuideState,
  onSizeChange,
  onCommunicationsChange,
  onTrackerChange,
  onAcceleratorStateChange,
  onOpenAcceleratorStepNode,
  onCloseAcceleratorStepNode,
  onTutorialPrevious,
  onTutorialNext,
  onTutorialRestart,
  onTutorialShortcutOpened,
  onFocusCard,
  onPersistNodePosition,
  onConnectCards,
  onDisconnectConnection,
  onDisconnectAllConnections,
  onToggleCardVisibility,
  onResetToBaseLayout,
  onTutorialCompletionExitHandled,
}: WorkspaceCanvasSurfaceV2Props) {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null)
  const [isFlowReady, setIsFlowReady] = useState(false)
  const [vaultViewMode, setVaultViewMode] = useState(WORKSPACE_CANVAS_V2_VAULT_MODE)
  const [acceleratorStepNodePositionOverride, setAcceleratorStepNodePositionOverride] = useState<{ x: number; y: number } | null>(null)
  const orgNodePositionFromBoard = useMemo(() => resolveWorkspaceCanvasOrgNodePosition(boardState.nodes), [boardState.nodes])
  const tutorialActiveFromBoard = boardState.onboardingFlow.active
  const initialPositionLookupRef = useRef<Record<WorkspaceCanvasV2CardId, { x: number; y: number }>>(resolveWorkspaceCanvasV2InitialPositionLookup(boardState.nodes, orgNodePositionFromBoard))
  const acceleratorTutorialCallout = useWorkspaceAcceleratorTutorialCallout({
    tutorialActive: tutorialActiveFromBoard,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
  })
  const {
    acceleratorRuntimeSnapshot,
    handleAcceleratorRuntimeChange,
    handleAcceleratorRuntimeActionsChange,
    handleOpenStepNode,
    handleHideStepNode,
    handlePreviousStep,
    handleNextStep,
    handleCompleteStep,
  } = useWorkspaceCanvasAcceleratorRuntime({ activeStepId: boardState.accelerator.activeStepId, onOpenAcceleratorStepNode, onCloseAcceleratorStepNode, tutorialCallout: acceleratorTutorialCallout, onTutorialActionComplete: onTutorialShortcutOpened })
  const {
    tutorialActive,
    tutorialSelectedCardId,
    tutorialNodeData,
    tutorialEdgeTargetId,
    tutorialSceneCardPositionOverrides,
    tutorialScenePrimaryCardId,
    tutorialSceneGuideGap,
    tutorialSceneBreakpoint,
    tutorialSceneCameraViewport,
    tutorialSceneNodeIds,
    tutorialPresentationMaskLayout,
    tutorialSceneSignature,
    tutorialLayoutAnimating,
    emptyStateMessage,
    handleTutorialNodeDragStop,
  } = useWorkspaceCanvasTutorialScene({
    boardState,
    onPrevious: onTutorialPrevious,
    onNext: onTutorialNext,
    acceleratorModuleViewerOpen: acceleratorRuntimeSnapshot?.isModuleViewerOpen === true,
  })
  const boardNodeLookup = useMemo(() => buildWorkspaceCanvasBoardNodeLookup(boardState.nodes), [boardState.nodes])
  const { tutorialCardMeasuredHeights, handleCardMeasuredHeightChange, tutorialShellMeasuredHeight, handleCurrentTutorialShellMeasuredHeightChange } = useWorkspaceTutorialMeasurements({ tutorialSceneSignature })
  const { tutorialCardPositionOverrides, setTutorialCardPositionOverrides } = useWorkspaceTutorialCardPositionOverrides({
    tutorialActive,
    tutorialSceneSignature,
  })
  const visibleCardIds = useWorkspaceCanvasVisibleCardIds({
    tutorialActive,
    hiddenCardIds: boardState.hiddenCardIds,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
  })
  const acceleratorCardVisible = visibleCardIds.includes("accelerator")
  const acceleratorWorkspaceNode = useMemo(
    () => resolveWorkspaceCanvasAcceleratorNode({ boardNodeLookup }),
    [boardNodeLookup],
  )
  const acceleratorWorkspaceNodeId = useMemo(
    () => resolveAcceleratorWorkspaceNodeId(acceleratorWorkspaceNode),
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
  const { tutorialCallout, handleTutorialActionComplete, handleOpenCard } = useWorkspaceTutorialActionHandlers({
    tutorialActive,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
    hiddenCardIds: boardState.hiddenCardIds,
    onTutorialNext,
    onTutorialShortcutOpened,
    onConnectCards,
    onToggleCardVisibility,
    onFocusCard,
  })
  const handleAcceleratorTutorialActionComplete = useWorkspaceAcceleratorTutorialActionComplete({ onTutorialNext, onTutorialShortcutOpened })
  const acceleratorTutorialInteractionPolicy = useWorkspaceAcceleratorTutorialInteractionPolicy({
    tutorialActive,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    acceleratorRuntimeSnapshot,
  })
  useResetAcceleratorStepNodePositionOverride({ acceleratorCardVisible, acceleratorStepNodeVisible, setAcceleratorStepNodePositionOverride })
  const acceleratorStepNodeData = useWorkspaceAcceleratorStepNodeData({
    acceleratorRuntimeSnapshot,
    acceleratorStepNodePositionOverride,
    acceleratorStepNodeVisible,
    autoLayoutMode: boardState.autoLayoutMode,
    allowEditing,
    tutorialActive,
    acceleratorWorkspaceNode,
    presentationMode,
    onPrevious: handlePreviousStep,
    onNext: handleNextStep,
    onComplete: handleCompleteStep,
    onClose: handleHideStepNode,
    onWorkspaceOnboardingSubmit: onInitialOnboardingSubmit,
  })
  const { showTutorialRestart, tutorialCalendarButtonCallout, onTutorialCalendarButtonComplete, organizationMapButtonCallout, onOrganizationMapButtonTutorialComplete } = resolveWorkspaceCanvasTutorialSurfaceProps({
    allowEditing,
    presentationMode,
    tutorialCallout,
    onTutorialComplete: handleTutorialActionComplete,
  })
  const cardDataLookup = useWorkspaceCanvasSurfaceCardDataLookup({
    boardState,
    allowEditing,
    presentationMode,
    seed,
    organizationEditorData,
    onSizeChange,
    onCommunicationsChange,
    onTrackerChange,
    onAcceleratorStateChange,
    onInitialOnboardingSubmit,
    vaultViewMode,
    onVaultViewModeChange: setVaultViewMode,
    acceleratorStepNodeVisible,
    onOpenAcceleratorStepNode: handleOpenStepNode,
    onHideAcceleratorStepNode: handleHideStepNode,
    onAcceleratorRuntimeChange: handleAcceleratorRuntimeChange,
    onAcceleratorRuntimeActionsChange: handleAcceleratorRuntimeActionsChange,
    acceleratorRuntimeSnapshot,
    acceleratorTutorialCallout,
    acceleratorTutorialInteractionPolicy,
    onAcceleratorTutorialActionComplete: handleAcceleratorTutorialActionComplete,
    journeyGuideState,
    onFocusCard,
    onOpenCard: handleOpenCard,
    onCardMeasuredHeightChange: handleCardMeasuredHeightChange,
    organizationShortcutItems: shortcutItems,
    organizationMapButtonCallout,
    onOrganizationMapButtonTutorialComplete,
    tutorialActive,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
  })
  const {
    tutorialNodeData: tutorialNodeWithPresentation,
    tutorialSuppressedNodeIds,
    tutorialDockTargets,
    tutorialDraggableCardIds,
    tutorialSceneNodeIds: resolvedTutorialSceneNodeIds,
    tutorialSceneCameraViewport: resolvedTutorialSceneCameraViewport,
  } = useWorkspaceTutorialNodeState({
    tutorialActive,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    tutorialSceneSignature,
    openedStepIds: boardState.onboardingFlow.openedTutorialStepIds,
    cardDataLookup,
    tutorialNodeData,
    tutorialBreakpoint: tutorialSceneBreakpoint,
    tutorialSceneCardPositionOverrides,
    tutorialScenePrimaryCardId,
    tutorialSceneGuideGap,
    tutorialSceneNodeIds,
    tutorialSceneCameraViewport,
    cardMeasuredHeights: tutorialCardMeasuredHeights,
    tutorialShellMeasuredHeight,
    tutorialPresentationMaskLayout,
    acceleratorRuntimeSnapshot,
    onTutorialShellMeasuredHeightChange: handleCurrentTutorialShellMeasuredHeightChange,
  })
  const { resolvedTutorialCardPositionOverrides, setTutorialUndockedCardIds } = useWorkspaceTutorialDockingState({
    tutorialActive,
    tutorialSceneSignature,
    tutorialCardPositionOverrides,
    tutorialSceneCardPositionOverrides,
    tutorialDockTargets,
  })
  const visibleCardIdSet = useMemo(
    () =>
      buildVisibleWorkspaceCanvasCardIdSet({
        visibleCardIds,
        tutorialSuppressedNodeIds,
      }),
    [tutorialSuppressedNodeIds, visibleCardIds],
  )
  const {
    onNodesChange,
    renderNodes,
    visibleNodeIds,
    tutorialSceneFitRequest,
  } = useWorkspaceCanvasRenderState({
    visibleCardIds,
    boardNodeLookup,
    initialPositionLookupRef,
    cardDataLookup,
    allowEditing,
    tutorialActive,
    acceleratorStepNodeData,
    tutorialNodeData: tutorialNodeWithPresentation,
    tutorialSceneCardPositionOverrides: resolvedTutorialCardPositionOverrides,
    tutorialDraggableCardIds,
    orgNodePositionFromBoard,
    tutorialSceneNodeIds: resolvedTutorialSceneNodeIds,
    tutorialSceneSignature,
    tutorialSceneCameraViewport: resolvedTutorialSceneCameraViewport,
    tutorialSceneRequestSeed: tutorialRestartRequestKey,
  })
  const handleFlowInit = useCallback((instance: ReactFlowInstance) => { flowInstanceRef.current = instance; setIsFlowReady(true) }, [])
  const { handleZoomIn, handleZoomOut, handleRecenterView, handleResetView } = useWorkspaceCanvasViewportControls({
    flowInstanceRef,
    tutorialActive,
    tutorialSceneFitRequest,
    tutorialCompletionExitRequest,
    focusCardRequest,
    journeyGuideState,
    visibleNodeIds,
    onResetToBaseLayout,
  })
  useWorkspaceCanvasCameraController({
    flowInstanceRef,
    isFlowReady,
    visibleNodeIds,
    layoutFitRequestKey,
    acceleratorFocusRequestKey,
    focusCardRequest,
    tutorialCompletionExitRequest,
    sceneFitRequest: tutorialSceneFitRequest,
    layoutFitOptions: WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
    sceneFitOptions: WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
    acceleratorFocusOptions: WORKSPACE_CANVAS_V2_ACCELERATOR_FOCUS_OPTIONS,
    focusCardOptions: WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
    onTutorialCompletionExitHandled,
  })
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
    acceleratorStepNodeVisible: Boolean(acceleratorStepNodeData && acceleratorWorkspaceNodeId),
    autoLayoutMode: boardState.autoLayoutMode,
    acceleratorWorkspaceNodeId,
    tutorialEdgeTargetId,
    onConnectCards,
    onDisconnectConnection,
    onDisconnectAllConnections,
  })
  useWorkspaceCanvasLifecycleLogs(renderNodes.length)
  const handleNodeDragStop = useWorkspaceCanvasNodeDragStop({
    allowEditing,
    tutorialActive,
    boardNodeLookup,
    onPersistNodePosition,
    setAcceleratorStepNodePositionOverride,
    setTutorialCardPositionOverrides,
    setTutorialUndockedCardIds,
    tutorialDockTargets,
    onTutorialNodeDragStop: handleTutorialNodeDragStop,
  })
  return (
    <WorkspaceCanvasSurfaceV2View
      nodes={renderNodes}
      edges={edges}
      calendar={seed.calendar}
      allowEditing={allowEditing}
      nodesDraggable={allowEditing || tutorialActive}
      tutorialActive={tutorialActive}
      layoutAnimating={tutorialLayoutAnimating}
      presentationMode={presentationMode}
      edgeContextMenuState={edgeContextMenuState}
      shortcutItems={shortcutItems}
      tutorialCalendarButtonCallout={tutorialCalendarButtonCallout}
      emptyStateMessage={emptyStateMessage}
      showTutorialRestart={showTutorialRestart}
      onNodesChange={onNodesChange}
      onNodeDragStop={handleNodeDragStop}
      onConnect={handleConnect}
      isValidConnection={handleIsValidConnection}
      onEdgeDoubleClick={handleEdgeDoubleClick}
      onEdgeContextMenu={handleEdgeContextMenu}
      onError={handleWorkspaceReactFlowError}
      onInit={handleFlowInit}
      onTutorialRestart={onTutorialRestart}
      onTutorialCalendarButtonComplete={onTutorialCalendarButtonComplete}
      onRecenterView={handleRecenterView}
      onResetView={handleResetView}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onCloseEdgeContextMenu={closeEdgeContextMenu}
      onDisconnectEdge={handleContextDisconnectEdge}
      onDisconnectFromSource={handleContextDisconnectFromSource}
      onDisconnectToTarget={handleContextDisconnectToTarget}
      onDisconnectAll={handleContextDisconnectAll}
    />
  )
}
