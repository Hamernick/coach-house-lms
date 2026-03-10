"use client"

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useMemo,
  useRef,
} from "react"
import { type NodeDragHandler } from "reactflow"

import {
  resolveWorkspaceCanvasTutorialCallout,
  resolveWorkspaceCanvasTutorialContinueMode,
  resolveWorkspaceCanvasTutorialSceneFocusCardIds,
} from "@/features/workspace-canvas-tutorial"

import { WORKSPACE_CANVAS_EVENTS } from "../contracts/workspace-canvas-events"
import { logWorkspaceCanvasEvent } from "../runtime/workspace-canvas-logger"
import {
  useWorkspaceCardShortcutItems,
} from "./workspace-canvas-surface-v2-hooks"
import type { WorkspaceCanvasSurfaceV2Props } from "./workspace-canvas-surface-v2-types"
import {
  isWorkspaceCanvasV2CardId,
  type WorkspaceCanvasV2CardId,
} from "./workspace-canvas-surface-v2-helpers"
import { ACCELERATOR_STEP_NODE_ID } from "../../workspace-board-flow-surface-accelerator-graph-composition"
import type { WorkspaceBoardState, WorkspaceCardId } from "../../workspace-board-types"
import type { WorkspaceBoardToggleContext } from "../../workspace-board-debug"
import { WORKSPACE_CANVAS_TUTORIAL_NODE_ID } from "./workspace-canvas-surface-v2-tutorial-runtime"

export function useWorkspaceCanvasNodeDragStop({
  allowEditing,
  boardNodeLookup,
  onPersistNodePosition,
  setAcceleratorStepNodePositionOverride,
  onTutorialNodeDragStop,
}: {
  allowEditing: boolean
  boardNodeLookup: Map<string, { x: number; y: number }>
  onPersistNodePosition: WorkspaceCanvasSurfaceV2Props["onPersistNodePosition"]
  setAcceleratorStepNodePositionOverride: Dispatch<
    SetStateAction<{ x: number; y: number } | null>
  >
  onTutorialNodeDragStop: (x: number, y: number) => void
}) {
  return useCallback<NodeDragHandler>(
    (_, node) => {
      if (!allowEditing) return
      if (node.id === ACCELERATOR_STEP_NODE_ID) {
        const nextX = Math.round(node.position.x)
        const nextY = Math.round(node.position.y)
        setAcceleratorStepNodePositionOverride((previous) => {
          if (previous?.x === nextX && previous?.y === nextY) {
            return previous
          }
          return { x: nextX, y: nextY }
        })
        return
      }
      if (node.id === WORKSPACE_CANVAS_TUTORIAL_NODE_ID) {
        onTutorialNodeDragStop(
          Math.round(node.position.x),
          Math.round(node.position.y),
        )
        return
      }
      if (!isWorkspaceCanvasV2CardId(node.id)) return

      const nextX = Math.round(node.position.x)
      const nextY = Math.round(node.position.y)
      const previous = boardNodeLookup.get(node.id)
      if (!previous) return
      if (previous.x === nextX && previous.y === nextY) return

      onPersistNodePosition(node.id, nextX, nextY)
      logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.ORG_NODE_DRAG_STOP, {
        cardId: node.id,
        x: nextX,
        y: nextY,
      })
    },
    [
      allowEditing,
      boardNodeLookup,
      onPersistNodePosition,
      onTutorialNodeDragStop,
      setAcceleratorStepNodePositionOverride,
    ],
  )
}

export function useWorkspaceTutorialSceneFitRequest({
  tutorialActive,
  tutorialStepIndex,
  visibleCardIds,
  openedTutorialStepIds,
  sceneFitPadding,
}: {
  tutorialActive: boolean
  tutorialStepIndex: number
  visibleCardIds: WorkspaceCanvasV2CardId[]
  openedTutorialStepIds: WorkspaceBoardState["onboardingFlow"]["openedTutorialStepIds"]
  sceneFitPadding: number | null
}) {
  const requestStateRef = useRef<{
    requestKey: number
    signature: string | null
  }>({
    requestKey: 0,
    signature: null,
  })

  return useMemo(() => {
    if (!tutorialActive) {
      requestStateRef.current.signature = null
      return null
    }

    const continueMode = resolveWorkspaceCanvasTutorialContinueMode(
      tutorialStepIndex,
      openedTutorialStepIds,
    )
    const callout = resolveWorkspaceCanvasTutorialCallout(
      tutorialStepIndex,
      openedTutorialStepIds,
    )
    const signature = [
      tutorialStepIndex,
      continueMode,
      openedTutorialStepIds.join(","),
    ].join("::")

    if (requestStateRef.current.signature !== signature) {
      requestStateRef.current = {
        requestKey: requestStateRef.current.requestKey + 1,
        signature,
      }
    }

    const visibleCardIdSet = new Set<string>(visibleCardIds)
    const sceneCardIds = resolveWorkspaceCanvasTutorialSceneFocusCardIds(
      tutorialStepIndex,
      openedTutorialStepIds,
    ).filter((cardId) => visibleCardIdSet.has(cardId))

    return {
      requestKey: requestStateRef.current.requestKey,
      nodeIds: [WORKSPACE_CANVAS_TUTORIAL_NODE_ID, ...sceneCardIds],
      padding: Math.max(
        sceneFitPadding ?? 0.3,
        callout?.kind === "shortcut-button"
          ? 0.46
          : callout?.kind === "team-access"
            ? 0.38
            : 0,
      ),
    }
  }, [
    openedTutorialStepIds,
    sceneFitPadding,
    tutorialActive,
    tutorialStepIndex,
    visibleCardIds,
  ])
}

export function useWorkspaceTutorialAwareShortcutItems({
  boardState,
  visibleCardIds,
  tutorialActive,
  tutorialSelectedCardId,
  focusCardRequest,
  journeyGuideState,
  onToggleCardVisibility,
  onFocusCard,
  onTutorialShortcutOpened,
}: {
  boardState: WorkspaceBoardState
  visibleCardIds: WorkspaceCardId[]
  tutorialActive: boolean
  tutorialSelectedCardId: WorkspaceCardId | null
  focusCardRequest: WorkspaceCanvasSurfaceV2Props["focusCardRequest"]
  journeyGuideState: WorkspaceCanvasSurfaceV2Props["journeyGuideState"]
  onToggleCardVisibility: WorkspaceCanvasSurfaceV2Props["onToggleCardVisibility"]
  onFocusCard: WorkspaceCanvasSurfaceV2Props["onFocusCard"]
  onTutorialShortcutOpened: WorkspaceCanvasSurfaceV2Props["onTutorialShortcutOpened"]
}) {
  const tutorialContinueMode = resolveWorkspaceCanvasTutorialContinueMode(
    boardState.onboardingFlow.tutorialStepIndex,
    boardState.onboardingFlow.openedTutorialStepIds,
  )
  return useWorkspaceCardShortcutItems({
    hiddenCardIds: boardState.hiddenCardIds,
    visibleCardIds,
    selectedCardId: tutorialActive
      ? tutorialSelectedCardId
      : focusCardRequest?.cardId ?? journeyGuideState.targetCardId,
    tutorialActive,
    tutorialStepIndex: boardState.onboardingFlow.tutorialStepIndex,
    openedTutorialStepIds: boardState.onboardingFlow.openedTutorialStepIds,
    onToggleCardVisibility: onToggleCardVisibility as (
      cardId: WorkspaceCardId,
      context?: WorkspaceBoardToggleContext,
    ) => void,
    onFocusCard,
    onTutorialAdvance:
      tutorialActive && tutorialContinueMode === "shortcut"
        ? onTutorialShortcutOpened
        : null,
  })
}
