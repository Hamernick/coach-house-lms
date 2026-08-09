"use client"

import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useRef,
} from "react"

import { saveWorkspaceNodePositionAction } from "../../_lib/workspace-actions"
import {
  logWorkspaceBoardDebug,
  summarizeWorkspaceBoardVisibility,
} from "./workspace-board-debug"
import { buildWorkspaceBoardStateWithNodePosition } from "./workspace-board-canvas-helpers"
import type {
  WorkspaceBoardState,
  WorkspaceCardId,
} from "./workspace-board-types"

export function useWorkspaceNodePositionPersistence({
  allowEditing,
  boardState,
  lastPersistedBoardContentRef,
  setBoardState,
}: {
  allowEditing: boolean
  boardState: WorkspaceBoardState
  lastPersistedBoardContentRef: MutableRefObject<WorkspaceBoardState>
  setBoardState: Dispatch<SetStateAction<WorkspaceBoardState>>
}) {
  const nodePositionPersistInFlightRef = useRef(false)
  const boardStateRef = useRef(boardState)
  boardStateRef.current = boardState
  const pendingNodePositionBoardStateRef = useRef<{
    boardState: WorkspaceBoardState
    cardId: WorkspaceCardId
    x: number
    y: number
  } | null>(null)
  const flushNodePositionPersist = useCallback(() => {
    if (nodePositionPersistInFlightRef.current) return
    nodePositionPersistInFlightRef.current = true

    void (async () => {
      while (pendingNodePositionBoardStateRef.current) {
        const pendingNodePosition = pendingNodePositionBoardStateRef.current
        const nextBoardState = pendingNodePosition.boardState
        pendingNodePositionBoardStateRef.current = null
        logWorkspaceBoardDebug("persist_node_position_start", {
          cardId: pendingNodePosition.cardId,
          x: pendingNodePosition.x,
          y: pendingNodePosition.y,
          ...summarizeWorkspaceBoardVisibility(nextBoardState),
        })
        const response = await saveWorkspaceNodePositionAction({
          boardState: nextBoardState,
          cardId: pendingNodePosition.cardId,
          x: pendingNodePosition.x,
          y: pendingNodePosition.y,
        })
        if (!("ok" in response)) {
          logWorkspaceBoardDebug("persist_node_position_error", {
            cardId: pendingNodePosition.cardId,
            error: response.error,
          })
          console.error(
            "[workspace-board] Unable to persist node position.",
            response.error
          )
          continue
        }

        logWorkspaceBoardDebug("persist_node_position_success", {
          cardId: pendingNodePosition.cardId,
          responseUpdatedAt: response.boardState.updatedAt,
          ...summarizeWorkspaceBoardVisibility(response.boardState),
        })
        lastPersistedBoardContentRef.current = nextBoardState
        setBoardState((previous) =>
          previous.updatedAt === response.boardState.updatedAt
            ? previous
            : {
                ...previous,
                updatedAt: response.boardState.updatedAt,
              }
        )
      }

      nodePositionPersistInFlightRef.current = false
    })()
  }, [lastPersistedBoardContentRef, setBoardState])

  return useCallback(
    (cardId: WorkspaceCardId, x: number, y: number) => {
      if (!allowEditing) return
      const currentBoardState = boardStateRef.current
      const nextBoardState = buildWorkspaceBoardStateWithNodePosition({
        boardState: currentBoardState,
        cardId,
        x,
        y,
      })
      if (nextBoardState === currentBoardState) return

      boardStateRef.current = nextBoardState
      pendingNodePositionBoardStateRef.current = {
        boardState: nextBoardState,
        cardId,
        x,
        y,
      }
      setBoardState(nextBoardState)
      flushNodePositionPersist()
    },
    [allowEditing, flushNodePositionPersist, setBoardState]
  )
}
