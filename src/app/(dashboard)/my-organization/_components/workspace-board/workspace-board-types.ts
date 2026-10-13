import type {
  OrgProgram,
  OrgProfile,
} from "@/components/organization/org-profile-card/types"
import type { OnboardingFlowDefaults } from "@/components/onboarding/onboarding-dialog/types"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card"
import type { WorkspaceCanvasTutorialStepId } from "@/features/workspace-canvas-tutorial"
import type { OrganizationMemberRole } from "@/lib/organization/active-org"
import type { ReactNode } from "react"

import type {
  FormationSummary,
  MyOrganizationCalendarView,
} from "../../_lib/types"

export const WORKSPACE_CARD_IDS = [
  "organization-overview",
  "programs",
  "accelerator",
  "brand-kit",
  "economic-engine",
  "calendar",
  "communications",
  "deck",
  "vault",
  "atlas",
] as const

export type WorkspaceCardId = (typeof WORKSPACE_CARD_IDS)[number]

export const WORKSPACE_LAYOUT_PRESETS = [
  "balanced",
  "calendar-focused",
  "communications-focused",
] as const

export type WorkspaceLayoutPreset = (typeof WORKSPACE_LAYOUT_PRESETS)[number]

export const WORKSPACE_AUTO_LAYOUT_MODES = [
  "dagre-tree",
  "timeline",
] as const

export type WorkspaceAutoLayoutMode =
  (typeof WORKSPACE_AUTO_LAYOUT_MODES)[number]

export const WORKSPACE_JOURNEY_STAGES = [
  "foundation",
  "materials",
  "accelerator-entry",
  "operating",
] as const

export type WorkspaceJourneyStage =
  (typeof WORKSPACE_JOURNEY_STAGES)[number]

export type WorkspaceLayoutPresetMeta = {
  label: string
  shortLabel: string
  algorithmLabel: string
}

export const WORKSPACE_LAYOUT_PRESET_META: Record<
  WorkspaceLayoutPreset,
  WorkspaceLayoutPresetMeta
> = {
  balanced: {
    label: "Dashboard",
    shortLabel: "Dashboard",
    algorithmLabel: "Semantic grid",
  },
  "calendar-focused": {
    label: "Cadence",
    shortLabel: "Cadence",
    algorithmLabel: "Semantic grid · calendar focus",
  },
  "communications-focused": {
    label: "Narrative",
    shortLabel: "Narrative",
    algorithmLabel: "Semantic grid · communications focus",
  },
}

export const WORKSPACE_CARD_SIZES = ["sm", "md", "lg"] as const

export type WorkspaceCardSize = (typeof WORKSPACE_CARD_SIZES)[number]

export const WORKSPACE_VAULT_VIEW_MODES = [
  "dropzone",
  "search",
  "mini-viewer",
] as const
export type WorkspaceVaultViewMode = (typeof WORKSPACE_VAULT_VIEW_MODES)[number]

export type WorkspaceDurationUnit = "hours" | "days" | "months"
export type WorkspaceCollaborationInviteStatus =
  | "active"
  | "expired"
  | "revoked"

export const WORKSPACE_COMMUNICATION_CHANNELS = [
  "social",
  "email",
  "blog",
] as const
export type WorkspaceCommunicationChannel =
  (typeof WORKSPACE_COMMUNICATION_CHANNELS)[number]

export const WORKSPACE_COMMUNICATION_MEDIA_MODES = [
  "text",
  "image",
  "video",
] as const
export type WorkspaceCommunicationMediaMode =
  (typeof WORKSPACE_COMMUNICATION_MEDIA_MODES)[number]

export type WorkspaceCommunicationActivityStatus = "scheduled" | "posted"

export type WorkspaceCommunicationPostStatus =
  WorkspaceCommunicationActivityStatus

export type WorkspaceCommunicationPost = {
  id: string
  channel: WorkspaceCommunicationChannel
  mediaMode: WorkspaceCommunicationMediaMode
  content: string
  status: WorkspaceCommunicationPostStatus
  scheduledFor: string
  postedAt: string | null
  createdBy: string
  createdAt: string
}

export type WorkspaceCommunicationChannelMap<TValue> = {
  social: TValue
  email: TValue
  blog: TValue
}

export type WorkspaceCommunicationChannelConnection = {
  connected: boolean
  provider: string | null
  connectedAt: string | null
  connectedBy: string | null
}

export type WorkspaceCommunicationActivity = {
  status: WorkspaceCommunicationActivityStatus
  channel: WorkspaceCommunicationChannel
  timestamp: string
}

export const WORKSPACE_ACTIVITY_TYPES = [
  "calendar_meeting",
  "calendar_board_meeting",
  "calendar_deadline",
  "calendar_milestone",
  "calendar_other",
  "accelerator",
  "social_scheduled",
  "social_posted",
  "donation",
] as const
export type WorkspaceActivityType = (typeof WORKSPACE_ACTIVITY_TYPES)[number]

export type WorkspaceActivitySource =
  | "calendar"
  | "accelerator"
  | "communications"
  | "donations"

export type WorkspaceActivityStatus = "scheduled" | "completed"

export type WorkspaceActivityRecord = {
  id: string
  source: WorkspaceActivitySource
  type: WorkspaceActivityType
  status: WorkspaceActivityStatus
  title: string
  timestamp: string
  description?: string | null
  href?: string | null
  metadata?: Record<string, string | number | boolean | null>
}

export type WorkspaceCommunicationsState = {
  channel: WorkspaceCommunicationChannel
  mediaMode: WorkspaceCommunicationMediaMode
  copy: string
  scheduledFor: string
  connectedChannels: WorkspaceCommunicationChannelMap<boolean>
  channelConnections: WorkspaceCommunicationChannelMap<WorkspaceCommunicationChannelConnection>
  activityByDay: Record<string, WorkspaceCommunicationActivity>
}

export type WorkspaceTrackerTab = "accelerator" | "objectives"
export type WorkspaceTrackerTicketStatus = "todo" | "in_progress" | "done"
export type WorkspaceTrackerTicketPriority =
  | "low"
  | "normal"
  | "high"
  | "critical"

export type WorkspaceTrackerCategory = {
  id: string
  title: string
  archived: boolean
  createdAt: string
}

export type WorkspaceTrackerTicket = {
  id: string
  categoryId: string
  title: string
  description: string | null
  status: WorkspaceTrackerTicketStatus
  priority: WorkspaceTrackerTicketPriority
  dueAt: string | null
  assigneeUserIds: string[]
  archived: boolean
  createdAt: string
  updatedAt: string
}

export type WorkspaceTrackerState = {
  tab: WorkspaceTrackerTab
  archivedAcceleratorGroups: string[]
  categories: WorkspaceTrackerCategory[]
  tickets: WorkspaceTrackerTicket[]
}

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

export type WorkspaceCollaborationInvite = {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
  createdBy: string
  createdAt: string
  expiresAt: string
  revokedAt: string | null
  durationValue: number
  durationUnit: WorkspaceDurationUnit
}

export type WorkspaceMemberOption = {
  userId: string
  name: string | null
  email: string | null
  avatarUrl: string | null
  role: OrganizationMemberRole
  isOwner: boolean
}

export type WorkspaceSeedData = {
  orgId: string
  viewerId: string
  viewerName: string
  viewerAvatarUrl: string | null
  presentationMode: boolean
  role: OrganizationMemberRole
  canEdit: boolean
  canInviteCollaborators: boolean
  hasAcceleratorAccess: boolean
  organizationTitle: string
  organizationSubtitle: string
  fundingGoalCents: number
  raisedCents: number
  programsCount: number
  peopleCount: number
  journeyReadiness: WorkspaceJourneyReadiness
  initialProfile: OrgProfile
  formationSummary: FormationSummary
  acceleratorTimeline?: WorkspaceAcceleratorCardStep[]
  activityFeed: WorkspaceActivityRecord[]
  calendar: MyOrganizationCalendarView
  collaborationInvites: WorkspaceCollaborationInvite[]
  members: WorkspaceMemberOption[]
  boardState: WorkspaceBoardState
  initialOnboarding: {
    required: boolean
    defaults: OnboardingFlowDefaults
  }
}

export type WorkspaceOrganizationEditorData = {
  initialProfile: OrgProfile
  people: OrgPersonWithImage[]
  programs: OrgProgram[]
  canEdit: boolean
}

export type WorkspaceJourneyReadiness = {
  organizationProfileComplete: boolean
  teammateCount: number
  workspaceDocumentCount: number
  acceleratorStarted: boolean
  acceleratorCompletedStepCount: number
}

export type WorkspaceJourneyGuideAction =
  | {
      kind: "focus-card"
      label: string
      cardId: WorkspaceCardId
    }
  | {
      kind: "open-step-node"
      label: string
    }
  | {
      kind: "open-accelerator"
      label: string
      href: string
    }

export type WorkspaceJourneyGuideState = {
  stage: WorkspaceJourneyStage
  title: string
  description: string
  checklist: [string, string, string]
  tone: "guide" | "operating"
  targetCardId: WorkspaceCardId
  primaryAction: WorkspaceJourneyGuideAction
  accentLabel: string
}

export type WorkspaceCardFrameProps = {
  cardId: WorkspaceCardId
  title: string
  subtitle: string
  tone?: "default" | "accelerator"
  titleIcon?: ReactNode
  titleBadge?: ReactNode
  headerMeta?: ReactNode
  headerAction?: ReactNode
  hideTitle?: boolean
  hideSubtitle?: boolean
  size: WorkspaceCardSize
  presentationMode: boolean
  onSizeChange: (nextSize: WorkspaceCardSize) => void
  fullHref: string
  canEdit: boolean
  editorHref?: string | null
  menuActions?: WorkspaceCardOverflowAction[]
  contentClassName?: string
  isCanvasFullscreen?: boolean
  onToggleCanvasFullscreen?: () => void
  fullscreenControlMode?: "overflow" | "inline"
  children: ReactNode
}

export type WorkspaceCardOverflowAction =
  | {
      id: string
      label: string
      icon?: ReactNode
      active?: boolean
      disabled?: boolean
      kind: "callback"
      onSelect: () => void
    }
  | {
      id: string
      label: string
      icon?: ReactNode
      active?: boolean
      disabled?: boolean
      kind: "link"
      href: string
      target?: "_self" | "_blank"
      download?: boolean
    }
