import type { WorkspaceCardReadiness } from "./workspace-canvas-card-readiness"

export type WorkspaceBranchStrokeTokens = {
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
  opacity: number
}

export function resolveWorkspaceCanvasBranchStyle({
  readiness,
  presentationMode,
}: {
  readiness: WorkspaceCardReadiness
  presentationMode: boolean
}): WorkspaceBranchStrokeTokens {
  const complete = readiness.isReady

  return {
    stroke: "rgba(148, 163, 184, 0.72)",
    strokeWidth: presentationMode ? (complete ? 1.1 : 1.05) : complete ? 1.35 : 1.3,
    strokeDasharray: complete ? undefined : "6 4",
    opacity: presentationMode ? (complete ? 0.48 : 0.4) : complete ? 0.72 : 0.62,
  }
}
