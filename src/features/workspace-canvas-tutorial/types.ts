export type WorkspaceCanvasTutorialCardId =
  | "organization-overview"
  | "programs"
  | "vault"
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
  | "tool-buttons"
  | "documents"
  | "programs"
  | "accelerator"
  | "fundraising"
  | "calendar"
  | "communications"
  | "collaboration"
  | "finish"

export type WorkspaceCanvasTutorialCallout =
  | {
      kind: "shortcut-button"
      cardId: WorkspaceCanvasTutorialCardId
      label: string
      instruction: string
    }
  | {
      kind: "team-access"
      label: string
      instruction: string
    }

export type WorkspaceCanvasTutorialStep = {
  id: WorkspaceCanvasTutorialStepId
  title: string
  message: string
  targetCardId: WorkspaceCanvasTutorialCardId | null
  targetLabel: string | null
  revealedCardIds: WorkspaceCanvasTutorialCardId[]
  continueMode?: "next" | "shortcut"
  calloutInstruction?: string | null
  calloutTarget?: "shortcut-button" | "team-access" | null
  highlightShortcutButtons?: boolean
}

export type WorkspaceCanvasTutorialProgress = {
  openedStepIds: WorkspaceCanvasTutorialStepId[]
  acknowledgedStepIds: WorkspaceCanvasTutorialStepId[]
}

export type WorkspaceCanvasTutorialNodeData = {
  stepIndex: number
  openedStepIds: WorkspaceCanvasTutorialStepId[]
  onPrevious: () => void
  onNext: () => void
}
