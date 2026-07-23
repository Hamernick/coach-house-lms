"use client"

import "reactflow/dist/style.css"

import { useMemo, useState } from "react"
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
  useOnViewportChange,
} from "reactflow"

import {
  WorkspaceNodeFrameHeader,
  WorkspaceNodeFrameRoot,
  WorkspaceNodeFrameSurface,
} from "@/components/workspace/workspace-node-frame"

import { useWorkspaceOntologyController } from "../hooks/use-workspace-ontology-controller"
import { useWorkspaceOntologyUrlState } from "../hooks/use-workspace-ontology-url-state"
import { useWorkspaceOntologyWayfinding } from "../hooks/use-workspace-ontology-wayfinding"
import { resolveWorkspaceOntologyNodeSize } from "../lib"
import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyRootGeometry,
  WorkspaceOntologyRootControl,
  WorkspaceOntologyRootId,
} from "../types"
import { WorkspaceOntologyEdge } from "./workspace-ontology-edge"
import { WorkspaceOntologyBranchToggle } from "./workspace-ontology-branch-toggle"
import {
  WorkspaceOntologyNode,
  WORKSPACE_ONTOLOGY_RELATIONSHIP_SOURCE_HANDLE_ID,
  WORKSPACE_ONTOLOGY_RELATIONSHIP_TARGET_HANDLE_ID,
  type WorkspaceOntologyNodeData,
} from "./workspace-ontology-node"

const ROOT_GEOMETRY: Record<
  "organization-overview" | "accelerator",
  WorkspaceOntologyRootGeometry
> = {
  "organization-overview": { x: 0, y: 0, width: 320, height: 194 },
  accelerator: { x: 360, y: 0, width: 320, height: 194 },
}
const VISUAL_ROOT_BOTTOM_SOURCE_HANDLE_ID = "visual-root-source-bottom"

const INPUT: WorkspaceOntologyInput = {
  roots: [
    {
      id: "organization-overview",
      label: "Organization",
      children: [
        {
          id: "ontology:visual:mission",
          label: "Mission and purpose",
          description: "The organization's public purpose.",
          category: "organization",
          kind: "Organization requirement",
          status: "complete",
          statusLabel: "Complete",
          relationshipLabel: "defines",
          href: "/workspace?view=editor&tab=company",
          actionLabel: "Open organization",
          ownerLabel: "Executive director",
          children: [
            {
              id: "ontology:visual:mission:statement",
              label: "Mission statement",
              description: "The public statement of purpose.",
              category: "organization",
              kind: "Profile field",
              status: "complete",
              statusLabel: "Complete",
              relationshipLabel: "includes",
              href: "/workspace?view=editor&tab=company",
              actionLabel: "Review mission",
              ownerLabel: "Executive director",
            },
            {
              id: "ontology:visual:mission:outcomes",
              label: "Intended outcomes",
              description: "The change the organization intends to create.",
              category: "organization",
              kind: "Profile field",
              status: "missing",
              statusLabel: "Needs information",
              relationshipLabel: "includes",
              href: "/workspace?view=editor&tab=company",
              actionLabel: "Add outcomes",
              ownerLabel: "Program director",
            },
          ],
        },
        {
          id: "ontology:visual:board",
          label: "Board roles",
          description: "Governing board membership and responsibilities.",
          category: "people",
          kind: "Governance requirement",
          status: "missing",
          statusLabel: "Needs information",
          relationshipLabel: "governs",
          href: "/workspace?view=editor&tab=people",
          actionLabel: "Add board roles",
          ownerLabel: "Board chair",
        },
        {
          id: "ontology:visual:program",
          label: "Youth arts program",
          description: "A current operating program.",
          category: "programs",
          kind: "Program",
          status: "in-progress",
          statusLabel: "In progress",
          relationshipLabel: "operates",
          href: "/workspace/programs",
          actionLabel: "Open program",
          ownerLabel: "Program director",
        },
      ],
    },
    {
      id: "accelerator",
      label: "Accelerator",
      children: [
        {
          id: "ontology:visual:legal",
          label: "Legal structure",
          description: "Select and document the legal structure.",
          category: "accelerator",
          kind: "Accelerator step",
          status: "blocked",
          statusLabel: "Blocked",
          relationshipLabel: "requires",
          href: "/workspace/accelerator",
          actionLabel: "Resolve blocker",
          ownerLabel: "Operations lead",
        },
        {
          id: "ontology:visual:budget",
          label: "Operating budget",
          description: "Build the first operating budget.",
          category: "fiscal",
          kind: "Accelerator step",
          status: "in-progress",
          statusLabel: "In progress",
          relationshipLabel: "requires",
          href: "/workspace/accelerator",
          actionLabel: "Continue budget",
          ownerLabel: "Treasurer",
        },
        {
          id: "ontology:visual:launch",
          label: "Program launch",
          description: "Prepare the program for delivery.",
          category: "accelerator",
          kind: "Accelerator milestone",
          status: "missing",
          statusLabel: "Needs information",
          relationshipLabel: "prepares",
          href: "/workspace/accelerator",
          actionLabel: "Complete launch plan",
          ownerLabel: "Program director",
        },
      ],
    },
  ],
  relationships: [
    {
      id: "ontology:visual:program-launch",
      source: "ontology:visual:program",
      target: "ontology:visual:launch",
      label: "planned through",
      category: "programs",
      status: "in-progress",
    },
  ],
}

type VisualRootData = {
  label: string
  control: WorkspaceOntologyRootControl
}

function VisualRootNode({ data }: { data: VisualRootData }) {
  return (
    <div className="h-full w-full">
      <WorkspaceNodeFrameRoot className="h-36 w-full rounded-2xl shadow-sm">
        <Handle
          type="target"
          position={Position.Left}
          className="pointer-events-none opacity-0"
          isConnectable={false}
        />
        <WorkspaceNodeFrameSurface className="p-4">
          <WorkspaceNodeFrameHeader className="h-full flex-col justify-between">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Primary card
            </span>
            <div>
              <p className="text-base font-semibold">{data.label}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Connected work continues to the right
              </p>
            </div>
          </WorkspaceNodeFrameHeader>
        </WorkspaceNodeFrameSurface>
        <Handle
          type="source"
          position={Position.Right}
          className="pointer-events-none opacity-0"
          isConnectable={false}
        />
        <Handle
          id={VISUAL_ROOT_BOTTOM_SOURCE_HANDLE_ID}
          type="source"
          position={Position.Bottom}
          className="pointer-events-none opacity-0"
          isConnectable={false}
        />
      </WorkspaceNodeFrameRoot>
      <div className="nodrag nopan flex justify-center pt-2.5">
        <WorkspaceOntologyBranchToggle
          label={data.label}
          control={data.control}
        />
      </div>
    </div>
  )
}

const NODE_TYPES = {
  "visual-root": VisualRootNode,
  "workspace-ontology": WorkspaceOntologyNode,
}
const EDGE_TYPES = { "workspace-ontology": WorkspaceOntologyEdge }

function VisualViewportZoomSync({
  onZoomChange,
}: {
  onZoomChange: (zoom: number) => void
}) {
  useOnViewportChange({
    onChange: (viewport) => onZoomChange(viewport.zoom),
    onEnd: (viewport) => onZoomChange(viewport.zoom),
  })
  return null
}

export function WorkspaceOntologyBoardVisualFixture() {
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(
    null
  )
  const [viewportZoom, setViewportZoom] = useState(0.9)
  const { state, setState } = useWorkspaceOntologyUrlState()
  const rootGeometry = ROOT_GEOMETRY
  const obstacles = useMemo(
    () =>
      Object.entries(rootGeometry).map(([id, geometry]) => ({
        id,
        ...geometry,
      })),
    [rootGeometry]
  )
  const controller = useWorkspaceOntologyController({
    input: INPUT,
    state,
    rootGeometry,
    obstacles,
    enabled: true,
    zoom: viewportZoom,
    onStateChange: setState,
  })
  const toggleNode = controller.toggleNode
  const nodes = useMemo<Node[]>(() => {
    const roots: Node<VisualRootData>[] = Object.entries(rootGeometry).map(
      ([id, geometry]) => ({
        id,
        type: "visual-root",
        position: { x: geometry.x, y: geometry.y },
        width: geometry.width,
        height: geometry.height,
        style: { width: geometry.width, height: geometry.height },
        data: {
          label:
            id === "organization-overview" ? "Organization" : "Accelerator",
          control: controller.rootControls[id as WorkspaceOntologyRootId]!,
        },
      })
    )
    const details: Node<WorkspaceOntologyNodeData>[] =
      controller.layoutNodes.map((node) => ({
        id: node.id,
        type: "workspace-ontology",
        position: node.position,
        width: node.size.width,
        height: node.size.height,
        style: resolveWorkspaceOntologyNodeSize(node),
        focusable: false,
        data: {
          kind: "workspace-ontology",
          node,
          detailLevel: controller.detailLevel,
          expanded: controller.state.expandedNodeIds.includes(node.id),
          transitionPhase:
            controller.nodeTransitionPhases.get(node.id) ?? "stable",
          transitionDelayMs: controller.nodeTransitionDelays.get(node.id) ?? 0,
          onActivate: node.hasChildren ? () => toggleNode(node.id) : undefined,
        },
      }))
    return [...roots, ...details]
  }, [
    controller.detailLevel,
    controller.layoutNodes,
    controller.nodeTransitionDelays,
    controller.nodeTransitionPhases,
    controller.rootControls,
    controller.state.expandedNodeIds,
    rootGeometry,
    toggleNode,
  ])
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
            : edge.kind === "hierarchy" && !edge.source.startsWith("ontology:")
              ? VISUAL_ROOT_BOTTOM_SOURCE_HANDLE_ID
              : undefined,
        type: "workspace-ontology",
        focusable: false,
        markerEnd:
          edge.kind === "relationship"
            ? { type: MarkerType.ArrowClosed, width: 12, height: 12 }
            : undefined,
        style: {
          stroke: "rgba(113, 113, 122, 0.62)",
          strokeWidth: edge.kind === "relationship" ? 1.25 : 1,
          strokeDasharray: edge.kind === "relationship" ? "5 5" : undefined,
        },
        data: {
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

  useWorkspaceOntologyWayfinding({
    flowInstance,
    isFlowReady: Boolean(flowInstance),
    layoutAnimating: controller.layoutAnimating,
    nodes: nodes.filter(
      (node): node is Node<WorkspaceOntologyNodeData> =>
        node.type === "workspace-ontology"
    ),
  })

  return (
    <section className="mx-auto mt-10 max-w-[74rem]">
      <header className="mb-5">
        <h2 className="text-lg font-semibold">Expanded planning-board scene</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Primary cards and their details share one collision-free layout.
        </p>
      </header>
      <div
        data-workspace-ontology-board-visual-fixture="true"
        data-layout-animating={controller.layoutAnimating ? "true" : "false"}
        data-viewport-zoom={viewportZoom.toFixed(2)}
        className="workspace-flow border-border bg-muted/30 h-[42rem] overflow-hidden rounded-2xl border"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          onInit={setFlowInstance}
          fitViewOptions={{ padding: 0.16, minZoom: 0.35, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
          zoomOnScroll={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <VisualViewportZoomSync onZoomChange={setViewportZoom} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>
    </section>
  )
}
