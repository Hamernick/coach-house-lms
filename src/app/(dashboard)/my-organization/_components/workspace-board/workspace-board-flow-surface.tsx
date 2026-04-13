"use client"

import { memo } from "react"

import { WorkspaceCanvasSurfaceV2 } from "./workspace-canvas-v2"
import { WorkspaceRealtimeCursorsOverlay } from "./workspace-board-flow-surface-cursors"

import { type WorkspaceBoardToggleContext } from "./workspace-board-debug"
import type {
  WorkspaceCanvasCardFocusRequest,
  WorkspaceCanvasTutorialCompletionExitRequest,
} from "./workspace-canvas-v2/runtime/workspace-canvas-viewport-command"
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
  tutorialRestartRequestKey: number
  onInitialOnboardingSubmit: (form: FormData) => Promise<void>
  focusCardRequest: WorkspaceCanvasCardFocusRequest
  tutorialCompletionExitRequest: WorkspaceCanvasTutorialCompletionExitRequest
  journeyGuideState: WorkspaceJourneyGuideState
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceBoardState["tracker"]) => void
  onAcceleratorStateChange: (next: WorkspaceBoardAcceleratorState) => void
  onOpenAcceleratorStepNode: (stepId: string | null) => void
  onCloseAcceleratorStepNode: (source?: "dock" | "card" | "unknown") => void
  onTutorialPrevious: () => void
  onTutorialNext: () => void
  onTutorialRestart: () => void
  onTutorialShortcutOpened: () => void
  onFocusCard: (cardId: WorkspaceCardId) => void
  onOnboardingFlowChange: (next: WorkspaceBoardOnboardingFlowState) => void
  onPersistNodePosition: (cardId: WorkspaceCardId, x: number, y: number) => void
  onToggleCardVisibility: (
    cardId: WorkspaceCardId,
    context?: WorkspaceBoardToggleContext,
  ) => void
  onResetToBaseLayout: () => void
  onConnectCards: (source: WorkspaceCardId, target: WorkspaceCardId) => void
  onDisconnectConnection: (connectionId: string) => void
  onDisconnectAllConnections: () => void
  onResetDefaultConnections: () => void
  onCursorConnectionStateChange: (state: "connecting" | "live" | "degraded") => void
  onTutorialCompletionExitHandled: () => void
}

export const WorkspaceBoardFlowSurface = memo(function WorkspaceBoardFlowSurface(
  props: WorkspaceBoardFlowSurfaceProps,
) {
  return (
    <>
      <WorkspaceCanvasSurfaceV2
        boardState={props.boardState}
        allowEditing={props.allowEditing}
        presentationMode={props.presentationMode}
        seed={props.seed}
        organizationEditorData={props.organizationEditorData}
        layoutFitRequestKey={props.layoutFitRequestKey}
        acceleratorFocusRequestKey={props.acceleratorFocusRequestKey}
        tutorialRestartRequestKey={props.tutorialRestartRequestKey}
        onInitialOnboardingSubmit={props.onInitialOnboardingSubmit}
        focusCardRequest={props.focusCardRequest}
        tutorialCompletionExitRequest={props.tutorialCompletionExitRequest}
        journeyGuideState={props.journeyGuideState}
        onSizeChange={props.onSizeChange}
        onCommunicationsChange={props.onCommunicationsChange}
        onTrackerChange={props.onTrackerChange}
        onAcceleratorStateChange={props.onAcceleratorStateChange}
        onOpenAcceleratorStepNode={props.onOpenAcceleratorStepNode}
        onCloseAcceleratorStepNode={props.onCloseAcceleratorStepNode}
        onTutorialPrevious={props.onTutorialPrevious}
        onTutorialNext={props.onTutorialNext}
        onTutorialRestart={props.onTutorialRestart}
        onTutorialShortcutOpened={props.onTutorialShortcutOpened}
        onFocusCard={props.onFocusCard}
        onPersistNodePosition={props.onPersistNodePosition}
        onConnectCards={props.onConnectCards}
        onDisconnectConnection={props.onDisconnectConnection}
        onDisconnectAllConnections={props.onDisconnectAllConnections}
        onToggleCardVisibility={props.onToggleCardVisibility}
        onResetToBaseLayout={props.onResetToBaseLayout}
        onTutorialCompletionExitHandled={props.onTutorialCompletionExitHandled}
      />
      <WorkspaceRealtimeCursorsOverlay
        roomName={props.workspaceRoomName}
        username={props.seed.viewerName}
        suspendPublishing={props.presentationMode}
        onConnectionStateChange={props.onCursorConnectionStateChange}
      />
    </>
  )
})

WorkspaceBoardFlowSurface.displayName = "WorkspaceBoardFlowSurface"
