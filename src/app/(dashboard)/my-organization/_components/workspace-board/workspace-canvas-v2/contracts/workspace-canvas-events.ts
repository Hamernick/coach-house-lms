export const WORKSPACE_CANVAS_EVENTS = {
  CANVAS_MOUNT: "canvas_mount",
  CANVAS_RENDER_CYCLE: "canvas_render_cycle",
  CAMERA_INITIAL_FIT: "camera_initial_fit",
  CAMERA_LAYOUT_FIT_REQUEST: "camera_layout_fit_request",
  CAMERA_ACCELERATOR_FOCUS_REQUEST: "camera_accelerator_focus_request",
  CONNECTION_ACCEPTED: "connection_accepted",
  CONNECTION_REJECTED: "connection_rejected",
  CONNECTION_REMOVED: "connection_removed",
  CONNECTION_DROPPED_INVALID: "connection_dropped_invalid",
  STORE_ACTION_DISPATCHED: "store_action_dispatched",
  STORE_ACTION_NOOP: "store_action_noop",
  ORG_NODE_DRAG_STOP: "org_node_drag_stop",
  REACTFLOW_ERROR: "reactflow_error",
  CARD_RENDER_ERROR: "card_render_error",
  GUARDRAIL_VIOLATION: "guardrail_violation",
} as const

export type WorkspaceCanvasEventName =
  (typeof WORKSPACE_CANVAS_EVENTS)[keyof typeof WORKSPACE_CANVAS_EVENTS]
