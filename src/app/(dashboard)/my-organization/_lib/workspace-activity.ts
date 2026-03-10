import { addWeeks, endOfWeek, startOfWeek, subWeeks } from 'date-fns'

import type { WorkspaceAcceleratorCardStep } from '@/features/workspace-accelerator-card'
import type {
  WorkspaceActivityRecord,
  WorkspaceActivityType,
  WorkspaceCommunicationPost,
  WorkspaceCommunicationsState,
} from '../_components/workspace-board/workspace-board-types'
import { normalizeEventType, type RoadmapCalendarEventType } from '@/lib/roadmap/calendar'

export const WORKSPACE_ACTIVITY_TOTAL_WEEKS = 26
export const WORKSPACE_ACTIVITY_PAST_WEEKS = 20
export const WORKSPACE_ACTIVITY_FUTURE_WEEKS =
  WORKSPACE_ACTIVITY_TOTAL_WEEKS - WORKSPACE_ACTIVITY_PAST_WEEKS - 1

export type WorkspaceActivityCalendarEventRow = {
  id: string
  title: string
  description: string | null
  event_type: string | null
  starts_at: string
  status: string
}

export type WorkspaceActivityAcceleratorProgressRow = {
  module_id: string
  status: string | null
  completed_at: string | null
  updated_at: string
}

function parseIso(value: string | null | undefined) {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return null
  return parsed.toISOString()
}

function truncate(value: string, max = 72) {
  const normalized = value.trim().replace(/\s+/gu, ' ')
  if (normalized.length <= max) return normalized
  return normalized.slice(0, max - 1).trimEnd() + '…'
}

function channelLabel(channel: WorkspaceCommunicationPost['channel']) {
  if (channel === 'email') return 'Email'
  if (channel === 'blog') return 'Blog'
  return 'Social'
}

function calendarEventTypeToActivityType(eventType: RoadmapCalendarEventType): WorkspaceActivityType {
  if (eventType === 'board_meeting') return 'calendar_board_meeting'
  if (eventType === 'deadline') return 'calendar_deadline'
  if (eventType === 'milestone') return 'calendar_milestone'
  if (eventType === 'other') return 'calendar_other'
  return 'calendar_meeting'
}

export function buildWorkspaceActivityHeatmapWindow(referenceDate = new Date()) {
  const start = startOfWeek(subWeeks(referenceDate, WORKSPACE_ACTIVITY_PAST_WEEKS), {
    weekStartsOn: 0,
  })
  const end = endOfWeek(addWeeks(referenceDate, WORKSPACE_ACTIVITY_FUTURE_WEEKS), {
    weekStartsOn: 0,
  })

  return {
    start,
    end,
    fromIso: start.toISOString(),
    toIso: end.toISOString(),
  }
}

export function buildWorkspaceActivityFeedFromCommunicationPosts(
  posts: WorkspaceCommunicationPost[],
): WorkspaceActivityRecord[] {
  return posts.flatMap((post) => {
    const timestamp = parseIso(post.postedAt ?? post.scheduledFor)
    if (!timestamp) return []
    const title =
      truncate(post.content) ||
      (post.status === 'posted'
        ? `${channelLabel(post.channel)} post published`
        : `${channelLabel(post.channel)} post scheduled`)

    return [
      {
        id: `communication:${post.id}`,
        source: 'communications' as const,
        type: post.status === 'posted' ? 'social_posted' : 'social_scheduled',
        status: post.status === 'posted' ? ('completed' as const) : ('scheduled' as const),
        title,
        timestamp,
        description: post.content.trim() || null,
        href: '/workspace',
        metadata: {
          channel: post.channel,
          mediaMode: post.mediaMode,
        },
      },
    ]
  })
}

export function buildWorkspaceActivityFeedFromCalendarEvents(
  events: WorkspaceActivityCalendarEventRow[],
): WorkspaceActivityRecord[] {
  return events.flatMap((event) => {
    if (event.status === 'canceled') return []
    const timestamp = parseIso(event.starts_at)
    if (!timestamp) return []
    const eventType = normalizeEventType(event.event_type)

    return [
      {
        id: `calendar:${event.id}`,
        source: 'calendar' as const,
        type: calendarEventTypeToActivityType(eventType),
        status: new Date(timestamp).getTime() > Date.now() ? 'scheduled' : 'completed',
        title: truncate(event.title, 56),
        timestamp,
        description: event.description?.trim() || null,
        href: '/my-organization?tab=calendar',
        metadata: {
          eventType,
        },
      },
    ]
  })
}

export function buildWorkspaceActivityFeedFromAcceleratorProgress(
  rows: WorkspaceActivityAcceleratorProgressRow[],
  timeline: WorkspaceAcceleratorCardStep[],
): WorkspaceActivityRecord[] {
  const moduleTitleById = new Map<string, string>()
  for (const step of timeline) {
    if (!moduleTitleById.has(step.moduleId)) {
      moduleTitleById.set(step.moduleId, step.moduleTitle)
    }
  }

  return rows.flatMap((row) => {
    if (row.status !== 'completed' && row.status !== 'in_progress') return []
    const timestamp = parseIso(row.status === 'completed' ? row.completed_at : row.updated_at)
    if (!timestamp) return []

    const moduleTitle = moduleTitleById.get(row.module_id) ?? 'Accelerator module'
    const statusLabel = row.status === 'completed' ? 'completed' : 'updated'

    return [
      {
        id: `accelerator:${row.module_id}:${timestamp}`,
        source: 'accelerator' as const,
        type: 'accelerator',
        status: 'completed',
        title: `${moduleTitle} ${statusLabel}`,
        timestamp,
        description: null,
        href: '/accelerator',
        metadata: {
          moduleId: row.module_id,
          moduleStatus: row.status ?? 'not_started',
        },
      },
    ]
  })
}

export function buildWorkspaceActivityFeedFromCommunicationsOverlay(
  activityByDay: WorkspaceCommunicationsState['activityByDay'],
): WorkspaceActivityRecord[] {
  return Object.entries(activityByDay).flatMap(([dayKey, entry]) => {
    const timestamp = parseIso(entry.timestamp)
    if (!timestamp) return []

    return [
      {
        id: `overlay:${dayKey}:${entry.channel}:${entry.status}`,
        source: 'communications' as const,
        type: entry.status === 'posted' ? 'social_posted' : 'social_scheduled',
        status: entry.status === 'posted' ? 'completed' : 'scheduled',
        title:
          entry.status === 'posted'
            ? `${channelLabel(entry.channel)} post published`
            : `${channelLabel(entry.channel)} post scheduled`,
        timestamp,
        description: null,
        href: '/workspace',
        metadata: {
          channel: entry.channel,
        },
      },
    ]
  })
}

export function mergeWorkspaceActivityFeeds(
  ...feeds: WorkspaceActivityRecord[][]
): WorkspaceActivityRecord[] {
  const deduped = new Map<string, WorkspaceActivityRecord>()
  for (const feed of feeds) {
    for (const record of feed) {
      const metadata = record.metadata ?? {}
      const signature = record.id.startsWith("overlay:")
        ? [
            record.source,
            record.type,
            record.status,
            record.timestamp,
            metadata.channel ?? "",
            metadata.moduleId ?? "",
            metadata.eventType ?? "",
          ].join(":")
        : record.id
      deduped.set(signature, record)
    }
  }

  return Array.from(deduped.values()).sort((left, right) =>
    right.timestamp.localeCompare(left.timestamp),
  )
}

export function buildWorkspaceActivityFeed({
  communicationPosts,
  calendarEvents,
  acceleratorProgress,
  acceleratorTimeline,
}: {
  communicationPosts: WorkspaceCommunicationPost[]
  calendarEvents: WorkspaceActivityCalendarEventRow[]
  acceleratorProgress: WorkspaceActivityAcceleratorProgressRow[]
  acceleratorTimeline: WorkspaceAcceleratorCardStep[]
}) {
  return mergeWorkspaceActivityFeeds(
    buildWorkspaceActivityFeedFromCommunicationPosts(communicationPosts),
    buildWorkspaceActivityFeedFromCalendarEvents(calendarEvents),
    buildWorkspaceActivityFeedFromAcceleratorProgress(
      acceleratorProgress,
      acceleratorTimeline,
    ),
  )
}
