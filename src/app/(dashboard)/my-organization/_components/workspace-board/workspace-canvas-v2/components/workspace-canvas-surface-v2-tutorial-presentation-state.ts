"use client"

import {
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialStep,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"
import type { WorkspaceCanvasTutorialPresentationChrome } from "@/features/workspace-canvas-tutorial/types"

import { resolveCardDimensions } from "../../workspace-board-layout"
import type { WorkspaceCardId } from "../../workspace-board-types"
import type { WorkspaceCardSize } from "../../workspace-board-types"

const ACCELERATOR_PRESENTATION_STEP_IDS = new Set([
  "accelerator-picker",
  "accelerator-progress",
  "accelerator-first-module",
  "accelerator-close-module",
])

const OVERVIEW_PRESENTATION_STEP_IDS = new Set([
  "organization",
  "tool-buttons",
  "collaboration",
])

const TOOL_PRESENTATION_CARD_IDS = new Set<WorkspaceCardId>([
  "programs",
  "roadmap",
  "economic-engine",
  "calendar",
  "communications",
])

export type WorkspaceTutorialPresentationFamily =
  | "welcome"
  | "overview"
  | "map"
  | "tool"
  | "accelerator"
  | "accelerator-module"

export function shouldWorkspaceTutorialTrackEmbeddedAcceleratorRuntime(
  tutorialStepId: WorkspaceCanvasTutorialStepId,
) {
  return (
    tutorialStepId === "accelerator-first-module" ||
    tutorialStepId === "accelerator-close-module"
  )
}

export type WorkspaceTutorialStageFamily =
  | "welcome"
  | "overview"
  | "map"
  | "tool"
  | "accelerator"

export type WorkspaceTutorialStageLayoutMode =
  | "centered"
  | "paired-right-rail"

export type WorkspaceTutorialPresentationShellSpec = {
  family: WorkspaceTutorialPresentationFamily
  shellWidth: number
  shellHeight: number
  layoutMode: Exclude<WorkspaceTutorialStageLayoutMode, "centered"> | "centered"
  pairGap: number | null
}

export type WorkspaceTutorialStageSpec = {
  family: WorkspaceTutorialStageFamily
  shellWidth: number
  shellHeight: number
  layoutMode: WorkspaceTutorialStageLayoutMode
  pairGap: number | null
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
  layoutMode: Exclude<WorkspaceTutorialStageLayoutMode, "centered"> | "centered"
  pairGap: number | null
  cardSize: WorkspaceCardSize
  surface: WorkspaceTutorialPresentationSurfaceSpec
  chrome: WorkspaceCanvasTutorialPresentationChrome
}

const WORKSPACE_TUTORIAL_ADAPTIVE_SHELL_CHROME_HEIGHT = {
  overview: 322,
  map: 280,
  tool: 156,
  "accelerator-module": 220,
} as const

const WORKSPACE_TUTORIAL_ACCELERATOR_PAIR_GAP = 64
export const WORKSPACE_TUTORIAL_PRESENTATION_FRAME_INSET = 10
export const WORKSPACE_TUTORIAL_PRESENTATION_SHELL_SIDE_PADDING = 24
const WORKSPACE_TUTORIAL_ACCELERATOR_CHECKLIST_SHELL_WIDTH = 520
const WORKSPACE_TUTORIAL_ACCELERATOR_CHECKLIST_SHELL_HEIGHT = 724
const WORKSPACE_TUTORIAL_ACCELERATOR_MODULE_SHELL_WIDTH = 560
const WORKSPACE_TUTORIAL_ACCELERATOR_MODULE_SHELL_HEIGHT = 960
const WORKSPACE_TUTORIAL_PRESENTATION_SHELL_SPECS: Record<
  Exclude<WorkspaceTutorialPresentationFamily, "welcome">,
  WorkspaceTutorialPresentationShellSpec
> = {
  overview: {
    family: "overview",
    shellWidth: 620,
    shellHeight: 664,
    layoutMode: "centered",
    pairGap: null,
  },
  map: {
    family: "map",
    shellWidth: 700,
    shellHeight: 724,
    layoutMode: "centered",
    pairGap: null,
  },
  tool: {
    family: "tool",
    shellWidth: 560,
    shellHeight: 676,
    layoutMode: "centered",
    pairGap: null,
  },
  accelerator: {
    family: "accelerator",
    shellWidth: WORKSPACE_TUTORIAL_ACCELERATOR_CHECKLIST_SHELL_WIDTH,
    shellHeight: WORKSPACE_TUTORIAL_ACCELERATOR_CHECKLIST_SHELL_HEIGHT,
    layoutMode: "paired-right-rail",
    pairGap: WORKSPACE_TUTORIAL_ACCELERATOR_PAIR_GAP,
  },
  "accelerator-module": {
    family: "accelerator-module",
    shellWidth: WORKSPACE_TUTORIAL_ACCELERATOR_MODULE_SHELL_WIDTH,
    shellHeight: WORKSPACE_TUTORIAL_ACCELERATOR_MODULE_SHELL_HEIGHT,
    layoutMode: "paired-right-rail",
    pairGap: WORKSPACE_TUTORIAL_ACCELERATOR_PAIR_GAP,
  },
}

function isWorkspaceTutorialCenteredAcceleratorIntroStep({
  tutorialStepIndex,
  openedStepIds = [],
}: {
  tutorialStepIndex: number
  openedStepIds?: WorkspaceCanvasTutorialStepId[]
}) {
  const step = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  if (step.id !== "accelerator") {
    return false
  }

  return (
    resolveWorkspaceCanvasTutorialContinueMode(
      tutorialStepIndex,
      openedStepIds,
    ) === "next"
  )
}

export function resolveWorkspaceTutorialPresentationCardId({
  tutorialStepIndex,
  openedStepIds = [],
}: {
  tutorialStepIndex: number
  openedStepIds?: WorkspaceCanvasTutorialStepId[]
}): WorkspaceCardId | null {
  const step = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    tutorialStepIndex,
    openedStepIds,
  )

  if (ACCELERATOR_PRESENTATION_STEP_IDS.has(step.id)) {
    return "accelerator"
  }

  if (OVERVIEW_PRESENTATION_STEP_IDS.has(step.id)) {
    return "organization-overview"
  }

  if (step.continueMode === "shortcut" && step.targetCardId) {
    return continueMode === "shortcut"
      ? "organization-overview"
      : step.targetCardId
  }

  return step.targetCardId
}

export function resolveWorkspaceTutorialPresentationFamily({
  tutorialStepIndex,
  openedStepIds = [],
  acceleratorModuleViewerOpen = false,
}: {
  tutorialStepIndex: number
  openedStepIds?: WorkspaceCanvasTutorialStepId[]
  acceleratorModuleViewerOpen?: boolean
}): WorkspaceTutorialPresentationFamily {
  const step = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  const cardId = resolveWorkspaceTutorialPresentationCardId({
    tutorialStepIndex,
    openedStepIds,
  })

  if (step.id === "welcome") {
    return "welcome"
  }

  if (step.sceneId === "accelerator-module") {
    if (!acceleratorModuleViewerOpen) {
      return "accelerator"
    }
    return "accelerator-module"
  }

  if (cardId === "accelerator") {
    if (acceleratorModuleViewerOpen) {
      return "accelerator-module"
    }
    return "accelerator"
  }

  if (cardId === "atlas" || step.sceneId === "map") {
    return "map"
  }

  if (cardId === "organization-overview" || cardId === null) {
    return "overview"
  }

  if (TOOL_PRESENTATION_CARD_IDS.has(cardId)) {
    return "tool"
  }

  return "overview"
}

export function resolveWorkspaceTutorialPresentationShellSpec({
  tutorialStepIndex,
  openedStepIds = [],
  acceleratorModuleViewerOpen = false,
}: {
  tutorialStepIndex: number
  openedStepIds?: WorkspaceCanvasTutorialStepId[]
  acceleratorModuleViewerOpen?: boolean
}): WorkspaceTutorialPresentationShellSpec | null {
  const family = resolveWorkspaceTutorialPresentationFamily({
    tutorialStepIndex,
    openedStepIds,
    acceleratorModuleViewerOpen,
  })

  if (family === "welcome") {
    return null
  }

  if (
    family === "accelerator" &&
    isWorkspaceTutorialCenteredAcceleratorIntroStep({
      tutorialStepIndex,
      openedStepIds,
    })
  ) {
    return {
      ...WORKSPACE_TUTORIAL_PRESENTATION_SHELL_SPECS.accelerator,
      layoutMode: "centered",
      pairGap: null,
    }
  }

  return WORKSPACE_TUTORIAL_PRESENTATION_SHELL_SPECS[family]
}

export function resolveWorkspaceTutorialStageFamily({
  tutorialStepIndex,
  openedStepIds = [],
  acceleratorModuleViewerOpen = false,
}: {
  tutorialStepIndex: number
  openedStepIds?: WorkspaceCanvasTutorialStepId[]
  acceleratorModuleViewerOpen?: boolean
}): WorkspaceTutorialStageFamily {
  const family = resolveWorkspaceTutorialPresentationFamily({
    tutorialStepIndex,
    openedStepIds,
    acceleratorModuleViewerOpen,
  })

  if (family === "accelerator-module") {
    return "accelerator"
  }

  return family
}

export function resolveWorkspaceTutorialStageShellSpec({
  tutorialStepIndex,
  openedStepIds = [],
  acceleratorModuleViewerOpen = false,
}: {
  tutorialStepIndex: number
  openedStepIds?: WorkspaceCanvasTutorialStepId[]
  acceleratorModuleViewerOpen?: boolean
}): WorkspaceTutorialStageSpec {
  const stageFamily = resolveWorkspaceTutorialStageFamily({
    tutorialStepIndex,
    openedStepIds,
    acceleratorModuleViewerOpen,
  })

  if (stageFamily === "welcome") {
    return {
      family: stageFamily,
      shellWidth: 520,
      shellHeight: 324,
      layoutMode: "centered",
      pairGap: null,
    }
  }

  const shellSpec = resolveWorkspaceTutorialPresentationShellSpec({
    tutorialStepIndex,
    openedStepIds,
    acceleratorModuleViewerOpen,
  })

  if (!shellSpec) {
    return {
      family: stageFamily,
      shellWidth: 520,
      shellHeight: 324,
      layoutMode: "centered",
      pairGap: null,
    }
  }

  return {
    family: stageFamily,
    shellWidth: shellSpec.shellWidth,
    shellHeight: shellSpec.shellHeight,
    layoutMode: shellSpec.layoutMode,
    pairGap: shellSpec.pairGap,
  }
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

export function resolveWorkspaceTutorialPresentationCardSize({
  cardId,
  family,
  cardSize,
}: {
  cardId: WorkspaceCardId
  family: WorkspaceTutorialPresentationFamily
  cardSize: WorkspaceCardSize
}) {
  if (cardId !== "accelerator") {
    if (family === "tool" && TOOL_PRESENTATION_CARD_IDS.has(cardId) && cardSize === "sm") {
      return "md"
    }

    return cardSize
  }

  return family === "accelerator-module" ? "lg" : "sm"
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

export function resolveWorkspaceTutorialPresentationShellHeight({
  family,
  shellHeight,
  surfaceFrameHeight,
}: {
  family: WorkspaceTutorialPresentationFamily
  shellHeight: number
  surfaceFrameHeight: number
}) {
  if (family === "overview") {
    return shellHeight
  }

  if (!(family in WORKSPACE_TUTORIAL_ADAPTIVE_SHELL_CHROME_HEIGHT)) {
    return shellHeight
  }

  const chromeHeight =
    WORKSPACE_TUTORIAL_ADAPTIVE_SHELL_CHROME_HEIGHT[
      family as keyof typeof WORKSPACE_TUTORIAL_ADAPTIVE_SHELL_CHROME_HEIGHT
    ]

  if (family === "tool") {
    return surfaceFrameHeight + chromeHeight
  }

  return Math.max(shellHeight, surfaceFrameHeight + chromeHeight)
}

export function resolveWorkspaceTutorialPresentationShellWidth({
  shellWidth,
  surfaceFrameWidth,
}: {
  shellWidth: number
  surfaceFrameWidth: number
}) {
  return Math.max(
    shellWidth,
    surfaceFrameWidth + WORKSPACE_TUTORIAL_PRESENTATION_SHELL_SIDE_PADDING * 2,
  )
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
