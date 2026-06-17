"use client"

import { useMemo, useRef, useState } from "react"
import { type ReactFlowInstance } from "reactflow"
import "reactflow/dist/style.css"

import { resolveWorkspaceCanvasOrgNodePosition } from "../adapters/workspace-canvas-from-board-state"
import { useWorkspaceCanvasSurfaceAcceleratorState } from "./workspace-canvas-surface-v2-accelerator-state"
import { handleWorkspaceReactFlowError } from "./workspace-canvas-surface-v2-config"
import {
  useWorkspaceCanvasVisibleCardIds,
  useWorkspaceCardReadinessMap,
  useWorkspaceTutorialMeasurements,
} from "./workspace-canvas-surface-v2-hooks"
import {
  useWorkspaceCanvasNodeDragStop,
  useWorkspaceTutorialAwareShortcutItems,
} from "./workspace-canvas-surface-v2-controller-hooks"
import { useWorkspaceCanvasRenderState } from "./workspace-canvas-surface-v2-render-state"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import { WorkspaceCanvasSurfaceV2View } from "./workspace-canvas-surface-v2-view"
import { useWorkspaceCanvasViewportControls } from "./workspace-canvas-surface-v2-viewport-controls"
import {
  WORKSPACE_CANVAS_V2_VAULT_MODE,
  type WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"
import { useWorkspaceCanvasPersonFitRequest } from "./workspace-canvas-people-placement-controller"
import { useWorkspaceCanvasSurfaceDragHandlers } from "./workspace-canvas-surface-v2-drag-handlers"
import { useWorkspaceCanvasSurfaceFlowState } from "./workspace-canvas-surface-v2-flow-state"
import { useWorkspaceCanvasSurfacePeopleState } from "./workspace-canvas-surface-v2-people-state"
import {
  useVisibleWorkspaceCanvasCardIdSet,
  useWorkspaceCanvasSurfaceNodeLookups,
} from "./workspace-canvas-surface-v2-node-lookups"
import { useWorkspaceTutorialNodeState } from "./workspace-canvas-surface-v2-tutorial-node-state"
import { useWorkspaceCanvasTutorialScene } from "./workspace-canvas-surface-v2-tutorial"
import { useWorkspaceCanvasViewportPreferences } from "./workspace-canvas-viewport-preferences"
import {
  resolveWorkspaceCanvasTutorialSurfaceProps,
  useWorkspaceCanvasSurfaceCardDataLookup,
} from "./workspace-canvas-surface-v2-support-helpers"
import {
  useWorkspaceTutorialActionHandlers,
  useWorkspaceTutorialCardPositionOverrides,
  useWorkspaceTutorialDockingState,
} from "./workspace-canvas-surface-v2-support"

// eslint-disable-next-line max-lines-per-function
export function WorkspaceCanvasSurfaceV2({
  boardState,
  allowEditing,
  workspaceDataDrawerCanEdit,
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
  onTutorialCompletionExitHandled,
}: WorkspaceCanvasSurfaceV2Props) {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null)
  const [isFlowReady, setIsFlowReady] = useState(false)
  const [vaultViewMode, setVaultViewMode] = useState(
    WORKSPACE_CANVAS_V2_VAULT_MODE
  )
  const orgNodePositionFromBoard = useMemo(
    () => resolveWorkspaceCanvasOrgNodePosition(boardState.nodes),
    [boardState.nodes]
  )
  const tutorialActiveFromBoard = boardState.onboardingFlow.active
  const { handleCanvasMoveEnd, suppressInitialFit, uiPreferencesScope } =
    useWorkspaceCanvasViewportPreferences({
      flowInstanceRef,
      isFlowReady,
      orgId: seed.orgId,
      tutorialActive: tutorialActiveFromBoard,
      viewerId: seed.viewerId,
    })
  const {
    allowPeopleCanvasInteraction,
    workspaceDataDrawerPeople,
    workspacePersonById,
    workspacePersonPlacements,
    placedWorkspacePersonIds,
    personRelationshipEdges,
    workspacePersonFitRequest,
    clearWorkspacePersonFitRequest,
    handleRemoveWorkspacePersonPlacement,
    handleWorkspacePersonDropToCanvas,
    handleAddWorkspacePeopleToCanvas,
    handleWorkspacePersonNodeDragStop,
    handleWorkspacePersonNodesDragStop,
  } = useWorkspaceCanvasSurfacePeopleState({
    allowEditing,
    flowInstanceRef,
    organizationEditorData,
    presentationMode,
    tutorialActive: tutorialActiveFromBoard,
    uiPreferencesScope,
    workspaceDataDrawerCanEdit,
  })
  const {
    acceleratorWorkspaceNode,
    acceleratorWorkspaceNodeId,
    boardNodeLookup,
    initialPositionLookupRef,
  } = useWorkspaceCanvasSurfaceNodeLookups({
    boardNodes: boardState.nodes,
    orgNodePositionFromBoard,
  })
  const acceleratorStepNodeVisible = boardState.acceleratorUi?.stepOpen === true
  const {
    acceleratorRuntimeSnapshot,
    acceleratorStepNodeData,
    acceleratorTutorialCallout,
    acceleratorTutorialInteractionPolicy,
    handleAcceleratorRuntimeActionsChange,
    handleAcceleratorRuntimeChange,
    handleAcceleratorTutorialActionComplete,
    handleHideStepNode,
    handleOpenStepNode,
    setAcceleratorStepNodePositionOverride,
  } = useWorkspaceCanvasSurfaceAcceleratorState({
    boardState,
    allowEditing,
    presentationMode,
    tutorialActive: tutorialActiveFromBoard,
    acceleratorWorkspaceNode,
    acceleratorStepNodeVisible,
    onInitialOnboardingSubmit,
    onOpenAcceleratorStepNode,
    onCloseAcceleratorStepNode,
    onTutorialNext,
    onTutorialShortcutOpened,
  })
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
    acceleratorModuleViewerOpen:
      acceleratorRuntimeSnapshot?.isModuleViewerOpen === true,
  })
  const {
    tutorialCardMeasuredHeights,
    handleCardMeasuredHeightChange,
    tutorialShellMeasuredHeight,
    handleCurrentTutorialShellMeasuredHeightChange,
  } = useWorkspaceTutorialMeasurements({ tutorialSceneSignature })
  const { tutorialCardPositionOverrides, setTutorialCardPositionOverrides } =
    useWorkspaceTutorialCardPositionOverrides({
      tutorialActive,
      tutorialSceneSignature,
    })
  const visibleCardIds = useWorkspaceCanvasVisibleCardIds({
    tutorialActive,
    hiddenCardIds: boardState.hiddenCardIds,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
  })
  const readinessMap = useWorkspaceCardReadinessMap({ seed, boardState })
  const shortcutItems = useWorkspaceTutorialAwareShortcutItems({
    boardState,
    visibleCardIds,
    tutorialActive,
    tutorialSelectedCardId,
    focusCardRequest,
    onToggleCardVisibility,
    onFocusCard,
    onTutorialShortcutOpened,
  })
  const { tutorialCallout, handleTutorialActionComplete, handleOpenCard } =
    useWorkspaceTutorialActionHandlers({
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
  const {
    showTutorialRestart,
    tutorialCalendarButtonCallout,
    onTutorialCalendarButtonComplete,
    organizationMapButtonCallout,
    onOrganizationMapButtonTutorialComplete,
  } = resolveWorkspaceCanvasTutorialSurfaceProps({
    allowEditing,
    isPlatformAdmin: seed.isPlatformAdmin,
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
    onAcceleratorTutorialActionComplete:
      handleAcceleratorTutorialActionComplete,
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
    onTutorialShellMeasuredHeightChange:
      handleCurrentTutorialShellMeasuredHeightChange,
  })
  const { resolvedTutorialCardPositionOverrides, setTutorialUndockedCardIds } =
    useWorkspaceTutorialDockingState({
      tutorialActive,
      tutorialSceneSignature,
      tutorialCardPositionOverrides,
      tutorialSceneCardPositionOverrides,
      tutorialDockTargets,
    })
  const visibleCardIdSet = useVisibleWorkspaceCanvasCardIdSet({
    tutorialSuppressedNodeIds,
    visibleCardIds,
  })
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
    allowPeopleCanvasInteraction,
    tutorialActive,
    acceleratorStepNodeData,
    tutorialNodeData: tutorialNodeWithPresentation,
    workspacePersonPlacements,
    workspacePersonById,
    onRemoveWorkspacePerson: handleRemoveWorkspacePersonPlacement,
    tutorialSceneCardPositionOverrides: resolvedTutorialCardPositionOverrides,
    tutorialDraggableCardIds,
    orgNodePositionFromBoard,
    tutorialSceneNodeIds: resolvedTutorialSceneNodeIds,
    tutorialSceneSignature,
    tutorialSceneCameraViewport: resolvedTutorialSceneCameraViewport,
    tutorialSceneRequestSeed: tutorialRestartRequestKey,
  })
  useWorkspaceCanvasPersonFitRequest({
    flowInstanceRef,
    isFlowReady,
    renderNodes,
    fitRequest: workspacePersonFitRequest,
    onFitRequestHandled: clearWorkspacePersonFitRequest,
  })
  const {
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
    handleFlowInit,
    handleRecenterView,
    handleZoomIn,
    handleZoomOut,
    renderEdges,
  } = useWorkspaceCanvasSurfaceFlowState({
    acceleratorFocusRequestKey,
    acceleratorStepNodeActive: Boolean(
      acceleratorStepNodeData && acceleratorWorkspaceNodeId
    ),
    acceleratorWorkspaceNodeId,
    allowEditing,
    autoLayoutMode: boardState.autoLayoutMode,
    connections: boardState.connections,
    flowInstanceRef,
    focusCardRequest,
    isFlowReady,
    layoutFitRequestKey,
    nodeRelationshipEdges: personRelationshipEdges,
    onConnectCards,
    onDisconnectAllConnections,
    onDisconnectConnection,
    onTutorialCompletionExitHandled,
    presentationMode,
    readinessMap,
    renderNodes,
    setIsFlowReady,
    suppressInitialFit,
    tutorialActive,
    tutorialCompletionExitRequest,
    tutorialEdgeTargetId,
    tutorialSceneFitRequest,
    visibleCardIdSet,
    visibleNodeIds,
  })
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
  const { handleCanvasNodeDragStop, handleCanvasSelectionDragStop } =
    useWorkspaceCanvasSurfaceDragHandlers({
      handleNodeDragStop,
      handleWorkspacePersonNodeDragStop,
      handleWorkspacePersonNodesDragStop,
    })
  const viewProps = {
    nodes: renderNodes,
    edges: renderEdges,
    allowEditing,
    peopleCanvasInteractionEnabled: allowPeopleCanvasInteraction,
    workspaceDataDrawerCanEdit,
    nodesDraggable:
      allowEditing || allowPeopleCanvasInteraction || tutorialActive,
    tutorialActive,
    layoutAnimating: tutorialLayoutAnimating,
    presentationMode,
    workspaceDataDrawerPeople,
    placedWorkspacePersonIds,
    workspaceDataDrawerViewerId: seed.viewerId,
    workspaceDataDrawerDocuments: organizationEditorData.documentsTab,
    uiPreferencesScope,
    edgeContextMenuState,
    shortcutItems,
    tutorialCalendarButtonCallout,
    emptyStateMessage,
    showTutorialRestart,
    onNodesChange,
    onNodeDragStop: handleCanvasNodeDragStop,
    onSelectionDragStop: handleCanvasSelectionDragStop,
    onMoveEnd: handleCanvasMoveEnd,
    onConnect: handleConnect,
    isValidConnection: handleIsValidConnection,
    onEdgeDoubleClick: handleEdgeDoubleClick,
    onEdgeContextMenu: handleEdgeContextMenu,
    onError: handleWorkspaceReactFlowError,
    onInit: handleFlowInit,
    onTutorialRestart,
    onTutorialCalendarButtonComplete,
    onRecenterView: handleRecenterView,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onWorkspacePersonDropToCanvas: handleWorkspacePersonDropToCanvas,
    onAddWorkspacePeopleToCanvas: handleAddWorkspacePeopleToCanvas,
    onCloseEdgeContextMenu: closeEdgeContextMenu,
    onDisconnectEdge: handleContextDisconnectEdge,
    onDisconnectFromSource: handleContextDisconnectFromSource,
    onDisconnectToTarget: handleContextDisconnectToTarget,
    onDisconnectAll: handleContextDisconnectAll,
  }

  return <WorkspaceCanvasSurfaceV2View {...viewProps} />
}
