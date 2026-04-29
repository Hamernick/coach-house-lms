"use client"

import type {
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
} from "@/features/workspace-accelerator-card"

import type { WorkspaceBoardNodeData } from "./workspace-board-node-types"
import { WorkspaceBoardAcceleratorHeaderSummary } from "./workspace-board-accelerator-header-summary"
import { WorkspaceBoardAcceleratorTitleIcon } from "./workspace-board-accelerator-title-icon"
import { WorkspaceBoardLazyAcceleratorHeaderPicker } from "./workspace-board-accelerator-lazy"

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
  if (!acceleratorRuntimeSnapshot || !acceleratorRuntimeActions) {
    return undefined
  }

  return (
    <WorkspaceBoardLazyAcceleratorHeaderPicker
      lessonGroupOptions={acceleratorRuntimeSnapshot.lessonGroupOptions ?? []}
      selectedLessonGroupKey={
        acceleratorRuntimeSnapshot.selectedLessonGroupKey ?? ""
      }
      viewerOpen={acceleratorRuntimeSnapshot.isModuleViewerOpen === true}
      tutorialCallout={
        acceleratorTutorialCallout?.focus === "picker"
          ? acceleratorTutorialCallout
          : null
      }
      tutorialInteractionPolicy={acceleratorTutorialInteractionPolicy ?? null}
      onLessonGroupChange={acceleratorRuntimeActions.selectLessonGroup}
    />
  )
}

export function resolveAcceleratorHeaderDetails({
  acceleratorRuntimeSnapshot,
}: {
  acceleratorRuntimeSnapshot: WorkspaceAcceleratorCardRuntimeSnapshot | null
}) {
  if (!acceleratorRuntimeSnapshot) return undefined

  return (
    <WorkspaceBoardAcceleratorHeaderSummary
      moduleCount={acceleratorRuntimeSnapshot.checklistModuleCount ?? 0}
      stepCount={acceleratorRuntimeSnapshot.filteredStepCount ?? 0}
    />
  )
}

export function renderAcceleratorTitleIcon() {
  return <WorkspaceBoardAcceleratorTitleIcon />
}
