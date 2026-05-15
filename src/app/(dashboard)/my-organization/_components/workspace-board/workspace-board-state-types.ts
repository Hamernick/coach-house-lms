import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"

import type { WorkspaceCommunicationsState } from "./workspace-board-communications-types"
import type {
  WorkspaceAutoLayoutMode,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceLayoutPreset,
} from "./workspace-board-constants"
import type { WorkspaceTrackerState } from "./workspace-board-tracker-types"

export type WorkspaceNodeState = {
  id: WorkspaceCardId
  x: number
  y: number
  size: WorkspaceCardSize
}

export type WorkspaceConnectionState = {
  id: string
  source: WorkspaceCardId
  target: WorkspaceCardId
}

export type WorkspaceBoardAcceleratorState = {
  activeStepId: string | null
  completedStepIds: string[]
}

export const WORKSPACE_ONBOARDING_STAGES = [2, 3, 4] as const

export type WorkspaceOnboardingStage = (typeof WORKSPACE_ONBOARDING_STAGES)[number]

export type WorkspaceBoardOnboardingFlowState = {
  active: boolean
  stage: WorkspaceOnboardingStage
  tutorialStepIndex: number
  openedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
  acknowledgedTutorialStepIds: WorkspaceCanvasTutorialStepId[]
  completedStages: WorkspaceOnboardingStage[]
  updatedAt: string
}

export type WorkspaceBoardVisibilityState = {
  allCardsHiddenExplicitly: boolean
}

export type WorkspaceBoardAcceleratorUiState = {
  stepOpen: boolean
  lastStepId: string | null
}

export type WorkspaceBoardState = {
  version: 1
  preset: WorkspaceLayoutPreset
  autoLayoutMode: WorkspaceAutoLayoutMode
  nodes: WorkspaceNodeState[]
  connections: WorkspaceConnectionState[]
  communications: WorkspaceCommunicationsState
  tracker: WorkspaceTrackerState
  accelerator: WorkspaceBoardAcceleratorState
  acceleratorUi?: WorkspaceBoardAcceleratorUiState
  onboardingFlow: WorkspaceBoardOnboardingFlowState
  hiddenCardIds: WorkspaceCardId[]
  visibility?: WorkspaceBoardVisibilityState
  updatedAt: string
}
