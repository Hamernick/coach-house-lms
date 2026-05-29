import { readFileSync } from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("stripe runtime production safety", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("keeps production paid-plan checkout on the primary Stripe runtime", () => {
    const stripeRuntime = readSource("src/lib/billing/stripe-runtime.ts")

    expect(stripeRuntime).toContain('process.env.NODE_ENV !== "production" && isTester && tester')
    expect(stripeRuntime).not.toContain("if (isTester && tester) return tester")
    expect(stripeRuntime).toContain("resolveStripeRuntimeConfigForCoaching")
    expect(stripeRuntime).toContain("if ((useTesterRuntime || shouldPreferTesterForLocalCoaching")
  })

  it("routes only super-admin coaching checkout to tester Stripe in production", async () => {
    vi.resetModules()
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://coachhouse.test")
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon")
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_primary")
    vi.stubEnv("STRIPE_ORGANIZATION_PRICE_ID", "price_live_org")
    vi.stubEnv("STRIPE_OPERATIONS_SUPPORT_PRICE_ID", "price_live_ops")
    vi.stubEnv("STRIPE_COACHING_FULL_PRICE_ID", "price_live_coaching_full")
    vi.stubEnv("STRIPE_COACHING_DISCOUNTED_PRICE_ID", "price_live_coaching_discounted")
    vi.stubEnv("STRIPE_TEST_SECRET_KEY", "sk_test_tester")
    vi.stubEnv("STRIPE_TEST_ORGANIZATION_PRICE_ID", "price_test_org")
    vi.stubEnv("STRIPE_TEST_OPERATIONS_SUPPORT_PRICE_ID", "price_test_ops")
    vi.stubEnv("STRIPE_TEST_COACHING_FULL_PRICE_ID", "price_test_coaching_full")
    vi.stubEnv("STRIPE_TEST_COACHING_DISCOUNTED_PRICE_ID", "price_test_coaching_discounted")

    const {
      resolveStripeRuntimeConfigForAudience,
      resolveStripeRuntimeConfigForCoaching,
      resolveStripePriceIdForCoaching,
      resolveStripePriceIdForPlan,
    } = await import("@/lib/billing/stripe-runtime")

    const paidPlanConfig = resolveStripeRuntimeConfigForAudience({ isTester: true })
    const adminCoachingConfig = resolveStripeRuntimeConfigForCoaching({
      useTesterRuntime: true,
      priceTier: "full",
    })
    const nonAdminCoachingConfig = resolveStripeRuntimeConfigForCoaching({
      useTesterRuntime: false,
      priceTier: "full",
    })

    expect(paidPlanConfig?.target).toBe("primary")
    expect(paidPlanConfig?.mode).toBe("live")
    expect(resolveStripePriceIdForPlan({ config: paidPlanConfig!, planTier: "organization" })).toBe("price_live_org")
    expect(adminCoachingConfig?.target).toBe("tester")
    expect(adminCoachingConfig?.mode).toBe("test")
    expect(resolveStripePriceIdForCoaching({ config: adminCoachingConfig!, priceTier: "full" })).toBe(
      "price_test_coaching_full",
    )
    expect(nonAdminCoachingConfig?.target).toBe("primary")
    expect(nonAdminCoachingConfig?.mode).toBe("live")
    expect(resolveStripePriceIdForCoaching({ config: nonAdminCoachingConfig!, priceTier: "full" })).toBe(
      "price_live_coaching_full",
    )
  })
})
