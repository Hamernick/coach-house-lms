import { describe, expect, it } from "vitest"

import { STEPS } from "@/components/onboarding/onboarding-dialog/constants"
import { RESERVED_PUBLIC_ORGANIZATION_SLUGS } from "@/lib/organization/reserved-public-slugs"

describe("onboarding steps", () => {
  it("keeps pricing and community as distinct onboarding steps", () => {
    expect(STEPS.map((step) => step.id)).toEqual([
      "intent",
      "pricing",
      "org",
      "account",
      "community",
    ])
  })

  it("reserves current app routes from public organization URLs", () => {
    for (const route of [
      "workspace",
      "find",
      "accelerator",
      "people",
      "documents",
      "marketplace",
    ]) {
      expect(RESERVED_PUBLIC_ORGANIZATION_SLUGS.has(route)).toBe(true)
    }
  })
})
