"use client"

import {
  useCallback,
  useMemo,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react"
import type { Edge, ReactFlowInstance } from "reactflow"

import { buildWorkspaceCardEdgeGeometryLookup } from "../../workspace-board-connection-handles"
import type { WorkspaceBoardState } from "../../workspace-board-types"
import { useWorkspaceCanvasCameraController } from "../runtime/workspace-canvas-camera-controller"
import { useWorkspaceCanvasConnectionsController } from "../runtime/workspace-canvas-connections-controller"
import { useWorkspaceCanvasLifecycleLogs } from "../runtime/workspace-canvas-lifecycle-logs"
import type {
  WorkspaceCanvasCardFocusRequest,
  WorkspaceCanvasSceneFitRequest,
  WorkspaceCanvasTutorialCompletionExitRequest,
} from "../runtime/workspace-canvas-viewport-command"
import {
  WORKSPACE_CANVAS_V2_ACCELERATOR_FOCUS_OPTIONS,
  WORKSPACE_CANVAS_V2_CARD_FOCUS_OPTIONS,
  WORKSPACE_CANVAS_V2_LAYOUT_FIT_OPTIONS,
  WORKSPACE_CANVAS_V2_TUTORIAL_SCENE_FIT_OPTIONS,
} from "./workspace-canvas-surface-v2-config"
import type {
  WorkspaceCanvasNode,
  WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"
import { useWorkspaceCardReadinessMap } from "./workspace-canvas-surface-v2-hooks"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import { useWorkspaceCanvasViewportControls } from "./workspace-canvas-surface-v2-viewport-controls"

export function useWorkspaceCanvasSurfaceFlowState({
  acceleratorFocusRequestKey,
  acceleratorStepNodeActive,
  acceleratorWorkspaceNodeId,
  allowEditing,
  autoLayoutMode,
  connections,
  flowInstanceRef,
  focusCardRequest,
  isFlowReady,
  layoutFitRequestKey,
  nodeRelationshipEdges,
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
}: {
  acceleratorFocusRequestKey: number
  acceleratorStepNodeActive: boolean
  acceleratorWorkspaceNodeId: WorkspaceCanvasV2CardId | null
  allowEditing: boolean
  autoLayoutMode: WorkspaceBoardState["autoLayoutMode"]
  connections: WorkspaceBoardState["connections"]
  flowInstanceRef: MutableRefObject<ReactFlowInstance | null>
  focusCardRequest: WorkspaceCanvasCardFocusRequest
  isFlowReady: boolean
  layoutFitRequestKey: number
  nodeRelationshipEdges: Edge[]
  onConnectCards: WorkspaceCanvasSurfaceV2Props["onConnectCards"]
  onDisconnectAllConnections: WorkspaceCanvasSurfaceV2Props["onDisconnectAllConnections"]
  onDisconnectConnection: WorkspaceCanvasSurfaceV2Props["onDisconnectConnection"]
  onTutorialCompletionExitHandled: WorkspaceCanvasSurfaceV2Props["onTutorialCompletionExitHandled"]
  presentationMode: boolean
  readinessMap: ReturnType<typeof useWorkspaceCardReadinessMap>
  renderNodes: WorkspaceCanvasNode[]
  setIsFlowReady: Dispatch<SetStateAction<boolean>>
  suppressInitialFit: boolean
  tutorialActive: boolean
  tutorialCompletionExitRequest: WorkspaceCanvasTutorialCompletionExitRequest
  tutorialEdgeTargetId: WorkspaceCanvasV2CardId | null
  tutorialSceneFitRequest: WorkspaceCanvasSceneFitRequest | null
  visibleCardIdSet: ReadonlySet<WorkspaceCanvasV2CardId>
  visibleNodeIds: string[]
}) {
  const nodeGeometryLookup = useMemo(
    () => buildWorkspaceCardEdgeGeometryLookup(renderNodes),
    [renderNodes]
  )
  const handleFlowInit = useCallback(
    (instance: ReactFlowInstance) => {
      flowInstanceRef.current = instance
      setIsFlowReady(true)
    },
    [flowInstanceRef, setIsFlowReady]
  )
  const { handleZoomIn, handleZoomOut, handleRecenterView } =
    useWorkspaceCanvasViewportControls({
      flowInstanceRef,
      tutorialActive,
      tutorialSceneFitRequest,
      tutorialCompletionExitRequest,
      focusCardRequest,
      visibleNodeIds,
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
    suppressInitialFit,
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
    connections,
    visibleCardIdSet,
    presentationMode,
    readinessMap,
    acceleratorStepNodeVisible: acceleratorStepNodeActive,
    autoLayoutMode,
    acceleratorWorkspaceNodeId,
    tutorialEdgeTargetId,
    nodeGeometryLookup,
    onConnectCards,
    onDisconnectConnection,
    onDisconnectAllConnections,
  })
  const renderEdges = useMemo(
    () => [...edges, ...nodeRelationshipEdges],
    [edges, nodeRelationshipEdges]
  )
  useWorkspaceCanvasLifecycleLogs(renderNodes.length)

  return {
    closeEdgeContextMenu,
    edgeContextMenuState,
    handleConnect,
    handleContextDisconnectAll,
    handleContextDisconnectEdge,
    handleContextDisconnectFromSource,
    handleContextDisconnectToTarget,
    handleEdgeContextMenu,
    handleEdgeDoubleClick,
    handleFlowInit,
    handleIsValidConnection,
    handleRecenterView,
    handleZoomIn,
    handleZoomOut,
    renderEdges,
  }
}
