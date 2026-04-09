import type { ReactNode } from "react"

export type WorkspaceCanvasTutorialCardId =
  | "organization-overview"
  | "programs"
  | "roadmap"
  | "accelerator"
  | "brand-kit"
  | "economic-engine"
  | "calendar"
  | "communications"
  | "deck"
  | "atlas"

export type WorkspaceCanvasTutorialStepId =
  | "welcome"
  | "organization"
  | "map-button"
  | "map-card"
  | "tool-buttons"
  | "accelerator"
  | "accelerator-picker"
  | "accelerator-progress"
  | "accelerator-first-module"
  | "accelerator-close-module"
  | "calendar"
  | "programs"
  | "roadmap"
  | "fundraising"
  | "communications"
  | "collaboration"

export type WorkspaceCanvasTutorialSceneId =
  | "overview"
  | "map"
  | "accelerator"
  | "accelerator-module"
  | "calendar"
  | "programs"
  | "roadmap"
  | "fundraising"
  | "communications"

export type WorkspaceCanvasTutorialCallout =
  | {
      kind: "shortcut-button"
      cardId: WorkspaceCanvasTutorialCardId
      label: string
      instruction: string
    }
  | {
      kind: "calendar-viewport-button"
      cardId: "calendar"
      label: string
      instruction: string
    }
  | {
      kind: "organization-map-button"
      label: string
      instruction: string
    }
  | {
      kind: "team-access"
      label: string
      instruction: string
    }
  | {
      kind:
        | "accelerator-picker"
        | "accelerator-progress"
        | "accelerator-first-module"
        | "accelerator-close-module"
      label: string
      instruction: string
    }

export type WorkspaceCanvasTutorialStep = {
  id: WorkspaceCanvasTutorialStepId
  sceneId: WorkspaceCanvasTutorialSceneId
  title: string
  message: string
  targetCardId: WorkspaceCanvasTutorialCardId | null
  targetLabel: string | null
  revealedCardIds: WorkspaceCanvasTutorialCardId[]
  continueMode?: "next" | "shortcut" | "action"
  calloutInstruction?: string | null
  calloutTarget?:
    | "shortcut-button"
    | "calendar-viewport-button"
    | "organization-map-button"
    | "team-access"
    | "accelerator-picker"
    | "accelerator-progress"
    | "accelerator-first-module"
    | "accelerator-close-module"
    | null
  highlightShortcutButtons?: boolean
}

export type WorkspaceCanvasTutorialProgress = {
  openedStepIds: WorkspaceCanvasTutorialStepId[]
  acknowledgedStepIds: WorkspaceCanvasTutorialStepId[]
}

export type WorkspaceCanvasTutorialNodeVariant = "welcome" | "attached"

export type WorkspaceCanvasTutorialPresentationMaskLayout = {
  cardId: WorkspaceCanvasTutorialCardId
  x: number
  y: number
  width: number
  height: number
}

export type WorkspaceCanvasTutorialPresentationChrome = {
  shellOverflow: "hidden" | "visible"
  bodyOverflow: "hidden" | "visible"
  bodyJustify: "start" | "center"
  slotOverflow: "hidden" | "visible"
  slotPaddingTop: number
  collapseBodyBottomPadding: boolean
  showBottomFade: boolean
  allowCalloutOverflow: boolean
}

export type WorkspaceCanvasTutorialPresentationSurface = {
  kind: "dashed-frame" | "framed-card"
  cardId: WorkspaceCanvasTutorialCardId
  cardWidth: number
  cardHeight: number
  frameWidth: number
  frameHeight: number
  frameInset: number
  frameRadius?: number
  heightMode?: "content" | "fill"
  scrollable?: boolean
  chrome?: WorkspaceCanvasTutorialPresentationChrome
}

export type WorkspaceCanvasTutorialNodeData = {
  stepIndex: number
  openedStepIds: WorkspaceCanvasTutorialStepId[]
  attached: boolean
  dragEnabled: boolean
  dragHandleClassName?: string
  variant: WorkspaceCanvasTutorialNodeVariant
  presentationContent?: ReactNode
  presentationKey?: string | null
  presentationSurface?: WorkspaceCanvasTutorialPresentationSurface | null
  suppressedNodeIds?: string[]
  onMeasuredShellHeightChange?: (height: number) => void
  onMeasuredHeightChange?: (height: number) => void
  onPresentationMaskLayoutChange?: (
    layout: WorkspaceCanvasTutorialPresentationMaskLayout | null,
  ) => void
  onPrevious: () => void
  onNext: () => void
}
