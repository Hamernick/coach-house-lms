import { describe, expect, it } from "vitest"

import { buildPublicImageTransformUrl } from "@/lib/storage/public-url"

describe("public storage image transforms", () => {
  it("requests bounded Supabase public images", () => {
    expect(
      buildPublicImageTransformUrl(
        "https://project.supabase.co/storage/v1/object/public/org-media/org/logo.png",
        { width: 144, height: 144, resize: "contain" }
      )
    ).toBe(
      "https://project.supabase.co/storage/v1/render/image/public/org-media/org/logo.png?width=144&height=144&resize=contain&quality=75"
    )
  })

  it("leaves non-Supabase and invalid URLs unchanged", () => {
    expect(
      buildPublicImageTransformUrl("https://example.org/logo.png", {
        width: 144,
        height: 144,
      })
    ).toBe("https://example.org/logo.png")
    expect(
      buildPublicImageTransformUrl("not a URL", {
        width: 144,
        height: 144,
      })
    ).toBe("not a URL")
  })
})
