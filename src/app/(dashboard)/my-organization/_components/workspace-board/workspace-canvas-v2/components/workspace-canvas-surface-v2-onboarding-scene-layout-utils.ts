import type {
  WorkspaceCanvasTutorialSceneId,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceCanvasTutorialSceneBreakpoint } from "./workspace-canvas-surface-v2-onboarding-scenes"
import { resolveWorkspaceCanvasTutorialBoostedZoom } from "./workspace-canvas-surface-v2-tutorial-zoom"

export type SceneSlotLayout = {
  primary: { x: number; y: number }
  organization: { x: number; y: number }
  parked: Array<{ x: number; y: number }>
  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
  }
  guide: {
    width: number
    minHeight: number
    anchorOffsetX: number
    overlap: number
  }
}

function boostSceneViewportLayout(layout: SceneSlotLayout): SceneSlotLayout {
  return {
    ...layout,
    viewport: {
      ...layout.viewport,
      zoom: resolveWorkspaceCanvasTutorialBoostedZoom(layout.viewport.zoom),
    },
  }
}

export function createBoostedSceneSlotLayouts<
  T extends Record<
    WorkspaceCanvasTutorialSceneId,
    Record<WorkspaceCanvasTutorialSceneBreakpoint, SceneSlotLayout>
  >,
>(layouts: T): T {
  return Object.fromEntries(
    Object.entries(layouts).map(([sceneId, breakpointLayouts]) => [
      sceneId,
      Object.fromEntries(
        Object.entries(breakpointLayouts).map(([breakpoint, layout]) => [
          breakpoint,
          boostSceneViewportLayout(layout),
        ]),
      ),
    ]),
  ) as T
}
