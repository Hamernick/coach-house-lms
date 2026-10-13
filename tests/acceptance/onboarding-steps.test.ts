import { describe, expect, it } from "vitest"

import { STEPS } from "@/components/onboarding/onboarding-dialog/constants"

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
})
