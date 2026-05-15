import type {
  ActivationAttentionItem,
  ActivationCoverageItem,
  ActivationEventListItem,
  ActivationFunnelStage,
  ActivationMonitorInput,
  ActivationMonitorRawCheckpoint,
  ActivationMonitorRawEvent,
  ActivationMonitorSeverity,
  ActivationMonitorSummary,
  ActivationMonitorStatus,
} from "../types"

export const ACTIVATION_MONITOR_WINDOW_DAYS = 30

export const ACTIVATION_FUNNEL_STAGE_DEFINITIONS = [
  {
    id: "checkout_started",
    label: "Checkout started",
    description: "A paid builder reached Stripe checkout.",
  },
  {
    id: "paid_plan_confirmed",
    label: "Paid plan confirmed",
    description: "Stripe success created an activation checkpoint.",
  },
  {
    id: "account_onboarding_completed",
    label: "Account onboarding",
    description: "The user finished profile and intent setup.",
  },
  {
    id: "workspace_first_viewed",
    label: "Workspace opened",
    description: "The activated user reached the workspace.",
  },
  {
    id: "first_homework_submitted",
    label: "First homework",
    description: "The user submitted an assignment payload.",
  },
  {
    id: "first_coaching_schedule_opened",
    label: "Coaching handoff",
    description: "The user opened a scheduling link.",
  },
] as const

const ACTIVATION_COVERAGE_DEFINITIONS = [
  {
    id: "checkout-start",
    label: "Checkout start",
    eventName: "checkout_started",
    checkpoint: "checkout_started",
  },
  {
    id: "paid-confirmed",
    label: "Paid confirmation",
    eventName: "checkout_completed",
    checkpoint: "paid_plan_confirmed",
  },
  {
    id: "onboarding-complete",
    label: "Onboarding complete",
    eventName: "onboarding_completed",
    checkpoint: "account_onboarding_completed",
  },
  {
    id: "workspace-open",
    label: "Workspace first view",
    eventName: "workspace_viewed",
    checkpoint: "workspace_first_viewed",
  },
  {
    id: "homework-submit",
    label: "Homework submit",
    eventName: "homework_submitted",
    checkpoint: "first_homework_submitted",
  },
  {
    id: "notes-save",
    label: "Module note saved",
    eventName: "module_note_saved",
    checkpoint: "first_module_note_saved",
  },
  {
    id: "coaching-opened",
    label: "Coaching opened",
    eventName: "coaching_schedule_opened",
    checkpoint: "first_coaching_schedule_opened",
  },
  {
    id: "invite-created",
    label: "Invite created",
    eventName: "organization_invite_created",
    checkpoint: "first_organization_invite_sent",
  },
  {
    id: "invite-accepted",
    label: "Invite accepted",
    eventName: "organization_invite_accepted",
    checkpoint: "first_invite_accepted",
  },
] as const

const ATTENTION_RULES: Array<{
  present: string
  missing: string
  severity: ActivationMonitorSeverity
  title: string
  summary: string
}> = [
  {
    present: "checkout_started",
    missing: "paid_plan_confirmed",
    severity: "critical",
    title: "Checkout has not confirmed",
    summary: "A user started paid checkout but has no paid confirmation checkpoint.",
  },
  {
    present: "paid_plan_confirmed",
    missing: "account_onboarding_completed",
    severity: "critical",
    title: "Paid user has not completed onboarding",
    summary: "The account has paid access but has not completed onboarding.",
  },
  {
    present: "account_onboarding_completed",
    missing: "workspace_first_viewed",
    severity: "warning",
    title: "Onboarded user has not opened workspace",
    summary: "The user finished onboarding but has not reached the workspace.",
  },
  {
    present: "workspace_first_viewed",
    missing: "first_homework_submitted",
    severity: "warning",
    title: "Workspace opened without first homework",
    summary: "The user reached the workspace but has not submitted assignment data.",
  },
  {
    present: "first_homework_submitted",
    missing: "first_coaching_schedule_opened",
    severity: "info",
    title: "Homework submitted without coaching handoff",
    summary: "A submitted homework path has not led to scheduling.",
  },
  {
    present: "first_organization_invite_sent",
    missing: "first_invite_accepted",
    severity: "info",
    title: "Invite sent without acceptance",
    summary: "The organization sent an invite that has not closed into access.",
  },
]

const EMPTY_SUMMARY: ActivationMonitorSummary = {
  totalEvents: 0,
  totalCheckpoints: 0,
  uniqueUsers: 0,
  uniqueOrgs: 0,
  attentionCount: 0,
  latestEventAt: null,
  latestCheckpointAt: null,
}

function identityKey(userId: string | null, orgId: string | null) {
  const user = userId?.trim() || "unknown-user"
  const org = orgId?.trim() || user
  return `${user}:${org}`
}

function eventLabel(eventName: string) {
  return eventName
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function latestIso(values: string[]) {
  return values
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
}

function buildFunnelStages(
  checkpoints: ActivationMonitorRawCheckpoint[],
): ActivationFunnelStage[] {
  let previousCount: number | null = null

  return ACTIVATION_FUNNEL_STAGE_DEFINITIONS.map((stage) => {
    const uniqueKeys = new Set(
      checkpoints
        .filter((checkpoint) => checkpoint.checkpoint === stage.id)
        .map((checkpoint) => identityKey(checkpoint.user_id, checkpoint.org_id)),
    )
    const count = uniqueKeys.size
    const conversionFromPrevious =
      previousCount == null || previousCount === 0
        ? null
        : Math.round((count / previousCount) * 100)
    const dropoffFromPrevious =
      previousCount == null ? null : Math.max(previousCount - count, 0)
    previousCount = count

    return {
      ...stage,
      count,
      conversionFromPrevious,
      dropoffFromPrevious,
    }
  })
}

function buildAttentionItems(
  checkpoints: ActivationMonitorRawCheckpoint[],
): ActivationAttentionItem[] {
  const grouped = new Map<
    string,
    {
      userId: string
      orgId: string
      checkpoints: Set<string>
      checkpointDates: Map<string, string>
    }
  >()

  for (const checkpoint of checkpoints) {
    const key = identityKey(checkpoint.user_id, checkpoint.org_id)
    const group =
      grouped.get(key) ??
      {
        userId: checkpoint.user_id,
        orgId: checkpoint.org_id,
        checkpoints: new Set<string>(),
        checkpointDates: new Map<string, string>(),
      }
    group.checkpoints.add(checkpoint.checkpoint)
    const currentDate = group.checkpointDates.get(checkpoint.checkpoint)
    if (!currentDate || new Date(checkpoint.completed_at) > new Date(currentDate)) {
      group.checkpointDates.set(checkpoint.checkpoint, checkpoint.completed_at)
    }
    grouped.set(key, group)
  }

  const items: ActivationAttentionItem[] = []
  for (const [key, group] of grouped.entries()) {
    const rule = ATTENTION_RULES.find(
      (candidate) =>
        group.checkpoints.has(candidate.present) &&
        !group.checkpoints.has(candidate.missing),
    )
    if (!rule) continue

    items.push({
      id: `${key}:${rule.missing}`,
      userId: group.userId,
      orgId: group.orgId,
      severity: rule.severity,
      presentCheckpoint: rule.present,
      missingCheckpoint: rule.missing,
      title: rule.title,
      summary: rule.summary,
      lastSeenAt: group.checkpointDates.get(rule.present) ?? new Date(0).toISOString(),
    })
  }

  return items
    .sort((a, b) => {
      const severityWeight = { critical: 0, warning: 1, info: 2 }
      const severityDelta = severityWeight[a.severity] - severityWeight[b.severity]
      if (severityDelta !== 0) return severityDelta
      return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
    })
    .slice(0, 8)
}

function buildCoverageItems({
  events,
  checkpoints,
}: {
  events: ActivationMonitorRawEvent[]
  checkpoints: ActivationMonitorRawCheckpoint[]
}): ActivationCoverageItem[] {
  return ACTIVATION_COVERAGE_DEFINITIONS.map((item) => {
    const eventCount = events.filter((event) => event.event_name === item.eventName).length
    const checkpointCount = item.checkpoint
      ? checkpoints.filter((checkpoint) => checkpoint.checkpoint === item.checkpoint).length
      : 0

    return {
      ...item,
      eventCount,
      checkpointCount,
      status: eventCount > 0 || checkpointCount > 0 ? "capturing" : "missing",
    }
  })
}

function buildEventList(events: ActivationMonitorRawEvent[]): ActivationEventListItem[] {
  return events
    .slice()
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 24)
    .map((event) => ({
      id: event.id,
      eventName: event.event_name,
      eventLabel: eventLabel(event.event_name),
      userId: event.user_id,
      orgId: event.org_id,
      journey: event.journey,
      source: event.source,
      surface: event.surface,
      planTier: event.plan_tier,
      occurredAt: event.occurred_at,
    }))
}

function buildSummary({
  events,
  checkpoints,
  attentionCount,
}: {
  events: ActivationMonitorRawEvent[]
  checkpoints: ActivationMonitorRawCheckpoint[]
  attentionCount: number
}): ActivationMonitorSummary {
  const uniqueUsers = new Set(
    [...events.map((event) => event.user_id), ...checkpoints.map((checkpoint) => checkpoint.user_id)]
      .filter((value): value is string => Boolean(value)),
  )
  const uniqueOrgs = new Set(
    [...events.map((event) => event.org_id), ...checkpoints.map((checkpoint) => checkpoint.org_id)]
      .filter((value): value is string => Boolean(value)),
  )

  return {
    totalEvents: events.length,
    totalCheckpoints: checkpoints.length,
    uniqueUsers: uniqueUsers.size,
    uniqueOrgs: uniqueOrgs.size,
    attentionCount,
    latestEventAt: latestIso(events.map((event) => event.occurred_at)),
    latestCheckpointAt: latestIso(
      checkpoints.map((checkpoint) => checkpoint.completed_at),
    ),
  }
}

export function createEmptyActivationMonitorInput({
  generatedAt,
  windowDays = ACTIVATION_MONITOR_WINDOW_DAYS,
  status = "ready",
  statusMessage = null,
}: {
  generatedAt: string
  windowDays?: number
  status?: ActivationMonitorStatus
  statusMessage?: string | null
}): ActivationMonitorInput {
  return {
    generatedAt,
    windowDays,
    status,
    statusMessage,
    summary: EMPTY_SUMMARY,
    funnelStages: buildFunnelStages([]),
    attentionItems: [],
    coverageItems: buildCoverageItems({ events: [], checkpoints: [] }),
    events: [],
  }
}

export function buildActivationMonitorInput({
  generatedAt,
  windowDays = ACTIVATION_MONITOR_WINDOW_DAYS,
  status = "ready",
  statusMessage = null,
  events,
  checkpoints,
}: {
  generatedAt: string
  windowDays?: number
  status?: ActivationMonitorStatus
  statusMessage?: string | null
  events: ActivationMonitorRawEvent[]
  checkpoints: ActivationMonitorRawCheckpoint[]
}): ActivationMonitorInput {
  const attentionItems = buildAttentionItems(checkpoints)

  return {
    generatedAt,
    windowDays,
    status,
    statusMessage,
    summary: buildSummary({
      events,
      checkpoints,
      attentionCount: attentionItems.length,
    }),
    funnelStages: buildFunnelStages(checkpoints),
    attentionItems,
    coverageItems: buildCoverageItems({ events, checkpoints }),
    events: buildEventList(events),
  }
}
