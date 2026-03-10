import type { WorkspaceCanvasTutorialCallout } from "@/features/workspace-canvas-tutorial"

export function shouldAutoOpenRightRailForWorkspaceTutorialCallout(
  tutorialCallout: WorkspaceCanvasTutorialCallout | null,
) {
  return tutorialCallout?.kind === "team-access"
}
