import { describe, expect, it } from "vitest"

import {
  decodeLinkPreviewHtmlEntities,
  GET,
} from "@/app/api/link-preview/route"

describe("link preview route", () => {
  it("decodes common named and numeric HTML entities", () => {
    expect(
      decodeLinkPreviewHtmlEntities(
        "Find Food &mdash; Help &amp; Support &#8212; Local &#x2026;"
      )
    ).toBe("Find Food — Help & Support — Local …")
  })

  it("does not perform server-side requests to caller-provided URLs", async () => {
    const response = await GET(
      new Request(
        "https://coachhouse.local/api/link-preview?url=http://127.0.0.1"
      )
    )

    expect(response.status).toBe(410)
    await expect(response.json()).resolves.toEqual({
      error: "Link previews are unavailable.",
    })
  })
})
