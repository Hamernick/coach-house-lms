import { describe, expect, it } from "vitest"

import {
  buildPublicMapFilterHref,
  buildPublicMapFilterSearchParams,
  normalizePublicMapQueryParam,
  resolvePublicMapFilterUrlState,
} from "@/components/public/public-map-index/filter-url-state"

describe("public map filter URL state", () => {
  it("hydrates search and category from query params", () => {
    const state = resolvePublicMapFilterUrlState(
      new URLSearchParams("q=mutual%20aid&category=housing")
    )

    expect(state).toEqual({
      activeGroup: "housing",
      query: "mutual aid",
    })
  })

  it("falls back to all categories for invalid or absent category params", () => {
    expect(
      resolvePublicMapFilterUrlState(new URLSearchParams("category=unknown"))
    ).toMatchObject({ activeGroup: "all" })
    expect(resolvePublicMapFilterUrlState(new URLSearchParams())).toEqual({
      activeGroup: "all",
      query: "",
    })
  })

  it("trims search text and removes empty/default filter params", () => {
    expect(normalizePublicMapQueryParam("  resource night  ")).toBe(
      "resource night"
    )

    const params = buildPublicMapFilterSearchParams({
      activeGroup: "all",
      query: "   ",
      searchParams: new URLSearchParams(
        "q=old&category=health&member_onboarding=1"
      ),
    })

    expect(params.toString()).toBe("member_onboarding=1")
  })

  it("builds shareable hrefs while preserving unrelated params", () => {
    expect(
      buildPublicMapFilterHref({
        activeGroup: "environment",
        pathname: "/find/atlas",
        query: " solar grants ",
        searchParams: new URLSearchParams("member_onboarding=1"),
      })
    ).toBe(
      "/find/atlas?member_onboarding=1&q=solar+grants&category=environment"
    )
  })
})
