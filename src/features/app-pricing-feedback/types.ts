export type AppPricingFeedbackAnswer = "yes" | "no"
export type AppPricingFeedbackSelection = AppPricingFeedbackAnswer | "skip"
export type AppPricingFeedbackResponseKind = "answered" | "skipped"
export type AppPricingFeedbackTutorialKey = "platform" | "accelerator"

export type AppPricingFeedbackInput = {
  selection: AppPricingFeedbackSelection | null
}

export type AppPricingFeedbackNormalizedInput = {
  surveyKey: string
  pricePerMonthUsd: number
  responseKind: AppPricingFeedbackResponseKind
  wouldPay: boolean | null
}

export type AppPricingFeedbackPrompt = {
  surveyKey: string
  pricePerMonthUsd: number
  bannerEyebrow: string
  bannerMessage: string
  yesLabel: string
  noLabel: string
  skipLabel: string
  thankYouMessage: string
}

export type SaveAppPricingFeedbackResult =
  | { ok: true }
  | { error: string }
