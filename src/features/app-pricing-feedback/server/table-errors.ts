function isMissingAppPricingFeedbackTableError(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as Record<string, unknown>
  if (record.code === "42P01" || record.code === "PGRST205") return true

  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.details === "string"
        ? record.details
        : ""

  if (
    message.includes("app_pricing_feedback_responses") ||
    message.includes("response_kind")
  ) {
    return true
  }

  const hint = typeof record.hint === "string" ? record.hint : ""
  return hint.includes("app_pricing_feedback_responses") || hint.includes("response_kind")
}

export function isMissingAppPricingFeedbackResponsesTableError(error: unknown) {
  return isMissingAppPricingFeedbackTableError(error)
}
