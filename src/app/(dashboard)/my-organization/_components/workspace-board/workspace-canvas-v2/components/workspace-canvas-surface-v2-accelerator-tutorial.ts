"use client"

import { useCallback } from "react"

import { resolveWorkspaceCanvasTutorialCallout } from "@/features/workspace-canvas-tutorial"
import type { WorkspaceAcceleratorTutorialCallout } from "@/features/workspace-accelerator-card"

import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"

export function resolveAcceleratorTutorialCallout({
  openedTutorialStepIds,
  tutorialActive,
  tutorialStepIndex,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasSurfaceV2Props["boardState"]["onboardingFlow"]["openedTutorialStepIds"]
}): WorkspaceAcceleratorTutorialCallout | null {
  if (!tutorialActive) return null
  const callout = resolveWorkspaceCanvasTutorialCallout(
    tutorialStepIndex,
    openedTutorialStepIds,
  )
  if (!callout) return null

  if (callout.kind === "accelerator-nav") {
    return {
      focus: "nav",
      title: callout.label,
      instruction: callout.instruction,
    }
  }
  if (callout.kind === "accelerator-picker") {
    return {
      focus: "picker",
      title: callout.label,
      instruction: callout.instruction,
    }
  }
  if (callout.kind === "accelerator-progress") {
    return {
      focus: "progress",
      title: callout.label,
      instruction: callout.instruction,
    }
  }
  if (callout.kind === "accelerator-first-module") {
    return {
      focus: "first-module",
      title: callout.label,
      instruction: callout.instruction,
    }
  }
  if (callout.kind === "accelerator-close-module") {
    return {
      focus: "close-module",
      title: callout.label,
      instruction: callout.instruction,
    }
  }

  return null
}

export function useWorkspaceAcceleratorTutorialActionComplete({
  onTutorialNext,
  onTutorialShortcutOpened,
}: Pick<
  WorkspaceCanvasSurfaceV2Props,
  "onTutorialNext" | "onTutorialShortcutOpened"
>) {
  return useCallback(
    (mode: "complete" | "complete-and-advance" = "complete") => {
      onTutorialShortcutOpened()
      if (mode === "complete-and-advance") {
        onTutorialNext()
      }
    },
    [onTutorialNext, onTutorialShortcutOpened],
  )
}
