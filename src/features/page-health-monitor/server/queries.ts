import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase"

import {
  buildPageHealthMonitorInput,
  createEmptyPageHealthMonitorInput,
  PAGE_HEALTH_MONITOR_WINDOW_DAYS,
} from "../lib"
import type { PageHealthIdentity, PageHealthRawEvent } from "../types"

const PAGE_HEALTH_MIGRATION_PENDING_MESSAGE =
  "Page-health migration pending. Apply the `app_page_health_events` migration, then refresh this view."

type SupabaseQueryError = {
  code?: string
  message?: string
  details?: string
}

type ProfileIdentityRow = {
  id: string
  email: string | null
  full_name: string | null
}

type OrganizationIdentityRow = {
  user_id: string
  profile: Json
}

function unavailableInput(generatedAt: string, message: string) {
  return createEmptyPageHealthMonitorInput({
    generatedAt,
    status: "unavailable",
    statusMessage: message,
  })
}

function isMissingPageHealthTableError(
  error: SupabaseQueryError | null | undefined
) {
  const message =
    `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase()
  return (
    error?.code === "PGRST205" ||
    (message.includes("schema cache") &&
      message.includes("app_page_health_events"))
  )
}

function pageHealthErrorMessage(error: SupabaseQueryError | null | undefined) {
  if (isMissingPageHealthTableError(error)) {
    return PAGE_HEALTH_MIGRATION_PENDING_MESSAGE
  }
  return error?.message ?? "Page-health events could not be loaded."
}

function collectIds(events: PageHealthRawEvent[], key: "user_id" | "org_id") {
  return Array.from(
    new Set(
      events
        .map((event) => event[key])
        .filter((value): value is string => typeof value === "string")
    )
  )
}

function resolveOrganizationName(profile: Json) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return null
  }
  const record = profile as Record<string, unknown>
  const candidates = [record.name, record.orgName, record.organizationName]
  return (
    candidates
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .find((value) => value.length > 0) ?? null
  )
}

function buildUserIdentities(rows: ProfileIdentityRow[]) {
  return new Map<string, PageHealthIdentity>(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        label: row.full_name?.trim() || row.email?.trim() || row.id,
        detail: row.email?.trim() || null,
      },
    ])
  )
}

function buildOrgIdentities(rows: OrganizationIdentityRow[]) {
  return new Map<string, PageHealthIdentity>(
    rows.map((row) => [
      row.user_id,
      {
        id: row.user_id,
        label: resolveOrganizationName(row.profile) ?? row.user_id,
        detail: null,
      },
    ])
  )
}

export async function getPageHealthMonitorPageInput() {
  const generatedAt = new Date().toISOString()
  const since = new Date(
    Date.now() - PAGE_HEALTH_MONITOR_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  let supabase: ReturnType<typeof createSupabaseAdminClient>
  try {
    supabase = createSupabaseAdminClient()
  } catch {
    return unavailableInput(
      generatedAt,
      "Service-role page-health access is not configured for this environment."
    )
  }

  const eventsResult = await supabase
    .from("app_page_health_events")
    .select(
      "id,user_id,org_id,event_type,severity,source,route_path,target_href,duration_ms,threshold_ms,error_name,error_message,error_digest,stack_hash,metadata,occurred_at"
    )
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(500)
    .returns<PageHealthRawEvent[]>()

  if (eventsResult.error) {
    return unavailableInput(
      generatedAt,
      pageHealthErrorMessage(eventsResult.error)
    )
  }

  const rawEvents = eventsResult.data ?? []
  const userIds = collectIds(rawEvents, "user_id")
  const orgIds = collectIds(rawEvents, "org_id")

  const [profilesResult, organizationsResult] = await Promise.all([
    userIds.length > 0
      ? supabase
          .from("profiles")
          .select("id,email,full_name")
          .in("id", userIds)
          .returns<ProfileIdentityRow[]>()
      : Promise.resolve({ data: [] as ProfileIdentityRow[], error: null }),
    orgIds.length > 0
      ? supabase
          .from("organizations")
          .select("user_id,profile")
          .in("user_id", orgIds)
          .returns<OrganizationIdentityRow[]>()
      : Promise.resolve({ data: [] as OrganizationIdentityRow[], error: null }),
  ])

  return buildPageHealthMonitorInput({
    generatedAt,
    rawEvents,
    userIdentities: buildUserIdentities(profilesResult.data ?? []),
    orgIdentities: buildOrgIdentities(organizationsResult.data ?? []),
  })
}
