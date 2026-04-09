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

import { Button } from "@/components/ui/button"

import type { MyOrganizationCalendarView } from "../../../../_lib/types"
import { WorkspaceCardShortcutRail } from "../shortcuts/workspace-card-shortcut-rail"
import { WorkspaceCardShortcutsMobile } from "../shortcuts/workspace-card-shortcuts-mobile"
import type { WorkspaceCardShortcutItemModel } from "../shortcuts/workspace-card-shortcut-model"
import { WorkspaceCanvasErrorBoundary } from "../runtime/workspace-canvas-error-boundary"
import { useWorkspaceCanvasConnectionsController } from "../runtime/workspace-canvas-connections-controller"
import type {
  WorkspaceCanvasNode,
  WorkspaceCanvasNodeData,
} from "./workspace-canvas-surface-v2-helpers"
import {
  WORKSPACE_CANVAS_V2_EDGE_TYPES,
  WORKSPACE_CANVAS_V2_NODE_TYPES,
} from "./workspace-canvas-node-types"
import { WorkspaceCanvasEdgeContextMenu } from "./workspace-canvas-edge-context-menu"
import { WorkspaceCanvasSurfaceV2ViewportControls } from "./workspace-canvas-surface-v2-viewport-controls-panel"
import {
  shouldPreventWorkspaceCanvasTouchZoom,
  shouldPreventWorkspaceCanvasWheelZoom,
} from "./workspace-canvas-surface-v2-gesture-guards"

const WORKSPACE_CANVAS_V2_PRO_OPTIONS = Object.freeze({ hideAttribution: true })

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

export function WorkspaceCanvasSurfaceV2View({
  nodes,
  edges,
  calendar,
  allowEditing,
  nodesDraggable,
  tutorialActive,
  layoutAnimating,
  presentationMode,
  edgeContextMenuState,
  shortcutItems,
  tutorialCalendarButtonCallout,
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
  onTutorialCalendarButtonComplete,
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
  calendar: MyOrganizationCalendarView
  allowEditing: boolean
  nodesDraggable: boolean
  tutorialActive: boolean
  layoutAnimating: boolean
  presentationMode: boolean
  edgeContextMenuState: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["edgeContextMenuState"]
  shortcutItems: WorkspaceCardShortcutItemModel[]
  tutorialCalendarButtonCallout?: { title: string; instruction: string } | null
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
  onTutorialCalendarButtonComplete?: (() => void) | undefined
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
        {shortcutItems.length > 0 ? (
          <WorkspaceCardShortcutRail items={shortcutItems} />
        ) : null}
        <WorkspaceCanvasSurfaceV2ViewportControls
          calendar={calendar}
          canEdit={allowEditing}
          tutorialCalendarButtonCallout={tutorialCalendarButtonCallout ?? null}
          onTutorialCalendarButtonComplete={onTutorialCalendarButtonComplete}
          onZoomOut={onZoomOut}
          onZoomIn={onZoomIn}
          onRecenterView={onRecenterView}
          onResetView={onResetView}
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={WORKSPACE_CANVAS_V2_NODE_TYPES}
          edgeTypes={WORKSPACE_CANVAS_V2_EDGE_TYPES}
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
