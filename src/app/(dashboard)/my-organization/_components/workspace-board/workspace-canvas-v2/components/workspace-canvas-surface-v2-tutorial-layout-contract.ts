"use client"

import { type WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"

import { resolveCardDimensions } from "../../workspace-board-layout"
import type { WorkspaceCardId } from "../../workspace-board-types"
import type { WorkspaceCanvasTutorialSceneBreakpoint } from "./workspace-canvas-surface-v2-onboarding-scenes"
import {
  resolveWorkspaceTutorialStageFamily,
  type WorkspaceTutorialStageFamily,
  type WorkspaceTutorialStageLayoutMode,
} from "./workspace-canvas-surface-v2-tutorial-presentation-state"
import { resolveWorkspaceCanvasTutorialBoostedZoom } from "./workspace-canvas-surface-v2-tutorial-zoom"

const WORKSPACE_CANVAS_TUTORIAL_MIN_X = 40
const WORKSPACE_CANVAS_TUTORIAL_MIN_Y = -520
const WORKSPACE_CANVAS_TUTORIAL_RIGHT_RAIL_BREAKPOINTS = new Set<
  WorkspaceCanvasTutorialSceneBreakpoint
>(["desktop"])

const WORKSPACE_CANVAS_TUTORIAL_STAGE_ANCHORS: Record<
  WorkspaceCanvasTutorialSceneBreakpoint,
  { x: number; y: number }
> = {
  desktop: { x: 824, y: 410 },
  tablet: { x: 592, y: 410 },
  mobile: { x: 500, y: 410 },
}

const WORKSPACE_CANVAS_TUTORIAL_STAGE_ZOOMS: Record<
  WorkspaceTutorialStageFamily,
  Record<WorkspaceCanvasTutorialSceneBreakpoint, number>
> = {
  welcome: {
    desktop: 0.68,
    tablet: 0.62,
    mobile: 0.58,
  },
  overview: {
    desktop: 0.68,
    tablet: 0.62,
    mobile: 0.58,
  },
  map: {
    desktop: 0.6,
    tablet: 0.56,
    mobile: 0.5,
  },
  tool: {
    desktop: 0.62,
    tablet: 0.56,
    mobile: 0.5,
  },
  accelerator: {
    desktop: 0.64,
    tablet: 0.58,
    mobile: 0.52,
  },
}

export type WorkspaceCanvasTutorialLayoutContract = {
  stageFamily: WorkspaceTutorialStageFamily
  tutorialNodePosition: { x: number; y: number }
  tutorialNodeStyle: {
    width: number
    height: number
    minHeight: number
  }
  cameraViewport: {
    x: number
    y: number
    zoom: number
    duration: number
  }
}

export function resolveWorkspaceCanvasTutorialGuideGap({
  layoutMode,
  pairGap,
  anchorOffsetX,
  overlap,
}: {
  layoutMode: WorkspaceTutorialStageLayoutMode
  pairGap: number | null
  anchorOffsetX: number
  overlap: number
}) {
  return layoutMode === "paired-right-rail"
    ? (pairGap ?? 0)
    : anchorOffsetX + overlap
}

function resolveCenteredNodePosition({
  breakpoint,
  width,
  height,
}: {
  breakpoint: WorkspaceCanvasTutorialSceneBreakpoint
  width: number
  height: number
}) {
  const anchor = WORKSPACE_CANVAS_TUTORIAL_STAGE_ANCHORS[breakpoint]

  return {
    x: Math.max(
      WORKSPACE_CANVAS_TUTORIAL_MIN_X,
      Math.round(anchor.x - width / 2),
    ),
    y: Math.max(
      WORKSPACE_CANVAS_TUTORIAL_MIN_Y,
      Math.round(anchor.y - height / 2),
    ),
  }
}

function resolveSceneAlignedGuidePosition({
  breakpoint,
  layoutMode,
  primaryCardId,
  organizationPosition,
  guideGap,
}: {
  breakpoint: WorkspaceCanvasTutorialSceneBreakpoint
  layoutMode: WorkspaceTutorialStageLayoutMode
  primaryCardId: WorkspaceCardId | null
  organizationPosition?: { x: number; y: number }
  guideGap: number
}) {
  if (!WORKSPACE_CANVAS_TUTORIAL_RIGHT_RAIL_BREAKPOINTS.has(breakpoint)) {
    return null
  }

  if (layoutMode !== "paired-right-rail") {
    return null
  }

  if (!organizationPosition || primaryCardId === "organization-overview") {
    return null
  }

  const organizationDimensions = resolveCardDimensions("md", "organization-overview")

  return {
    x: Math.max(
      WORKSPACE_CANVAS_TUTORIAL_MIN_X,
      Math.round(organizationPosition.x + organizationDimensions.width + guideGap),
    ),
    y: Math.max(WORKSPACE_CANVAS_TUTORIAL_MIN_Y, Math.round(organizationPosition.y)),
  }
}

function resolveStageCameraViewport({
  stageFamily,
  tutorialNodePosition,
  width,
  height,
  breakpoint,
}: {
  stageFamily: WorkspaceTutorialStageFamily
  tutorialNodePosition: { x: number; y: number }
  width: number
  height: number
  breakpoint: WorkspaceCanvasTutorialSceneBreakpoint
}) {
  const baseZoom = WORKSPACE_CANVAS_TUTORIAL_STAGE_ZOOMS[stageFamily][breakpoint]

  return {
    x: tutorialNodePosition.x + width / 2,
    y: tutorialNodePosition.y + height / 2,
    zoom: resolveWorkspaceCanvasTutorialBoostedZoom(baseZoom),
    duration: 240,
  }
}

export function resolveWorkspaceCanvasTutorialLayoutContract({
  tutorialStepIndex,
  openedTutorialStepIds = [],
  acceleratorModuleViewerOpen = false,
  breakpoint,
  shellWidth,
  shellHeight,
  primaryCardId,
  cardPositionOverrides,
  guideGap,
  layoutMode,
}: {
  tutorialStepIndex: number
  openedTutorialStepIds?: WorkspaceCanvasTutorialStepId[]
  acceleratorModuleViewerOpen?: boolean
  breakpoint: WorkspaceCanvasTutorialSceneBreakpoint
  shellWidth: number
  shellHeight: number
  primaryCardId: WorkspaceCardId | null
  cardPositionOverrides: Partial<Record<WorkspaceCardId, { x: number; y: number }>>
  guideGap: number
  layoutMode: WorkspaceTutorialStageLayoutMode
}): WorkspaceCanvasTutorialLayoutContract {
  const stageFamily = resolveWorkspaceTutorialStageFamily({
    tutorialStepIndex,
    openedStepIds: openedTutorialStepIds,
    acceleratorModuleViewerOpen,
  })
  const tutorialNodePosition =
    resolveSceneAlignedGuidePosition({
      breakpoint,
      layoutMode,
      primaryCardId,
      organizationPosition: cardPositionOverrides["organization-overview"],
      guideGap,
    }) ??
    resolveCenteredNodePosition({
      breakpoint,
      width: shellWidth,
      height: shellHeight,
    })

  return {
    stageFamily,
    tutorialNodePosition,
    tutorialNodeStyle: {
      width: shellWidth,
      height: shellHeight,
      minHeight: shellHeight,
    },
    cameraViewport: resolveStageCameraViewport({
      breakpoint,
      stageFamily,
      tutorialNodePosition,
      width: shellWidth,
      height: shellHeight,
    }),
  }
}
