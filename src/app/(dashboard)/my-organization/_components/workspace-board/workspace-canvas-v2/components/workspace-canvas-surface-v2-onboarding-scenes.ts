import {
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialStep,
  type WorkspaceCanvasTutorialSceneId,
  type WorkspaceCanvasTutorialStepId,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceCardId } from "../../workspace-board-types"
import {
  PRIMARY_CARD_BY_SCENE,
  SCENE_BY_SHORTCUT_TARGET_CARD,
  SCENE_SLOT_LAYOUTS,
  SECONDARY_SCENE_CARD_ORDER,
} from "./workspace-canvas-surface-v2-onboarding-scenes-config"

export type WorkspaceCanvasTutorialSceneBreakpoint = "mobile" | "tablet" | "desktop"

export function resolveWorkspaceCanvasTutorialSceneBreakpoint(
  viewportWidth: number | null | undefined,
): WorkspaceCanvasTutorialSceneBreakpoint {
  const width =
    typeof viewportWidth === "number" && Number.isFinite(viewportWidth)
      ? viewportWidth
      : 1440

  if (width < 768) return "mobile"
  if (width < 1200) return "tablet"
  return "desktop"
}

function resolveScenePrimaryCardId({
  tutorialStepIndex,
  openedTutorialStepIds,
  visibleCardIds,
  sceneId,
}: {
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
  visibleCardIds: WorkspaceCardId[]
  sceneId: WorkspaceCanvasTutorialSceneId
}) {
  const currentStep = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    tutorialStepIndex,
    openedTutorialStepIds,
  )
  if (currentStep.id === "welcome") {
    return null
  }
  const defaultPrimaryCardId = PRIMARY_CARD_BY_SCENE[sceneId]

  if (
    continueMode === "shortcut" &&
    visibleCardIds.includes("organization-overview")
  ) {
    return "organization-overview" as const
  }

  if (visibleCardIds.includes(defaultPrimaryCardId)) {
    return defaultPrimaryCardId
  }

  if (visibleCardIds.includes("organization-overview")) {
    return "organization-overview" as const
  }

  return visibleCardIds[0] ?? null
}

function resolveEffectiveTutorialSceneId({
  tutorialStepIndex,
  openedTutorialStepIds,
}: {
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
}) {
  const currentStep = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
    tutorialStepIndex,
    openedTutorialStepIds,
  )

  if (currentStep.continueMode === "shortcut" && continueMode === "shortcut") {
    return "overview"
  }

  if (
    currentStep.continueMode === "shortcut" &&
    continueMode !== "shortcut" &&
    currentStep.targetCardId
  ) {
    return (
      SCENE_BY_SHORTCUT_TARGET_CARD[currentStep.targetCardId] ??
      currentStep.sceneId
    )
  }

  return currentStep.sceneId
}

export function resolveWorkspaceCanvasTutorialSceneLayout({
  tutorialStepIndex,
  openedTutorialStepIds = [],
  visibleCardIds,
  breakpoint,
}: {
  tutorialStepIndex: number
  openedTutorialStepIds?: WorkspaceCanvasTutorialStepId[]
  visibleCardIds: WorkspaceCardId[]
  breakpoint: WorkspaceCanvasTutorialSceneBreakpoint
}) {
  const currentStep = resolveWorkspaceCanvasTutorialStep(tutorialStepIndex)
  const effectiveSceneId = resolveEffectiveTutorialSceneId({
    tutorialStepIndex,
    openedTutorialStepIds,
  })
  const sceneLayout = SCENE_SLOT_LAYOUTS[effectiveSceneId][breakpoint]
  const primaryCardId = resolveScenePrimaryCardId({
    tutorialStepIndex,
    openedTutorialStepIds,
    visibleCardIds,
    sceneId: effectiveSceneId,
  })
  const positions: Partial<Record<WorkspaceCardId, { x: number; y: number }>> = {}

  if (!primaryCardId) {
    return {
      currentStep,
      sceneId: effectiveSceneId,
      primaryCardId: null,
      cardPositionOverrides: positions,
      layout: sceneLayout,
    }
  }

  positions[primaryCardId] = sceneLayout.primary

  if (
    primaryCardId !== "organization-overview" &&
    visibleCardIds.includes("organization-overview")
  ) {
    positions["organization-overview"] = sceneLayout.organization
  }

  const parkedCardIds = SECONDARY_SCENE_CARD_ORDER.filter(
    (cardId) =>
      visibleCardIds.includes(cardId) &&
      cardId !== primaryCardId &&
      cardId !== "organization-overview",
  )

  parkedCardIds.forEach((cardId, index) => {
    const parkedSlot =
      sceneLayout.parked[index] ??
      sceneLayout.parked[sceneLayout.parked.length - 1] ?? {
        x: sceneLayout.primary.x + 360 + index * 240,
        y: sceneLayout.primary.y + 360,
      }

    positions[cardId] = parkedSlot
  })

  return {
    currentStep,
    sceneId: effectiveSceneId,
    primaryCardId,
    cardPositionOverrides: positions,
    layout: sceneLayout,
  }
}
