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
