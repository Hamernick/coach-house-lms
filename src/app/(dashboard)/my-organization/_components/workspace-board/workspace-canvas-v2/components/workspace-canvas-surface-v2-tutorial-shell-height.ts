import type { WorkspaceTutorialPresentationFamily } from "./workspace-canvas-surface-v2-tutorial-presentation-state"

export function shouldWorkspaceTutorialUseMeasuredShellHeight(
  family: WorkspaceTutorialPresentationFamily,
) {
  return (
    family === "welcome" ||
    family === "tool" ||
    family === "accelerator-module"
  )
}

export function shouldWorkspaceTutorialMeasurePresentationContentHeight(
  family: WorkspaceTutorialPresentationFamily,
) {
  return family === "overview" || family === "map"
}

export function resolveWorkspaceTutorialRenderedShellHeight({
  family,
  estimatedShellHeight,
  measuredShellHeight,
}: {
  family: WorkspaceTutorialPresentationFamily
  estimatedShellHeight: number
  measuredShellHeight: number | null | undefined
}) {
  if (!shouldWorkspaceTutorialUseMeasuredShellHeight(family)) {
    return estimatedShellHeight
  }

  if (
    typeof measuredShellHeight !== "number" ||
    !Number.isFinite(measuredShellHeight) ||
    measuredShellHeight <= 0
  ) {
    return estimatedShellHeight
  }

  return Math.round(measuredShellHeight)
}
