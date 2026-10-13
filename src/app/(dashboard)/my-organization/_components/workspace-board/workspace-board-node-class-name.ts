import type { WorkspaceCardId, WorkspaceCardSize } from "./workspace-board-types"

const AUTO_HEIGHT_CARD_IDS = new Set<WorkspaceCardId>([
  "accelerator",
  "organization-overview",
  "programs",
  "calendar",
])

export function isWorkspaceNodeAutoHeightCard(cardId?: WorkspaceCardId) {
  return cardId ? AUTO_HEIGHT_CARD_IDS.has(cardId) : false
}

export function workspaceNodeClassName(
  _size: WorkspaceCardSize,
  cardId?: WorkspaceCardId,
) {
  return isWorkspaceNodeAutoHeightCard(cardId)
    ? "h-auto overflow-visible select-none will-change-transform"
    : "h-full overflow-visible select-none will-change-transform"
}
