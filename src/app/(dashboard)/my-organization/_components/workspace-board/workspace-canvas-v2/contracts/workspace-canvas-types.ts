export type WorkspaceCanvasPosition = {
  x: number
  y: number
}

export type WorkspaceCanvasStoreState = {
  orgNodePosition: WorkspaceCanvasPosition
  dragTick: number
}

export type WorkspaceCanvasStoreAction =
  | {
      type: "set_org_node_position"
      position: WorkspaceCanvasPosition
      source: "hydrate" | "drag"
    }
  | {
      type: "reset_org_node_position"
      position: WorkspaceCanvasPosition
    }

export type WorkspaceCanvasStoreDispatchResult = {
  changed: boolean
  state: WorkspaceCanvasStoreState
}
