"use client"

import { useMemo } from "react"

import { MyOrganizationEditorView } from "../my-organization-editor-view"
import { WorkspaceBoardCard, type WorkspaceBoardNodeData } from "./workspace-board-node"
import { cn } from "@/lib/utils"
import type {
  WorkspaceBoardAcceleratorState,
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
  WorkspaceOrganizationEditorData,
  WorkspaceTrackerState,
  WorkspaceVaultViewMode,
} from "./workspace-board-types"

type UseWorkspaceBoardFullscreenCardDataArgs = {
  fullscreenCardId: WorkspaceCardId | null
  boardState: WorkspaceBoardState
  allowEditing: boolean
  presentationMode: boolean
  vaultViewMode: WorkspaceVaultViewMode
  seed: WorkspaceBoardNodeData["seed"]
  organizationEditorData: WorkspaceOrganizationEditorData
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceTrackerState) => void
  onVaultViewModeChange: (next: WorkspaceVaultViewMode) => void
  onAcceleratorStateChange: (next: WorkspaceBoardAcceleratorState) => void
  acceleratorStepNodeVisible: boolean
  onOpenAcceleratorStepNode: () => void
  onHideAcceleratorStepNode: () => void
  onAcceleratorRuntimeChange: NonNullable<WorkspaceBoardNodeData["onAcceleratorRuntimeChange"]>
  onAcceleratorRuntimeActionsChange: NonNullable<WorkspaceBoardNodeData["onAcceleratorRuntimeActionsChange"]>
  onToggleCanvasFullscreen: (cardId: WorkspaceCardId) => void
}

export function useWorkspaceBoardFullscreenCardData({
  fullscreenCardId,
  boardState,
  allowEditing,
  presentationMode,
  vaultViewMode,
  seed,
  organizationEditorData,
  onSizeChange,
  onCommunicationsChange,
  onTrackerChange,
  onVaultViewModeChange,
  onAcceleratorStateChange,
  acceleratorStepNodeVisible,
  onOpenAcceleratorStepNode,
  onHideAcceleratorStepNode,
  onAcceleratorRuntimeChange,
  onAcceleratorRuntimeActionsChange,
  onToggleCanvasFullscreen,
}: UseWorkspaceBoardFullscreenCardDataArgs): WorkspaceBoardNodeData | null {
  return useMemo(() => {
    if (!fullscreenCardId) return null
    const node = boardState.nodes.find((entry) => entry.id === fullscreenCardId)
    if (!node) return null

    return {
      cardId: node.id,
      size: "md",
      canEdit: allowEditing,
      presentationMode,
      communications: boardState.communications,
      tracker: boardState.tracker,
      vaultViewMode,
      acceleratorState: boardState.accelerator,
      seed,
      organizationEditorData,
      onSizeChange,
      onCommunicationsChange,
      onTrackerChange,
      onVaultViewModeChange,
      onAcceleratorStateChange,
      acceleratorStepNodeVisible,
      onOpenAcceleratorStepNode,
      onHideAcceleratorStepNode,
      onAcceleratorRuntimeChange,
      onAcceleratorRuntimeActionsChange,
      isCanvasFullscreen: true,
      onToggleCanvasFullscreen,
    }
  }, [
    acceleratorStepNodeVisible,
    allowEditing,
    boardState.communications,
    boardState.accelerator,
    boardState.nodes,
    boardState.tracker,
    vaultViewMode,
    fullscreenCardId,
    onAcceleratorRuntimeActionsChange,
    onAcceleratorRuntimeChange,
    onHideAcceleratorStepNode,
    onOpenAcceleratorStepNode,
    onToggleCanvasFullscreen,
    onCommunicationsChange,
    onSizeChange,
    onTrackerChange,
    onVaultViewModeChange,
    onAcceleratorStateChange,
    presentationMode,
    seed,
    organizationEditorData,
  ])
}

export function WorkspaceBoardFlowSurfaceFullscreenLayer({
  fullscreenCardId,
  organizationEditorData,
  fullscreenCardData,
  onClose,
}: {
  fullscreenCardId: WorkspaceCardId | null
  organizationEditorData: WorkspaceOrganizationEditorData
  fullscreenCardData: WorkspaceBoardNodeData | null
  onClose: () => void
}) {
  if (fullscreenCardId === "organization-overview" && organizationEditorData) {
    return (
      <div
        className="absolute inset-0 z-30 bg-background"
        role="region"
        aria-label="Fullscreen organization editor"
      >
        <MyOrganizationEditorView
          embedded
          initialProfile={organizationEditorData.initialProfile}
          people={organizationEditorData.people}
          programs={organizationEditorData.programs}
          initialTab="company"
          canEdit={organizationEditorData.canEdit}
          onClose={onClose}
        />
      </div>
    )
  }

  if (!fullscreenCardData) return null

  return (
    <div
      className="absolute inset-0 z-30 bg-background"
      role="region"
      aria-label="Fullscreen workspace card"
    >
      <div
        className={cn(
          "h-full w-full",
          fullscreenCardData.cardId === "roadmap" &&
            "mx-auto max-w-[64rem] px-3 py-3 sm:px-6 sm:py-5",
        )}
      >
        <WorkspaceBoardCard data={fullscreenCardData} />
      </div>
    </div>
  )
}
