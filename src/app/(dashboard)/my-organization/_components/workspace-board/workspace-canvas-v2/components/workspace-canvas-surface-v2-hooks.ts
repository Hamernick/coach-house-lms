import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"

import {
  resolveWorkspaceCanvasTutorialCallout,
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialHighlightShortcutButtons,
  resolveWorkspaceCanvasTutorialSelectedCardId,
  resolveWorkspaceCanvasTutorialVisibleCardIds,
} from "@/features/workspace-canvas-tutorial"

import type { WorkspaceBoardToggleContext } from "../../workspace-board-debug"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceSeedData,
} from "../../workspace-board-types"
import {
  isWorkspaceCanvasV2CardId,
  type WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"
import { buildWorkspaceCardShortcutItemModels } from "../shortcuts/workspace-card-shortcut-model"
import { resolveWorkspaceCanvasCardReadinessMap } from "../runtime/workspace-canvas-card-readiness"

function resolveVisibleWorkspaceCanvasCardIds(
  hiddenCardIds: WorkspaceBoardState["hiddenCardIds"],
) {
  return (
    ["organization-overview", "programs", "roadmap", "accelerator", "brand-kit", "economic-engine", "calendar", "communications"] as const
  ).filter((cardId) => !hiddenCardIds.includes(cardId))
}

function resolveTutorialWorkspaceCanvasVisibleCardIds({
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
  boardVisibleCardIds,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
  boardVisibleCardIds: WorkspaceCanvasV2CardId[]
}) {
  if (!tutorialActive) {
    return boardVisibleCardIds
  }

  return resolveWorkspaceCanvasTutorialVisibleCardIds(
    tutorialStepIndex,
    openedTutorialStepIds,
  ).filter(isWorkspaceCanvasV2CardId)
}

export function useWorkspaceCanvasVisibleCardIds({
  tutorialActive,
  hiddenCardIds,
  tutorialStepIndex,
  openedTutorialStepIds,
}: {
  tutorialActive: boolean
  hiddenCardIds: WorkspaceBoardState["hiddenCardIds"]
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
}) {
  const boardVisibleCardIds = useMemo<WorkspaceCanvasV2CardId[]>(
    () => resolveVisibleWorkspaceCanvasCardIds(hiddenCardIds),
    [hiddenCardIds],
  )

  return useMemo<WorkspaceCanvasV2CardId[]>(
    () =>
      resolveTutorialWorkspaceCanvasVisibleCardIds({
        tutorialActive,
        tutorialStepIndex,
        openedTutorialStepIds,
        boardVisibleCardIds,
      }),
    [
      boardVisibleCardIds,
      openedTutorialStepIds,
      tutorialActive,
      tutorialStepIndex,
    ],
  )
}

export function resolveAcceleratorWorkspaceNodeId(
  acceleratorWorkspaceNode: WorkspaceBoardState["nodes"][number] | null,
) {
  return acceleratorWorkspaceNode &&
    isWorkspaceCanvasV2CardId(acceleratorWorkspaceNode.id)
    ? acceleratorWorkspaceNode.id
    : null
}

export function useResetAcceleratorStepNodePositionOverride({
  acceleratorCardVisible,
  acceleratorStepNodeVisible,
  setAcceleratorStepNodePositionOverride,
}: {
  acceleratorCardVisible: boolean
  acceleratorStepNodeVisible: boolean
  setAcceleratorStepNodePositionOverride: Dispatch<
    SetStateAction<{ x: number; y: number } | null>
  >
}) {
  useEffect(() => {
    if (!acceleratorCardVisible || !acceleratorStepNodeVisible) {
      setAcceleratorStepNodePositionOverride(null)
    }
  }, [
    acceleratorCardVisible,
    acceleratorStepNodeVisible,
    setAcceleratorStepNodePositionOverride,
  ])
}

export function useWorkspaceCardShortcutItems({
  hiddenCardIds,
  visibleCardIds,
  selectedCardId,
  tutorialActive,
  tutorialStepIndex,
  openedTutorialStepIds,
  onToggleCardVisibility,
  onFocusCard,
  onTutorialAdvance,
}: {
  hiddenCardIds: WorkspaceBoardState["hiddenCardIds"]
  visibleCardIds?: WorkspaceCardId[] | null
  selectedCardId: WorkspaceCardId | null
  tutorialActive: boolean
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
  onToggleCardVisibility: (
    cardId: WorkspaceCardId,
    context?: WorkspaceBoardToggleContext,
  ) => void
  onFocusCard: (cardId: WorkspaceCardId) => void
  onTutorialAdvance?: (() => void) | null
}) {
  return useMemo(
    () => {
      const tutorialContinueMode = resolveWorkspaceCanvasTutorialContinueMode(
        tutorialStepIndex,
        openedTutorialStepIds,
      )
      const tutorialCallout =
        tutorialActive && tutorialContinueMode === "shortcut"
          ? resolveWorkspaceCanvasTutorialCallout(
              tutorialStepIndex,
              openedTutorialStepIds,
            )
          : null

      return buildWorkspaceCardShortcutItemModels({
        hiddenCardIds,
        visibleCardIds,
        selectedCardId,
        onToggle: onToggleCardVisibility,
        onFocusCard,
        tutorialTargetCardId:
          tutorialCallout?.kind === "shortcut-button"
            ? tutorialCallout.cardId
            : null,
        tutorialInstruction:
          tutorialCallout?.kind === "shortcut-button"
            ? tutorialCallout.instruction
            : null,
        tutorialHighlightAll:
          tutorialActive &&
          resolveWorkspaceCanvasTutorialHighlightShortcutButtons(
            tutorialStepIndex,
          ),
        onTutorialAdvance:
          tutorialActive && tutorialContinueMode === "shortcut"
            ? onTutorialAdvance
            : null,
      })
    },
    [
      hiddenCardIds,
      onFocusCard,
      onToggleCardVisibility,
      onTutorialAdvance,
      openedTutorialStepIds,
      selectedCardId,
      tutorialActive,
      tutorialStepIndex,
      visibleCardIds,
    ],
  )
}

export function useWorkspaceCardReadinessMap({
  seed,
  boardState,
}: {
  seed: WorkspaceSeedData
  boardState: WorkspaceBoardState
}) {
  return useMemo(
    () =>
      resolveWorkspaceCanvasCardReadinessMap({
        seed,
        boardState,
      }),
    [boardState, seed],
  )
}

export function useWorkspaceCanvasTutorialVisibility({
  boardState,
}: {
  boardState: WorkspaceBoardState
}) {
  return useMemo(() => {
    const tutorialActive = boardState.onboardingFlow.active
    const tutorialSelectedCardId = tutorialActive
      ? resolveWorkspaceCanvasTutorialSelectedCardId(
          boardState.onboardingFlow.tutorialStepIndex,
          boardState.onboardingFlow.openedTutorialStepIds,
        )
      : null

    return {
      tutorialActive,
      tutorialSelectedCardId,
      emptyStateMessage: tutorialActive
        ? null
        : "No cards visible. Use the Organization shortcuts to show a card.",
    }
  }, [
    boardState.onboardingFlow.active,
    boardState.onboardingFlow.openedTutorialStepIds,
    boardState.onboardingFlow.tutorialStepIndex,
  ])
}

export function useWorkspaceTutorialCardMeasuredHeights() {
  const [tutorialCardMeasuredHeights, setTutorialCardMeasuredHeights] = useState<
    Partial<Record<WorkspaceCardId, Partial<Record<WorkspaceCardSize, number>>>>
  >({})

  const handleCardMeasuredHeightChange = useCallback(
    (cardId: WorkspaceCardId, size: WorkspaceCardSize, height: number) => {
      setTutorialCardMeasuredHeights((current) => {
        const nextHeight = Math.round(height)
        const currentCardHeights = current[cardId] ?? {}
        return currentCardHeights[size] === nextHeight
          ? current
          : {
              ...current,
              [cardId]: {
                ...currentCardHeights,
                [size]: nextHeight,
              },
            }
      })
    },
    [],
  )

  return {
    tutorialCardMeasuredHeights,
    handleCardMeasuredHeightChange,
  }
}

export function useWorkspaceTutorialShellMeasuredHeights() {
  const [tutorialShellMeasuredHeights, setTutorialShellMeasuredHeights] =
    useState<Record<string, number>>({})

  const handleTutorialShellMeasuredHeightChange = useCallback(
    (sceneSignature: string, height: number) => {
      setTutorialShellMeasuredHeights((current) => {
        const nextHeight = Math.max(0, Math.round(height))
        return current[sceneSignature] === nextHeight
          ? current
          : {
              ...current,
              [sceneSignature]: nextHeight,
            }
      })
    },
    [],
  )

  return {
    tutorialShellMeasuredHeights,
    handleTutorialShellMeasuredHeightChange,
  }
}

export function useWorkspaceTutorialMeasurements({
  tutorialSceneSignature,
}: {
  tutorialSceneSignature: string | null
}) {
  const { tutorialCardMeasuredHeights, handleCardMeasuredHeightChange } =
    useWorkspaceTutorialCardMeasuredHeights()
  const {
    tutorialShellMeasuredHeights,
    handleTutorialShellMeasuredHeightChange,
  } = useWorkspaceTutorialShellMeasuredHeights()

  return {
    tutorialCardMeasuredHeights,
    handleCardMeasuredHeightChange,
    tutorialShellMeasuredHeight:
      tutorialSceneSignature !== null
        ? tutorialShellMeasuredHeights[tutorialSceneSignature] ?? null
        : null,
    handleCurrentTutorialShellMeasuredHeightChange:
      tutorialSceneSignature !== null
        ? (height: number) =>
            handleTutorialShellMeasuredHeightChange(
              tutorialSceneSignature,
              height,
            )
        : undefined,
  }
}
