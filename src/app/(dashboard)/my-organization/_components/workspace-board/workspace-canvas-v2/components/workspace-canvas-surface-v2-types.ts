import type { WorkspaceBoardToggleContext } from "../../workspace-board-debug"
import type {
  WorkspaceBoardAcceleratorState,
  WorkspaceBoardState,
  WorkspaceCardId,
  WorkspaceCardSize,
  WorkspaceCommunicationsState,
  WorkspaceJourneyGuideState,
  WorkspaceOrganizationEditorData,
  WorkspaceSeedData,
  WorkspaceTrackerState,
} from "../../workspace-board-types"

export type WorkspaceCanvasSurfaceV2Props = {
  boardState: WorkspaceBoardState
  allowEditing: boolean
  presentationMode: boolean
  seed: WorkspaceSeedData
  organizationEditorData: WorkspaceOrganizationEditorData
  layoutFitRequestKey: number
  acceleratorFocusRequestKey: number
  focusCardRequest: {
    cardId: WorkspaceCardId
    requestKey: number
  } | null
  journeyGuideState: WorkspaceJourneyGuideState
  onSizeChange: (cardId: WorkspaceCardId, size: WorkspaceCardSize) => void
  onCommunicationsChange: (next: WorkspaceCommunicationsState) => void
  onTrackerChange: (next: WorkspaceTrackerState) => void
  onAcceleratorStateChange: (next: WorkspaceBoardAcceleratorState) => void
  onOpenAcceleratorStepNode: (stepId: string | null) => void
  onCloseAcceleratorStepNode: (source?: "dock" | "card" | "unknown") => void
  onTutorialPrevious: () => void
  onTutorialNext: () => void
  onTutorialShortcutOpened: () => void
  onFocusCard: (cardId: WorkspaceCardId) => void
  onPersistNodePosition: (cardId: WorkspaceCardId, x: number, y: number) => void
  onConnectCards: (source: WorkspaceCardId, target: WorkspaceCardId) => void
  onDisconnectConnection: (connectionId: string) => void
  onDisconnectAllConnections: () => void
  onToggleCardVisibility: (
    cardId: WorkspaceCardId,
    context?: WorkspaceBoardToggleContext,
  ) => void
}
