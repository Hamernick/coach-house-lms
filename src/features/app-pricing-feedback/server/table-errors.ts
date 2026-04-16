function getAppPricingFeedbackErrorText(record: Record<string, unknown>) {
  return [
    typeof record.message === "string" ? record.message : "",
    typeof record.details === "string" ? record.details : "",
    typeof record.hint === "string" ? record.hint : "",
  ]
    .join(" ")
    .toLowerCase()
}

function isMissingAppPricingFeedbackTableError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  const code = typeof record.code === "string" ? record.code : ""

  if (code === "42P01" || code === "42703" || code === "PGRST205") {
    return true
  }

  const text = getAppPricingFeedbackErrorText(record)
  if (!text.includes("app_pricing_feedback_responses") && !text.includes("response_kind")) {
    return false
  }

  return (
    text.includes("does not exist") ||
    text.includes("could not find the table") ||
    text.includes("could not find the 'response_kind' column") ||
    text.includes("schema cache")
  )
}

export function isAppPricingFeedbackOrgReferenceError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code !== "23503") return false

  const text = getAppPricingFeedbackErrorText(record)
  return (
    text.includes("app_pricing_feedback_responses_org_id_fkey") ||
    (text.includes("app_pricing_feedback_responses") && text.includes("org_id"))
  )
}

export function isMissingAppPricingFeedbackResponsesTableError(error: unknown) {
  return isMissingAppPricingFeedbackTableError(error)
}
