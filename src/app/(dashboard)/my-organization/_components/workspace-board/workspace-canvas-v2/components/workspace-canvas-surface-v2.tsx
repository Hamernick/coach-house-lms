"use client"

import "reactflow/dist/style.css"

import { useWorkspaceCanvasSurfaceV2Bootstrap } from "./use-workspace-canvas-surface-v2-bootstrap"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import { WorkspaceCanvasSurfaceV2View } from "./workspace-canvas-surface-v2-view"
import * as Runtime from "./workspace-canvas-surface-v2-runtime"

const WORKSPACE_LIVE_CANVAS_ONTOLOGY_ENABLED = false

export function WorkspaceCanvasSurfaceV2(props: WorkspaceCanvasSurfaceV2Props) {
  const { boardState, allowEditing, presentationMode, seed } = props
  const { organizationEditorData, workspaceDataDrawerCanEdit } = props
  const { workspaceFoundationEnabled, onTutorialNext } = props
  const { onTutorialShortcutOpened, onFocusCard } = props
  const bootstrap = useWorkspaceCanvasSurfaceV2Bootstrap({
    allowEditing,
    boardState,
    onAcceleratorStateChange: props.onAcceleratorStateChange,
    onCloseAcceleratorStepNode: props.onCloseAcceleratorStepNode,
    onFocusCard,
    onInitialOnboardingSubmit: props.onInitialOnboardingSubmit,
    onOpenAcceleratorStepNode: props.onOpenAcceleratorStepNode,
    onTutorialNext,
    onTutorialShortcutOpened,
    organizationEditorData,
    presentationMode,
    seed,
    workspaceDataDrawerCanEdit,
    workspaceFoundationEnabled,
  })
  const { accelerator, acceleratorDrawer, nodeLookups, people, viewport } =
    bootstrap
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
  } = Runtime.useWorkspaceCanvasTutorialScene({
    boardState,
    onPrevious: props.onTutorialPrevious,
    onNext: onTutorialNext,
    acceleratorModuleViewerOpen:
      accelerator.acceleratorRuntimeSnapshot?.isModuleViewerOpen === true,
  })
  const {
    tutorialCardMeasuredHeights,
    handleCardMeasuredHeightChange,
    tutorialShellMeasuredHeight,
    handleCurrentTutorialShellMeasuredHeightChange,
  } = Runtime.useWorkspaceTutorialMeasurements({ tutorialSceneSignature })
  const { tutorialCardPositionOverrides, setTutorialCardPositionOverrides } =
    Runtime.useWorkspaceTutorialCardPositionOverrides({
      tutorialActive,
      tutorialSceneSignature,
    })
  const visibleCardIds = Runtime.useWorkspaceCanvasVisibleCardIds({
    tutorialActive,
    hiddenCardIds: boardState.hiddenCardIds,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
  })
  const readinessMap = Runtime.useWorkspaceCardReadinessMap({
    seed,
    boardState,
  })
  const ontology = Runtime.useWorkspaceCanvasOntology({
    boardState,
    seed,
    organizationEditorData,
    visibleCardIds,
    personPlacements: people.workspacePersonPlacements,
    cardMeasuredHeights: tutorialCardMeasuredHeights,
    enabled:
      WORKSPACE_LIVE_CANVAS_ONTOLOGY_ENABLED &&
      !bootstrap.tutorialActiveFromBoard,
    zoom: viewport.viewportZoom,
    onFocusRoot: onFocusCard,
    onOpenAction: bootstrap.handleOpenOntologyAction,
    onOpenDataDrawer: acceleratorDrawer.onOpenWorkspaceDataDrawer,
  })
  const shortcutItems = Runtime.useWorkspaceTutorialAwareShortcutItems({
    boardState,
    visibleCardIds,
    tutorialActive,
    tutorialSelectedCardId,
    focusCardRequest: props.focusCardRequest,
    onToggleCardVisibility: props.onToggleCardVisibility,
    onFocusCard,
    onTutorialShortcutOpened,
  })
  const { tutorialCallout, handleTutorialActionComplete, handleOpenCard } =
    Runtime.useWorkspaceTutorialActionHandlers({
      tutorialActive,
      tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
      openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
      hiddenCardIds: boardState.hiddenCardIds,
      onTutorialNext,
      onTutorialShortcutOpened,
      onConnectCards: props.onConnectCards,
      onToggleCardVisibility: props.onToggleCardVisibility,
      onFocusCard,
    })
  const {
    showTutorialRestart,
    tutorialCalendarButtonCallout,
    onTutorialCalendarButtonComplete,
    organizationMapButtonCallout,
    onOrganizationMapButtonTutorialComplete,
  } = Runtime.resolveWorkspaceCanvasTutorialSurfaceProps({
    allowEditing,
    isPlatformAdmin: seed.isPlatformAdmin,
    presentationMode,
    tutorialCallout,
    onTutorialComplete: handleTutorialActionComplete,
  })
  const cardDataLookup = Runtime.useWorkspaceCanvasSurfaceCardDataLookup({
    boardState,
    allowEditing,
    presentationMode,
    seed,
    organizationEditorData,
    onSizeChange: props.onSizeChange,
    onCommunicationsChange: props.onCommunicationsChange,
    onTrackerChange: props.onTrackerChange,
    onAcceleratorStateChange: props.onAcceleratorStateChange,
    onInitialOnboardingSubmit: props.onInitialOnboardingSubmit,
    vaultViewMode: bootstrap.vaultViewMode,
    onVaultViewModeChange: bootstrap.setVaultViewMode,
    acceleratorStepNodeVisible: bootstrap.acceleratorStepNodeVisible,
    onOpenAcceleratorStepNode: accelerator.handleOpenStepNode,
    onHideAcceleratorStepNode: accelerator.handleHideStepNode,
    onAcceleratorRuntimeChange: accelerator.handleAcceleratorRuntimeChange,
    onAcceleratorRuntimeActionsChange:
      accelerator.handleAcceleratorRuntimeActionsChange,
    acceleratorRuntimeSnapshot: accelerator.acceleratorRuntimeSnapshot,
    acceleratorTutorialCallout: accelerator.acceleratorTutorialCallout,
    acceleratorTutorialInteractionPolicy:
      accelerator.acceleratorTutorialInteractionPolicy,
    onAcceleratorTutorialActionComplete:
      accelerator.handleAcceleratorTutorialActionComplete,
    journeyGuideState: props.journeyGuideState,
    onFocusCard,
    onOpenCard: handleOpenCard,
    onCardMeasuredHeightChange: handleCardMeasuredHeightChange,
    organizationShortcutItems: shortcutItems,
    organizationMapButtonCallout,
    onOrganizationMapButtonTutorialComplete,
    tutorialActive,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    ontologyRootControls: undefined,
    ontologyActionRequest: bootstrap.ontologyActionRequest,
  })
  const {
    tutorialNodeData: tutorialNodeWithPresentation,
    tutorialSuppressedNodeIds,
    tutorialDockTargets,
    tutorialDraggableCardIds,
    tutorialSceneNodeIds: resolvedTutorialSceneNodeIds,
    tutorialSceneCameraViewport: resolvedTutorialSceneCameraViewport,
  } = Runtime.useWorkspaceTutorialNodeState({
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
    acceleratorRuntimeSnapshot: accelerator.acceleratorRuntimeSnapshot,
    onTutorialShellMeasuredHeightChange:
      handleCurrentTutorialShellMeasuredHeightChange,
  })
  const { resolvedTutorialCardPositionOverrides, setTutorialUndockedCardIds } =
    Runtime.useWorkspaceTutorialDockingState({
      tutorialActive,
      tutorialSceneSignature,
      tutorialCardPositionOverrides,
      tutorialSceneCardPositionOverrides,
      tutorialDockTargets,
    })
  const visibleCardIdSet = Runtime.useVisibleWorkspaceCanvasCardIdSet({
    tutorialSuppressedNodeIds,
    visibleCardIds,
  })
  const { onNodesChange, renderNodes, tutorialSceneFitRequest } =
    Runtime.useWorkspaceCanvasRenderState({
      visibleCardIds,
      boardNodeLookup: nodeLookups.boardNodeLookup,
      initialPositionLookupRef: nodeLookups.initialPositionLookupRef,
      cardDataLookup,
      allowEditing,
      allowPeopleCanvasInteraction: people.allowPeopleCanvasInteraction,
      tutorialActive,
      acceleratorStepNodeData: accelerator.acceleratorStepNodeData,
      tutorialNodeData: tutorialNodeWithPresentation,
      workspacePersonPlacements: people.workspacePersonPlacements,
      workspacePersonById: people.workspacePersonById,
      onRemoveWorkspacePerson: people.handleRemoveWorkspacePersonPlacement,
      tutorialSceneCardPositionOverrides: resolvedTutorialCardPositionOverrides,
      tutorialDraggableCardIds,
      orgNodePositionFromBoard: bootstrap.orgNodePositionFromBoard,
      tutorialSceneNodeIds: resolvedTutorialSceneNodeIds,
      tutorialSceneSignature,
      tutorialSceneCameraViewport: resolvedTutorialSceneCameraViewport,
      tutorialSceneRequestSeed: props.tutorialRestartRequestKey,
    })
  Runtime.useWorkspaceCanvasPersonFitRequest({
    flowInstanceRef: bootstrap.flowInstanceRef,
    isFlowReady: bootstrap.isFlowReady,
    renderNodes,
    fitRequest: people.workspacePersonFitRequest,
    onFitRequestHandled: people.clearWorkspacePersonFitRequest,
  })
  const handleNodeDragStop = Runtime.useWorkspaceCanvasNodeDragStop({
    allowEditing,
    tutorialActive,
    boardNodeLookup: nodeLookups.boardNodeLookup,
    onPersistNodePosition: props.onPersistNodePosition,
    setAcceleratorStepNodePositionOverride:
      accelerator.setAcceleratorStepNodePositionOverride,
    setTutorialCardPositionOverrides,
    setTutorialUndockedCardIds,
    tutorialDockTargets,
    onTutorialNodeDragStop: handleTutorialNodeDragStop,
  })
  const { handleCanvasNodeDragStop, handleCanvasSelectionDragStop } =
    Runtime.useWorkspaceCanvasSurfaceDragHandlers({
      handleNodeDragStop,
      handleWorkspacePersonNodeDragStop:
        people.handleWorkspacePersonNodeDragStop,
      handleWorkspacePersonNodesDragStop:
        people.handleWorkspacePersonNodesDragStop,
    })
  const ontologyInteractions = Runtime.useWorkspaceCanvasOntologyInteractions({
    ontology,
    tutorialActive,
    renderNodes,
    onNodesChange,
    onNodeDragStop: handleCanvasNodeDragStop,
    onSelectionDragStop: handleCanvasSelectionDragStop,
    flowInstanceRef: bootstrap.flowInstanceRef,
    isFlowReady: bootstrap.isFlowReady,
  })
  const flowState = Runtime.useWorkspaceCanvasSurfaceFlowState({
    acceleratorFocusRequestKey: props.acceleratorFocusRequestKey,
    acceleratorStepNodeActive: Boolean(
      accelerator.acceleratorStepNodeData &&
      nodeLookups.acceleratorWorkspaceNodeId
    ),
    acceleratorWorkspaceNodeId: nodeLookups.acceleratorWorkspaceNodeId,
    allowEditing,
    autoLayoutMode: boardState.autoLayoutMode,
    connections: boardState.connections,
    flowInstanceRef: bootstrap.flowInstanceRef,
    focusCardRequest: props.focusCardRequest,
    isFlowReady: bootstrap.isFlowReady,
    layoutFitRequestKey: props.layoutFitRequestKey,
    nodeRelationshipEdges: people.personRelationshipEdges,
    ontologyEdges: WORKSPACE_LIVE_CANVAS_ONTOLOGY_ENABLED ? ontology.edges : [],
    onConnectCards: props.onConnectCards,
    onDisconnectAllConnections: props.onDisconnectAllConnections,
    onDisconnectConnection: props.onDisconnectConnection,
    onTutorialCompletionExitHandled: props.onTutorialCompletionExitHandled,
    presentationMode,
    readinessMap,
    renderNodes: ontologyInteractions.nodes,
    setIsFlowReady: bootstrap.setIsFlowReady,
    suppressInitialFit: viewport.suppressInitialFit,
    tutorialActive,
    tutorialCompletionExitRequest: props.tutorialCompletionExitRequest,
    tutorialEdgeTargetId,
    tutorialSceneFitRequest,
    visibleCardIdSet,
    visibleNodeIds: ontologyInteractions.visibleNodeIds,
  })
  const viewProps = {
    nodes: ontologyInteractions.nodes,
    edges: flowState.renderEdges,
    allowEditing,
    peopleCanvasInteractionEnabled: people.allowPeopleCanvasInteraction,
    workspaceDataDrawerCanEdit:
      workspaceFoundationEnabled && workspaceDataDrawerCanEdit,
    workspaceFoundationEnabled,
    nodesDraggable:
      allowEditing || people.allowPeopleCanvasInteraction || tutorialActive,
    tutorialActive,
    layoutAnimating: tutorialLayoutAnimating || ontology.layoutAnimating,
    presentationMode,
    workspaceDataDrawerPeople: people.workspaceDataDrawerPeople,
    placedWorkspacePersonIds: people.placedWorkspacePersonIds,
    workspaceDataDrawerViewerId: seed.viewerId,
    workspaceDataDrawerOrganization: organizationEditorData,
    workspaceDataDrawerDocuments: organizationEditorData.documentsTab,
    ...acceleratorDrawer,
    uiPreferencesScope: viewport.uiPreferencesScope,
    edgeContextMenuState: flowState.edgeContextMenuState,
    shortcutItems,
    tutorialCalendarButtonCallout,
    emptyStateMessage,
    showTutorialRestart,
    onNodesChange: ontologyInteractions.onNodesChange,
    onNodeClick: ontologyInteractions.onNodeClick,
    onNodeDoubleClick: flowState.handleNodeDoubleClick,
    onKeyDownCapture: ontologyInteractions.onKeyDownCapture,
    onNodeDragStop: ontologyInteractions.onNodeDragStop,
    onSelectionDragStop: ontologyInteractions.onSelectionDragStop,
    onMoveStart: ontologyInteractions.onMoveStart,
    onMoveEnd: viewport.handleCanvasMoveEnd,
    onConnect: flowState.handleConnect,
    isValidConnection: flowState.handleIsValidConnection,
    onEdgeDoubleClick: flowState.handleEdgeDoubleClick,
    onEdgeContextMenu: flowState.handleEdgeContextMenu,
    onError: Runtime.handleWorkspaceReactFlowError,
    onInit: flowState.handleFlowInit,
    onTutorialRestart: props.onTutorialRestart,
    onTutorialCalendarButtonComplete,
    onRecenterView: flowState.handleRecenterView,
    onZoomIn: flowState.handleZoomIn,
    onZoomOut: flowState.handleZoomOut,
    onWorkspacePersonDropToCanvas: people.handleWorkspacePersonDropToCanvas,
    onAddWorkspacePeopleToCanvas: people.handleAddWorkspacePeopleToCanvas,
    onRemoveWorkspacePersonFromCanvas:
      people.handleRemoveWorkspacePersonPlacement,
    onCloseEdgeContextMenu: flowState.closeEdgeContextMenu,
    onDisconnectEdge: flowState.handleContextDisconnectEdge,
    onDisconnectFromSource: flowState.handleContextDisconnectFromSource,
    onDisconnectToTarget: flowState.handleContextDisconnectToTarget,
    onDisconnectAll: flowState.handleContextDisconnectAll,
  }
  return <WorkspaceCanvasSurfaceV2View {...viewProps} />
}
