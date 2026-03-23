import {
  isWorkspaceCardAutoHeight,
  resolveWorkspaceCardHeightModeClassName,
} from "./workspace-board-layout-config"
import type { WorkspaceCardId, WorkspaceCardSize } from "./workspace-board-types"

export function isWorkspaceNodeAutoHeightCard(cardId?: WorkspaceCardId) {
  return isWorkspaceCardAutoHeight(cardId)
}

export function workspaceNodeClassName(
  _size: WorkspaceCardSize,
  cardId?: WorkspaceCardId,
) {
  return `${resolveWorkspaceCardHeightModeClassName(cardId)} overflow-visible select-none will-change-transform`
}
