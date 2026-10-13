import type { OrgProgram, OrgProfile } from "@/components/organization/org-profile-card/types"
import type { OrgPersonWithImage } from "@/components/people/supporters-showcase"
import type { WorkspaceAcceleratorCardStep } from "@/features/workspace-accelerator-card/types"
import type { OrganizationMemberRole } from "@/lib/organization/active-org"
import type { ReactNode } from "react"

import type { FormationSummary, MyOrganizationCalendarView } from "../../_lib/types"

export const WORKSPACE_CARD_IDS = [
  "organization-overview",
  "formation-status",
  "brand-kit",
  "economic-engine",
  "calendar",
  "communications",
  "deck",
  "vault",
  "atlas",
] as const

export type WorkspaceCardId = (typeof WORKSPACE_CARD_IDS)[number]

export const WORKSPACE_LAYOUT_PRESETS = ["balanced", "calendar-focused", "communications-focused"] as const

export type WorkspaceLayoutPreset = (typeof WORKSPACE_LAYOUT_PRESETS)[number]

export type WorkspaceLayoutPresetMeta = {
  label: string
  shortLabel: string
  algorithmLabel: string
}

export const WORKSPACE_LAYOUT_PRESET_META: Record<WorkspaceLayoutPreset, WorkspaceLayoutPresetMeta> = {
  balanced: {
    label: "Dashboard",
    shortLabel: "Dashboard",
    algorithmLabel: "Manual grid",
  },
  "calendar-focused": {
    label: "Cadence",
    shortLabel: "Cadence",
    algorithmLabel: "ELK layered",
  },
  "communications-focused": {
    label: "Narrative",
    shortLabel: "Narrative",
    algorithmLabel: "ELK radial",
  },
}

export const WORKSPACE_CARD_SIZES = ["sm", "md"] as const

export type WorkspaceCardSize = (typeof WORKSPACE_CARD_SIZES)[number]

export type WorkspaceDurationUnit = "hours" | "days" | "months"
export type WorkspaceCollaborationInviteStatus = "active" | "expired" | "revoked"

export const WORKSPACE_COMMUNICATION_CHANNELS = ["social", "email", "blog"] as const
export type WorkspaceCommunicationChannel = (typeof WORKSPACE_COMMUNICATION_CHANNELS)[number]

export const WORKSPACE_COMMUNICATION_MEDIA_MODES = ["text", "image", "video"] as const
export type WorkspaceCommunicationMediaMode = (typeof WORKSPACE_COMMUNICATION_MEDIA_MODES)[number]

export type WorkspaceCommunicationActivityStatus = "scheduled" | "posted"

export type WorkspaceCommunicationPostStatus = WorkspaceCommunicationActivityStatus

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
export type WorkspaceTrackerTicketPriority = "low" | "normal" | "high" | "critical"

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

export type WorkspaceBoardState = {
  version: 1
  preset: WorkspaceLayoutPreset
  nodes: WorkspaceNodeState[]
  connections: WorkspaceConnectionState[]
  communications: WorkspaceCommunicationsState
  tracker: WorkspaceTrackerState
  hiddenCardIds: WorkspaceCardId[]
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
  acceleratorOverlayEnabled: boolean
  presentationMode: boolean
  role: OrganizationMemberRole
  canEdit: boolean
  canInviteCollaborators: boolean
  organizationTitle: string
  organizationSubtitle: string
  fundingGoalCents: number
  raisedCents: number
  programsCount: number
  peopleCount: number
  initialProfile: OrgProfile
  formationSummary: FormationSummary
  acceleratorTimeline?: WorkspaceAcceleratorCardStep[]
  calendar: MyOrganizationCalendarView
  collaborationInvites: WorkspaceCollaborationInvite[]
  members: WorkspaceMemberOption[]
  boardState: WorkspaceBoardState
}

export type WorkspaceOrganizationEditorData = {
  initialProfile: OrgProfile
  people: OrgPersonWithImage[]
  programs: OrgProgram[]
  canEdit: boolean
}

export type WorkspaceCardFrameProps = {
  cardId: WorkspaceCardId
  title: string
  subtitle: string
  hideTitle?: boolean
  hideSubtitle?: boolean
  size: WorkspaceCardSize
  presentationMode: boolean
  onSizeChange: (nextSize: WorkspaceCardSize) => void
  fullHref: string
  canEdit: boolean
  editorHref?: string | null
  isCanvasFullscreen?: boolean
  onToggleCanvasFullscreen?: () => void
  children: ReactNode
}
