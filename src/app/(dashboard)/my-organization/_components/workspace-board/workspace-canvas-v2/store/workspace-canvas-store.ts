import { useSyncExternalStore } from "react"

import { WORKSPACE_CANVAS_EVENTS } from "../contracts/workspace-canvas-events"
import type {
  WorkspaceCanvasStoreAction,
  WorkspaceCanvasStoreDispatchResult,
  WorkspaceCanvasStoreState,
} from "../contracts/workspace-canvas-types"
import {
  logWorkspaceCanvasEvent,
  logWorkspaceCanvasWarning,
} from "../runtime/workspace-canvas-logger"

type WorkspaceCanvasStoreListener = () => void

function samePosition(
  left: WorkspaceCanvasStoreState["orgNodePosition"],
  right: WorkspaceCanvasStoreState["orgNodePosition"],
) {
  return left.x === right.x && left.y === right.y
}

function reduceWorkspaceCanvasStoreState(
  previous: WorkspaceCanvasStoreState,
  action: WorkspaceCanvasStoreAction,
): WorkspaceCanvasStoreState {
  if (action.type === "set_org_node_position") {
    if (samePosition(previous.orgNodePosition, action.position)) {
      return previous
    }
    return {
      ...previous,
      orgNodePosition: action.position,
      dragTick: previous.dragTick + (action.source === "drag" ? 1 : 0),
    }
  }

  if (samePosition(previous.orgNodePosition, action.position)) {
    return previous
  }

  return {
    ...previous,
    orgNodePosition: action.position,
  }
}

export function createWorkspaceCanvasStore(initialState: WorkspaceCanvasStoreState) {
  let state = initialState
  const listeners = new Set<WorkspaceCanvasStoreListener>()

  const emit = () => {
    for (const listener of listeners) {
      listener()
    }
  }

  return {
    getState() {
      return state
    },
    subscribe(listener: WorkspaceCanvasStoreListener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    dispatch(action: WorkspaceCanvasStoreAction): WorkspaceCanvasStoreDispatchResult {
      const next = reduceWorkspaceCanvasStoreState(state, action)
      if (next === state) {
        logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.STORE_ACTION_NOOP, {
          actionType: action.type,
        })
        return {
          changed: false,
          state,
        }
      }

      state = next
      logWorkspaceCanvasEvent(WORKSPACE_CANVAS_EVENTS.STORE_ACTION_DISPATCHED, {
        actionType: action.type,
      })
      if (action.type === "set_org_node_position" && action.source === "drag") {
        if (state.dragTick > 1000) {
          logWorkspaceCanvasWarning(WORKSPACE_CANVAS_EVENTS.GUARDRAIL_VIOLATION, {
            reason: "unexpected_drag_tick_growth",
            dragTick: state.dragTick,
          })
        }
      }
      emit()
      return {
        changed: true,
        state,
      }
    },
  }
}

export type WorkspaceCanvasStore = ReturnType<typeof createWorkspaceCanvasStore>

export function useWorkspaceCanvasStoreSelector<T>(
  store: WorkspaceCanvasStore,
  selector: (state: WorkspaceCanvasStoreState) => T,
) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  )
}
