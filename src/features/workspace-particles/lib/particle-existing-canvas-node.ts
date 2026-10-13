import type { Node, ReactFlowInstance } from "reactflow"

import type { ParticleSource } from "../types"
import { PARTICLE_SIZES } from "./particle-state"

export function activateExistingCanvasNode({
  flow,
  source,
  point,
  onPlace,
}: {
  flow: ReactFlowInstance
  source: ParticleSource
  point?: { x: number; y: number }
  onPlace?: (node: Node) => boolean
}): "shown" | "moved" | null {
  if (!source.canvasNodeId) return null
  const canvasNode = flow.getNode(source.canvasNodeId)
  if (!canvasNode) return null
  if (!point) {
    void flow.fitView({
      nodes: [{ id: canvasNode.id }],
      maxZoom: 1,
      duration: 250,
    })
    return "shown"
  }

  const position = flow.screenToFlowPosition(point)
  const width = canvasNode.width ?? PARTICLE_SIZES.mini.width
  const height = canvasNode.height ?? PARTICLE_SIZES.mini.height
  const placed = onPlace?.({
    ...canvasNode,
    position: {
      x: position.x - width / 2,
      y: position.y - height / 2,
    },
  })

  return placed ? "moved" : null
}
