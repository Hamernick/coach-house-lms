"use client"

import { memo } from "react"

import { WorkspaceCanvasSurfaceV2 } from "./workspace-canvas-v2"

import { type WorkspaceBoardToggleContext } from "./workspace-board-debug"
import type {
  WorkspaceBoardAcceleratorState,
  WorkspaceBoardOnboardingFlowState,
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
  WorkspaceJourneyGuideState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
} from "./workspace-board-types"

export type WorkspaceBoardFlowSurfaceProps = {
  seed: WorkspaceSeedData
  organizationEditorData: WorkspaceOrganizationEditorData
  boardState: WorkspaceBoardState
  allowEditing: boolean
  presentationMode: boolean
  workspaceRoomName: string
  layoutFitRequestKey: number
  acceleratorFocusRequestKey: number
  focusCardRequest: {
    cardId: WorkspaceCardId
    requestKey: number
  } | null
  journeyGuideState: WorkspaceJourneyGuideState
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceBoardState["tracker"]) => void
  onAcceleratorStateChange: (next: WorkspaceBoardAcceleratorState) => void
  onOpenAcceleratorStepNode: (stepId: string | null) => void
  onCloseAcceleratorStepNode: (source?: "dock" | "card" | "unknown") => void
  onTutorialPrevious: () => void
  onTutorialNext: () => void
  onTutorialShortcutOpened: () => void
  onFocusCard: (cardId: WorkspaceCardId) => void
  onOnboardingFlowChange: (next: WorkspaceBoardOnboardingFlowState) => void
  onPersistNodePosition: (cardId: WorkspaceCardId, x: number, y: number) => void
  onToggleCardVisibility: (
    cardId: WorkspaceCardId,
    context?: WorkspaceBoardToggleContext,
  ) => void
  onConnectCards: (source: WorkspaceCardId, target: WorkspaceCardId) => void
  onDisconnectConnection: (connectionId: string) => void
  onDisconnectAllConnections: () => void
  onResetDefaultConnections: () => void
  onCursorConnectionStateChange: (state: "connecting" | "live" | "degraded") => void
}

export const WorkspaceBoardFlowSurface = memo(function WorkspaceBoardFlowSurface(
  props: WorkspaceBoardFlowSurfaceProps,
) {
  return (
    <WorkspaceCanvasSurfaceV2
      boardState={props.boardState}
      allowEditing={props.allowEditing}
      presentationMode={props.presentationMode}
      seed={props.seed}
      organizationEditorData={props.organizationEditorData}
      layoutFitRequestKey={props.layoutFitRequestKey}
      acceleratorFocusRequestKey={props.acceleratorFocusRequestKey}
      focusCardRequest={props.focusCardRequest}
      journeyGuideState={props.journeyGuideState}
      onSizeChange={props.onSizeChange}
      onCommunicationsChange={props.onCommunicationsChange}
      onTrackerChange={props.onTrackerChange}
      onAcceleratorStateChange={props.onAcceleratorStateChange}
      onOpenAcceleratorStepNode={props.onOpenAcceleratorStepNode}
      onCloseAcceleratorStepNode={props.onCloseAcceleratorStepNode}
      onTutorialPrevious={props.onTutorialPrevious}
      onTutorialNext={props.onTutorialNext}
      onTutorialShortcutOpened={props.onTutorialShortcutOpened}
      onFocusCard={props.onFocusCard}
      onPersistNodePosition={props.onPersistNodePosition}
      onConnectCards={props.onConnectCards}
      onDisconnectConnection={props.onDisconnectConnection}
      onDisconnectAllConnections={props.onDisconnectAllConnections}
      onToggleCardVisibility={props.onToggleCardVisibility}
    />
  )
})

WorkspaceBoardFlowSurface.displayName = "WorkspaceBoardFlowSurface"
