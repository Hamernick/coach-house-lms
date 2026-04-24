import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PricingCallToActionSection } from "@/components/public/pricing-surface-sections/pricing-call-to-action-section"
import { PricingFeatureBreakdownIntroSection } from "@/components/public/pricing-surface-sections/pricing-feature-breakdown-intro-section"

describe("public pricing sign up links", () => {
  it("routes pricing get-started buttons through the canonical signup page", () => {
    const callToActionMarkup = renderToStaticMarkup(
      React.createElement(PricingCallToActionSection),
    )
    const featureIntroMarkup = renderToStaticMarkup(
      React.createElement(PricingFeatureBreakdownIntroSection),
    )

    expect(callToActionMarkup).toContain('href="/sign-up"')
    expect(featureIntroMarkup).toContain('href="/sign-up"')
    expect(callToActionMarkup).not.toContain("plan=individual")
    expect(featureIntroMarkup).not.toContain("plan=individual")
  })
})
