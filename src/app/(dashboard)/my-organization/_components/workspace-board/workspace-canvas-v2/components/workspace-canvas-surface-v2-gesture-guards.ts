export function shouldPreventWorkspaceCanvasWheelZoom(ctrlKey: boolean) {
  return ctrlKey
}

export function shouldPreventWorkspaceCanvasTouchZoom(touchCount: number) {
  return touchCount > 1
}
