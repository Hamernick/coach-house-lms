import {
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialStep,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceBoardState, WorkspaceCardId } from "../../workspace-board-types"
import {
  resolveWorkspaceCanvasTutorialSceneLayout,
  type WorkspaceCanvasTutorialSceneBreakpoint,
} from "./workspace-canvas-surface-v2-onboarding-scenes"
import {
  resolveWorkspaceTutorialStageFamily,
  resolveWorkspaceTutorialStageShellSpec,
} from "./workspace-canvas-surface-v2-tutorial-presentation-state"
import {
  resolveWorkspaceCanvasTutorialGuideGap,
  resolveWorkspaceCanvasTutorialLayoutContract,
} from "./workspace-canvas-surface-v2-tutorial-layout-contract"
import { resolveWorkspaceCanvasTutorialShellMode } from "../runtime/workspace-canvas-focus-policy"

export const WORKSPACE_CANVAS_TUTORIAL_NODE_ID = "workspace-canvas-tutorial"

export function resolveWorkspaceCanvasTutorialSceneSignature({
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
  breakpoint,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
  breakpoint?: WorkspaceCanvasTutorialSceneBreakpoint | null
}) {
  if (!tutorialActive) {
    return null
  }

  const stageFamily = resolveWorkspaceTutorialStageFamily({
    tutorialStepIndex,
    openedStepIds: openedTutorialStepIds,
  })

  return [
    stageFamily,
    breakpoint ?? "desktop",
  ].join("::")
}

export function resolveWorkspaceCanvasTutorialRuntime({
  tutorialStepIndex,
  openedTutorialStepIds = [],
  visibleCardIds,
  existingNodes: _existingNodes,
  breakpoint,
  acceleratorModuleViewerOpen = false,
}: {
  tutorialStepIndex: number
  openedTutorialStepIds?: WorkspaceCanvasTutorialStepId[]
  visibleCardIds: WorkspaceCardId[]
  existingNodes: WorkspaceBoardState["nodes"]
  breakpoint: WorkspaceCanvasTutorialSceneBreakpoint
  acceleratorModuleViewerOpen?: boolean
}) {
  const scene = resolveWorkspaceCanvasTutorialSceneLayout({
    tutorialStepIndex,
    openedTutorialStepIds,
    visibleCardIds,
    breakpoint,
  })
  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    tutorialStepIndex,
    openedTutorialStepIds,
  )
  const primaryCardId = scene.primaryCardId
  const shouldUseDetachedCenteredPrompt =
    scene.sceneId === "overview" &&
    resolveWorkspaceCanvasTutorialStep(tutorialStepIndex).continueMode ===
      "shortcut" &&
    continueMode === "shortcut"
  const stageShellSpec = resolveWorkspaceTutorialStageShellSpec({
    tutorialStepIndex,
    openedStepIds: openedTutorialStepIds,
    acceleratorModuleViewerOpen,
  })
  const shellMode = resolveWorkspaceCanvasTutorialShellMode({
    continueMode,
    tutorialNodeAttached:
      !shouldUseDetachedCenteredPrompt &&
      stageShellSpec.layoutMode === "paired-right-rail",
  })
  const cardPositionOverrides = primaryCardId
    ? scene.cardPositionOverrides
    : visibleCardIds.includes("organization-overview")
      ? {
          ...scene.cardPositionOverrides,
          "organization-overview": scene.layout.organization,
        }
      : scene.cardPositionOverrides
  const guideGap = resolveWorkspaceCanvasTutorialGuideGap({
    layoutMode: stageShellSpec.layoutMode,
    pairGap: stageShellSpec.pairGap,
    anchorOffsetX: scene.layout.guide.anchorOffsetX,
    overlap: scene.layout.guide.overlap,
  })
  const layoutContract = resolveWorkspaceCanvasTutorialLayoutContract({
    tutorialStepIndex,
    openedTutorialStepIds,
    acceleratorModuleViewerOpen,
    breakpoint,
    shellWidth: stageShellSpec.shellWidth,
    shellHeight: stageShellSpec.shellHeight,
    primaryCardId,
    cardPositionOverrides,
    guideGap,
    layoutMode: stageShellSpec.layoutMode,
  })

  return {
    cardPositionOverrides,
    primaryCardId,
    guideGap,
    tutorialNodePosition: layoutContract.tutorialNodePosition,
    tutorialNodeStyle: layoutContract.tutorialNodeStyle,
    tutorialNodeAttached: shellMode === "guided-shell",
    tutorialEdgeTargetCardId: null,
    cameraViewport: layoutContract.cameraViewport,
    sceneNodeIds: [WORKSPACE_CANVAS_TUTORIAL_NODE_ID],
  }
}
