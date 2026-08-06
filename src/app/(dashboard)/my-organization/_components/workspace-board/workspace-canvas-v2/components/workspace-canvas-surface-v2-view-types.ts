import type { KeyboardEventHandler } from "react"
import type {
  NodeDragHandler,
  NodeMouseHandler,
  OnMoveEnd,
  OnNodesChange,
  ReactFlowInstance,
  SelectionDragHandler,
} from "reactflow"

import type { DocumentsTabData } from "@/components/organization/org-profile-card/tabs/documents-tab/data"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import type { WorkspaceReactFlowErrorHandler } from "@/components/workspace/workspace-reactflow-error-bootstrap"
import type { WorkspaceAcceleratorCardInput } from "@/features/workspace-accelerator-card"
import type { RoadmapSection } from "@/lib/roadmap"
import type { WorkspaceBoardUiPreferenceScope } from "../../workspace-board-ui-preferences"
import type { WorkspaceOrganizationEditorData } from "../../workspace-board-types"
import type { useWorkspaceCanvasConnectionsController } from "../runtime/workspace-canvas-connections-controller"
import type { WorkspaceCardShortcutItemModel } from "../shortcuts/workspace-card-shortcut-model"
import type {
  WorkspaceCanvasPeopleAddRequest,
  WorkspaceCanvasPersonDropRequest,
} from "./workspace-canvas-people-dnd"
import type { WorkspaceDataDrawerRequest } from "./workspace-canvas-overlay-drawer-tabs"
import type { WorkspaceCanvasNode } from "./workspace-canvas-surface-v2-helpers"

type WorkspaceCanvasConnectionsController = ReturnType<
  typeof useWorkspaceCanvasConnectionsController
>

export type WorkspaceCanvasSurfaceV2ViewProps = {
  nodes: WorkspaceCanvasNode[]
  edges: WorkspaceCanvasConnectionsController["edges"]
  allowEditing: boolean
  peopleCanvasInteractionEnabled: boolean
  workspaceDataDrawerCanEdit: boolean
  workspaceFoundationEnabled: boolean
  nodesDraggable: boolean
  tutorialActive: boolean
  layoutAnimating: boolean
  presentationMode: boolean
  workspaceDataDrawerPeople: OrgPersonWithImage[]
  placedWorkspacePersonIds: ReadonlySet<string>
  workspaceDataDrawerViewerId: string
  workspaceDataDrawerOrganization: WorkspaceOrganizationEditorData
  workspaceDataDrawerDocuments: DocumentsTabData
  workspaceAcceleratorDrawerInput: WorkspaceAcceleratorCardInput
  workspaceAcceleratorDrawerRoadmapSections: RoadmapSection[]
  workspaceAcceleratorDrawerHasAccess: boolean
  workspaceAcceleratorDrawerPaywallHref: string
  workspaceDataDrawerRequest: WorkspaceDataDrawerRequest | null
  uiPreferencesScope: WorkspaceBoardUiPreferenceScope
  edgeContextMenuState: WorkspaceCanvasConnectionsController["edgeContextMenuState"]
  shortcutItems: WorkspaceCardShortcutItemModel[]
  tutorialCalendarButtonCallout?: { title: string; instruction: string } | null
  emptyStateMessage?: string | null
  showTutorialRestart: boolean
  onNodesChange: OnNodesChange
  onNodeClick: NodeMouseHandler
  onNodeDoubleClick: NodeMouseHandler
  onKeyDownCapture: KeyboardEventHandler<HTMLDivElement>
  onNodeDragStop: NodeDragHandler
  onSelectionDragStop: SelectionDragHandler
  onMoveStart: () => void
  onMoveEnd: OnMoveEnd
  onConnect: WorkspaceCanvasConnectionsController["handleConnect"]
  isValidConnection: WorkspaceCanvasConnectionsController["handleIsValidConnection"]
  onEdgeDoubleClick: WorkspaceCanvasConnectionsController["handleEdgeDoubleClick"]
  onEdgeContextMenu: WorkspaceCanvasConnectionsController["handleEdgeContextMenu"]
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
  onRemoveWorkspacePersonFromCanvas: (personId: string) => void
  onOpenWorkspaceDataDrawer: (
    request: Omit<WorkspaceDataDrawerRequest, "id">
  ) => void
  onCloseEdgeContextMenu: WorkspaceCanvasConnectionsController["closeEdgeContextMenu"]
  onDisconnectEdge: WorkspaceCanvasConnectionsController["handleContextDisconnectEdge"]
  onDisconnectFromSource: WorkspaceCanvasConnectionsController["handleContextDisconnectFromSource"]
  onDisconnectToTarget: WorkspaceCanvasConnectionsController["handleContextDisconnectToTarget"]
  onDisconnectAll: WorkspaceCanvasConnectionsController["handleContextDisconnectAll"]
}
