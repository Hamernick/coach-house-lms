import type { SupabaseClient } from "@supabase/supabase-js"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Database, Json } from "@/lib/supabase"

export const USER_JOURNEY_EVENT_NAMES = [
  "checkout_started",
  "checkout_completed",
  "onboarding_completed",
  "member_onboarding_completed",
  "workspace_viewed",
  "homework_submitted",
  "module_note_saved",
  "coaching_schedule_opened",
  "organization_invite_created",
  "organization_invite_accepted",
] as const

export type UserJourneyEventName = (typeof USER_JOURNEY_EVENT_NAMES)[number]

export const USER_ACTIVATION_CHECKPOINTS = [
  "checkout_started",
  "paid_plan_confirmed",
  "account_onboarding_completed",
  "workspace_onboarding_started",
  "workspace_first_viewed",
  "first_homework_submitted",
  "first_module_note_saved",
  "first_coaching_schedule_opened",
  "first_organization_invite_sent",
  "member_onboarding_completed",
  "first_invite_accepted",
] as const

export type UserActivationCheckpoint = (typeof USER_ACTIVATION_CHECKPOINTS)[number]

type TelemetryClient = SupabaseClient<Database, "public">

type TrackUserJourneyEventInput = {
  userId?: string | null
  orgId?: string | null
  eventName: UserJourneyEventName
  journey?: string | null
  source?: string | null
  surface?: string | null
  planTier?: string | null
  metadata?: Record<string, unknown> | null
}

type CompleteActivationCheckpointInput = {
  userId: string
  orgId?: string | null
  checkpoint: UserActivationCheckpoint
  sourceEventId?: string | null
  metadata?: Record<string, unknown> | null
}

type TrackUserJourneyMilestoneInput = TrackUserJourneyEventInput & {
  userId: string
  checkpoint?: UserActivationCheckpoint | null
}

type TelemetryResult =
  | { ok: true; eventId: string | null }
  | { ok: false; eventId: null; reason: "unavailable" | "insert_failed" | "checkpoint_failed" }

const SENSITIVE_METADATA_KEYS = new Set([
  "email",
  "publicemail",
  "phone",
  "phonenumber",
  "token",
  "invitetoken",
  "inviteurl",
  "url",
  "href",
  "password",
  "firstname",
  "lastname",
  "fullname",
  "linkedin",
])

function normalizeMetadataKey(key: string) {
  return key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
}

function sanitizeTelemetryValue(value: unknown, depth = 0): Json | undefined {
  if (depth > 4) return null
  if (value == null) return null
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .map((item) => sanitizeTelemetryValue(item, depth + 1))
      .filter((item): item is Json => item !== undefined)
  }
  if (typeof value === "object") {
    const output: Record<string, Json> = {}
    for (const [key, item] of Object.entries(value).slice(0, 80)) {
      if (SENSITIVE_METADATA_KEYS.has(normalizeMetadataKey(key))) continue
      const sanitized = sanitizeTelemetryValue(item, depth + 1)
      if (sanitized !== undefined) output[key] = sanitized
    }
    return output
  }
  return undefined
}

function sanitizeTelemetryMetadata(metadata: Record<string, unknown> | null | undefined): Json {
  if (!metadata) return {}
  const sanitized = sanitizeTelemetryValue(metadata)
  return sanitized && typeof sanitized === "object" && !Array.isArray(sanitized) ? sanitized : {}
}

function createTelemetryClient(): TelemetryClient | null {
  if (
    process.env.NODE_ENV === "test" &&
    process.env.USER_JOURNEY_TELEMETRY_TEST_ENABLE !== "1"
  ) {
    return null
  }

  try {
    return createSupabaseAdminClient()
  } catch {
    return null
  }
}

function isTelemetrySchemaUnavailableError(error: unknown) {
  const maybeError = error as { code?: string; message?: string; details?: string } | null
  const message = `${maybeError?.message ?? ""} ${maybeError?.details ?? ""}`.toLowerCase()

  return (
    maybeError?.code === "PGRST205" ||
    (message.includes("schema cache") &&
      (message.includes("user_journey_events") ||
        message.includes("user_activation_checkpoints")))
  )
}

export async function trackUserJourneyEvent({
  userId,
  orgId,
  eventName,
  journey,
  source,
  surface,
  planTier,
  metadata,
}: TrackUserJourneyEventInput): Promise<TelemetryResult> {
  const client = createTelemetryClient()
  if (!client) return { ok: false, eventId: null, reason: "unavailable" }

  const { data, error } = await client
    .from("user_journey_events")
    .insert({
      user_id: userId ?? null,
      org_id: orgId ?? null,
      event_name: eventName,
      journey: journey ?? null,
      source: source ?? "server",
      surface: surface ?? null,
      plan_tier: planTier ?? null,
      metadata: sanitizeTelemetryMetadata(metadata),
    })
    .select("id")
    .single<{ id: string }>()

  if (error) {
    if (isTelemetrySchemaUnavailableError(error)) {
      return { ok: false, eventId: null, reason: "unavailable" }
    }
    return { ok: false, eventId: null, reason: "insert_failed" }
  }

  return { ok: true, eventId: data?.id ?? null }
}

export async function completeActivationCheckpoint({
  userId,
  orgId,
  checkpoint,
  sourceEventId,
  metadata,
}: CompleteActivationCheckpointInput): Promise<TelemetryResult> {
  const client = createTelemetryClient()
  if (!client) return { ok: false, eventId: null, reason: "unavailable" }

  const { error } = await client.from("user_activation_checkpoints").upsert(
    {
      user_id: userId,
      org_id: orgId ?? userId,
      checkpoint,
      source_event_id: sourceEventId ?? null,
      metadata: sanitizeTelemetryMetadata(metadata),
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,org_id,checkpoint", ignoreDuplicates: true },
  )

  if (error) {
    if (isTelemetrySchemaUnavailableError(error)) {
      return { ok: false, eventId: null, reason: "unavailable" }
    }
    return { ok: false, eventId: null, reason: "checkpoint_failed" }
  }

  return { ok: true, eventId: sourceEventId ?? null }
}

export async function trackUserJourneyMilestone({
  checkpoint,
  ...event
}: TrackUserJourneyMilestoneInput): Promise<TelemetryResult> {
  const eventResult = await trackUserJourneyEvent(event)

  if (!checkpoint) return eventResult
  if (!eventResult.ok && eventResult.reason === "unavailable") return eventResult

  const checkpointResult = await completeActivationCheckpoint({
    userId: event.userId,
    orgId: event.orgId,
    checkpoint,
    sourceEventId: eventResult.eventId,
    metadata: event.metadata,
  })

  if (!eventResult.ok) return eventResult
  return checkpointResult.ok ? eventResult : checkpointResult
}
