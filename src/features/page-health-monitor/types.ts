import type { Json } from "@/lib/supabase"

export type PageHealthEventType =
  | "route_error"
  | "global_error"
  | "unhandled_rejection"
  | "slow_page_load"
  | "stuck_page_load"

export type PageHealthSeverity = "info" | "warning" | "critical"

export type PageHealthSource = "client" | "error_boundary"

export type PageHealthMonitorStatus = "ready" | "unavailable"

export type PageHealthEventInput = {
  eventType: PageHealthEventType
  severity?: PageHealthSeverity
  source?: PageHealthSource
  routePath?: string | null
  targetHref?: string | null
  durationMs?: number | null
  thresholdMs?: number | null
  errorName?: string | null
  errorMessage?: string | null
  errorDigest?: string | null
  stackHash?: string | null
  metadata?: Record<string, unknown> | null
}

export type NormalizedPageHealthEventInput = {
  eventType: PageHealthEventType
  severity: PageHealthSeverity
  source: PageHealthSource
  routePath: string | null
  targetHref: string | null
  durationMs: number | null
  thresholdMs: number | null
  errorName: string | null
  errorMessage: string | null
  errorDigest: string | null
  stackHash: string | null
  metadata: Json
}

export type PageHealthRawEvent = {
  id: string
  user_id: string | null
  org_id: string | null
  event_type: PageHealthEventType
  severity: PageHealthSeverity
  source: PageHealthSource
  route_path: string | null
  target_href: string | null
  duration_ms: number | null
  threshold_ms: number | null
  error_name: string | null
  error_message: string | null
  error_digest: string | null
  stack_hash: string | null
  metadata: Json
  occurred_at: string
}

export type PageHealthIdentity = {
  id: string
  label: string
  detail: string | null
}

export type PageHealthEventListItem = {
  id: string
  eventType: PageHealthEventType
  eventLabel: string
  severity: PageHealthSeverity
  source: PageHealthSource
  userId: string | null
  orgId: string | null
  userLabel: string
  orgLabel: string
  routePath: string | null
  targetHref: string | null
  durationMs: number | null
  thresholdMs: number | null
  errorName: string | null
  errorMessage: string | null
  occurredAt: string
}

export type PageHealthAffectedAccount = {
  id: string
  userId: string | null
  orgId: string | null
  userLabel: string
  orgLabel: string
  eventCount: number
  criticalCount: number
  warningCount: number
  latestRoute: string | null
  latestEventAt: string | null
}

export type PageHealthMonitorSummary = {
  totalEvents: number
  criticalEvents: number
  warningEvents: number
  slowEvents: number
  affectedUsers: number
  affectedOrgs: number
  latestEventAt: string | null
}

export type PageHealthMonitorInput = {
  generatedAt: string
  windowDays: number
  status: PageHealthMonitorStatus
  statusMessage: string | null
  summary: PageHealthMonitorSummary
  affectedAccounts: PageHealthAffectedAccount[]
  events: PageHealthEventListItem[]
}
