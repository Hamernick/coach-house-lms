import type {
  AppPricingFeedbackAnswer,
  AppPricingFeedbackInput,
  AppPricingFeedbackNormalizedInput,
  AppPricingFeedbackPrompt,
  AppPricingFeedbackTutorialKey,
} from "../types"

export const APP_PRICING_FEEDBACK_SURVEY_KEY = "coach-house-monthly-price-20-v1"
export const APP_PRICING_FEEDBACK_PRICE_PER_MONTH_USD = 20
export const APP_PRICING_FEEDBACK_REVEAL_DELAY_MS = 650

const APP_PRICING_FEEDBACK_PROMPT: AppPricingFeedbackPrompt = {
  surveyKey: APP_PRICING_FEEDBACK_SURVEY_KEY,
  pricePerMonthUsd: APP_PRICING_FEEDBACK_PRICE_PER_MONTH_USD,
  bannerEyebrow: "Quick question",
  bannerMessage: "Would you pay $20/month to keep using Coach House if it feels worth it?",
  yesLabel: "Yes",
  noLabel: "No",
  skipLabel: "Skip",
  thankYouMessage: "Thanks. We saved your response.",
}

export function isAppPricingFeedbackAnswer(value: string): value is AppPricingFeedbackAnswer {
  return value === "yes" || value === "no"
}

export function isAppPricingFeedbackWorkspaceRoute(pathname: string | null) {
  return pathname === "/workspace" || Boolean(pathname?.startsWith("/workspace/"))
}

export function getAppPricingFeedbackTutorialStorageKeys(
  tutorial: AppPricingFeedbackTutorialKey,
) {
  if (tutorial === "accelerator") {
    return [
      "coachhouse_tutorial_completed_accelerator",
      "coachhouse_tutorial_dismissed_accelerator",
    ]
  }

  return [
    "coachhouse_tutorial_completed_platform",
    "coachhouse_tutorial_dismissed_platform",
    "coachhouse_tour_completed",
  ]
}

export function resolveAppPricingFeedbackPrompt(hasResponse: boolean): AppPricingFeedbackPrompt | null {
  return hasResponse ? null : APP_PRICING_FEEDBACK_PROMPT
}

export function normalizeAppPricingFeedbackInput(
  input: AppPricingFeedbackInput,
): { ok: true; value: AppPricingFeedbackNormalizedInput } | { ok: false; error: string } {
  if (input.selection === "skip") {
    return {
      ok: true,
      value: {
        surveyKey: APP_PRICING_FEEDBACK_SURVEY_KEY,
        pricePerMonthUsd: APP_PRICING_FEEDBACK_PRICE_PER_MONTH_USD,
        responseKind: "skipped",
        wouldPay: null,
      },
    }
  }

  if (!input.selection) {
    return { ok: false, error: "Choose yes or no before sending feedback." }
  }

  return {
    ok: true,
    value: {
      surveyKey: APP_PRICING_FEEDBACK_SURVEY_KEY,
      pricePerMonthUsd: APP_PRICING_FEEDBACK_PRICE_PER_MONTH_USD,
      responseKind: "answered",
      wouldPay: input.selection === "yes",
    },
  }
}
