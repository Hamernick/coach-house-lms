"use server"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseAuthSessionMissingError } from "@/lib/supabase/auth-errors"
import { resolveActiveOrganization } from "@/lib/organization/active-org"
import { createNotification } from "@/lib/notifications"
import {
  mapCalendarRow,
  normalizeAssignedRoles,
  normalizeRecurrence,
  type RoadmapCalendarAssignedRole,
  type RoadmapCalendarEvent,
  type RoadmapCalendarEventInput,
  type RoadmapCalendarEventUpdate,
  type RoadmapCalendarRecurrence,
  type RoadmapCalendarType,
} from "@/lib/roadmap/calendar"

const CALENDAR_TABLES = {
  public: {
    events: "roadmap_calendar_public_events",
    feeds: "roadmap_calendar_public_feeds",
  },
  internal: {
    events: "roadmap_calendar_internal_events",
    feeds: "roadmap_calendar_internal_feeds",
  },
} as const

type CalendarListResult =
  | { ok: true; events: RoadmapCalendarEvent[]; canManageCalendar: boolean }
  | { error: string }

type CalendarWriteResult =
  | { ok: true; event: RoadmapCalendarEvent }
  | { error: string }

type CalendarDeleteResult = { ok: true } | { error: string }

type FeedTokenResult =
  | {
      ok: true
      publicToken: string
      internalToken: string
    }
  | { error: string }

type FeedRotateResult = { ok: true; token: string } | { error: string }

async function resolveCalendarAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
) {
  const { orgId, role } = await resolveActiveOrganization(supabase, userId)
  let canManageCalendar = role === "owner" || role === "admin"

  if (role === "staff") {
    const { data: settingsRow } = await supabase
      .from("organization_access_settings")
      .select("staff_can_manage_calendar")
      .eq("org_id", orgId)
      .maybeSingle<{ staff_can_manage_calendar: boolean }>()
    canManageCalendar = Boolean(settingsRow?.staff_can_manage_calendar)
  }

  return { orgId, role, canManageCalendar }
}

function createFeedToken() {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid.replace(/-/g, "")
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
}

function normalizeCalendarInput(input: RoadmapCalendarEventInput) {
  const title = input.title?.trim()
  if (!title) return { error: "Event title is required." } as const

  const startsAt = new Date(input.startsAt)
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "Start date is invalid." } as const
  }

  const endsAt = input.endsAt ? new Date(input.endsAt) : null
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return { error: "End date is invalid." } as const
  }
  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    return { error: "End date must be after the start date." } as const
  }

  const assignedRoles = normalizeAssignedRoles(input.assignedRoles)
  const recurrence = normalizeRecurrence(input.recurrence)

  return {
    title,
    description: input.description?.trim() ?? null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt ? endsAt.toISOString() : null,
    allDay: Boolean(input.allDay),
    recurrence,
    status: input.status === "canceled" ? "canceled" : "active",
    assignedRoles: assignedRoles.length > 0 ? assignedRoles : (["admin"] as RoadmapCalendarAssignedRole[]),
  }
}

async function notifyCalendarChange({
  orgId,
  actorId,
  calendarType,
  action,
  event,
}: {
  orgId: string
  actorId: string
  calendarType: RoadmapCalendarType
  action: "created" | "updated" | "deleted"
  event: RoadmapCalendarEvent
}) {
  let adminClient: ReturnType<typeof createSupabaseAdminClient> | null = null
  try {
    adminClient = createSupabaseAdminClient()
  } catch {
    adminClient = null
  }

  if (!adminClient) return

  const { data: members } = await adminClient
    .from("organization_memberships")
    .select("member_id, role")
    .eq("org_id", orgId)
    .in("role", ["admin", "staff"])
    .returns<Array<{ member_id: string; role: string }>>()

  const { data: settingsRow } = await adminClient
    .from("organization_access_settings")
    .select("staff_can_manage_calendar")
    .eq("org_id", orgId)
    .maybeSingle<{ staff_can_manage_calendar: boolean }>()

  const allowedStaff = Boolean(settingsRow?.staff_can_manage_calendar)

  const recipientIds = new Set<string>([orgId])
  for (const member of members ?? []) {
    if (member.role === "admin") {
      recipientIds.add(member.member_id)
    }
    if (member.role === "staff" && allowedStaff) {
      recipientIds.add(member.member_id)
    }
  }

  const title = `Calendar event ${action}`
  const description = `${event.title} was ${action}.`

  await Promise.all(
    Array.from(recipientIds).map((userId) =>
      createNotification(adminClient!, {
        userId,
        title,
        description,
        href: "/roadmap",
        tone: action === "deleted" ? "warning" : "info",
        type: `roadmap_calendar_${action}`,
        actorId,
        orgId,
        metadata: {
          eventId: event.id,
          calendarType,
        },
      })
    )
  )
}

export async function listRoadmapCalendarEvents({
  calendarType,
  from,
  to,
}: {
  calendarType: RoadmapCalendarType
  from?: string | null
  to?: string | null
}): Promise<CalendarListResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) {
    return { error: "Unable to load user." }
  }
  if (!user) return { error: "Not authenticated." }

  const { orgId, canManageCalendar } = await resolveCalendarAccess(supabase, user.id)
  const table = CALENDAR_TABLES[calendarType].events

  let query = supabase
    .from(table)
    .select("id,org_id,title,description,starts_at,ends_at,all_day,recurrence,status,assigned_roles,created_at,updated_at")
    .eq("org_id", orgId)
    .order("starts_at", { ascending: true })

  if (from) {
    query = query.gte("starts_at", from)
  }
  if (to) {
    query = query.lte("starts_at", to)
  }

  const { data, error: listError } = await query

  if (listError) return { error: listError.message }

  return {
    ok: true,
    events: (data ?? []).map(mapCalendarRow),
    canManageCalendar,
  }
}

export async function createRoadmapCalendarEvent({
  calendarType,
  event,
}: {
  calendarType: RoadmapCalendarType
  event: RoadmapCalendarEventInput
}): Promise<CalendarWriteResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) {
    return { error: "Unable to load user." }
  }
  if (!user) return { error: "Not authenticated." }

  const { orgId, canManageCalendar } = await resolveCalendarAccess(supabase, user.id)
  if (!canManageCalendar) return { error: "Forbidden." }

  const normalized = normalizeCalendarInput(event)
  if ("error" in normalized) return normalized

  const table = CALENDAR_TABLES[calendarType].events

  const { data, error: insertError } = await supabase
    .from(table)
    .insert({
      org_id: orgId,
      title: normalized.title,
      description: normalized.description,
      starts_at: normalized.startsAt,
      ends_at: normalized.endsAt,
      all_day: normalized.allDay,
      recurrence: normalized.recurrence,
      status: normalized.status,
      assigned_roles: normalized.assignedRoles,
    })
    .select("id,org_id,title,description,starts_at,ends_at,all_day,recurrence,status,assigned_roles,created_at,updated_at")
    .maybeSingle()

  if (insertError || !data) return { error: insertError?.message ?? "Unable to create event." }

  const mapped = mapCalendarRow(data)
  await notifyCalendarChange({ orgId, actorId: user.id, calendarType, action: "created", event: mapped })

  return { ok: true, event: mapped }
}

export async function updateRoadmapCalendarEvent({
  calendarType,
  eventId,
  updates,
}: {
  calendarType: RoadmapCalendarType
  eventId: string
  updates: RoadmapCalendarEventUpdate
}): Promise<CalendarWriteResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) {
    return { error: "Unable to load user." }
  }
  if (!user) return { error: "Not authenticated." }

  const { orgId, canManageCalendar } = await resolveCalendarAccess(supabase, user.id)
  if (!canManageCalendar) return { error: "Forbidden." }

  const table = CALENDAR_TABLES[calendarType].events

  const { data: existing } = await supabase
    .from(table)
    .select("id,org_id,title,description,starts_at,ends_at,all_day,recurrence,status,assigned_roles,created_at,updated_at")
    .eq("org_id", orgId)
    .eq("id", eventId)
    .maybeSingle()

  if (!existing) return { error: "Event not found." }

  const normalized = normalizeCalendarInput({
    title: updates.title ?? existing.title,
    description: updates.description ?? existing.description,
    startsAt: updates.startsAt ?? existing.starts_at,
    endsAt: updates.endsAt ?? existing.ends_at,
    allDay: updates.allDay ?? existing.all_day,
    recurrence: updates.recurrence ?? (existing.recurrence as RoadmapCalendarRecurrence | null),
    status: updates.status ?? (existing.status === "canceled" ? "canceled" : "active"),
    assignedRoles: updates.assignedRoles ?? normalizeAssignedRoles(existing.assigned_roles ?? []),
  })

  if ("error" in normalized) return normalized

  const { data, error: updateError } = await supabase
    .from(table)
    .update({
      title: normalized.title,
      description: normalized.description,
      starts_at: normalized.startsAt,
      ends_at: normalized.endsAt,
      all_day: normalized.allDay,
      recurrence: normalized.recurrence,
      status: normalized.status,
      assigned_roles: normalized.assignedRoles,
    })
    .eq("org_id", orgId)
    .eq("id", eventId)
    .select("id,org_id,title,description,starts_at,ends_at,all_day,recurrence,status,assigned_roles,created_at,updated_at")
    .maybeSingle()

  if (updateError || !data) return { error: updateError?.message ?? "Unable to update event." }

  const mapped = mapCalendarRow(data)
  await notifyCalendarChange({ orgId, actorId: user.id, calendarType, action: "updated", event: mapped })

  return { ok: true, event: mapped }
}

export async function deleteRoadmapCalendarEvent({
  calendarType,
  eventId,
}: {
  calendarType: RoadmapCalendarType
  eventId: string
}): Promise<CalendarDeleteResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) {
    return { error: "Unable to load user." }
  }
  if (!user) return { error: "Not authenticated." }

  const { orgId, canManageCalendar } = await resolveCalendarAccess(supabase, user.id)
  if (!canManageCalendar) return { error: "Forbidden." }

  const table = CALENDAR_TABLES[calendarType].events

  const { data: existing } = await supabase
    .from(table)
    .select("id,org_id,title,description,starts_at,ends_at,all_day,recurrence,status,assigned_roles,created_at,updated_at")
    .eq("org_id", orgId)
    .eq("id", eventId)
    .maybeSingle()

  const { error: deleteError } = await supabase.from(table).delete().eq("org_id", orgId).eq("id", eventId)

  if (deleteError) return { error: deleteError.message }

  if (existing) {
    await notifyCalendarChange({
      orgId,
      actorId: user.id,
      calendarType,
      action: "deleted",
      event: mapCalendarRow(existing),
    })
  }

  return { ok: true }
}

export async function getRoadmapCalendarFeedTokens(): Promise<FeedTokenResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) {
    return { error: "Unable to load user." }
  }
  if (!user) return { error: "Not authenticated." }

  const { orgId, canManageCalendar } = await resolveCalendarAccess(supabase, user.id)
  if (!canManageCalendar) return { error: "Forbidden." }

  const [publicToken, internalToken] = await Promise.all([
    ensureFeedToken({ supabase, orgId, calendarType: "public" }),
    ensureFeedToken({ supabase, orgId, calendarType: "internal" }),
  ])

  if (publicToken.error) return publicToken
  if (internalToken.error) return internalToken

  return {
    ok: true,
    publicToken: publicToken.token,
    internalToken: internalToken.token,
  }
}

export async function rotateRoadmapCalendarFeedToken({
  calendarType,
}: {
  calendarType: RoadmapCalendarType
}): Promise<FeedRotateResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error && !isSupabaseAuthSessionMissingError(error)) {
    return { error: "Unable to load user." }
  }
  if (!user) return { error: "Not authenticated." }

  const { orgId, canManageCalendar } = await resolveCalendarAccess(supabase, user.id)
  if (!canManageCalendar) return { error: "Forbidden." }

  const table = CALENDAR_TABLES[calendarType].feeds
  const token = createFeedToken()

  const { data, error: updateError } = await supabase
    .from(table)
    .upsert({ org_id: orgId, token, rotated_at: new Date().toISOString() })
    .select("token")
    .maybeSingle<{ token: string }>()

  if (updateError || !data) return { error: updateError?.message ?? "Unable to rotate token." }

  return { ok: true, token: data.token }
}

async function ensureFeedToken({
  supabase,
  orgId,
  calendarType,
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
  orgId: string
  calendarType: RoadmapCalendarType
}): Promise<{ token: string } | { error: string }> {
  const table = CALENDAR_TABLES[calendarType].feeds
  const { data: existing } = await supabase
    .from(table)
    .select("token")
    .eq("org_id", orgId)
    .maybeSingle<{ token: string }>()

  if (existing?.token) return { token: existing.token }

  const token = createFeedToken()
  const { data, error } = await supabase
    .from(table)
    .insert({ org_id: orgId, token })
    .select("token")
    .maybeSingle<{ token: string }>()

  if (error || !data) return { error: error?.message ?? "Unable to create feed token." }
  return { token: data.token }
}
