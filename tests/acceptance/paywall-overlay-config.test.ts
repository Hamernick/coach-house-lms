import { describe, expect, it } from "vitest"

import {
  buildDismissedPaywallHref,
  shouldAutoDismissPaywallOverlay,
} from "@/components/paywall/paywall-overlay/config"

describe("paywall overlay query handling", () => {
  it("strips paywall query keys and preserves unrelated params", () => {
    const href = buildDismissedPaywallHref({
      pathname: "/organization",
      searchParams: new URLSearchParams(
        "paywall=organization&plan=organization&source=accelerator&upgrade=accelerator-access&checkout_error=checkout_failed&foo=bar",
      ),
    })

    expect(href).toBe("/organization?foo=bar")
  })

  it("auto-dismisses stale paywall overlays for paid plans", () => {
    expect(
      shouldAutoDismissPaywallOverlay({
        currentPlanTier: "organization",
        paywallKind: "organization",
      }),
    ).toBe(true)
    expect(
      shouldAutoDismissPaywallOverlay({
        currentPlanTier: "operations_support",
        paywallKind: "accelerator",
      }),
    ).toBe(true)
  })

  it("keeps the overlay open for free plans or when there is no paywall query", () => {
    expect(
      shouldAutoDismissPaywallOverlay({
        currentPlanTier: "free",
        paywallKind: "organization",
      }),
    ).toBe(false)
    expect(
      shouldAutoDismissPaywallOverlay({
        currentPlanTier: "organization",
        paywallKind: null,
      }),
    ).toBe(false)
  })
})
