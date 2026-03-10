import type { NotificationTone } from "@/lib/notifications"
import type { RoadmapCalendarEvent } from "@/lib/roadmap/calendar"

export type BoardReminderWindowDays = 1 | 7

export type BoardNotificationsInput = {
  id: string
}

export type BoardReminderWindow = {
  days: BoardReminderWindowDays
  label: string
}

export type BoardReminderNotificationMetadata = {
  kind: "board_meeting_reminder"
  eventId: string
  reminderWindowDays: BoardReminderWindowDays
  recipientId: string
  occurrenceStartsAt: string
  dedupeKey: string
}

export type BoardReminderMembership = {
  orgId: string
  recipientId: string
}

export type BoardReminderExistingNotification = {
  id: string
  userId: string
  orgId: string | null
  metadata: Record<string, unknown> | null
}

export type BoardReminderCandidate = {
  userId: string
  orgId: string
  title: string
  description: string
  href: string
  tone: NotificationTone
  metadata: BoardReminderNotificationMetadata
}

export type BoardReminderPlanInput = {
  events: RoadmapCalendarEvent[]
  memberships: BoardReminderMembership[]
  existingNotifications: BoardReminderExistingNotification[]
  now?: Date
}

export type BoardReminderPlan = {
  candidates: BoardReminderCandidate[]
  eventsScanned: number
  dueEvents: number
  skippedExisting: number
  skippedNoRecipients: number
}

export type BoardReminderSweepResult = BoardReminderPlan & {
  created: number
}

export type BoardReminderCronAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string }
