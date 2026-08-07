import type { Json } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function transitionFiscalW9Completion({
  actorId,
  applicationId,
  document,
  expectedUpdatedAt,
}: {
  actorId: string
  applicationId: string
  document: Json
  expectedUpdatedAt: string
}) {
  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.rpc(
    "complete_fiscal_sponsorship_w9_transition",
    {
      p_actor_id: actorId,
      p_application_id: applicationId,
      p_document: document,
      p_expected_updated_at: expectedUpdatedAt,
    }
  )

  if (error) {
    const record = error as unknown as Record<string, unknown>
    const missing =
      record.code === "42883" ||
      record.code === "PGRST202" ||
      (typeof record.message === "string" &&
        record.message.includes("complete_fiscal_sponsorship_w9_transition"))
    return missing
      ? {
          error:
            "Fiscal sponsorship applications are not available until the latest database migrations are applied.",
        }
      : { error: "Unable to save the signed W-9 record." }
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { error: "Unable to save the signed W-9 record." }
  }
  const result = data as Record<string, unknown>
  if (
    result.ok === true &&
    typeof result.applicationId === "string" &&
    typeof result.documentId === "string" &&
    typeof result.version === "number"
  ) {
    return {
      applicationId: result.applicationId,
      documentId: result.documentId,
      ok: true as const,
      version: result.version,
    }
  }
  if (result.ok !== false || typeof result.code !== "string") {
    return { error: "Unable to save the signed W-9 record." }
  }
  if (result.code === "stale") {
    return { error: "This application changed. Refresh before signing again." }
  }
  if (result.code === "not_found") {
    return { error: "Unable to load fiscal sponsorship application." }
  }
  return { error: "Unable to save the signed W-9 record." }
}
