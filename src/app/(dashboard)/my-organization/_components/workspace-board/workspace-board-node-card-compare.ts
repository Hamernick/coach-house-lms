import type { WorkspaceBoardNodeData } from "./workspace-board-node"

type WorkspaceBoardCardProps = {
  data: WorkspaceBoardNodeData
}

export function workspaceBoardCardPropsEqual(
  previous: WorkspaceBoardCardProps,
  next: WorkspaceBoardCardProps
) {
  const prevData = previous.data
  const nextData = next.data

  if (prevData === nextData) return true
  if (prevData.cardId !== nextData.cardId) return false
  if (prevData.size !== nextData.size) return false
  if (prevData.canEdit !== nextData.canEdit) return false
  if (prevData.presentationMode !== nextData.presentationMode) return false
  if (prevData.isCanvasFullscreen !== nextData.isCanvasFullscreen) return false
  if (prevData.seed !== nextData.seed) return false
  if (prevData.isJourneyTarget !== nextData.isJourneyTarget) return false
  if (prevData.onSizeChange !== nextData.onSizeChange) return false
  if (prevData.onCommunicationsChange !== nextData.onCommunicationsChange)
    return false
  if (prevData.onTrackerChange !== nextData.onTrackerChange) return false
  if (prevData.onFocusCard !== nextData.onFocusCard) return false
  if (prevData.onToggleCanvasFullscreen !== nextData.onToggleCanvasFullscreen)
    return false
  if (prevData.organizationEditorData !== nextData.organizationEditorData)
    return false
  if (prevData.cardId === "organization-overview") {
    if (prevData.organizationShortcutItems !== nextData.organizationShortcutItems) {
      return false
    }
  }

  if (prevData.cardId === "communications") {
    if (prevData.communications !== nextData.communications) return false
  }

  if (prevData.cardId === "vault") {
    if (prevData.vaultViewMode !== nextData.vaultViewMode) return false
    if (prevData.onVaultViewModeChange !== nextData.onVaultViewModeChange)
      return false
  }

  if (prevData.cardId === "accelerator") {
    if (prevData.acceleratorState !== nextData.acceleratorState) return false
    if (
      prevData.onAcceleratorStateChange !== nextData.onAcceleratorStateChange
    ) {
      return false
    }
    if (
      prevData.acceleratorStepNodeVisible !== nextData.acceleratorStepNodeVisible
    ) {
      return false
    }
    if (
      prevData.onOpenAcceleratorStepNode !== nextData.onOpenAcceleratorStepNode
    ) {
      return false
    }
    if (
      prevData.onHideAcceleratorStepNode !== nextData.onHideAcceleratorStepNode
    ) {
      return false
    }
    if (
      prevData.onAcceleratorRuntimeChange !== nextData.onAcceleratorRuntimeChange
    ) {
      return false
    }
    if (
      prevData.onAcceleratorRuntimeActionsChange !==
      nextData.onAcceleratorRuntimeActionsChange
    ) {
      return false
    }
    if (
      prevData.acceleratorTutorialCallout !== nextData.acceleratorTutorialCallout
    ) {
      return false
    }
    if (
      prevData.onAcceleratorTutorialActionComplete !==
      nextData.onAcceleratorTutorialActionComplete
    ) {
      return false
    }
    if (prevData.journeyGuideState !== nextData.journeyGuideState) return false
  }

  return true
}
