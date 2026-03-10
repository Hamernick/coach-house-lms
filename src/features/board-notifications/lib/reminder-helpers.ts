import { formatCalendarDate, formatCalendarTime, type RoadmapCalendarRecurrence } from "@/lib/roadmap/calendar"

import type {
  BoardReminderCandidate,
  BoardReminderExistingNotification,
  BoardReminderMembership,
  BoardReminderNotificationMetadata,
  BoardReminderPlan,
  BoardReminderPlanInput,
  BoardReminderWindow,
  BoardReminderWindowDays,
} from "../types"

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_RECURRENCE_ITERATIONS = 512

export const BOARD_MEETING_REMINDER_TYPE = "board_meeting_reminder"

export const BOARD_MEETING_REMINDER_WINDOWS: BoardReminderWindow[] = [
  { days: 7, label: "in 7 days" },
  { days: 1, label: "tomorrow" },
]

function startOfUtcDay(value: Date) {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
}

function differenceInUtcCalendarDays(left: Date, right: Date) {
  return Math.round((startOfUtcDay(left) - startOfUtcDay(right)) / DAY_MS)
}

function parseDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function parseEndDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(`${value}T23:59:59.999Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function advanceOccurrence(start: Date, recurrence: RoadmapCalendarRecurrence) {
  const next = new Date(start)
  const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1

  if (recurrence.frequency === "weekly") {
    next.setUTCDate(next.getUTCDate() + 7 * interval)
    return next
  }

  if (recurrence.frequency === "monthly") {
    next.setUTCMonth(next.getUTCMonth() + interval)
    return next
  }

  if (recurrence.frequency === "quarterly") {
    next.setUTCMonth(next.getUTCMonth() + 3 * interval)
    return next
  }

  next.setUTCFullYear(next.getUTCFullYear() + interval)
  return next
}

function isOccurrenceWithinRecurrenceBounds(
  occurrence: Date,
  recurrence: RoadmapCalendarRecurrence,
  occurrenceNumber: number,
) {
  if (typeof recurrence.count === "number" && recurrence.count > 0 && occurrenceNumber > recurrence.count) {
    return false
  }

  const endDate = parseEndDate(recurrence.endDate)
  if (endDate && occurrence.getTime() > endDate.getTime()) return false

  return true
}

export function resolveNextBoardMeetingOccurrenceStart({
  startsAt,
  recurrence,
  now = new Date(),
}: {
  startsAt: string
  recurrence: RoadmapCalendarRecurrence | null
  now?: Date
}) {
  const initial = parseDate(startsAt)
  if (!initial) return null

  const reference = new Date(startOfUtcDay(now))

  if (!recurrence) {
    return initial.getTime() >= reference.getTime() ? initial : null
  }

  let occurrence = new Date(initial)
  let occurrenceNumber = 1

  for (let index = 0; index < MAX_RECURRENCE_ITERATIONS; index += 1) {
    if (!isOccurrenceWithinRecurrenceBounds(occurrence, recurrence, occurrenceNumber)) {
      return null
    }

    if (occurrence.getTime() >= reference.getTime()) {
      return occurrence
    }

    occurrence = advanceOccurrence(occurrence, recurrence)
    occurrenceNumber += 1
  }

  return null
}

export function resolveBoardMeetingReminderWindow(
  occurrenceStartsAt: Date,
  now = new Date(),
): BoardReminderWindow | null {
  const difference = differenceInUtcCalendarDays(occurrenceStartsAt, now)
  return BOARD_MEETING_REMINDER_WINDOWS.find((window) => window.days === difference) ?? null
}

export function buildBoardMeetingReminderDedupeKey({
  eventId,
  reminderWindowDays,
  recipientId,
}: {
  eventId: string
  reminderWindowDays: BoardReminderWindowDays
  recipientId: string
}) {
  return `${eventId}::${reminderWindowDays}::${recipientId}`
}

export function buildBoardMeetingReminderMetadata({
  eventId,
  reminderWindowDays,
  recipientId,
  occurrenceStartsAt,
}: {
  eventId: string
  reminderWindowDays: BoardReminderWindowDays
  recipientId: string
  occurrenceStartsAt: string
}): BoardReminderNotificationMetadata {
  return {
    kind: "board_meeting_reminder",
    eventId,
    reminderWindowDays,
    recipientId,
    occurrenceStartsAt,
    dedupeKey: buildBoardMeetingReminderDedupeKey({
      eventId,
      reminderWindowDays,
      recipientId,
    }),
  }
}

export function readBoardMeetingReminderMetadata(
  metadata: Record<string, unknown> | null | undefined,
): BoardReminderNotificationMetadata | null {
  if (!metadata) return null

  const kind = metadata.kind
  const eventId = metadata.eventId
  const reminderWindowDays = metadata.reminderWindowDays
  const recipientId = metadata.recipientId
  const occurrenceStartsAt = metadata.occurrenceStartsAt
  const dedupeKey = metadata.dedupeKey

  if (kind !== "board_meeting_reminder") return null
  if (typeof eventId !== "string" || typeof recipientId !== "string") return null
  if (reminderWindowDays !== 1 && reminderWindowDays !== 7) return null
  if (typeof occurrenceStartsAt !== "string" || typeof dedupeKey !== "string") return null

  return {
    kind,
    eventId,
    reminderWindowDays,
    recipientId,
    occurrenceStartsAt,
    dedupeKey,
  }
}

export function buildBoardMeetingReminderSignature(metadata: BoardReminderNotificationMetadata) {
  return `${metadata.dedupeKey}::${metadata.occurrenceStartsAt}`
}

function formatBoardMeetingReminderDescription({
  title,
  occurrenceStartsAt,
  allDay,
}: {
  title: string
  occurrenceStartsAt: string
  allDay: boolean
}) {
  const dateLabel = formatCalendarDate(occurrenceStartsAt, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  if (allDay) {
    return `${title} is scheduled for ${dateLabel}.`
  }

  const timeLabel = formatCalendarTime(occurrenceStartsAt)
  return `${title} is scheduled for ${dateLabel} at ${timeLabel}.`
}

export function buildBoardMeetingReminderPlan({
  events,
  memberships,
  existingNotifications,
  now = new Date(),
}: BoardReminderPlanInput): BoardReminderPlan {
  const recipientsByOrg = new Map<string, Set<string>>()
  for (const membership of memberships) {
    const existing = recipientsByOrg.get(membership.orgId)
    if (existing) {
      existing.add(membership.recipientId)
      continue
    }
    recipientsByOrg.set(membership.orgId, new Set([membership.recipientId]))
  }

  const existingSignatures = new Set<string>()
  for (const notification of existingNotifications) {
    const metadata = readBoardMeetingReminderMetadata(notification.metadata)
    if (!metadata) continue
    existingSignatures.add(buildBoardMeetingReminderSignature(metadata))
  }

  const candidates: BoardReminderCandidate[] = []
  let dueEvents = 0
  let skippedExisting = 0
  let skippedNoRecipients = 0

  for (const event of events) {
    const occurrenceStartsAt = resolveNextBoardMeetingOccurrenceStart({
      startsAt: event.startsAt,
      recurrence: event.recurrence,
      now,
    })
    if (!occurrenceStartsAt) continue

    const reminderWindow = resolveBoardMeetingReminderWindow(occurrenceStartsAt, now)
    if (!reminderWindow) continue

    dueEvents += 1
    const recipients = recipientsByOrg.get(event.orgId)
    if (!recipients || recipients.size === 0) {
      skippedNoRecipients += 1
      continue
    }

    for (const recipientId of recipients) {
      const metadata = buildBoardMeetingReminderMetadata({
        eventId: event.id,
        reminderWindowDays: reminderWindow.days,
        recipientId,
        occurrenceStartsAt: occurrenceStartsAt.toISOString(),
      })
      const signature = buildBoardMeetingReminderSignature(metadata)

      if (existingSignatures.has(signature)) {
        skippedExisting += 1
        continue
      }

      existingSignatures.add(signature)
      candidates.push({
        userId: recipientId,
        orgId: event.orgId,
        title: reminderWindow.days === 1 ? `${event.title} is tomorrow` : `${event.title} is in 7 days`,
        description: formatBoardMeetingReminderDescription({
          title: event.title,
          occurrenceStartsAt: occurrenceStartsAt.toISOString(),
          allDay: event.allDay,
        }),
        href: "/roadmap",
        tone: reminderWindow.days === 1 ? "warning" : "info",
        metadata,
      })
    }
  }

  return {
    candidates,
    eventsScanned: events.length,
    dueEvents,
    skippedExisting,
    skippedNoRecipients,
  }
}

export function findBoardMeetingReminderNotificationIdsForEvent({
  eventId,
  notifications,
}: {
  eventId: string
  notifications: BoardReminderExistingNotification[]
}) {
  return notifications.flatMap((notification) => {
    const metadata = readBoardMeetingReminderMetadata(notification.metadata)
    return metadata?.eventId === eventId ? [notification.id] : []
  })
}
