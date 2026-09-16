"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { pickGoogleDriveFiles } from "@/features/google-drive/client"
const pickDriveFiles = () => pickGoogleDriveFiles(true)
import type { Connection } from "reactflow"
import {
  WorkspaceParticlesProvider,
  useWorkspaceParticlesController,
} from "@/features/workspace-particles/client"
import type { WorkspaceParticleState } from "@/features/workspace-particles"
import { WorkspaceCanvasSurfaceV2View } from "./workspace-canvas-surface-v2-view"
import type { WorkspaceCanvasSurfaceV2ViewProps } from "./workspace-canvas-surface-v2-view-types"

function eventPoint(event: MouseEvent | React.MouseEvent) {
  return { x: event.clientX, y: event.clientY }
}

export function WorkspaceCanvasParticlesSurface({
  particleState,
  onParticlesChange,
  ...props
}: WorkspaceCanvasSurfaceV2ViewProps & {
  particleState: WorkspaceParticleState | undefined
  onParticlesChange: (state: WorkspaceParticleState) => void
}) {
  const router = useRouter()
  useEffect(() => {
    const refresh = () => router.refresh()
    window.addEventListener("focus", refresh)
    return () => window.removeEventListener("focus", refresh)
  }, [router])
  const particles = useWorkspaceParticlesController({
    state: particleState,
    sections: props.workspaceAcceleratorDrawerRoadmapSections,
    canEdit: props.allowEditing && !props.presentationMode,
    enabled: !props.tutorialActive,
    onChange: onParticlesChange,
    pickDriveFiles,
  })
  const nodes = useMemo(
    () => [...props.nodes, ...particles.nodes],
    [props.nodes, particles.nodes]
  )
  const visibleIds = useMemo(
    () => new Set(nodes.map((node) => node.id)),
    [nodes]
  )
  const edges = useMemo(
    () => [
      ...props.edges,
      ...particles.state.connections
        .filter(
          (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
        )
        .map((edge) => ({
          ...edge,
          type: "smoothstep",
          animated: false,
          style: { stroke: "var(--muted-foreground)", strokeWidth: 1.5 },
        })),
    ],
    [props.edges, particles.state.connections, visibleIds]
  )
  const touchesParticle = (connection: Pick<Connection, "source" | "target">) =>
    connection.source?.startsWith("particle-") ||
    connection.target?.startsWith("particle-")
  return (
    <WorkspaceParticlesProvider controller={particles}>
      <WorkspaceCanvasSurfaceV2View
        {...props}
        nodes={nodes}
        edges={edges}
        onInit={(instance) => {
          particles.setFlow(instance)
          props.onInit(instance)
        }}
        onNodesChange={(changes) => {
          particles.onNodesChange(changes)
          props.onNodesChange(
            changes.filter(
              (change) =>
                !("id" in change) || !change.id.startsWith("particle-")
            )
          )
        }}
        onNodeDragStart={(_event, node) => {
          if (node.type === "workspace-particle")
            particles.setDraggingNode(true)
        }}
        onNodeDragStop={(event, node, moved) => {
          particles.persistPositions(
            moved?.length ? moved : [node],
            eventPoint(event)
          )
          if (node.type !== "workspace-particle")
            props.onNodeDragStop(event, node, moved)
        }}
        onSelectionDragStop={(event, moved) => {
          particles.persistPositions(moved, eventPoint(event))
          props.onSelectionDragStop(
            event,
            moved.filter((node) => node.type !== "workspace-particle")
          )
        }}
        onConnect={(connection) => {
          if (touchesParticle(connection)) particles.connect(connection)
          else props.onConnect(connection)
        }}
        isValidConnection={(connection) =>
          touchesParticle(connection)
            ? particles.canEdit &&
              Boolean(
                connection.source &&
                connection.target &&
                connection.source !== connection.target &&
                visibleIds.has(connection.source) &&
                visibleIds.has(connection.target)
              )
            : props.isValidConnection(connection)
        }
        onEdgeDoubleClick={(event, edge) => {
          if (edge.id.startsWith("particle-edge:"))
            particles.disconnect(edge.id)
          else props.onEdgeDoubleClick(event, edge)
        }}
        onEdgeContextMenu={(event, edge) => {
          if (edge.id.startsWith("particle-edge:")) event.preventDefault()
          else props.onEdgeContextMenu(event, edge)
        }}
      />
    </WorkspaceParticlesProvider>
  )
}
