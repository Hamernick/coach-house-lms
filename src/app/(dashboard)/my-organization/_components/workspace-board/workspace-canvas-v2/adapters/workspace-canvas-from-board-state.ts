import type { WorkspaceBoardState } from "../../workspace-board-types"

import type { WorkspaceCanvasPosition } from "../contracts/workspace-canvas-types"

export function resolveWorkspaceCanvasOrgNodePosition(
  nodes: WorkspaceBoardState["nodes"],
): WorkspaceCanvasPosition {
  const orgNode = nodes.find((node) => node.id === "organization-overview")
  if (!orgNode) {
    return { x: 180, y: 120 }
  }

  return {
    x: orgNode.x,
    y: orgNode.y,
  }
}
