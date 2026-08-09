import { describe, expect, it } from "vitest"

import { decodeLinkPreviewHtmlEntities } from "@/app/api/link-preview/route"

describe("link preview route", () => {
  it("decodes common named and numeric HTML entities", () => {
    expect(
      decodeLinkPreviewHtmlEntities(
        "Find Food &mdash; Help &amp; Support &#8212; Local &#x2026;"
      )
    ).toBe("Find Food — Help & Support — Local …")
  })
})
