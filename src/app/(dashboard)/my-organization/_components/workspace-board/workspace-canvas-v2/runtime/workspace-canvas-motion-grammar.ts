import {
  resolveWorkspaceCanvasSceneTransitionTiming,
  type WorkspaceCanvasTransitionTiming,
} from "@/lib/workspace-canvas/motion-spec"

import type { WorkspaceTutorialTransitionKind } from "../components/workspace-canvas-surface-v2-tutorial-scene-spec"

export type { WorkspaceCanvasTransitionTiming }

export function resolveWorkspaceCanvasTransitionTiming({
  transitionKind,
  prefersReducedMotion,
  initialScene = false,
}: {
  transitionKind: WorkspaceTutorialTransitionKind
  prefersReducedMotion: boolean
  initialScene?: boolean
}): WorkspaceCanvasTransitionTiming {
  return resolveWorkspaceCanvasSceneTransitionTiming({
    transitionKind,
    prefersReducedMotion,
    initialScene,
  })
}
