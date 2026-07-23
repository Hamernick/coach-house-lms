import type { NodeChange } from "reactflow"

export function shouldReconcileWorkspaceCanvasNodes(changes: NodeChange[]) {
  return !changes.some(
    (change) => change.type === "position" && change.dragging === true
  )
}
