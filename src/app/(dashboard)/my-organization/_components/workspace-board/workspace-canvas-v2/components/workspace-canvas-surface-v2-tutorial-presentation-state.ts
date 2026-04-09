"use client"

import {
  resolveWorkspaceCanvasTutorialStep,
  type WorkspaceCanvasTutorialPresentationChrome,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

import { resolveCardDimensions } from "../../workspace-board-layout"
import type { WorkspaceCardId } from "../../workspace-board-types"
import type { WorkspaceCardSize } from "../../workspace-board-types"
import {
  resolveWorkspaceTutorialPresentationCardSize,
  resolveWorkspaceTutorialPresentationCardId,
  resolveWorkspaceTutorialPresentationFamily,
  resolveWorkspaceTutorialPresentationShellHeight,
  resolveWorkspaceTutorialPresentationShellSpec,
  resolveWorkspaceTutorialPresentationShellWidth,
  resolveWorkspaceTutorialStageFamily,
  resolveWorkspaceTutorialStageShellSpec,
  shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime,
  WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET,
  WORKSPACE_TUTORIAL_PRESENTATION_SHELL_SIDE_PADDING,
  type WorkspaceTutorialPresentationFamily,
  type WorkspaceTutorialStageFamily,
  type WorkspaceTutorialStageLayoutMode,
  type WorkspaceTutorialStageSpec,
} from "./workspace-canvas-surface-v2-tutorial-presentation-shells"

export {
  resolveWorkspaceTutorialPresentationCardId,
  resolveWorkspaceTutorialPresentationCardSize,
  resolveWorkspaceTutorialPresentationFamily,
  resolveWorkspaceTutorialPresentationShellHeight,
  resolveWorkspaceTutorialPresentationShellSpec,
  resolveWorkspaceTutorialPresentationShellWidth,
  resolveWorkspaceTutorialStageFamily,
  resolveWorkspaceTutorialStageShellSpec,
  shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime,
  WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET,
  WORKSPACE_TUTORIAL_PRESENTATION_SHELL_SIDE_PADDING,
}
export type {
  WorkspaceTutorialPresentationFamily,
  WorkspaceTutorialStageFamily,
  WorkspaceTutorialStageLayoutMode,
  WorkspaceTutorialStageSpec,
}

export type WorkspaceTutorialPresentationSurfaceSpec = {
  cardWidth: number
  cardHeight: number
  frameWidth: number
  frameHeight: number
}

export type WorkspaceTutorialPresentationLayoutSpec = {
  family: WorkspaceTutorialPresentationFamily
  shellWidth: number
  shellHeight: number
  layoutMode: WorkspaceTutorialStageSpec["layoutMode"]
  pairGap: number | null
  cardSize: WorkspaceCardSize
  surface: WorkspaceTutorialPresentationSurfaceSpec
  chrome: WorkspaceCanvasTutorialPresentationChrome
}

export function resolveWorkspaceTutorialPresentationSurfaceSpec({
  cardId,
  cardSize,
  measuredHeight,
}: {
  cardId: WorkspaceCardId
  cardSize: WorkspaceCardSize
  measuredHeight?: number | null
}): WorkspaceTutorialPresentationSurfaceSpec {
  const dimensions = resolveCardDimensions(cardSize, cardId)
  const cardHeight = Math.max(
    0,
    Math.round(measuredHeight ?? dimensions.height),
  )

  return {
    cardWidth: dimensions.width,
    cardHeight,
    frameWidth:
      dimensions.width + WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET * 2,
    frameHeight:
      cardHeight + WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET * 2,
  }
}

export function resolveWorkspaceTutorialPresentationSurfaceKind({
  cardId: _cardId,
  family: _family,
}: {
  cardId: WorkspaceCardId
  family: WorkspaceTutorialPresentationFamily
}) {
  return "dashed-frame" as const
}

export function resolveWorkspaceTutorialPresentationChrome({
  tutorialStepIndex,
  cardId,
  cardWidth,
}: {
  tutorialStepIndex: number
  cardId: WorkspaceCardId
  cardWidth: number
}): WorkspaceCanvasTutorialPresentationChrome {
  const step = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  const isAcceleratorCard = cardId === "accelerator"
  const allowCalloutOverflow =
    step.id === "accelerator-close-module" && isAcceleratorCard
  const shouldClipCompactAcceleratorPresentation =
    isAcceleratorCard && !allowCalloutOverflow && cardWidth < 1000

  return {
    shellOverflow: allowCalloutOverflow ? "visible" : "hidden",
    bodyOverflow: allowCalloutOverflow ? "visible" : "hidden",
    bodyJustify: "start",
    slotOverflow: shouldClipCompactAcceleratorPresentation
      ? "hidden"
      : "visible",
    slotPaddingTop: 0,
    collapseBodyBottomPadding: shouldClipCompactAcceleratorPresentation,
    showBottomFade: shouldClipCompactAcceleratorPresentation,
    allowCalloutOverflow,
  }
}

export function resolveWorkspaceTutorialPresentationLayoutSpec({
  tutorialStepIndex,
  openedStepIds = [],
  acceleratorModuleViewerOpen = false,
  cardId,
  cardSize,
  measuredHeights,
}: {
  tutorialStepIndex: number
  openedStepIds?: WorkspaceCanvasTutorialStepId[]
  acceleratorModuleViewerOpen?: boolean
  cardId: WorkspaceCardId
  cardSize: WorkspaceCardSize
  measuredHeights?: Partial<Record<WorkspaceCardSize, number>>
}): WorkspaceTutorialPresentationLayoutSpec | null {
  const shellSpec = resolveWorkspaceTutorialPresentationShellSpec({
    tutorialStepIndex,
    openedStepIds,
    acceleratorModuleViewerOpen,
  })

  if (!shellSpec) {
    return null
  }

  const presentationCardSize = resolveWorkspaceTutorialPresentationCardSize({
    cardId,
    family: shellSpec.family,
    cardSize,
  })
  const surfaceSpec = resolveWorkspaceTutorialPresentationSurfaceSpec({
    cardId,
    cardSize: presentationCardSize,
    measuredHeight: measuredHeights?.[presentationCardSize],
  })

  return {
    family: shellSpec.family,
    shellWidth: resolveWorkspaceTutorialPresentationShellWidth({
      shellWidth: shellSpec.shellWidth,
      surfaceFrameWidth: surfaceSpec.frameWidth,
    }),
    shellHeight: resolveWorkspaceTutorialPresentationShellHeight({
      family: shellSpec.family,
      shellHeight: shellSpec.shellHeight,
      surfaceFrameHeight: surfaceSpec.frameHeight,
    }),
    layoutMode: shellSpec.layoutMode,
    pairGap: shellSpec.pairGap,
    cardSize: presentationCardSize,
    surface: surfaceSpec,
    chrome: resolveWorkspaceTutorialPresentationChrome({
      tutorialStepIndex,
      cardId,
      cardWidth: surfaceSpec.cardWidth,
    }),
  }
}
