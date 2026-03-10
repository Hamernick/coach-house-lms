import type {
  WorkspaceCommunicationActivity,
  WorkspaceCommunicationChannel,
  WorkspaceCommunicationChannelConnection,
  WorkspaceCommunicationsState,
} from "./workspace-board-types"

const DEFAULT_COMMUNICATION_COPY =
  "Launching this week: our next milestone and how partners can plug in."

const DEFAULT_CHANNEL_CONNECTIONS = {
  social: false,
  email: false,
  blog: false,
} as const

const DEFAULT_CHANNEL_CONNECTION_DETAILS: WorkspaceCommunicationsState["channelConnections"] = {
  social: {
    connected: false,
    provider: null,
    connectedAt: null,
    connectedBy: null,
  },
  email: {
    connected: false,
    provider: null,
    connectedAt: null,
    connectedBy: null,
  },
  blog: {
    connected: false,
    provider: null,
    connectedAt: null,
    connectedBy: null,
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function nowIso() {
  return new Date().toISOString()
}

function isoInMinutesFromNow(minutes: number) {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

function normalizeChannel(value: unknown, fallback: WorkspaceCommunicationChannel): WorkspaceCommunicationChannel {
  if (value === "social" || value === "email" || value === "blog") {
    return value
  }
  return fallback
}

function normalizeIsoDate(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value.trim().length === 0) return fallback
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return fallback
  return parsed.toISOString()
}

function normalizeOptionalIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length === 0) return null
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return null
  return parsed.toISOString()
}

function normalizeCommunicationActivity(
  value: unknown,
): WorkspaceCommunicationActivity | null {
  if (!isRecord(value)) return null
  const status = value.status === "scheduled" || value.status === "posted" ? value.status : null
  if (!status) return null
  const channel = normalizeChannel(value.channel, "social")
  const timestamp = normalizeIsoDate(value.timestamp, nowIso())
  return {
    status,
    channel,
    timestamp,
  }
}

function normalizeConnectedChannels(value: unknown): WorkspaceCommunicationsState["connectedChannels"] {
  const source = isRecord(value) ? value : {}
  return {
    social: Boolean(source.social),
    email: Boolean(source.email),
    blog: Boolean(source.blog),
  }
}

function normalizeChannelConnectionEntry(value: unknown): WorkspaceCommunicationChannelConnection {
  if (!isRecord(value)) {
    return {
      connected: false,
      provider: null,
      connectedAt: null,
      connectedBy: null,
    }
  }

  return {
    connected: Boolean(value.connected),
    provider: typeof value.provider === "string" && value.provider.trim().length > 0 ? value.provider.trim() : null,
    connectedAt: normalizeOptionalIsoDate(value.connectedAt),
    connectedBy:
      typeof value.connectedBy === "string" && value.connectedBy.trim().length > 0 ? value.connectedBy.trim() : null,
  }
}

function normalizeChannelConnections(
  value: unknown,
  connectedChannels: WorkspaceCommunicationsState["connectedChannels"],
): WorkspaceCommunicationsState["channelConnections"] {
  const source = isRecord(value) ? value : {}

  const social = normalizeChannelConnectionEntry(source.social)
  const email = normalizeChannelConnectionEntry(source.email)
  const blog = normalizeChannelConnectionEntry(source.blog)

  return {
    social: {
      ...DEFAULT_CHANNEL_CONNECTION_DETAILS.social,
      ...social,
      connected: connectedChannels.social || social.connected,
    },
    email: {
      ...DEFAULT_CHANNEL_CONNECTION_DETAILS.email,
      ...email,
      connected: connectedChannels.email || email.connected,
    },
    blog: {
      ...DEFAULT_CHANNEL_CONNECTION_DETAILS.blog,
      ...blog,
      connected: connectedChannels.blog || blog.connected,
    },
  }
}

function normalizeActivityByDay(value: unknown) {
  if (!isRecord(value)) return {}
  const next: Record<string, WorkspaceCommunicationActivity> = {}
  for (const [dayKey, rawEntry] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(dayKey)) continue
    const entry = normalizeCommunicationActivity(rawEntry)
    if (!entry) continue
    next[dayKey] = entry
  }
  return next
}

export function buildDefaultWorkspaceCommunicationsState(): WorkspaceCommunicationsState {
  return {
    channel: "social",
    mediaMode: "text",
    copy: DEFAULT_COMMUNICATION_COPY,
    scheduledFor: isoInMinutesFromNow(15),
    connectedChannels: { ...DEFAULT_CHANNEL_CONNECTIONS },
    channelConnections: {
      social: { ...DEFAULT_CHANNEL_CONNECTION_DETAILS.social },
      email: { ...DEFAULT_CHANNEL_CONNECTION_DETAILS.email },
      blog: { ...DEFAULT_CHANNEL_CONNECTION_DETAILS.blog },
    },
    activityByDay: {},
  }
}

export function normalizeWorkspaceCommunicationsState(value: unknown): WorkspaceCommunicationsState {
  const fallback = buildDefaultWorkspaceCommunicationsState()
  if (!isRecord(value)) return fallback
  const mediaMode =
    value.mediaMode === "text" || value.mediaMode === "image" || value.mediaMode === "video"
      ? value.mediaMode
      : fallback.mediaMode
  const copy =
    typeof value.copy === "string" && value.copy.trim().length > 0
      ? value.copy
      : fallback.copy

  const connectedChannels = normalizeConnectedChannels(value.connectedChannels)
  const channelConnections = normalizeChannelConnections(value.channelConnections, connectedChannels)

  return {
    channel: normalizeChannel(value.channel, fallback.channel),
    mediaMode,
    copy,
    scheduledFor: normalizeIsoDate(value.scheduledFor, fallback.scheduledFor),
    connectedChannels,
    channelConnections,
    activityByDay: normalizeActivityByDay(value.activityByDay),
  }
}
