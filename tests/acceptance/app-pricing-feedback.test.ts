import "./test-utils"

import { beforeEach, describe, expect, it, vi } from "vitest"

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
import { saveAppPricingFeedback } from "@/features/app-pricing-feedback/server/actions"
import { resetTestMocks } from "./test-utils"

const { resolveAuthenticatedAppContextMock } = vi.hoisted(() => ({
  resolveAuthenticatedAppContextMock: vi.fn(),
}))

vi.mock("@/lib/auth/request-context", () => ({
  resolveAuthenticatedAppContext: resolveAuthenticatedAppContextMock,
}))

describe("app pricing feedback feature contract", () => {
  beforeEach(() => {
    resetTestMocks()
    resolveAuthenticatedAppContextMock.mockReset()
  })

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
    expect(isAppPricingFeedbackWorkspaceRoute("/workspace/documents")).toBe(true)
    expect(isAppPricingFeedbackWorkspaceRoute("/find")).toBe(false)
    expect(isAppPricingFeedbackWorkspaceRoute("/find/a-more-just-chicago")).toBe(false)
    expect(isAppPricingFeedbackWorkspaceRoute("/organization")).toBe(false)
    expect(isAppPricingFeedbackWorkspaceRoute("/organization/workspace")).toBe(false)
    expect(isAppPricingFeedbackWorkspaceRoute("/my-organization")).toBe(false)
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

  it("retries without org context when the active organization reference is missing", async () => {
    const upsert = vi
      .fn()
      .mockResolvedValueOnce({
        error: {
          code: "23503",
          message:
            'insert or update on table "app_pricing_feedback_responses" violates foreign key constraint "app_pricing_feedback_responses_org_id_fkey"',
        },
      })
      .mockResolvedValueOnce({ error: null })

    resolveAuthenticatedAppContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn(() => ({
          upsert,
        })),
      },
      user: { id: "user-1" },
      activeOrg: { orgId: "org-missing", role: "owner" },
    })

    await expect(
      saveAppPricingFeedback({
        selection: "yes",
      }),
    ).resolves.toEqual({ ok: true })

    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        user_id: "user-1",
        org_id: "org-missing",
        survey_key: APP_PRICING_FEEDBACK_SURVEY_KEY,
        would_pay: true,
        response_kind: "answered",
      }),
      { onConflict: "user_id,survey_key" },
    )
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        user_id: "user-1",
        org_id: null,
        survey_key: APP_PRICING_FEEDBACK_SURVEY_KEY,
        would_pay: true,
        response_kind: "answered",
      }),
      { onConflict: "user_id,survey_key" },
    )
  })

  it("keeps the migrations toast scoped to missing table or column errors", async () => {
    const upsert = vi.fn().mockResolvedValue({
      error: {
        code: "42703",
        message: 'column "response_kind" of relation "app_pricing_feedback_responses" does not exist',
      },
    })

    resolveAuthenticatedAppContextMock.mockResolvedValue({
      supabase: {
        from: vi.fn(() => ({
          upsert,
        })),
      },
      user: { id: "user-1" },
      activeOrg: { orgId: "org-1", role: "owner" },
    })

    await expect(
      saveAppPricingFeedback({
        selection: "no",
      }),
    ).resolves.toEqual({
      error: "Pricing feedback is not available until the latest database migrations are applied.",
    })
  })
})
