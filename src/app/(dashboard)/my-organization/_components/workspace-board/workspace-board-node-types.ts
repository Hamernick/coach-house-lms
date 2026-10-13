import type {
  WorkspaceAcceleratorCardRuntimeActions,
  WorkspaceAcceleratorCardRuntimeSnapshot,
} from "@/features/workspace-accelerator-card"
import type { WorkspaceCardShortcutItemModel } from "./workspace-canvas-v2/shortcuts/workspace-card-shortcut-model"
import type {
  WorkspaceAcceleratorStepPlacement,
} from "./workspace-board-accelerator-step-layout"
import type {
  WorkspaceBoardAcceleratorState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
  WorkspaceJourneyGuideState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceTrackerState,
  WorkspaceVaultViewMode,
} from "./workspace-board-types"

export type WorkspaceBoardNodeData = {
  cardId: WorkspaceCardId
  size: WorkspaceCardSize
  canEdit: boolean
  presentationMode: boolean
  communications: WorkspaceCommunicationsState
  tracker: WorkspaceTrackerState
  vaultViewMode: WorkspaceVaultViewMode
  acceleratorState: WorkspaceBoardAcceleratorState
  seed: WorkspaceSeedData
  organizationEditorData?: WorkspaceOrganizationEditorData
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceTrackerState) => void
  onVaultViewModeChange: (next: WorkspaceVaultViewMode) => void
  onAcceleratorStateChange: (next: WorkspaceBoardAcceleratorState) => void
  acceleratorStepNodeVisible?: boolean
  onOpenAcceleratorStepNode?: (stepId?: string | null) => void
  onHideAcceleratorStepNode?: () => void
  onAcceleratorRuntimeChange?: (
    snapshot: WorkspaceAcceleratorCardRuntimeSnapshot
  ) => void
  onAcceleratorRuntimeActionsChange?: (
    actions: WorkspaceAcceleratorCardRuntimeActions
  ) => void
  journeyGuideState?: WorkspaceJourneyGuideState | null
  isJourneyTarget?: boolean
  onFocusCard?: (cardId: WorkspaceCardId) => void
  isCanvasFullscreen?: boolean
  onToggleCanvasFullscreen?: (cardId: WorkspaceCardId) => void
  organizationShortcutItems?: WorkspaceCardShortcutItemModel[]
}

export type WorkspaceBoardAcceleratorStepNodeData = {
  step: WorkspaceAcceleratorCardRuntimeSnapshot["currentStep"]
  placement: WorkspaceAcceleratorStepPlacement
  stepIndex: number
  stepTotal: number
  canGoPrevious: boolean
  canGoNext: boolean
  completed: boolean
  moduleCompleted: boolean
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
  onClose: () => void
  presentationMode: boolean
}
