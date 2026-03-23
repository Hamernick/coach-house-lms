const WORKSPACE_CANVAS_TUTORIAL_ZOOM_BOOST = 0.1
const WORKSPACE_CANVAS_TUTORIAL_MAX_ZOOM = 0.88

export function resolveWorkspaceCanvasTutorialBoostedZoom(baseZoom: number) {
  return Math.min(
    WORKSPACE_CANVAS_TUTORIAL_MAX_ZOOM,
    Math.round((baseZoom + WORKSPACE_CANVAS_TUTORIAL_ZOOM_BOOST) * 100) / 100,
  )
}
