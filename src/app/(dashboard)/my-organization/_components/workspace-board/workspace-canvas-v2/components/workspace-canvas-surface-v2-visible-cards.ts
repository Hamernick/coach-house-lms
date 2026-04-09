import type { WorkspaceBoardState } from "../../workspace-board-types"
import type { WorkspaceCanvasV2CardId } from "./workspace-canvas-surface-v2-helpers"

const WORKSPACE_LIVE_CANVAS_CARD_IDS = [
  "organization-overview",
  "programs",
  "roadmap",
  "accelerator",
  "brand-kit",
  "economic-engine",
  "communications",
] as const satisfies readonly WorkspaceCanvasV2CardId[]

export function resolveVisibleWorkspaceCanvasCardIds(
  hiddenCardIds: WorkspaceBoardState["hiddenCardIds"],
) {
  return WORKSPACE_LIVE_CANVAS_CARD_IDS.filter(
    (cardId) => !hiddenCardIds.includes(cardId),
  )
}
