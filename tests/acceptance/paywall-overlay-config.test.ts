import { describe, expect, it } from "vitest"

import {
  buildStripeCheckoutPath,
  buildDismissedPaywallHref,
  getSafeInternalPaywallPath,
  resolvePaywallOverlayDisplayPlanTier,
  shouldAutoDismissPaywallOverlay,
} from "@/components/paywall/paywall-overlay/config"

describe("paywall overlay query handling", () => {
  it("strips paywall query keys and preserves unrelated params", () => {
    const href = buildDismissedPaywallHref({
      pathname: "/organization",
      searchParams: new URLSearchParams(
        "paywall=organization&plan=organization&source=accelerator&upgrade=accelerator-access&checkout_error=checkout_failed&paywall_preview=1&redirect=%2Fworkspace&cancel=%2Ffind&foo=bar",
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

  it("keeps preview paywalls open for platform-admin testing", () => {
    expect(
      shouldAutoDismissPaywallOverlay({
        currentPlanTier: "organization",
        paywallKind: "organization",
        preview: true,
      }),
    ).toBe(false)
  })

  it("renders preview paywalls as free-plan dialogs so admins can test upgrade CTAs", () => {
    expect(
      resolvePaywallOverlayDisplayPlanTier({
        currentPlanTier: "organization",
        preview: true,
      }),
    ).toBe("free")
    expect(
      resolvePaywallOverlayDisplayPlanTier({
        currentPlanTier: "operations_support",
        preview: false,
      }),
    ).toBe("operations_support")
  })

  it("builds safe Stripe checkout paths with sidebar return targets", () => {
    expect(
      buildStripeCheckoutPath({
        plan: "organization",
        source: "sidebar_upgrade",
        redirectTarget: "/workspace",
        cancelTarget: "/find",
      }),
    ).toBe(
      "/api/stripe/checkout?plan=organization&source=sidebar_upgrade&redirect=%2Fworkspace&cancel=%2Ffind",
    )
  })

  it("drops unsafe paywall redirect targets before checkout", () => {
    expect(getSafeInternalPaywallPath("https://bad.example")).toBeNull()
    expect(getSafeInternalPaywallPath("//bad.example/path")).toBeNull()
    expect(getSafeInternalPaywallPath("/workspace")).toBe("/workspace")
    expect(
      buildStripeCheckoutPath({
        plan: "operations_support",
        source: null,
        redirectTarget: "https://bad.example",
        cancelTarget: "//bad.example",
      }),
    ).toBe("/api/stripe/checkout?plan=operations_support&source=billing")
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
