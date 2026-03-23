"use client"

import { useEffect, useRef } from "react"
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type NodeDragHandler,
  type ReactFlowInstance,
  useNodesState,
} from "reactflow"
import LocateFixedIcon from "lucide-react/dist/esm/icons/locate-fixed"
import MinusIcon from "lucide-react/dist/esm/icons/minus"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"

import { WorkspaceCardShortcutsMobile } from "../shortcuts/workspace-card-shortcuts-mobile"
import type { WorkspaceCardShortcutItemModel } from "../shortcuts/workspace-card-shortcut-model"
import { WorkspaceCanvasErrorBoundary } from "../runtime/workspace-canvas-error-boundary"
import { useWorkspaceCanvasConnectionsController } from "../runtime/workspace-canvas-connections-controller"
import type {
  WorkspaceCanvasNode,
  WorkspaceCanvasNodeData,
} from "./workspace-canvas-surface-v2-helpers"
import { WORKSPACE_CANVAS_V2_NODE_TYPES } from "./workspace-canvas-node-types"
import { WorkspaceCanvasEdgeContextMenu } from "./workspace-canvas-edge-context-menu"
import { WorkspaceCanvasSurfaceV2HelpOverlay } from "./workspace-canvas-surface-v2-help-overlay"
import {
  shouldPreventWorkspaceCanvasTouchZoom,
  shouldPreventWorkspaceCanvasWheelZoom,
} from "./workspace-canvas-surface-v2-gesture-guards"

const WORKSPACE_CANVAS_V2_PRO_OPTIONS = Object.freeze({ hideAttribution: true })
const WORKSPACE_CANVAS_V2_EDGE_TYPES = Object.freeze({})

function WorkspaceCanvasSurfaceV2MobileShortcutOverlay({
  items,
}: {
  items: WorkspaceCardShortcutItemModel[]
}) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 md:hidden">
      <WorkspaceCardShortcutsMobile items={items} />
    </div>
  )
}

function WorkspaceCanvasSurfaceV2ViewportControls({
  onRecenterView,
  onResetView,
  onZoomIn,
  onZoomOut,
}: {
  onRecenterView: () => void
  onResetView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30 flex items-center gap-2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/70 bg-card/92 p-1 shadow-sm backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <MinusIcon className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onRecenterView}
          aria-label="Recenter view"
          title="Recenter view"
        >
          <LocateFixedIcon className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onResetView}
          aria-label="Reset view"
          title="Reset view"
        >
          <RotateCcwIcon className="h-4 w-4" aria-hidden />
        </Button>
        <WorkspaceCanvasSurfaceV2HelpOverlay integrated />
      </div>
    </div>
  )
}

export function WorkspaceCanvasSurfaceV2View({
  nodes,
  edges,
  allowEditing,
  nodesDraggable,
  tutorialActive,
  layoutAnimating,
  presentationMode,
  edgeContextMenuState,
  shortcutItems,
  emptyStateMessage,
  showTutorialRestart,
  onNodesChange,
  onNodeDragStop,
  onConnect,
  isValidConnection,
  onEdgeDoubleClick,
  onEdgeContextMenu,
  onError,
  onInit,
  onTutorialRestart,
  onRecenterView,
  onResetView,
  onZoomIn,
  onZoomOut,
  onCloseEdgeContextMenu,
  onDisconnectEdge,
  onDisconnectFromSource,
  onDisconnectToTarget,
  onDisconnectAll,
}: {
  nodes: WorkspaceCanvasNode[]
  edges: ReturnType<typeof useWorkspaceCanvasConnectionsController>["edges"]
  allowEditing: boolean
  nodesDraggable: boolean
  tutorialActive: boolean
  layoutAnimating: boolean
  presentationMode: boolean
  edgeContextMenuState: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["edgeContextMenuState"]
  shortcutItems: WorkspaceCardShortcutItemModel[]
  emptyStateMessage?: string | null
  showTutorialRestart: boolean
  onNodesChange: ReturnType<typeof useNodesState<WorkspaceCanvasNodeData>>[2]
  onNodeDragStop: NodeDragHandler
  onConnect: ReturnType<typeof useWorkspaceCanvasConnectionsController>["handleConnect"]
  isValidConnection: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleIsValidConnection"]
  onEdgeDoubleClick: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleEdgeDoubleClick"]
  onEdgeContextMenu: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleEdgeContextMenu"]
  onError: (errorCode: string, message: string) => void
  onInit: (instance: ReactFlowInstance) => void
  onTutorialRestart: () => void
  onRecenterView: () => void
  onResetView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onCloseEdgeContextMenu: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["closeEdgeContextMenu"]
  onDisconnectEdge: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleContextDisconnectEdge"]
  onDisconnectFromSource: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleContextDisconnectFromSource"]
  onDisconnectToTarget: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleContextDisconnectToTarget"]
  onDisconnectAll: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleContextDisconnectAll"]
}) {
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const nodeTypesRef = useRef(WORKSPACE_CANVAS_V2_NODE_TYPES)
  const edgeTypesRef = useRef(WORKSPACE_CANVAS_V2_EDGE_TYPES)

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

    const handleWheel = (event: WheelEvent) => {
      if (shouldPreventWorkspaceCanvasWheelZoom(event.ctrlKey)) {
        event.preventDefault()
      }
    }
    const handleTouchMove = (event: TouchEvent) => {
      if (shouldPreventWorkspaceCanvasTouchZoom(event.touches.length)) {
        event.preventDefault()
      }
    }
    const handleGestureEvent = (event: Event) => {
      event.preventDefault()
    }
    const listenerOptions = { passive: false, capture: true } as const

    surface.addEventListener("wheel", handleWheel, listenerOptions)
    surface.addEventListener("touchmove", handleTouchMove, listenerOptions)
    surface.addEventListener("gesturestart", handleGestureEvent, listenerOptions)
    surface.addEventListener("gesturechange", handleGestureEvent, listenerOptions)
    surface.addEventListener("gestureend", handleGestureEvent, listenerOptions)

    return () => {
      surface.removeEventListener("wheel", handleWheel, listenerOptions)
      surface.removeEventListener("touchmove", handleTouchMove, listenerOptions)
      surface.removeEventListener("gesturestart", handleGestureEvent, listenerOptions)
      surface.removeEventListener("gesturechange", handleGestureEvent, listenerOptions)
      surface.removeEventListener("gestureend", handleGestureEvent, listenerOptions)
    }
  }, [])

  return (
    <WorkspaceCanvasErrorBoundary>
      <div
        ref={surfaceRef}
        className="workspace-layout-surface relative min-h-[min(820px,calc(100svh-9.5rem))] flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-800"
        data-layout-animating={layoutAnimating ? "true" : undefined}
      >
        {showTutorialRestart ? (
          <div className="pointer-events-none absolute bottom-4 left-4 z-30">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="pointer-events-auto rounded-xl border-border/70 bg-card/92 shadow-sm backdrop-blur"
              onClick={onTutorialRestart}
            >
              Restart guide
            </Button>
          </div>
        ) : null}
        <WorkspaceCanvasSurfaceV2ViewportControls
          onZoomOut={onZoomOut}
          onZoomIn={onZoomIn}
          onRecenterView={onRecenterView}
          onResetView={onResetView}
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypesRef.current}
          edgeTypes={edgeTypesRef.current}
          nodesDraggable={nodesDraggable}
          nodesConnectable={allowEditing && !tutorialActive}
          elementsSelectable={false}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onEdgeContextMenu={onEdgeContextMenu}
          zoomOnPinch
          zoomOnScroll
          zoomOnDoubleClick={false}
          panOnDrag
          preventScrolling
          minZoom={0.2}
          maxZoom={1.25}
          proOptions={WORKSPACE_CANVAS_V2_PRO_OPTIONS}
          onError={onError}
          onInit={onInit}
          className="org-flow workspace-flow"
        >
          <Background
            id="workspace-v2-dot-grid"
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.6}
            color={presentationMode ? "rgba(148, 163, 184, 0.42)" : "rgba(148, 163, 184, 0.64)"}
          />
        </ReactFlow>
        {nodes.length === 0 && emptyStateMessage ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-6">
            <p className="rounded-md border border-border/70 bg-card/80 px-3 py-2 text-center text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
              {emptyStateMessage}
            </p>
          </div>
        ) : null}
        {edgeContextMenuState ? (
          <WorkspaceCanvasEdgeContextMenu
            state={edgeContextMenuState}
            onClose={onCloseEdgeContextMenu}
            onDisconnectEdge={onDisconnectEdge}
            onDisconnectFromSource={onDisconnectFromSource}
            onDisconnectToTarget={onDisconnectToTarget}
            onDisconnectAll={onDisconnectAll}
          />
        ) : null}
        {shortcutItems.length > 0 ? (
          <WorkspaceCanvasSurfaceV2MobileShortcutOverlay items={shortcutItems} />
        ) : null}
      </div>
    </WorkspaceCanvasErrorBoundary>
  )
}
