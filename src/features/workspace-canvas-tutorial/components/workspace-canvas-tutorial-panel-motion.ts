"use client"

import {
  resolveWorkspaceCanvasPresentationHandoffDelayMs,
  shouldWorkspaceCanvasAnimateInitialPresentation,
  type WorkspaceCanvasPresentationMotionPreset,
} from "@/lib/workspace-canvas/motion-spec"

import type {
  WorkspaceCanvasTutorialPresentationSurface,
  WorkspaceCanvasTutorialStepId,
} from "../types"

export type WorkspaceTutorialPresentationMotionPreset =
  WorkspaceCanvasPresentationMotionPreset

function resolveWorkspaceTutorialPresentationCardIdFromTransitionKey(
  transitionKey: string | null,
) {
  if (!transitionKey) return null

  const [, cardId] = transitionKey.split("::")
  if (!cardId || cardId === "none") return null
  return cardId
}

export function resolveWorkspaceTutorialPresentationTransitionKey({
  sceneId,
  presentationSurface,
}: {
  sceneId: string
  presentationSurface?: WorkspaceCanvasTutorialPresentationSurface | null
}) {
  return [
    sceneId,
    presentationSurface?.cardId ?? "none",
    presentationSurface?.kind ?? "none",
  ].join("::")
}

export function resolveWorkspaceTutorialPresentationMotionPreset({
  stepId,
  presentationSurface,
  previousPresentationTransitionKey,
}: {
  stepId: WorkspaceCanvasTutorialStepId
  presentationSurface?: WorkspaceCanvasTutorialPresentationSurface | null
  previousPresentationTransitionKey: string | null
}): WorkspaceTutorialPresentationMotionPreset {
  if (
    stepId === "accelerator-close-module" ||
    !presentationSurface
  ) {
    return "default"
  }

  const previousCardId =
    resolveWorkspaceTutorialPresentationCardIdFromTransitionKey(
      previousPresentationTransitionKey,
    )

  if (presentationSurface.cardId === "accelerator") {
    return previousCardId === "accelerator"
      ? "default"
      : "accelerator-entry"
  }

  if (previousCardId && previousCardId !== presentationSurface.cardId) {
    return "surface-handoff"
  }

  return "default"
}

export function resolveWorkspaceTutorialPresentationHandoffDelayMs(
  preset: WorkspaceTutorialPresentationMotionPreset,
) {
  return resolveWorkspaceCanvasPresentationHandoffDelayMs(preset)
}

export function shouldWorkspaceTutorialAnimateInitialPresentationWrapper(
  preset: WorkspaceTutorialPresentationMotionPreset,
  prefersReducedMotion: boolean,
) {
  return shouldWorkspaceCanvasAnimateInitialPresentation(
    preset,
    prefersReducedMotion,
  )
}

export {
  shouldWorkspaceTutorialAnimateInitialPresentationWrapper as shouldWorkspaceTutorialAnimateInitialPresentation,
}
