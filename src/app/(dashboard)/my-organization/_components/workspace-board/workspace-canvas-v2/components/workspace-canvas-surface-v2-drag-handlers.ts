"use client"

import { useCallback } from "react"
import type { Node, NodeDragHandler, SelectionDragHandler } from "reactflow"

export function useWorkspaceCanvasSurfaceDragHandlers({
  handleNodeDragStop,
  handleWorkspacePersonNodeDragStop,
  handleWorkspacePersonNodesDragStop,
}: {
  handleNodeDragStop: NodeDragHandler
  handleWorkspacePersonNodeDragStop: (node: Node) => boolean
  handleWorkspacePersonNodesDragStop: (nodes: Node[]) => boolean | void
}) {
  const handleCanvasNodeDragStop = useCallback<NodeDragHandler>(
    (event, node, nodes) => {
      if (handleWorkspacePersonNodeDragStop(node)) {
        return
      }

      handleNodeDragStop(event, node, nodes)
    },
    [handleNodeDragStop, handleWorkspacePersonNodeDragStop]
  )
  const handleCanvasSelectionDragStop = useCallback<SelectionDragHandler>(
    (event, nodes) => {
      const draggedNodes = nodes
      handleWorkspacePersonNodesDragStop(draggedNodes)

      for (const draggedNode of draggedNodes) {
        if (draggedNode.type === "workspace-person") continue
        handleNodeDragStop(event, draggedNode, draggedNodes)
      }
    },
    [handleNodeDragStop, handleWorkspacePersonNodesDragStop]
  )

  return {
    handleCanvasNodeDragStop,
    handleCanvasSelectionDragStop,
  }
}
