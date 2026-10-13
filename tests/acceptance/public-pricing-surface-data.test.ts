import { describe, expect, it } from "vitest"

import { PLATFORM_TIERS } from "@/components/public/pricing-surface-data"

describe("public pricing surface data", () => {
  it("routes each tier signup CTA with its selected builder plan", () => {
    expect(PLATFORM_TIERS.map((tier) => [tier.id, tier.ctaLabel, tier.ctaHref])).toEqual([
      [
        "formation",
        "Get started",
        "/?section=signup&intent=build&plan=free",
      ],
      [
        "organization",
        "Get started",
        "/?section=signup&intent=build&plan=organization",
      ],
      [
        "operations",
        "Get started",
        "/?section=signup&intent=build&plan=operations_support",
      ],
    ])
  })
})
