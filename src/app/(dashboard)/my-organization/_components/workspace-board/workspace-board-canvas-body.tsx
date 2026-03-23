"use client"

import { useEffect } from "react"

import { useAppShellRightRailControls } from "@/components/app-shell/right-rail-controls"
import {
  clampWorkspaceCanvasTutorialStepIndex,
  resolveWorkspaceCanvasTutorialCallout,
} from "@/features/workspace-canvas-tutorial"
import type {
  WorkspaceCanvasCardFocusRequest,
  WorkspaceCanvasTutorialCompletionExitRequest,
} from "./workspace-canvas-v2/runtime/workspace-canvas-viewport-command"

import { WorkspaceBoardFlowSurface } from "./workspace-board-flow-surface"
import { WorkspaceBoardInitialOnboardingSurface } from "./workspace-board-initial-onboarding-surface"
import { WorkspaceBoardRightRail } from "./workspace-board-right-rail"
import { resolveWorkspaceJourneyGuideState } from "./workspace-board-journey"
import { shouldAutoOpenRightRailForWorkspaceTutorialCallout } from "./workspace-board-tutorial-right-rail"
import type {
  WorkspaceAutoLayoutMode,
  WorkspaceBoardAcceleratorState,
  WorkspaceBoardOnboardingFlowState,
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCollaborationInvite,
  WorkspaceCommunicationsState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceTrackerState,
} from "./workspace-board-types"
import type { WorkspaceBoardToggleContext } from "./workspace-board-debug"

export function WorkspaceBoardCanvasBody({
  initialOnboardingActive,
  seed,
  allowEditing,
  boardState,
  invites,
  cursorConnectionState,
  rightRailCurrentUser,
  layoutFitRequestKey,
  acceleratorFocusRequestKey,
  tutorialRestartRequestKey,
  focusCardRequest,
  tutorialCompletionExitRequest,
  journeyGuideState,
  organizationEditorData,
  onInitialOnboardingSubmit,
  onAutoLayoutModeChange,
  onInvitesChange,
  onSizeChange,
  onCommunicationsChange,
  onTrackerChange,
  onAcceleratorStateChange,
  onOpenAcceleratorStepNode,
  onCloseAcceleratorStepNode,
  onTutorialPrevious,
  onTutorialNext,
  onTutorialRestart,
  onTutorialShortcutOpened,
  onFocusCard,
  onOnboardingFlowChange,
  onPersistNodePosition,
  onToggleCardVisibility,
  onResetToBaseLayout,
  onConnectCards,
  onDisconnectConnection,
  onDisconnectAllConnections,
  onResetDefaultConnections,
  onCursorConnectionStateChange,
  onTutorialCompletionExitHandled,
}: {
  initialOnboardingActive: boolean
  seed: WorkspaceSeedData
  allowEditing: boolean
  boardState: WorkspaceBoardState
  invites: WorkspaceCollaborationInvite[]
  cursorConnectionState: "connecting" | "live" | "degraded"
  rightRailCurrentUser: {
    id: string
    name: string
    avatarUrl: string | null
  }
  layoutFitRequestKey: number
  acceleratorFocusRequestKey: number
  tutorialRestartRequestKey: number
  focusCardRequest: WorkspaceCanvasCardFocusRequest
  tutorialCompletionExitRequest: WorkspaceCanvasTutorialCompletionExitRequest
  journeyGuideState: ReturnType<typeof resolveWorkspaceJourneyGuideState>
  organizationEditorData: WorkspaceOrganizationEditorData
  onInitialOnboardingSubmit: (form: FormData) => Promise<void>
  onAutoLayoutModeChange: (mode: WorkspaceAutoLayoutMode) => void
  onInvitesChange: (nextInvites: WorkspaceCollaborationInvite[]) => void
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceTrackerState) => void
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
}) {
  const rightRailControls = useAppShellRightRailControls()
  const tutorialActive = boardState.onboardingFlow.active
  const tutorialStepIndex = clampWorkspaceCanvasTutorialStepIndex(
    boardState.onboardingFlow.tutorialStepIndex,
  )
  const tutorialCallout = tutorialActive
    ? resolveWorkspaceCanvasTutorialCallout(
        tutorialStepIndex,
        boardState.onboardingFlow.openedTutorialStepIds,
      )
    : null

  useEffect(() => {
    if (!shouldAutoOpenRightRailForWorkspaceTutorialCallout(tutorialCallout)) {
      return
    }
    rightRailControls?.setRightOpenAuto(true)
  }, [rightRailControls, tutorialCallout])

  if (initialOnboardingActive) {
    return (
      <WorkspaceBoardInitialOnboardingSurface
        seed={seed}
        onSubmit={onInitialOnboardingSubmit}
      />
    )
  }

  return (
    <>
      <WorkspaceBoardRightRail
        autoLayoutMode={boardState.autoLayoutMode}
        canEdit={allowEditing}
        canInvite={seed.canInviteCollaborators}
        members={seed.members}
        invites={invites}
        realtimeState={cursorConnectionState}
        currentUser={rightRailCurrentUser}
        tutorialTeamAccessCallout={
          tutorialCallout?.kind === "team-access"
            ? {
                title: tutorialCallout.label,
                instruction: tutorialCallout.instruction,
              }
            : null
        }
        onAutoLayoutModeChange={onAutoLayoutModeChange}
        onInvitesChange={onInvitesChange}
      />

      <div className="relative flex min-h-0 flex-1">
        <WorkspaceBoardFlowSurface
          seed={seed}
          organizationEditorData={organizationEditorData}
          boardState={boardState}
          allowEditing={allowEditing}
          presentationMode={seed.presentationMode}
          workspaceRoomName={`org:${seed.orgId}:workspace`}
          layoutFitRequestKey={layoutFitRequestKey}
          acceleratorFocusRequestKey={acceleratorFocusRequestKey}
          tutorialRestartRequestKey={tutorialRestartRequestKey}
          onInitialOnboardingSubmit={onInitialOnboardingSubmit}
          focusCardRequest={focusCardRequest}
          tutorialCompletionExitRequest={tutorialCompletionExitRequest}
          journeyGuideState={journeyGuideState}
          onSizeChange={onSizeChange}
          onCommunicationsChange={onCommunicationsChange}
          onTrackerChange={onTrackerChange}
          onAcceleratorStateChange={onAcceleratorStateChange}
          onOpenAcceleratorStepNode={onOpenAcceleratorStepNode}
          onCloseAcceleratorStepNode={onCloseAcceleratorStepNode}
          onTutorialPrevious={onTutorialPrevious}
          onTutorialNext={onTutorialNext}
          onTutorialRestart={onTutorialRestart}
          onTutorialShortcutOpened={onTutorialShortcutOpened}
          onFocusCard={onFocusCard}
          onOnboardingFlowChange={onOnboardingFlowChange}
          onPersistNodePosition={onPersistNodePosition}
          onToggleCardVisibility={onToggleCardVisibility}
          onResetToBaseLayout={onResetToBaseLayout}
          onConnectCards={onConnectCards}
          onDisconnectConnection={onDisconnectConnection}
          onDisconnectAllConnections={onDisconnectAllConnections}
          onResetDefaultConnections={onResetDefaultConnections}
          onCursorConnectionStateChange={onCursorConnectionStateChange}
          onTutorialCompletionExitHandled={onTutorialCompletionExitHandled}
        />
      </div>
    </>
  )
}
