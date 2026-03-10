import { describe, expect, it } from "vitest"

import { PLATFORM_TIERS } from "@/components/public/pricing-surface-data"

describe("public pricing surface data", () => {
  it("uses a single signup CTA for every tier", () => {
    for (const tier of PLATFORM_TIERS) {
      expect(tier.ctaLabel).toBe("Get started")
      expect(tier.ctaHref).toBe("/?section=signup")
    }
  })
})
