"use client"

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeDragHandler,
  type ReactFlowInstance,
} from "reactflow"
import "reactflow/dist/style.css"

import { MyOrganizationEditorView } from "../my-organization-editor-view"
import { WorkspaceBoardCanvasDocks } from "./workspace-board-canvas-docks"
import {
  WorkspaceBoardContextMenu,
} from "./workspace-board-context-menu"
import { useWorkspaceBoardContextMenu } from "./workspace-board-flow-surface-context-menu"
import { useWorkspaceBoardCanvasRepair } from "./workspace-board-flow-surface-repair"
import { resolveCardDimensions } from "./workspace-board-layout"
import { useWorkspaceBoardFlowFitting } from "./workspace-board-flow-surface-fit-view"
import { WorkspaceRealtimeCursorsOverlay } from "./workspace-board-flow-surface-cursors"
import {
  WorkspaceBoardCard,
  WorkspaceBoardNode,
  type WorkspaceBoardNodeData,
  workspaceNodeClassName,
} from "./workspace-board-node"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
} from "./workspace-board-types"

const WORKSPACE_NODE_TYPES = Object.freeze({
  workspace: WorkspaceBoardNode,
})
const WORKSPACE_POSITION_SNAP = 8
const WORKSPACE_ALWAYS_HIDDEN_CARD_IDS: WorkspaceCardId[] = ["deck", "atlas"]

type WorkspaceFlowNode = Node<WorkspaceBoardNodeData>

export type WorkspaceBoardFlowSurfaceProps = {
  seed: WorkspaceSeedData
  organizationEditorData: WorkspaceOrganizationEditorData
  boardState: WorkspaceBoardState
  allowEditing: boolean
  presentationMode: boolean
  workspaceRoomName: string
  layoutFitRequestKey: number
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceBoardState["tracker"]) => void
  onPersistNodePosition: (cardId: WorkspaceCardId, x: number, y: number) => void
  onToggleCardVisibility: (cardId: WorkspaceCardId) => void
  onConnectCards: (source: WorkspaceCardId, target: WorkspaceCardId) => void
  onDisconnectConnection: (connectionId: string) => void
  onDisconnectAllConnections: () => void
  onResetDefaultConnections: () => void
  onCursorConnectionStateChange: (state: "connecting" | "live" | "degraded") => void
}

export const WorkspaceBoardFlowSurface = memo(function WorkspaceBoardFlowSurface({
  seed,
  organizationEditorData,
  boardState,
  allowEditing,
  presentationMode,
  workspaceRoomName,
  layoutFitRequestKey,
  onSizeChange,
  onCommunicationsChange,
  onTrackerChange,
  onPersistNodePosition,
  onToggleCardVisibility,
  onConnectCards,
  onDisconnectConnection,
  onDisconnectAllConnections,
  onResetDefaultConnections,
  onCursorConnectionStateChange,
}: WorkspaceBoardFlowSurfaceProps) {
  const flowInstanceRef = useRef<ReactFlowInstance<WorkspaceBoardNodeData> | null>(null)
  const [fullscreenCardId, setFullscreenCardId] = useState<WorkspaceCardId | null>(null)
  const [isFlowReady, setIsFlowReady] = useState(false)
  const [isNodeDragging, setIsNodeDragging] = useState(false)
  const [isViewportMoving, setIsViewportMoving] = useState(false)
  const isCanvasFullscreen = fullscreenCardId !== null

  const hiddenCardIdsForSurface = useMemo<WorkspaceCardId[]>(
    () => [
      ...boardState.hiddenCardIds,
      ...WORKSPACE_ALWAYS_HIDDEN_CARD_IDS,
      ...(seed.acceleratorOverlayEnabled ? [] : (["formation-status"] as WorkspaceCardId[])),
    ],
    [boardState.hiddenCardIds, seed.acceleratorOverlayEnabled],
  )

  const {
    surfaceRef,
    contextMenuState,
    setContextMenuState,
    visibleCardIds,
    handlePaneContextMenu,
    handleNodeContextMenu,
    handleEdgeContextMenu,
  } = useWorkspaceBoardContextMenu({
    allowEditing,
    isCanvasFullscreen,
    nodes: boardState.nodes,
    hiddenCardIds: hiddenCardIdsForSurface,
  })

  const edgeStyle = useMemo(
    () =>
      presentationMode
        ? { strokeWidth: 1.1, opacity: 0.42 }
        : { strokeWidth: 1.35, opacity: 0.7 },
    [presentationMode],
  )

  const hiddenCardIdSet = useMemo(
    () => new Set<WorkspaceCardId>(hiddenCardIdsForSurface),
    [hiddenCardIdsForSurface],
  )

  const visibleEdgeCardIds = useMemo(
    () => new Set(boardState.nodes.filter((node) => !hiddenCardIdSet.has(node.id)).map((node) => node.id)),
    [boardState.nodes, hiddenCardIdSet],
  )

  const edges = useMemo<Edge[]>(
    () =>
      boardState.connections.filter(
        (edge) => visibleEdgeCardIds.has(edge.source) && visibleEdgeCardIds.has(edge.target),
      ).map((edge) => ({
        ...edge,
        type: "smoothstep",
        animated: false,
        style: edgeStyle,
      })),
    [boardState.connections, edgeStyle, visibleEdgeCardIds],
  )

  const handleToggleCanvasFullscreen = useCallback((cardId: WorkspaceCardId) => {
    setFullscreenCardId((previous) => (previous === cardId ? null : cardId))
  }, [])

  useEffect(() => {
    if (!fullscreenCardId) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setFullscreenCardId(null)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [fullscreenCardId])

  const composedNodes = useMemo<WorkspaceFlowNode[]>(() => {
    return boardState.nodes
      .filter((node) => !hiddenCardIdSet.has(node.id))
      .map((node) => {
        const dimensions = resolveCardDimensions(node.size, node.id)
        return {
          id: node.id,
          type: "workspace",
          position: { x: node.x, y: node.y },
          draggable: allowEditing && !isCanvasFullscreen,
          selectable: false,
          dragHandle: allowEditing ? ".workspace-card-drag-handle" : undefined,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          className: workspaceNodeClassName(node.size),
          style: {
            width: dimensions.width,
            height: dimensions.height,
            minHeight: dimensions.height,
          },
          data: {
            cardId: node.id,
            size: node.size,
            canEdit: allowEditing,
            presentationMode,
            communications: boardState.communications,
            tracker: boardState.tracker,
            seed,
            organizationEditorData,
            onSizeChange,
            onCommunicationsChange,
            onTrackerChange,
            onToggleCanvasFullscreen: handleToggleCanvasFullscreen,
          },
        }
      })
  }, [
    allowEditing,
    boardState.communications,
    boardState.nodes,
    boardState.tracker,
    hiddenCardIdSet,
    handleToggleCanvasFullscreen,
    isCanvasFullscreen,
    onCommunicationsChange,
    onSizeChange,
    onTrackerChange,
    presentationMode,
    seed,
    organizationEditorData,
  ])

  useEffect(() => {
    const instance = flowInstanceRef.current
    if (!instance) return
    instance.setNodes(composedNodes)
  }, [composedNodes])

  const fullscreenCardData = useMemo<WorkspaceBoardNodeData | null>(() => {
    if (!fullscreenCardId) return null
    const node = boardState.nodes.find((entry) => entry.id === fullscreenCardId)
    if (!node) return null

    return {
      cardId: node.id,
      size: "md",
      canEdit: allowEditing,
      presentationMode,
      communications: boardState.communications,
      tracker: boardState.tracker,
      seed,
      organizationEditorData,
      onSizeChange,
      onCommunicationsChange,
      onTrackerChange,
      isCanvasFullscreen: true,
      onToggleCanvasFullscreen: handleToggleCanvasFullscreen,
    }
  }, [
    allowEditing,
    boardState.communications,
    boardState.nodes,
    boardState.tracker,
    fullscreenCardId,
    handleToggleCanvasFullscreen,
    onCommunicationsChange,
    onSizeChange,
    onTrackerChange,
    presentationMode,
    seed,
    organizationEditorData,
  ])

  const handleNodeDragStop = ((_, node) => {
    setIsNodeDragging(false)
    if (!allowEditing || isCanvasFullscreen) return
    const snappedX = Math.round(node.position.x / WORKSPACE_POSITION_SNAP) * WORKSPACE_POSITION_SNAP
    const snappedY = Math.round(node.position.y / WORKSPACE_POSITION_SNAP) * WORKSPACE_POSITION_SNAP

    flowInstanceRef.current?.setNodes((previous) =>
      previous.map((entry) =>
        entry.id === node.id
          ? {
              ...entry,
              position: {
                x: snappedX,
                y: snappedY,
              },
            }
          : entry,
      ),
    )

    onPersistNodePosition(node.id as WorkspaceCardId, snappedX, snappedY)
  }) satisfies NodeDragHandler

  const handleNodeDragStart = useCallback<NodeDragHandler>(() => {
    setIsNodeDragging(true)
  }, [])

  const handleViewportMoveStart = useCallback(() => {
    setIsViewportMoving(true)
  }, [])

  const handleViewportMoveEnd = useCallback(() => {
    setIsViewportMoving(false)
  }, [])

  const layoutFitViewOptions = useMemo(
    () => ({
      padding: presentationMode ? 0.16 : 0.12,
      maxZoom: 1.02,
      minZoom: 0.18,
      duration: 280,
    }),
    [presentationMode],
  )

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep" as const,
      style: edgeStyle,
    }),
    [edgeStyle],
  )

  const proOptions = useMemo(() => ({ hideAttribution: true }), [])
  const { isLayoutAnimating } = useWorkspaceBoardFlowFitting({
    flowInstanceRef,
    isFlowReady,
    isCanvasFullscreen,
    composedNodeCount: composedNodes.length,
    layoutFitRequestKey,
    layoutFitViewOptions,
  })
  const { repairCanvasAlignment } = useWorkspaceBoardCanvasRepair({
    flowInstanceRef,
    layoutFitViewOptions,
    presentationMode,
    isCanvasFullscreen,
    isFlowReady,
  })

  return (
    <div
      ref={surfaceRef}
      className="workspace-layout-surface relative min-h-[min(820px,calc(100svh-9.5rem))] flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-800"
      data-layout-animating={isLayoutAnimating ? "true" : "false"}
    >
      <ReactFlow
        defaultNodes={composedNodes}
        edges={edges}
        nodeTypes={WORKSPACE_NODE_TYPES}
        onInit={(instance) => {
          flowInstanceRef.current = instance
          setIsFlowReady(true)
        }}
        onNodeDragStart={allowEditing && !isCanvasFullscreen ? handleNodeDragStart : undefined}
        onNodeDragStop={handleNodeDragStop}
        onMoveStart={handleViewportMoveStart}
        onMoveEnd={handleViewportMoveEnd}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneClick={() => setContextMenuState(null)}
        onNodeClick={() => setContextMenuState(null)}
        onEdgeClick={() => setContextMenuState(null)}
        nodesDraggable={allowEditing && !isCanvasFullscreen}
        nodesConnectable={false}
        elementsSelectable={false}
        nodeDragThreshold={0}
        snapToGrid={false}
        zoomOnPinch
        zoomOnScroll
        zoomOnDoubleClick={false}
        panOnScroll={false}
        panOnDrag={!isCanvasFullscreen}
        minZoom={0.18}
        maxZoom={1.25}
        proOptions={proOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        className="org-flow workspace-flow"
      >
        {!presentationMode && !isCanvasFullscreen ? (
          <Controls
            position="bottom-left"
            showFitView={false}
            showInteractive={false}
            className="!m-3 !overflow-hidden !rounded-[20px] !border !border-border/70 !bg-card/95 !p-1 !shadow-md [&_button]:!m-0.5 [&_button]:!rounded-[12px] [&_button]:!border-border/60 [&_button]:!bg-transparent [&_button]:!text-foreground [&_button:hover]:!bg-accent/60"
          />
        ) : null}
        {!presentationMode && !isCanvasFullscreen ? (
          <MiniMap
            position="bottom-right"
            zoomable
            pannable
            className="!m-3 !overflow-hidden !rounded-[20px] !border !border-border/70 !bg-card/95 !shadow-md"
          />
        ) : null}
        <Background
          id="workspace-dot-grid"
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.6}
          color={presentationMode ? "rgba(148, 163, 184, 0.42)" : "rgba(148, 163, 184, 0.64)"}
        />
      </ReactFlow>

      {!presentationMode ? (
        <WorkspaceBoardCanvasDocks
          hiddenCardIds={hiddenCardIdsForSurface}
          disabled={!allowEditing || isCanvasFullscreen}
          onToggle={onToggleCardVisibility}
          allowAcceleratorCard={seed.acceleratorOverlayEnabled}
        />
      ) : null}

      <WorkspaceRealtimeCursorsOverlay
        roomName={workspaceRoomName}
        username={seed.viewerName}
        onConnectionStateChange={onCursorConnectionStateChange}
        suspendPublishing={isNodeDragging || isViewportMoving}
      />

      {contextMenuState && allowEditing && !presentationMode && !isCanvasFullscreen ? (
        <WorkspaceBoardContextMenu
          state={contextMenuState}
          visibleCardIds={visibleCardIds}
          connections={boardState.connections}
          onClose={() => setContextMenuState(null)}
          onRepairCanvas={() => repairCanvasAlignment(true)}
          onHideCard={onToggleCardVisibility}
          onConnect={onConnectCards}
          onDisconnect={onDisconnectConnection}
          onDisconnectAll={onDisconnectAllConnections}
          onResetDefaultConnections={onResetDefaultConnections}
        />
      ) : null}

      {fullscreenCardId === "organization-overview" && organizationEditorData ? (
        <div
          className="absolute inset-0 z-30 bg-background"
          role="region"
          aria-label="Fullscreen organization editor"
        >
          <MyOrganizationEditorView
            embedded
            initialProfile={organizationEditorData.initialProfile}
            people={organizationEditorData.people}
            programs={organizationEditorData.programs}
            initialTab="company"
            canEdit={organizationEditorData.canEdit}
            onClose={() => setFullscreenCardId(null)}
          />
        </div>
      ) : fullscreenCardData ? (
        <div
          className="absolute inset-0 z-30 bg-background"
          role="region"
          aria-label="Fullscreen workspace card"
        >
          <WorkspaceBoardCard data={fullscreenCardData} />
        </div>
      ) : null}
    </div>
  )
})

WorkspaceBoardFlowSurface.displayName = "WorkspaceBoardFlowSurface"
