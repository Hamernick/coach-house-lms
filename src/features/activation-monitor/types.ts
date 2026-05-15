export type ActivationMonitorStatus = "ready" | "unavailable"

export type ActivationMonitorSeverity = "critical" | "warning" | "info"

export type ActivationMonitorRawEvent = {
  id: string
  user_id: string | null
  org_id: string | null
  event_name: string
  journey: string | null
  source: string
  surface: string | null
  plan_tier: string | null
  occurred_at: string
}

export type ActivationMonitorRawCheckpoint = {
  id: string
  user_id: string
  org_id: string
  checkpoint: string
  completed_at: string
}

export type ActivationFunnelStage = {
  id: string
  label: string
  description: string
  count: number
  conversionFromPrevious: number | null
  dropoffFromPrevious: number | null
}

export type ActivationAttentionItem = {
  id: string
  userId: string
  orgId: string
  severity: ActivationMonitorSeverity
  presentCheckpoint: string
  missingCheckpoint: string
  title: string
  summary: string
  lastSeenAt: string
}

export type ActivationCoverageItem = {
  id: string
  label: string
  eventName: string
  checkpoint: string | null
  eventCount: number
  checkpointCount: number
  status: "capturing" | "missing"
}

export type ActivationEventListItem = {
  id: string
  eventName: string
  eventLabel: string
  userId: string | null
  orgId: string | null
  journey: string | null
  source: string
  surface: string | null
  planTier: string | null
  occurredAt: string
}

export type ActivationMonitorSummary = {
  totalEvents: number
  totalCheckpoints: number
  uniqueUsers: number
  uniqueOrgs: number
  attentionCount: number
  latestEventAt: string | null
  latestCheckpointAt: string | null
}

export type ActivationMonitorInput = {
  generatedAt: string
  windowDays: number
  status: ActivationMonitorStatus
  statusMessage: string | null
  summary: ActivationMonitorSummary
  funnelStages: ActivationFunnelStage[]
  attentionItems: ActivationAttentionItem[]
  coverageItems: ActivationCoverageItem[]
  events: ActivationEventListItem[]
}
