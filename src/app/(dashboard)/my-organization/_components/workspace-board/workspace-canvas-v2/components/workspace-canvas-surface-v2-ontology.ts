"use client"

import { useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { MarkerType, type Edge, type Node } from "reactflow"

import {
  resolveWorkspaceOntologyNodeActivation,
  useWorkspaceOntologyController,
  useWorkspaceOntologyUrlState,
  type WorkspaceOntologyActionTarget,
  type WorkspaceOntologyNodeData,
  WORKSPACE_ONTOLOGY_RELATIONSHIP_SOURCE_HANDLE_ID,
  WORKSPACE_ONTOLOGY_RELATIONSHIP_TARGET_HANDLE_ID,
  type WorkspaceOntologyRootControl,
  type WorkspaceOntologyRootGeometry,
  type WorkspaceOntologyRootId,
} from "@/features/workspace-ontology"

import { resolveCardDimensions } from "../../workspace-board-layout"
import { WORKSPACE_CARD_SOURCE_HANDLE_IDS } from "../../workspace-board-connection-handles"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
} from "../../workspace-board-types"
import { buildWorkspaceCanvasOntologyInput } from "../adapters/workspace-canvas-ontology-input"
import {
  getWorkspaceCanvasPersonNodeId,
  type WorkspaceCanvasPersonPlacement,
  WORKSPACE_CANVAS_PERSON_NODE_SIZE,
} from "./workspace-canvas-person-node-model"
import type { WorkspaceCanvasV2CardId } from "./workspace-canvas-surface-v2-helpers"

export const WORKSPACE_ONTOLOGY_NODE_TYPE = "workspace-ontology"
export const WORKSPACE_ONTOLOGY_EDGE_TYPE = "workspace-ontology"

type WorkspaceCardMeasuredHeights = Partial<
  Record<WorkspaceCardId, Partial<Record<WorkspaceCardSize, number>>>
>

function resolveWorkspaceCardMeasuredHeight({
  cardId,
  size,
  fallbackHeight,
  cardMeasuredHeights,
}: {
  cardId: WorkspaceCardId
  size: WorkspaceCardSize
  fallbackHeight: number
  cardMeasuredHeights: WorkspaceCardMeasuredHeights
}) {
  const measuredHeight = cardMeasuredHeights[cardId]?.[size]
  return typeof measuredHeight === "number" && Number.isFinite(measuredHeight)
    ? Math.max(1, Math.round(measuredHeight))
    : fallbackHeight
}

function buildRootGeometry({
  boardState,
  visibleCardIds,
  cardMeasuredHeights,
}: {
  boardState: WorkspaceBoardState
  visibleCardIds: WorkspaceCanvasV2CardId[]
  cardMeasuredHeights: WorkspaceCardMeasuredHeights
}) {
  const visibleIds = new Set<string>(visibleCardIds)
  const geometry: Partial<
    Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
  > = {}
  for (const node of boardState.nodes) {
    if (!visibleIds.has(node.id)) continue
    if (
      node.id !== "organization-overview" &&
      node.id !== "programs" &&
      node.id !== "accelerator" &&
      node.id !== "roadmap" &&
      node.id !== "calendar" &&
      node.id !== "fiscal-sponsorship"
    ) {
      continue
    }
    const dimensions = resolveCardDimensions(node.size, node.id)
    geometry[node.id] = {
      x: node.x,
      y: node.y,
      width: dimensions.width,
      height: resolveWorkspaceCardMeasuredHeight({
        cardId: node.id,
        size: node.size,
        fallbackHeight: dimensions.height,
        cardMeasuredHeights,
      }),
    }
  }
  return geometry
}

function buildObstacles({
  boardState,
  visibleCardIds,
  personPlacements,
  cardMeasuredHeights,
}: {
  boardState: WorkspaceBoardState
  visibleCardIds: WorkspaceCanvasV2CardId[]
  personPlacements: WorkspaceCanvasPersonPlacement[]
  cardMeasuredHeights: WorkspaceCardMeasuredHeights
}) {
  const visibleIds = new Set<string>(visibleCardIds)
  return [
    ...boardState.nodes
      .filter((node) => visibleIds.has(node.id))
      .map((node) => {
        const dimensions = resolveCardDimensions(node.size, node.id)
        return {
          id: node.id,
          x: node.x,
          y: node.y,
          width: dimensions.width,
          height: resolveWorkspaceCardMeasuredHeight({
            cardId: node.id,
            size: node.size,
            fallbackHeight: dimensions.height,
            cardMeasuredHeights,
          }),
        }
      }),
    ...personPlacements.map((placement) => ({
      id: getWorkspaceCanvasPersonNodeId(placement.personId),
      x: placement.x,
      y: placement.y,
      width: WORKSPACE_CANVAS_PERSON_NODE_SIZE.width,
      height: WORKSPACE_CANVAS_PERSON_NODE_SIZE.height,
    })),
  ]
}

export function useWorkspaceCanvasOntology({
  boardState,
  seed,
  organizationEditorData,
  visibleCardIds,
  personPlacements,
  cardMeasuredHeights,
  enabled,
  zoom,
  onFocusRoot,
  onOpenAction,
}: {
  boardState: WorkspaceBoardState
  seed: WorkspaceSeedData
  organizationEditorData: WorkspaceOrganizationEditorData
  visibleCardIds: WorkspaceCanvasV2CardId[]
  personPlacements: WorkspaceCanvasPersonPlacement[]
  cardMeasuredHeights: WorkspaceCardMeasuredHeights
  enabled: boolean
  zoom: number
  onFocusRoot: (rootId: WorkspaceOntologyRootId) => void
  onOpenAction: (
    rootId: WorkspaceOntologyRootId,
    target: WorkspaceOntologyActionTarget
  ) => void
}) {
  const router = useRouter()
  const { state: ontologyState, setState: setOntologyState } =
    useWorkspaceOntologyUrlState()
  const visibleRootIds = useMemo(
    () => new Set<string>(visibleCardIds),
    [visibleCardIds]
  )
  const input = useMemo(() => {
    const completeInput = buildWorkspaceCanvasOntologyInput({
      seed,
      editor: organizationEditorData,
      tracker: boardState.tracker,
      placedPersonIds: personPlacements.map((placement) => placement.personId),
    })
    return {
      roots: completeInput.roots.filter((root) => visibleRootIds.has(root.id)),
      relationships: completeInput.relationships,
    }
  }, [
    boardState.tracker,
    organizationEditorData,
    personPlacements,
    seed,
    visibleRootIds,
  ])
  const structureOpen = enabled && ontologyState.expandedRootIds.length > 0
  const rootGeometry = useMemo(
    () =>
      buildRootGeometry({
        boardState,
        visibleCardIds,
        cardMeasuredHeights,
      }),
    [boardState, cardMeasuredHeights, visibleCardIds]
  )
  const obstacles = useMemo(
    () =>
      buildObstacles({
        boardState,
        visibleCardIds,
        personPlacements,
        cardMeasuredHeights,
      }),
    [boardState, cardMeasuredHeights, personPlacements, visibleCardIds]
  )
  const controller = useWorkspaceOntologyController({
    input,
    state: ontologyState,
    rootGeometry,
    obstacles,
    enabled,
    zoom,
    onStateChange: setOntologyState,
  })
  const nodeById = useMemo(
    () => new Map(controller.layoutNodes.map((node) => [node.id, node])),
    [controller.layoutNodes]
  )
  const toggleNode = controller.toggleNode
  const activateNode = useCallback(
    (nodeId: string, options?: { openInNewTab?: boolean }) => {
      const node = nodeById.get(nodeId)
      if (!node) return
      const activation = resolveWorkspaceOntologyNodeActivation(node)
      if (activation.kind === "toggle-details") {
        toggleNode(activation.nodeId)
        return
      }
      if (activation.kind === "open-action") {
        onOpenAction(activation.rootId, activation.target)
        return
      }
      if (activation.kind === "focus-root") {
        onFocusRoot(activation.rootId)
        return
      }
      if (options?.openInNewTab) {
        window.open(activation.href, "_blank", "noopener,noreferrer")
        return
      }
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(activation.href)) {
        window.location.assign(activation.href)
        return
      }
      router.push(activation.href)
    },
    [nodeById, onFocusRoot, onOpenAction, router, toggleNode]
  )
  const rootControlsByCardId = useMemo(() => {
    const controls: Partial<
      Record<WorkspaceCardId, WorkspaceOntologyRootControl>
    > = {}
    for (const [rootId, control] of Object.entries(controller.rootControls)) {
      if (!control) continue
      controls[rootId as WorkspaceCardId] = control
    }
    return controls
  }, [controller.rootControls])
  const nodes = useMemo<Node<WorkspaceOntologyNodeData>[]>(
    () =>
      controller.layoutNodes.map((node) => {
        const transitionPhase =
          controller.nodeTransitionPhases.get(node.id) ?? "stable"
        const exiting = transitionPhase === "exiting"
        return {
          id: node.id,
          type: WORKSPACE_ONTOLOGY_NODE_TYPE,
          className: "workspace-ontology-layout-node",
          position: node.position,
          width: node.size.width,
          height: node.size.height,
          style: {
            width: node.size.width,
            height: node.size.height,
          },
          draggable: false,
          selectable: !exiting,
          focusable: false,
          data: {
            kind: "workspace-ontology" as const,
            node,
            detailLevel: controller.detailLevel,
            expanded: controller.state.expandedNodeIds.includes(node.id),
            transitionPhase,
            transitionDelayMs:
              controller.nodeTransitionDelays.get(node.id) ?? 0,
            onActivate: () => activateNode(node.id),
          },
        }
      }),
    [
      activateNode,
      controller.detailLevel,
      controller.layoutNodes,
      controller.nodeTransitionDelays,
      controller.state.expandedNodeIds,
      controller.nodeTransitionPhases,
    ]
  )
  const edges = useMemo<Edge[]>(
    () =>
      controller.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        targetHandle:
          edge.kind === "relationship" && edge.target.startsWith("ontology:")
            ? WORKSPACE_ONTOLOGY_RELATIONSHIP_TARGET_HANDLE_ID
            : undefined,
        sourceHandle:
          edge.kind === "relationship" && edge.source.startsWith("ontology:")
            ? WORKSPACE_ONTOLOGY_RELATIONSHIP_SOURCE_HANDLE_ID
            : edge.source.startsWith("ontology:")
              ? undefined
              : WORKSPACE_CARD_SOURCE_HANDLE_IDS.bottom,
        type: WORKSPACE_ONTOLOGY_EDGE_TYPE,
        focusable: false,
        animated: false,
        interactionWidth: 18,
        markerEnd:
          edge.kind === "relationship"
            ? {
                type: MarkerType.ArrowClosed,
                width: 12,
                height: 12,
                color:
                  "color-mix(in srgb, var(--muted-foreground) 78%, transparent)",
              }
            : undefined,
        style: {
          stroke:
            "color-mix(in srgb, var(--muted-foreground) 74%, transparent)",
          strokeWidth: edge.kind === "relationship" ? 1.25 : 1,
          strokeDasharray: edge.kind === "relationship" ? "5 5" : undefined,
        },
        data: {
          role: "workspace-ontology",
          label: edge.label,
          category: edge.category,
          status: edge.status,
          kind: edge.kind,
          showLabel: edge.showLabel,
          detailLevel: controller.detailLevel,
          transitionPhase:
            controller.edgeTransitionPhases.get(edge.id) ?? "stable",
          transitionDelayMs: controller.edgeTransitionDelays.get(edge.id) ?? 0,
        },
      })),
    [
      controller.detailLevel,
      controller.edges,
      controller.edgeTransitionDelays,
      controller.edgeTransitionPhases,
    ]
  )

  return {
    ...controller,
    structureOpen,
    nodes,
    edges,
    activateNode,
    rootControlsByCardId,
  }
}
