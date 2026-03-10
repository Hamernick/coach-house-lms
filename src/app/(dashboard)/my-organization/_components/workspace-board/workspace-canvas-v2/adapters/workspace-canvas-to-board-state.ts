import type { WorkspaceBoardState } from "../../workspace-board-types"

import type { WorkspaceCanvasPosition } from "../contracts/workspace-canvas-types"

export function applyWorkspaceCanvasOrgNodePositionToBoardState({
  boardState,
  position,
}: {
  boardState: WorkspaceBoardState
  position: WorkspaceCanvasPosition
}): WorkspaceBoardState {
  const nextNodes = boardState.nodes.map((node) =>
    node.id === "organization-overview"
      ? {
          ...node,
          x: position.x,
          y: position.y,
        }
      : node,
  )

  const unchanged = nextNodes.every((node, index) => node === boardState.nodes[index])
  if (unchanged) return boardState

  return {
    ...boardState,
    nodes: nextNodes,
  }
}
