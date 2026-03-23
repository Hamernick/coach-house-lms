import type { WorkspaceBoardState, WorkspaceCardSize } from "../../workspace-board-types"
import {
  WORKSPACE_CANVAS_V2_CARD_CONTRACT,
  WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS,
  type WorkspaceCanvasV2CardId,
} from "../contracts/workspace-card-contract"

export function resolveWorkspaceCanvasV2DefaultPosition(cardId: WorkspaceCanvasV2CardId) {
  return WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS[cardId]
}

export function resolveOrgCardSize(nodes: WorkspaceBoardState["nodes"]): WorkspaceCardSize {
  const orgNode = nodes.find((node) => node.id === "organization-overview")
  const fallbackSize =
    WORKSPACE_CANVAS_V2_CARD_CONTRACT["organization-overview"].defaultSize
  if (!orgNode?.size) return fallbackSize
  const allowed =
    WORKSPACE_CANVAS_V2_CARD_CONTRACT["organization-overview"].allowedSizes
  return allowed.some((size) => size === orgNode.size) ? orgNode.size : fallbackSize
}

export function resolveWorkspaceCanvasV2InitialPositionLookup(
  nodes: WorkspaceBoardState["nodes"],
  orgNodePositionFromBoard: { x: number; y: number },
) {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  return {
    "organization-overview": orgNodePositionFromBoard,
    programs: byId.has("programs")
      ? {
          x: byId.get("programs")!.x,
          y: byId.get("programs")!.y,
        }
      : WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS.programs,
    accelerator: byId.has("accelerator")
      ? {
          x: byId.get("accelerator")!.x,
          y: byId.get("accelerator")!.y,
        }
      : WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS.accelerator,
    "brand-kit": byId.has("brand-kit")
      ? {
          x: byId.get("brand-kit")!.x,
          y: byId.get("brand-kit")!.y,
        }
      : WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS["brand-kit"],
    "economic-engine": byId.has("economic-engine")
      ? {
          x: byId.get("economic-engine")!.x,
          y: byId.get("economic-engine")!.y,
        }
      : WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS["economic-engine"],
    roadmap: byId.has("roadmap")
      ? {
          x: byId.get("roadmap")!.x,
          y: byId.get("roadmap")!.y,
        }
      : WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS.roadmap,
    calendar: byId.has("calendar")
      ? {
          x: byId.get("calendar")!.x,
          y: byId.get("calendar")!.y,
        }
      : WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS.calendar,
    communications: byId.has("communications")
      ? {
          x: byId.get("communications")!.x,
          y: byId.get("communications")!.y,
        }
      : WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS.communications,
    atlas: byId.has("atlas")
      ? {
          x: byId.get("atlas")!.x,
          y: byId.get("atlas")!.y,
        }
      : WORKSPACE_CANVAS_V2_DEFAULT_POSITIONS.atlas,
  } satisfies Record<WorkspaceCanvasV2CardId, { x: number; y: number }>
}
