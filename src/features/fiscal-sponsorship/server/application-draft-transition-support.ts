import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase"

type DraftTransitionResult =
  | { applicationId: string; ok: true; updatedAt: string }
  | { code: string; ok: false; status?: string }

function parseDraftTransitionResult(
  value: unknown
): DraftTransitionResult | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const result = value as Record<string, unknown>
  if (result.ok === false && typeof result.code === "string") {
    return {
      code: result.code,
      ok: false,
      ...(typeof result.status === "string" ? { status: result.status } : {}),
    }
  }

  if (
    result.ok === true &&
    typeof result.applicationId === "string" &&
    typeof result.updatedAt === "string"
  ) {
    return {
      applicationId: result.applicationId,
      ok: true,
      updatedAt: result.updatedAt,
    }
  }

  return null
}

function isMissingDraftTransitionError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42883" || record.code === "PGRST202") return true
  return (
    typeof record.message === "string" &&
    record.message.includes(
      "save_fiscal_sponsorship_application_draft_transition"
    )
  )
}

function draftTransitionFailure(code: string) {
  if (code === "stale") {
    return { error: "This draft changed. Refresh before saving again." }
  }
  if (code === "project_not_found") {
    return { error: "Unable to find that organization project." }
  }
  if (code === "source_activity_not_found") {
    return { error: "Unable to find the selected activity budget." }
  }
  if (code === "invalid_budget") {
    return { error: "The selected activity budget could not be saved." }
  }
  if (code === "invalid_status") {
    return {
      error:
        "This application is locked while Coach House reviews or processes it.",
    }
  }
  return { error: "Unable to save fiscal sponsorship application." }
}

export async function saveFiscalApplicationDraftTransition({
  actorId,
  allowLocked,
  budgetRows,
  budgetTotalCents,
  expectedUpdatedAt,
  hasBudgetRows,
  payload,
  projectId,
  sourceActivityId,
}: {
  actorId: string
  allowLocked: boolean
  budgetRows: Json
  budgetTotalCents: number
  expectedUpdatedAt: string | null
  hasBudgetRows: boolean
  payload: Json
  projectId: string
  sourceActivityId: string | null
}) {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.rpc(
    "save_fiscal_sponsorship_application_draft_transition",
    {
      p_actor_id: actorId,
      p_allow_locked: allowLocked,
      p_budget_rows: budgetRows,
      p_budget_total_cents: budgetTotalCents,
      p_expected_updated_at: expectedUpdatedAt,
      p_has_budget_rows: hasBudgetRows,
      p_payload: payload,
      p_project_id: projectId,
      p_source_activity_id: sourceActivityId,
    }
  )

  if (error) {
    return isMissingDraftTransitionError(error)
      ? {
          error:
            "Fiscal sponsorship applications are not available until the latest database migrations are applied.",
        }
      : { error: "Unable to save fiscal sponsorship application." }
  }

  const result = parseDraftTransitionResult(data)
  if (!result) {
    return { error: "Unable to save fiscal sponsorship application." }
  }
  if (!result.ok) return draftTransitionFailure(result.code)

  return {
    applicationId: result.applicationId,
    ok: true as const,
    updatedAt: result.updatedAt,
  }
}
