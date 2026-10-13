import { timingSafeEqual } from "node:crypto"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createNotification } from "@/lib/notifications"
import { mapCalendarRow, type RoadmapCalendarEvent } from "@/lib/roadmap/calendar"
import type { Database } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import {
  BOARD_MEETING_REMINDER_TYPE,
  buildBoardMeetingReminderPlan,
  findBoardMeetingReminderNotificationIdsForEvent,
} from "../lib"
import type {
  BoardReminderCronAuthResult,
  BoardReminderExistingNotification,
  BoardReminderMembership,
  BoardReminderSweepResult,
} from "../types"

type AdminClient = SupabaseClient<Database, "public">

type CalendarEventRow = Pick<
  Database["public"]["Tables"]["roadmap_calendar_internal_events"]["Row"],
  | "id"
  | "org_id"
  | "title"
  | "description"
  | "event_type"
  | "starts_at"
  | "ends_at"
  | "all_day"
  | "recurrence"
  | "status"
  | "assigned_roles"
  | "created_at"
  | "updated_at"
>

type MembershipRow = Pick<
  Database["public"]["Tables"]["organization_memberships"]["Row"],
  "org_id" | "member_id"
>

type NotificationRow = Pick<
  Database["public"]["Tables"]["notifications"]["Row"],
  "id" | "user_id" | "org_id" | "metadata"
>

function resolveAdminClient(supabase?: AdminClient) {
  return supabase ?? createSupabaseAdminClient()
}

function resolveCronSecret() {
  return process.env.INTERNAL_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim() || null
}

function safeCompareSecret(input: string, expected: string) {
  const left = Buffer.from(input)
  const right = Buffer.from(expected)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

function resolveRequestSecret(request: Request) {
  const authorization = request.headers.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim()
  }

  const headerSecret = request.headers.get("x-cron-secret")?.trim()
  return headerSecret || null
}

async function listActiveBoardMeetingEvents(supabase: AdminClient) {
  const { data, error } = await supabase
    .from("roadmap_calendar_internal_events")
    .select(
      "id,org_id,title,description,event_type,starts_at,ends_at,all_day,recurrence,status,assigned_roles,created_at,updated_at",
    )
    .eq("event_type", "board_meeting")
    .eq("status", "active")
    .returns<CalendarEventRow[]>()

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapCalendarRow)
}

async function listBoardMembershipsForOrganizations(supabase: AdminClient, orgIds: string[]) {
  if (orgIds.length === 0) return []

  const { data, error } = await supabase
    .from("organization_memberships")
    .select("org_id,member_id")
    .in("org_id", orgIds)
    .eq("role", "board")
    .returns<MembershipRow[]>()

  if (error) throw new Error(error.message)

  return (data ?? []).map<BoardReminderMembership>((row) => ({
    orgId: row.org_id,
    recipientId: row.member_id,
  }))
}

async function listExistingBoardReminderNotifications(
  supabase: AdminClient,
  {
    orgIds,
    recipientIds,
  }: {
    orgIds: string[]
    recipientIds?: string[]
  },
) {
  if (orgIds.length === 0) return []

  let query = supabase
    .from("notifications")
    .select("id,user_id,org_id,metadata")
    .eq("type", BOARD_MEETING_REMINDER_TYPE)
    .in("org_id", orgIds)

  if (recipientIds && recipientIds.length > 0) {
    query = query.in("user_id", recipientIds)
  }

  const { data, error } = await query.returns<NotificationRow[]>()
  if (error) throw new Error(error.message)

  return (data ?? []).map<BoardReminderExistingNotification>((row) => ({
    id: row.id,
    userId: row.user_id,
    orgId: row.org_id,
    metadata: row.metadata,
  }))
}

async function createBoardReminderNotifications(
  supabase: AdminClient,
  result: BoardReminderSweepResult,
) {
  const outcomes = await Promise.all(
    result.candidates.map((candidate) =>
      createNotification(supabase, {
        userId: candidate.userId,
        orgId: candidate.orgId,
        title: candidate.title,
        description: candidate.description,
        href: candidate.href,
        tone: candidate.tone,
        type: BOARD_MEETING_REMINDER_TYPE,
        metadata: candidate.metadata,
      }),
    ),
  )

  const failed = outcomes.find((outcome) => "error" in outcome)
  if (failed && "error" in failed) {
    throw new Error(failed.error)
  }

  return outcomes.length
}

async function buildBoardReminderSweepResult({
  supabase,
  events,
  now,
}: {
  supabase: AdminClient
  events: RoadmapCalendarEvent[]
  now: Date
}): Promise<BoardReminderSweepResult> {
  const orgIds = Array.from(new Set(events.map((event) => event.orgId)))
  const memberships = await listBoardMembershipsForOrganizations(supabase, orgIds)
  const recipientIds = Array.from(new Set(memberships.map((membership) => membership.recipientId)))
  const existingNotifications = await listExistingBoardReminderNotifications(supabase, {
    orgIds,
    recipientIds,
  })

  const plan = buildBoardMeetingReminderPlan({
    events,
    memberships,
    existingNotifications,
    now,
  })

  const created = await createBoardReminderNotifications(supabase, { ...plan, created: 0 })
  return { ...plan, created }
}

export function authorizeBoardReminderCronRequest(request: Request): BoardReminderCronAuthResult {
  const expectedSecret = resolveCronSecret()
  if (!expectedSecret) {
    return { ok: false, status: 500, error: "Board reminder cron secret is not configured." }
  }

  const providedSecret = resolveRequestSecret(request)
  if (!providedSecret || !safeCompareSecret(providedSecret, expectedSecret)) {
    return { ok: false, status: 401, error: "Unauthorized" }
  }

  return { ok: true }
}

export async function runBoardMeetingReminderSweep({
  now = new Date(),
  supabase,
}: {
  now?: Date
  supabase?: AdminClient
} = {}): Promise<BoardReminderSweepResult> {
  const admin = resolveAdminClient(supabase)
  const events = await listActiveBoardMeetingEvents(admin)

  if (events.length === 0) {
    return {
      candidates: [],
      eventsScanned: 0,
      dueEvents: 0,
      skippedExisting: 0,
      skippedNoRecipients: 0,
      created: 0,
    }
  }

  return buildBoardReminderSweepResult({
    supabase: admin,
    events,
    now,
  })
}

export async function clearBoardMeetingReminderNotificationsForEvent({
  eventId,
  orgId,
  supabase,
}: {
  eventId: string
  orgId: string
  supabase?: AdminClient
}) {
  const admin = resolveAdminClient(supabase)
  const existingNotifications = await listExistingBoardReminderNotifications(admin, { orgIds: [orgId] })
  const notificationIds = findBoardMeetingReminderNotificationIdsForEvent({
    eventId,
    notifications: existingNotifications,
  })

  if (notificationIds.length === 0) return 0

  const { error } = await admin.from("notifications").delete().in("id", notificationIds)
  if (error) throw new Error(error.message)

  return notificationIds.length
}

export async function syncBoardMeetingReminderNotificationsForEvent({
  event,
  now = new Date(),
  supabase,
}: {
  event: RoadmapCalendarEvent
  now?: Date
  supabase?: AdminClient
}) {
  const admin = resolveAdminClient(supabase)

  if (event.eventType !== "board_meeting" || event.status !== "active") {
    return {
      candidates: [],
      eventsScanned: 0,
      dueEvents: 0,
      skippedExisting: 0,
      skippedNoRecipients: 0,
      created: 0,
    }
  }

  return buildBoardReminderSweepResult({
    supabase: admin,
    events: [event],
    now,
  })
}
