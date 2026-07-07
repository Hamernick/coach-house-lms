import { createSupabaseAdminClient } from "@/lib/supabase/admin"

import { normalizePageHealthEventInput } from "../lib"
import type { PageHealthEventInput } from "../types"

type RecordPageHealthEventInput = {
  input: PageHealthEventInput
  userId?: string | null
  orgId?: string | null
}

type PageHealthRecordResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: "unavailable" | "insert_failed" }

function isPageHealthSchemaUnavailableError(error: unknown) {
  const maybeError = error as {
    code?: string
    message?: string
    details?: string
  } | null
  const message =
    `${maybeError?.message ?? ""} ${maybeError?.details ?? ""}`.toLowerCase()

  return (
    maybeError?.code === "PGRST205" ||
    (message.includes("schema cache") &&
      message.includes("app_page_health_events"))
  )
}

export async function recordPageHealthEvent({
  input,
  orgId,
  userId,
}: RecordPageHealthEventInput): Promise<PageHealthRecordResult> {
  let client: ReturnType<typeof createSupabaseAdminClient>
  try {
    client = createSupabaseAdminClient()
  } catch {
    return { ok: false, reason: "unavailable" }
  }

  const normalized = normalizePageHealthEventInput(input)
  const { data, error } = await client
    .from("app_page_health_events")
    .insert({
      user_id: userId ?? null,
      org_id: orgId ?? null,
      event_type: normalized.eventType,
      severity: normalized.severity,
      source: normalized.source,
      route_path: normalized.routePath,
      target_href: normalized.targetHref,
      duration_ms: normalized.durationMs,
      threshold_ms: normalized.thresholdMs,
      error_name: normalized.errorName,
      error_message: normalized.errorMessage,
      error_digest: normalized.errorDigest,
      stack_hash: normalized.stackHash,
      metadata: normalized.metadata,
    })
    .select("id")
    .single<{ id: string }>()

  if (error) {
    return isPageHealthSchemaUnavailableError(error)
      ? { ok: false, reason: "unavailable" }
      : { ok: false, reason: "insert_failed" }
  }

  return { ok: true, id: data?.id ?? null }
}
