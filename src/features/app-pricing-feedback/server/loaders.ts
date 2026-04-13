import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase"
import { resolveAppPricingFeedbackPrompt, APP_PRICING_FEEDBACK_SURVEY_KEY } from "../lib"
import type { AppPricingFeedbackPrompt } from "../types"
import { isMissingAppPricingFeedbackResponsesTableError } from "./table-errors"

type AppPricingFeedbackQueryClient = Pick<SupabaseClient<Database, "public">, "from">

export async function loadAppPricingFeedbackPrompt({
  supabase,
  userId,
}: {
  supabase: AppPricingFeedbackQueryClient
  userId: string
}): Promise<AppPricingFeedbackPrompt | null> {
  const { data, error } = await supabase
    .from("app_pricing_feedback_responses")
    .select("id")
    .eq("user_id", userId)
    .eq("survey_key", APP_PRICING_FEEDBACK_SURVEY_KEY)
    .maybeSingle<{ id: string }>()

  if (error) {
    if (!isMissingAppPricingFeedbackResponsesTableError(error)) {
      console.error("Unable to load app pricing feedback prompt.", error)
    }
    return null
  }

  return resolveAppPricingFeedbackPrompt(Boolean(data?.id))
}
