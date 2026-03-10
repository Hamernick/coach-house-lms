import { describe, expect, it } from "vitest"

import PricingPage from "@/app/(public)/pricing/page"

import { captureRedirect } from "./test-utils"

describe("public pricing route", () => {
  it("redirects legacy pricing traffic to the home pricing section", async () => {
    const destination = await captureRedirect(() =>
      PricingPage({
        searchParams: Promise.resolve({
          source: "campaign",
          plan: "organization",
          embed: "1",
        }),
      }),
    )

    expect(destination).toBe("/?section=pricing&source=campaign&plan=organization")
  })
})
