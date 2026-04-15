import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { useSearchParamsMock } = vi.hoisted(() => ({
  useSearchParamsMock: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: useSearchParamsMock,
}))

import { PricingStep } from "@/components/onboarding/onboarding-dialog/components/pricing-step"
import { StepFooter } from "@/components/onboarding/onboarding-dialog/components/step-footer"

describe("onboarding pricing step", () => {
  beforeEach(() => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams())
  })

  it("renders an explicit continue button for paid post-signup access onboarding", () => {
    const markup = renderToStaticMarkup(
      createElement(PricingStep, {
        step: 1,
        attemptedStep: null,
        errors: {},
        currentPlanTier: "organization",
        checkoutReturnTo: "/onboarding?source=onboarding_pricing",
        onboardingMode: "post_signup_access",
        submitting: false,
      }),
    )

    expect(markup).toContain("Current plan")
    expect(markup).toContain("Continue to workspace")
    expect(markup).not.toContain("Builder access active")
  })

  it("keeps the generic current-plan button label outside the post-signup access recovery flow", () => {
    const markup = renderToStaticMarkup(
      createElement(PricingStep, {
        step: 1,
        attemptedStep: null,
        errors: {},
        currentPlanTier: "organization",
        checkoutReturnTo: "/onboarding?source=onboarding_pricing",
        onboardingMode: "full",
        submitting: false,
      }),
    )

    expect(markup).toContain("Builder access active")
    expect(markup).not.toContain("Continue to workspace")
  })
})

describe("onboarding step footer", () => {
  it("uses a workspace-specific submit label for the paid post-signup pricing step", () => {
    const markup = renderToStaticMarkup(
      createElement(StepFooter, {
        step: 1,
        totalSteps: 2,
        submitting: false,
        currentStepId: "pricing",
        onboardingMode: "post_signup_access",
        intentFocus: "build",
        slugStatus: "available",
        formationStatus: "approved",
        accountStepReady: true,
        builderPlanTier: "organization",
        onPrev: () => undefined,
        onNext: () => undefined,
      }),
    )

    expect(markup).toContain("Enter workspace")
    expect(markup).not.toContain("Finish")
  })
})
