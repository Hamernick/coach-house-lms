"use client"

import {
  useCallback,
  useMemo,
  useState,
  type DragEvent,
  type KeyboardEventHandler,
} from "react"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  type NodeDragHandler,
  type NodeMouseHandler,
  type OnMoveEnd,
  type OnNodesChange,
  type ReactFlowInstance,
  type SelectionDragHandler,
} from "reactflow"

import {
  useRegisterAppShellAccountMenuAction,
  type AppShellAccountMenuAction,
} from "@/components/app-shell/account-menu-actions-context"
import type { DocumentsTabData } from "@/components/organization/org-profile-card/tabs/documents-tab/data"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import {
  WorkspaceReactFlowErrorBootstrap,
  type WorkspaceReactFlowErrorHandler,
} from "@/components/workspace/workspace-reactflow-error-bootstrap"
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
import { useWorkspaceCanvasSurfaceGestureGuards } from "./workspace-canvas-surface-v2-gesture-effect"
import { WorkspaceCanvasOverlayDrawerContainerProvider } from "./workspace-canvas-overlay-drawer-container"
import { WorkspaceCanvasOverlayDrawer } from "./workspace-canvas-overlay-drawer"
import {
  hasWorkspaceCanvasPersonDragPayload,
  readWorkspaceCanvasPersonDragPayload,
  type WorkspaceCanvasPeopleAddRequest,
  type WorkspaceCanvasPersonDropRequest,
} from "./workspace-canvas-people-dnd"
import type { WorkspaceBoardUiPreferenceScope } from "../../workspace-board-ui-preferences"

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

function useWorkspaceTutorialRestartAccountMenuAction({
  showTutorialRestart,
  onTutorialRestart,
}: {
  showTutorialRestart: boolean
  onTutorialRestart: () => void
}) {
  return useMemo<AppShellAccountMenuAction | null>(
    () =>
      showTutorialRestart
        ? {
            id: "workspace-tutorial-restart",
            label: "Restart guide",
            icon: RotateCcwIcon,
            onSelect: onTutorialRestart,
            priority: 20,
            visibility: "platform-admin",
          }
        : null,
    [onTutorialRestart, showTutorialRestart]
  )
}

export function WorkspaceCanvasSurfaceV2View({
  nodes,
  edges,
  allowEditing,
  peopleCanvasInteractionEnabled,
  workspaceDataDrawerCanEdit,
  nodesDraggable,
  tutorialActive,
  layoutAnimating,
  presentationMode,
  workspaceDataDrawerPeople,
  placedWorkspacePersonIds,
  workspaceDataDrawerViewerId,
  workspaceDataDrawerDocuments,
  uiPreferencesScope,
  edgeContextMenuState,
  shortcutItems,
  tutorialCalendarButtonCallout,
  emptyStateMessage,
  showTutorialRestart,
  onNodesChange,
  onNodeClick,
  onKeyDownCapture,
  onNodeDragStop,
  onSelectionDragStop,
  onMoveEnd,
  onConnect,
  isValidConnection,
  onEdgeDoubleClick,
  onEdgeContextMenu,
  onError,
  onInit,
  onTutorialRestart,
  onTutorialCalendarButtonComplete,
  onRecenterView,
  onZoomIn,
  onZoomOut,
  onWorkspacePersonDropToCanvas,
  onAddWorkspacePeopleToCanvas,
  onCloseEdgeContextMenu,
  onDisconnectEdge,
  onDisconnectFromSource,
  onDisconnectToTarget,
  onDisconnectAll,
}: {
  nodes: WorkspaceCanvasNode[]
  edges: ReturnType<typeof useWorkspaceCanvasConnectionsController>["edges"]
  allowEditing: boolean
  peopleCanvasInteractionEnabled: boolean
  workspaceDataDrawerCanEdit: boolean
  nodesDraggable: boolean
  tutorialActive: boolean
  layoutAnimating: boolean
  presentationMode: boolean
  workspaceDataDrawerPeople: OrgPersonWithImage[]
  placedWorkspacePersonIds: ReadonlySet<string>
  workspaceDataDrawerViewerId: string
  workspaceDataDrawerDocuments: DocumentsTabData
  uiPreferencesScope: WorkspaceBoardUiPreferenceScope
  edgeContextMenuState: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["edgeContextMenuState"]
  shortcutItems: WorkspaceCardShortcutItemModel[]
  tutorialCalendarButtonCallout?: { title: string; instruction: string } | null
  emptyStateMessage?: string | null
  showTutorialRestart: boolean
  onNodesChange: OnNodesChange
  onNodeClick: NodeMouseHandler
  onKeyDownCapture: KeyboardEventHandler<HTMLDivElement>
  onNodeDragStop: NodeDragHandler
  onSelectionDragStop: SelectionDragHandler
  onMoveEnd: OnMoveEnd
  onConnect: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleConnect"]
  isValidConnection: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleIsValidConnection"]
  onEdgeDoubleClick: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleEdgeDoubleClick"]
  onEdgeContextMenu: ReturnType<
    typeof useWorkspaceCanvasConnectionsController
  >["handleEdgeContextMenu"]
  onError: WorkspaceReactFlowErrorHandler
  onInit: (instance: ReactFlowInstance) => void
  onTutorialRestart: () => void
  onTutorialCalendarButtonComplete?: (() => void) | undefined
  onRecenterView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onWorkspacePersonDropToCanvas: (
    request: WorkspaceCanvasPersonDropRequest
  ) => boolean
  onAddWorkspacePeopleToCanvas: (
    request: WorkspaceCanvasPeopleAddRequest
  ) => number
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
  const [surfaceContainer, setSurfaceContainer] =
    useState<HTMLDivElement | null>(null)
  const [flowFrameContainer, setFlowFrameContainer] =
    useState<HTMLDivElement | null>(null)
  const nodeTypes = useMemo(() => WORKSPACE_CANVAS_V2_NODE_TYPES, [])
  const edgeTypes = useMemo(() => WORKSPACE_CANVAS_V2_EDGE_TYPES, [])
  const nodesSelectable = !tutorialActive
  const selectNodesOnDrag =
    !tutorialActive && (allowEditing || peopleCanvasInteractionEnabled)
  const tutorialRestartAccountMenuAction =
    useWorkspaceTutorialRestartAccountMenuAction({
      showTutorialRestart,
      onTutorialRestart,
    })
  const handleCanvasDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!hasWorkspaceCanvasPersonDragPayload(event.dataTransfer)) return
      if (!peopleCanvasInteractionEnabled) return

      event.preventDefault()
      event.dataTransfer.dropEffect = "copy"
    },
    [peopleCanvasInteractionEnabled]
  )
  const handleCanvasDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const personIds = readWorkspaceCanvasPersonDragPayload(event.dataTransfer)
      if (personIds.length === 0) return

      event.preventDefault()
      event.stopPropagation()
      if (personIds.length === 1) {
        const personId = personIds[0]
        if (!personId) return

        onWorkspacePersonDropToCanvas({
          personId,
          clientX: event.clientX,
          clientY: event.clientY,
        })
        return
      }

      onAddWorkspacePeopleToCanvas({
        personIds,
        clientX: event.clientX,
        clientY: event.clientY,
      })
    },
    [onAddWorkspacePeopleToCanvas, onWorkspacePersonDropToCanvas]
  )
  const handleAddWorkspacePeopleToCanvas = useCallback(
    (personIds: string[]) => {
      if (
        !peopleCanvasInteractionEnabled ||
        !flowFrameContainer ||
        personIds.length === 0
      ) {
        return 0
      }

      const frameRect = flowFrameContainer.getBoundingClientRect()
      return onAddWorkspacePeopleToCanvas({
        personIds,
        clientX: frameRect.left + frameRect.width / 2,
        clientY: frameRect.top + frameRect.height / 2,
      })
    },
    [
      flowFrameContainer,
      onAddWorkspacePeopleToCanvas,
      peopleCanvasInteractionEnabled,
    ]
  )

  useRegisterAppShellAccountMenuAction(tutorialRestartAccountMenuAction)

  useWorkspaceCanvasSurfaceGestureGuards({ surfaceContainer })

  return (
    <WorkspaceCanvasErrorBoundary>
      <div
        ref={setSurfaceContainer}
        className="workspace-layout-surface relative min-h-[min(820px,calc(100svh-9.5rem))] flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-800"
        data-layout-animating={layoutAnimating ? "true" : undefined}
      >
        <WorkspaceCanvasOverlayDrawerContainerProvider
          container={flowFrameContainer}
        >
          {shortcutItems.length > 0 ? (
            <WorkspaceCardShortcutRail
              items={shortcutItems}
              dataAction={
                <WorkspaceCanvasOverlayDrawer
                  people={workspaceDataDrawerPeople}
                  placedPersonIds={placedWorkspacePersonIds}
                  viewerId={workspaceDataDrawerViewerId}
                  documentsTab={workspaceDataDrawerDocuments}
                  canEdit={workspaceDataDrawerCanEdit}
                  uiPreferencesScope={uiPreferencesScope}
                  onAddPeopleToCanvas={handleAddWorkspacePeopleToCanvas}
                />
              }
            />
          ) : null}
          <WorkspaceCanvasSurfaceV2ViewportControls
            tutorialCalendarButtonCallout={
              tutorialCalendarButtonCallout ?? null
            }
            onTutorialCalendarButtonComplete={onTutorialCalendarButtonComplete}
            onZoomOut={onZoomOut}
            onZoomIn={onZoomIn}
            onRecenterView={onRecenterView}
          />
          <div
            ref={setFlowFrameContainer}
            data-workspace-canvas-flow-frame="true"
            className="absolute inset-0"
          >
            <ReactFlowProvider>
              <WorkspaceReactFlowErrorBootstrap onError={onError}>
                {(handleReactFlowError) => (
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    nodesDraggable={nodesDraggable}
                    nodesConnectable={allowEditing && !tutorialActive}
                    nodeDragThreshold={4}
                    elementsSelectable={nodesSelectable}
                    selectionKeyCode="Shift"
                    multiSelectionKeyCode={["Meta", "Control"]}
                    selectionMode={SelectionMode.Partial}
                    selectionOnDrag={false}
                    selectNodesOnDrag={selectNodesOnDrag}
                    onNodesChange={onNodesChange}
                    onNodeClick={onNodeClick}
                    onKeyDownCapture={onKeyDownCapture}
                    onNodeDragStop={onNodeDragStop}
                    onSelectionDragStop={onSelectionDragStop}
                    onMoveEnd={onMoveEnd}
                    onConnect={onConnect}
                    isValidConnection={isValidConnection}
                    onEdgeDoubleClick={onEdgeDoubleClick}
                    onEdgeContextMenu={onEdgeContextMenu}
                    onDragOver={handleCanvasDragOver}
                    onDrop={handleCanvasDrop}
                    zoomOnPinch
                    zoomOnScroll
                    zoomOnDoubleClick={false}
                    panOnDrag
                    preventScrolling
                    minZoom={0.2}
                    maxZoom={1.25}
                    onlyRenderVisibleElements
                    proOptions={WORKSPACE_CANVAS_V2_PRO_OPTIONS}
                    onError={handleReactFlowError}
                    onInit={onInit}
                    className="org-flow workspace-flow"
                  >
                    <Background
                      id="workspace-v2-dot-grid"
                      variant={BackgroundVariant.Dots}
                      gap={20}
                      size={1.6}
                      color={
                        presentationMode
                          ? "rgba(148, 163, 184, 0.42)"
                          : "rgba(148, 163, 184, 0.64)"
                      }
                    />
                  </ReactFlow>
                )}
              </WorkspaceReactFlowErrorBootstrap>
            </ReactFlowProvider>
          </div>
          {nodes.length === 0 && emptyStateMessage ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center px-6">
              <p className="border-border/70 bg-card/80 text-muted-foreground rounded-md border px-3 py-2 text-center text-xs shadow-sm backdrop-blur-sm">
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
            <WorkspaceCanvasSurfaceV2MobileShortcutOverlay
              items={shortcutItems}
            />
          ) : null}
        </WorkspaceCanvasOverlayDrawerContainerProvider>
      </div>
    </WorkspaceCanvasErrorBoundary>
  )
}
