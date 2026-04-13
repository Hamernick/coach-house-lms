import { describe, expect, it } from "vitest"

import {
  APP_PRICING_FEEDBACK_PRICE_PER_MONTH_USD,
  APP_PRICING_FEEDBACK_SURVEY_KEY,
  APP_PRICING_FEEDBACK_REVEAL_DELAY_MS,
  getAppPricingFeedbackTutorialStorageKeys,
  isAppPricingFeedbackAnswer,
  isAppPricingFeedbackWorkspaceRoute,
  normalizeAppPricingFeedbackInput,
  resolveAppPricingFeedbackPrompt,
} from "@/features/app-pricing-feedback"

describe("app pricing feedback feature contract", () => {
  it("requires a yes or no answer", () => {
    expect(
      normalizeAppPricingFeedbackInput({
        selection: null,
      }),
    ).toEqual({
      ok: false,
      error: "Choose yes or no before sending feedback.",
    })
  })

  it("normalizes yes responses into a persisted payload", () => {
    expect(
      normalizeAppPricingFeedbackInput({
        selection: "yes",
      }),
    ).toEqual({
      ok: true,
      value: {
        surveyKey: APP_PRICING_FEEDBACK_SURVEY_KEY,
        pricePerMonthUsd: APP_PRICING_FEEDBACK_PRICE_PER_MONTH_USD,
        responseKind: "answered",
        wouldPay: true,
      },
    })
  })

  it("preserves no responses as explicit answered feedback", () => {
    expect(
      normalizeAppPricingFeedbackInput({
        selection: "no",
      }),
    ).toEqual({
      ok: true,
      value: {
        surveyKey: APP_PRICING_FEEDBACK_SURVEY_KEY,
        pricePerMonthUsd: APP_PRICING_FEEDBACK_PRICE_PER_MONTH_USD,
        responseKind: "answered",
        wouldPay: false,
      },
    })
  })

  it("records skips without forcing a yes or no answer", () => {
    expect(
      normalizeAppPricingFeedbackInput({
        selection: "skip",
      }),
    ).toEqual({
      ok: true,
      value: {
        surveyKey: APP_PRICING_FEEDBACK_SURVEY_KEY,
        pricePerMonthUsd: APP_PRICING_FEEDBACK_PRICE_PER_MONTH_USD,
        responseKind: "skipped",
        wouldPay: null,
      },
    })
  })

  it("exposes the prompt only for unanswered users", () => {
    expect(resolveAppPricingFeedbackPrompt(true)).toBeNull()

    expect(resolveAppPricingFeedbackPrompt(false)).toMatchObject({
      surveyKey: APP_PRICING_FEEDBACK_SURVEY_KEY,
      pricePerMonthUsd: 20,
      yesLabel: "Yes",
      skipLabel: "Skip",
    })
  })

  it("accepts only yes/no answer values", () => {
    expect(isAppPricingFeedbackAnswer("yes")).toBe(true)
    expect(isAppPricingFeedbackAnswer("no")).toBe(true)
    expect(isAppPricingFeedbackAnswer("maybe")).toBe(false)
  })

  it("scopes the banner to /workspace routes", () => {
    expect(isAppPricingFeedbackWorkspaceRoute("/workspace")).toBe(true)
    expect(isAppPricingFeedbackWorkspaceRoute("/workspace/roadmap")).toBe(true)
    expect(isAppPricingFeedbackWorkspaceRoute("/organization")).toBe(false)
    expect(isAppPricingFeedbackWorkspaceRoute("/accelerator")).toBe(false)
  })

  it("uses tutorial completion markers that match the shell flow", () => {
    expect(getAppPricingFeedbackTutorialStorageKeys("platform")).toEqual([
      "coachhouse_tutorial_completed_platform",
      "coachhouse_tutorial_dismissed_platform",
      "coachhouse_tour_completed",
    ])
    expect(getAppPricingFeedbackTutorialStorageKeys("accelerator")).toEqual([
      "coachhouse_tutorial_completed_accelerator",
      "coachhouse_tutorial_dismissed_accelerator",
    ])
    expect(APP_PRICING_FEEDBACK_REVEAL_DELAY_MS).toBe(650)
  })
})
