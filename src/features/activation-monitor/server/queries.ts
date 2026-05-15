import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import {
  ACTIVATION_MONITOR_WINDOW_DAYS,
  buildActivationMonitorInput,
  createEmptyActivationMonitorInput,
} from "../lib"
import type {
  ActivationMonitorRawCheckpoint,
  ActivationMonitorRawEvent,
} from "../types"

const TELEMETRY_MIGRATION_PENDING_MESSAGE =
  "Telemetry migration pending. Run `pnpm db:push` so Supabase creates `user_journey_events` and `user_activation_checkpoints`, then refresh this view."

type SupabaseQueryError = {
  code?: string
  message?: string
  details?: string
}

function telemetryUnavailableInput(generatedAt: string, message: string) {
  return createEmptyActivationMonitorInput({
    generatedAt,
    status: "unavailable",
    statusMessage: message,
  })
}

function isMissingTelemetryTableError(error: SupabaseQueryError | null | undefined) {
  const message = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase()

  return (
    error?.code === "PGRST205" ||
    (message.includes("schema cache") &&
      (message.includes("user_journey_events") ||
        message.includes("user_activation_checkpoints")))
  )
}

function telemetryErrorMessage(
  eventsError: SupabaseQueryError | null | undefined,
  checkpointsError: SupabaseQueryError | null | undefined,
) {
  if (
    isMissingTelemetryTableError(eventsError) ||
    isMissingTelemetryTableError(checkpointsError)
  ) {
    return TELEMETRY_MIGRATION_PENDING_MESSAGE
  }

  return (
    eventsError?.message ??
    checkpointsError?.message ??
    "Telemetry tables could not be loaded."
  )
}

export async function getActivationMonitorPageInput() {
  const generatedAt = new Date().toISOString()
  const since = new Date(
    Date.now() - ACTIVATION_MONITOR_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  let supabase: ReturnType<typeof createSupabaseAdminClient>
  try {
    supabase = createSupabaseAdminClient()
  } catch {
    return telemetryUnavailableInput(
      generatedAt,
      "Service-role telemetry access is not configured for this environment.",
    )
  }

  const [eventsResult, checkpointsResult] = await Promise.all([
    supabase
      .from("user_journey_events")
      .select("id, user_id, org_id, event_name, journey, source, surface, plan_tier, occurred_at")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(500)
      .returns<ActivationMonitorRawEvent[]>(),
    supabase
      .from("user_activation_checkpoints")
      .select("id, user_id, org_id, checkpoint, completed_at")
      .gte("completed_at", since)
      .order("completed_at", { ascending: false })
      .limit(1000)
      .returns<ActivationMonitorRawCheckpoint[]>(),
  ])

  if (eventsResult.error || checkpointsResult.error) {
    return telemetryUnavailableInput(
      generatedAt,
      telemetryErrorMessage(eventsResult.error, checkpointsResult.error),
    )
  }

  return buildActivationMonitorInput({
    generatedAt,
    events: eventsResult.data ?? [],
    checkpoints: checkpointsResult.data ?? [],
  })
}
