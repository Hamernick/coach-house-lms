import type { Json } from "@/lib/supabase"

import type {
  NormalizedPageHealthEventInput,
  PageHealthAffectedAccount,
  PageHealthEventInput,
  PageHealthEventListItem,
  PageHealthEventType,
  PageHealthIdentity,
  PageHealthMonitorInput,
  PageHealthMonitorSummary,
  PageHealthMonitorStatus,
  PageHealthRawEvent,
  PageHealthSeverity,
  PageHealthSource,
} from "../types"

export const PAGE_HEALTH_MONITOR_WINDOW_DAYS = 14

export const PAGE_HEALTH_EVENT_TYPES = [
  "route_error",
  "global_error",
  "unhandled_rejection",
  "slow_page_load",
  "stuck_page_load",
] as const satisfies PageHealthEventType[]

const PAGE_HEALTH_SEVERITIES = [
  "info",
  "warning",
  "critical",
] as const satisfies PageHealthSeverity[]

const PAGE_HEALTH_SOURCES = [
  "client",
  "error_boundary",
] as const satisfies PageHealthSource[]

const EMPTY_SUMMARY = {
  totalEvents: 0,
  criticalEvents: 0,
  warningEvents: 0,
  slowEvents: 0,
  affectedUsers: 0,
  affectedOrgs: 0,
  latestEventAt: null,
} satisfies PageHealthMonitorSummary

const SENSITIVE_METADATA_KEYS = [
  "email",
  "phone",
  "token",
  "password",
  "invite",
  "secret",
  "url",
  "href",
  "search",
  "query",
]

function normalizeMetadataKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
}

function isSensitiveMetadataKey(key: string) {
  const normalizedKey = normalizeMetadataKey(key)
  return SENSITIVE_METADATA_KEYS.some((sensitiveKey) =>
    normalizedKey.includes(sensitiveKey)
  )
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function cleanNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return Math.max(Math.round(value), 0)
}

function cleanEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
) {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback
}

function sanitizeMetadataValue(value: unknown, depth = 0): Json | undefined {
  if (depth > 3) return null
  if (value == null) return null
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value
  }
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    return value
      .slice(0, 25)
      .map((item) => sanitizeMetadataValue(item, depth + 1))
      .filter((item): item is Json => item !== undefined)
  }
  if (typeof value === "object") {
    const output: Record<string, Json> = {}
    for (const [key, item] of Object.entries(value).slice(0, 40)) {
      if (isSensitiveMetadataKey(key)) continue
      const sanitized = sanitizeMetadataValue(item, depth + 1)
      if (sanitized !== undefined) output[key] = sanitized
    }
    return output
  }
  return undefined
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | null | undefined
) {
  const sanitized = sanitizeMetadataValue(metadata)
  return sanitized && typeof sanitized === "object" && !Array.isArray(sanitized)
    ? sanitized
    : {}
}

export function normalizePageHealthEventInput(
  input: PageHealthEventInput
): NormalizedPageHealthEventInput {
  const safeInput: Partial<PageHealthEventInput> =
    input && typeof input === "object" ? input : {}
  return {
    eventType: cleanEnum(
      safeInput.eventType,
      PAGE_HEALTH_EVENT_TYPES,
      "route_error"
    ),
    severity: cleanEnum(safeInput.severity, PAGE_HEALTH_SEVERITIES, "warning"),
    source: cleanEnum(safeInput.source, PAGE_HEALTH_SOURCES, "client"),
    routePath: cleanString(safeInput.routePath, 300),
    targetHref: cleanString(safeInput.targetHref, 300),
    durationMs: cleanNumber(safeInput.durationMs),
    thresholdMs: cleanNumber(safeInput.thresholdMs),
    errorName: cleanString(safeInput.errorName, 120),
    errorMessage: cleanString(safeInput.errorMessage, 500),
    errorDigest: cleanString(safeInput.errorDigest, 160),
    stackHash: cleanString(safeInput.stackHash, 80),
    metadata: sanitizeMetadata(safeInput.metadata),
  }
}

export function createEmptyPageHealthMonitorInput({
  generatedAt,
  status = "ready",
  statusMessage = null,
}: {
  generatedAt: string
  status?: PageHealthMonitorStatus
  statusMessage?: string | null
}): PageHealthMonitorInput {
  return {
    generatedAt,
    windowDays: PAGE_HEALTH_MONITOR_WINDOW_DAYS,
    status,
    statusMessage,
    summary: EMPTY_SUMMARY,
    affectedAccounts: [],
    events: [],
  }
}

function eventLabel(eventType: PageHealthEventType) {
  return eventType
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function identityKey(userId: string | null, orgId: string | null) {
  return `${userId ?? "unknown-user"}:${orgId ?? userId ?? "unknown-org"}`
}

function resolveIdentityLabel(
  id: string | null,
  identities: Map<string, PageHealthIdentity>
) {
  if (!id) return "Unknown"
  return identities.get(id)?.label ?? `${id.slice(0, 4)}…${id.slice(-4)}`
}

function buildEventItem({
  event,
  orgIdentities,
  userIdentities,
}: {
  event: PageHealthRawEvent
  orgIdentities: Map<string, PageHealthIdentity>
  userIdentities: Map<string, PageHealthIdentity>
}): PageHealthEventListItem {
  return {
    id: event.id,
    eventType: event.event_type,
    eventLabel: eventLabel(event.event_type),
    severity: event.severity,
    source: event.source,
    userId: event.user_id,
    orgId: event.org_id,
    userLabel: resolveIdentityLabel(event.user_id, userIdentities),
    orgLabel: resolveIdentityLabel(event.org_id, orgIdentities),
    routePath: event.route_path,
    targetHref: event.target_href,
    durationMs: event.duration_ms,
    thresholdMs: event.threshold_ms,
    errorName: event.error_name,
    errorMessage: event.error_message,
    occurredAt: event.occurred_at,
  }
}

function buildAffectedAccounts(
  events: PageHealthEventListItem[]
): PageHealthAffectedAccount[] {
  const grouped = new Map<string, PageHealthAffectedAccount>()

  for (const event of events) {
    const key = identityKey(event.userId, event.orgId)
    const current =
      grouped.get(key) ??
      ({
        id: key,
        userId: event.userId,
        orgId: event.orgId,
        userLabel: event.userLabel,
        orgLabel: event.orgLabel,
        eventCount: 0,
        criticalCount: 0,
        warningCount: 0,
        latestRoute: null,
        latestEventAt: null,
      } satisfies PageHealthAffectedAccount)

    current.eventCount += 1
    if (event.severity === "critical") current.criticalCount += 1
    if (event.severity === "warning") current.warningCount += 1
    if (
      !current.latestEventAt ||
      new Date(event.occurredAt).getTime() >
        new Date(current.latestEventAt).getTime()
    ) {
      current.latestEventAt = event.occurredAt
      current.latestRoute = event.routePath
    }
    grouped.set(key, current)
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (b.criticalCount !== a.criticalCount) {
      return b.criticalCount - a.criticalCount
    }
    if (b.warningCount !== a.warningCount)
      return b.warningCount - a.warningCount
    return (
      new Date(b.latestEventAt ?? 0).getTime() -
      new Date(a.latestEventAt ?? 0).getTime()
    )
  })
}

export function buildPageHealthMonitorInput({
  generatedAt,
  orgIdentities,
  rawEvents,
  userIdentities,
}: {
  generatedAt: string
  orgIdentities: Map<string, PageHealthIdentity>
  rawEvents: PageHealthRawEvent[]
  userIdentities: Map<string, PageHealthIdentity>
}): PageHealthMonitorInput {
  const events = rawEvents.map((event) =>
    buildEventItem({ event, orgIdentities, userIdentities })
  )
  const userIds = new Set(events.map((event) => event.userId).filter(Boolean))
  const orgIds = new Set(events.map((event) => event.orgId).filter(Boolean))
  const latestEventAt =
    events
      .map((event) => event.occurredAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null

  return {
    generatedAt,
    windowDays: PAGE_HEALTH_MONITOR_WINDOW_DAYS,
    status: "ready",
    statusMessage: null,
    summary: {
      totalEvents: events.length,
      criticalEvents: events.filter((event) => event.severity === "critical")
        .length,
      warningEvents: events.filter((event) => event.severity === "warning")
        .length,
      slowEvents: events.filter((event) =>
        ["slow_page_load", "stuck_page_load"].includes(event.eventType)
      ).length,
      affectedUsers: userIds.size,
      affectedOrgs: orgIds.size,
      latestEventAt,
    },
    affectedAccounts: buildAffectedAccounts(events).slice(0, 20),
    events,
  }
}
