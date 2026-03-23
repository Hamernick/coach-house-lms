import {
  resolveWorkspaceCanvasTutorialContinueMode,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceCardId } from "../../workspace-board-types"

type WorkspaceCanvasTutorialContinueMode = ReturnType<
  typeof resolveWorkspaceCanvasTutorialContinueMode
>

export type WorkspaceCanvasShellMode =
  | "centered-prompt"
  | "guided-shell"
  | "live-canvas-only"

export function resolveWorkspaceCanvasTutorialShellMode({
  continueMode,
  tutorialNodeAttached,
}: {
  continueMode: WorkspaceCanvasTutorialContinueMode
  tutorialNodeAttached: boolean
}): WorkspaceCanvasShellMode {
  if (continueMode === "shortcut") {
    return "centered-prompt"
  }

  return tutorialNodeAttached ? "guided-shell" : "centered-prompt"
}

export function resolveWorkspaceCanvasTutorialAutofocusTarget({
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
  visibleCardIds,
  tutorialSelectedCardId,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
  visibleCardIds: WorkspaceCardId[]
  tutorialSelectedCardId: WorkspaceCardId | null
}): WorkspaceCardId | null {
  if (!tutorialActive) {
    return null
  }

  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    tutorialStepIndex,
    openedTutorialStepIds,
  )
  if (continueMode === "shortcut") {
    return null
  }

  if (!tutorialSelectedCardId) {
    return null
  }

  return visibleCardIds.includes(tutorialSelectedCardId)
    ? tutorialSelectedCardId
    : null
}

export function resolveWorkspaceCanvasFallbackFocusTarget({
  focusCardId,
  journeyGuideTargetCardId,
  visibleNodeIds,
}: {
  focusCardId?: string | null
  journeyGuideTargetCardId?: string | null
  visibleNodeIds: string[]
}): string | null {
  const visibleNodeIdSet = new Set(visibleNodeIds)

  if (focusCardId && visibleNodeIdSet.has(focusCardId)) {
    return focusCardId
  }

  if (journeyGuideTargetCardId && visibleNodeIdSet.has(journeyGuideTargetCardId)) {
    return journeyGuideTargetCardId
  }

  return null
}
