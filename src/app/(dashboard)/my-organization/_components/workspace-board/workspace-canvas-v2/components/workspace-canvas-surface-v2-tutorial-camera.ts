export function resolveWorkspaceTutorialSceneCameraViewport({
  tutorialNodePosition,
  shellWidth,
  shellHeight,
  tutorialSceneCameraViewport,
}: {
  tutorialNodePosition: { x: number; y: number } | null
  shellWidth: number | null
  shellHeight: number | null
  tutorialSceneCameraViewport: {
    x: number
    y: number
    zoom: number
    duration: number
    delayMs?: number
  } | null
}) {
  if (
    !tutorialNodePosition ||
    shellWidth === null ||
    shellHeight === null ||
    !tutorialSceneCameraViewport
  ) {
    return tutorialSceneCameraViewport
  }

  return {
    ...tutorialSceneCameraViewport,
    x: Math.round(tutorialNodePosition.x + shellWidth / 2),
    y: Math.round(tutorialNodePosition.y + shellHeight / 2),
  }
}
