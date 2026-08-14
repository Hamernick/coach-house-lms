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
  | {
      ok: false
      reason: "unavailable" | "rate_limited" | "insert_failed"
    }

function isPageHealthSchemaUnavailableError(error: unknown) {
  const maybeError = error as {
    code?: string
    message?: string
    details?: string
  } | null
  const message =
    `${maybeError?.message ?? ""} ${maybeError?.details ?? ""}`.toLowerCase()

  return (
    maybeError?.code === "PGRST202" ||
    maybeError?.code === "PGRST205" ||
    (message.includes("schema cache") &&
      (message.includes("app_page_health_events") ||
        message.includes("record_page_health_event")))
  )
}

function readPageHealthRecordResult(data: unknown): PageHealthRecordResult {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, reason: "insert_failed" }
  }

  const result = data as { id?: unknown; status?: unknown }
  if (result.status === "rate_limited") {
    return { ok: false, reason: "rate_limited" }
  }

  if (result.status !== "recorded") {
    return { ok: false, reason: "insert_failed" }
  }

  return {
    ok: true,
    id: typeof result.id === "string" ? result.id : null,
  }
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
  const { data, error } = await client.rpc("record_page_health_event", {
    p_event: normalized,
    p_org_id: orgId ?? null,
    p_user_id: userId ?? null,
  })

  if (error) {
    return isPageHealthSchemaUnavailableError(error)
      ? { ok: false, reason: "unavailable" }
      : { ok: false, reason: "insert_failed" }
  }

  return readPageHealthRecordResult(data)
}
