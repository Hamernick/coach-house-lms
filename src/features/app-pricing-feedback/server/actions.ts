"use server"

import { resolveAuthenticatedAppContext } from "@/lib/auth/request-context"
import type { Database } from "@/lib/supabase"
import { normalizeAppPricingFeedbackInput } from "../lib"
import type { AppPricingFeedbackInput, SaveAppPricingFeedbackResult } from "../types"
import { isMissingAppPricingFeedbackResponsesTableError } from "./table-errors"

type AppPricingFeedbackInsert =
  Database["public"]["Tables"]["app_pricing_feedback_responses"]["Insert"]

export async function saveAppPricingFeedback(
  input: AppPricingFeedbackInput,
): Promise<SaveAppPricingFeedbackResult> {
  const { supabase, user, activeOrg } = await resolveAuthenticatedAppContext()
  const normalized = normalizeAppPricingFeedbackInput(input)
  if (!normalized.ok) {
    return { error: normalized.error }
  }

  const payload: AppPricingFeedbackInsert = {
    user_id: user.id,
    org_id: activeOrg.orgId,
    survey_key: normalized.value.surveyKey,
    price_per_month_usd: normalized.value.pricePerMonthUsd,
    response_kind: normalized.value.responseKind,
    would_pay: normalized.value.wouldPay,
    feedback: null,
  }

  const { error } = await supabase
    .from("app_pricing_feedback_responses")
    .upsert(payload, { onConflict: "user_id,survey_key" })

  if (error) {
    if (isMissingAppPricingFeedbackResponsesTableError(error)) {
      return {
        error:
          "Pricing feedback is not available until the latest database migrations are applied.",
      }
    }
    return { error: "Unable to save pricing feedback right now." }
  }

  return { ok: true }
}
