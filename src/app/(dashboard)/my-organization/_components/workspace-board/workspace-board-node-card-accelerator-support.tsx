"use client"

import type {
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
} from "@/features/workspace-accelerator-card"

import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import { WorkspaceBoardAcceleratorTitleIcon } from "./workspace-board-accelerator-title-icon"

export function resolveAcceleratorHeaderMeta({
  acceleratorRuntimeActions,
  acceleratorRuntimeSnapshot,
  acceleratorTutorialCallout,
  acceleratorTutorialInteractionPolicy,
}: {
  acceleratorRuntimeActions: WorkspaceAcceleratorCardRuntimeActions | null
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
  acceleratorTutorialCallout: WorkspaceBoardNodeData["acceleratorTutorialCallout"]
  acceleratorTutorialInteractionPolicy: WorkspaceBoardNodeData["acceleratorTutorialInteractionPolicy"]
}) {
  void acceleratorRuntimeActions
  void acceleratorRuntimeSnapshot
  void acceleratorTutorialCallout
  void acceleratorTutorialInteractionPolicy
  return undefined
}

export function resolveAcceleratorHeaderDetails({
  acceleratorRuntimeSnapshot,
}: {
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
}) {
  void acceleratorRuntimeSnapshot
  return undefined
}

export function renderAcceleratorTitleIcon() {
  return <WorkspaceBoardAcceleratorTitleIcon />
}
