import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { usePathnameMock, useAppPricingFeedbackControllerMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
  useAppPricingFeedbackControllerMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}))

vi.mock("@/features/app-pricing-feedback/hooks/use-app-pricing-feedback-controller", () => ({
  useAppPricingFeedbackController: useAppPricingFeedbackControllerMock,
}))

const PROMPT = {
  surveyKey: "coach-house-monthly-price-20-v1",
  pricePerMonthUsd: 20,
  bannerEyebrow: "Quick question",
  bannerMessage: "Would you pay $20/month to keep using Coach House if it feels worth it?",
  yesLabel: "Yes",
  noLabel: "No",
  skipLabel: "Skip",
  thankYouMessage: "Thanks. We saved your response.",
} as const

describe("AppPricingFeedbackPrompt", () => {
  beforeEach(() => {
    usePathnameMock.mockReset()
    useAppPricingFeedbackControllerMock.mockReset()
    useAppPricingFeedbackControllerMock.mockReturnValue({
      error: null,
      isPending: false,
      showConfirmation: false,
      bannerVisible: true,
      submit: vi.fn(),
    })
  })

  it("renders the banner on workspace routes", async () => {
    usePathnameMock.mockReturnValue("/workspace")
    const { AppPricingFeedbackPrompt } = await import(
      "@/features/app-pricing-feedback/components/app-pricing-feedback-prompt"
    )

    const markup = renderToStaticMarkup(
      createElement(AppPricingFeedbackPrompt, {
        prompt: PROMPT,
        tutorial: "platform",
        tutorialPending: false,
      }),
    )

    expect(markup).toContain("Would you pay $20/month to keep using Coach House if it feels worth it?")
    expect(markup).toContain("fixed")
  })

  it("does not render the banner outside workspace routes", async () => {
    usePathnameMock.mockReturnValue("/find/a-more-just-chicago")
    const { AppPricingFeedbackPrompt } = await import(
      "@/features/app-pricing-feedback/components/app-pricing-feedback-prompt"
    )

    const markup = renderToStaticMarkup(
      createElement(AppPricingFeedbackPrompt, {
        prompt: PROMPT,
        tutorial: "platform",
        tutorialPending: false,
      }),
    )

    expect(markup).toBe("")
  })
})
