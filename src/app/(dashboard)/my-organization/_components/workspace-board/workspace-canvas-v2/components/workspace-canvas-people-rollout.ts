import type { WorkspaceCanvasPersonPlacement } from "./workspace-canvas-person-node-model"

export function resolveWorkspaceCanvasPersonPlacements({
  enabled,
  placements,
}: {
  enabled: boolean
  placements: WorkspaceCanvasPersonPlacement[]
}) {
  return enabled ? placements : []
}

export function canMutateWorkspaceCanvasPeople({
  enabled,
  interactionEnabled,
  tutorialActive,
}: {
  enabled: boolean
  interactionEnabled: boolean
  tutorialActive: boolean
}) {
  return enabled && interactionEnabled && !tutorialActive
}
