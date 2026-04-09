import type { WorkspaceCardSize } from "../../workspace-board-types"

export function resolveWorkspaceCanvasCollapsedAcceleratorCardSize({
  currentSize,
  previousCollapsedSize,
}: {
  currentSize: WorkspaceCardSize
  previousCollapsedSize: WorkspaceCardSize | null
}) {
  if (previousCollapsedSize) {
    return previousCollapsedSize
  }

  return currentSize === "lg" ? "sm" : currentSize
}
