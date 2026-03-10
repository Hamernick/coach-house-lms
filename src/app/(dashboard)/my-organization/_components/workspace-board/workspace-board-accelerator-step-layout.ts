import type { WorkspaceAutoLayoutMode } from "./workspace-board-types"

export const ACCELERATOR_STEP_SIDE_SOURCE_HANDLE_ID =
  "accelerator-step-source-right"
export const ACCELERATOR_STEP_TOP_SOURCE_HANDLE_ID =
  "accelerator-step-source-top"
export const ACCELERATOR_STEP_SIDE_TARGET_HANDLE_ID =
  "accelerator-step-target-left"
export const ACCELERATOR_STEP_BOTTOM_TARGET_HANDLE_ID =
  "accelerator-step-target-bottom"

export type WorkspaceAcceleratorStepPlacement = "right" | "above"

export function resolveWorkspaceAcceleratorStepPlacement(
  autoLayoutMode: WorkspaceAutoLayoutMode,
): WorkspaceAcceleratorStepPlacement {
  return autoLayoutMode === "timeline" ? "above" : "right"
}

export function resolveWorkspaceAcceleratorStepEdgeHandles(
  autoLayoutMode: WorkspaceAutoLayoutMode,
) {
  const placement = resolveWorkspaceAcceleratorStepPlacement(autoLayoutMode)
  if (placement === "above") {
    return {
      sourceHandle: ACCELERATOR_STEP_TOP_SOURCE_HANDLE_ID,
      targetHandle: ACCELERATOR_STEP_BOTTOM_TARGET_HANDLE_ID,
    }
  }

  return {
    sourceHandle: ACCELERATOR_STEP_SIDE_SOURCE_HANDLE_ID,
    targetHandle: ACCELERATOR_STEP_SIDE_TARGET_HANDLE_ID,
  }
}
