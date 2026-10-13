import { describe, expect, it } from "vitest"
import { MARKETPLACE_COACHES } from "@/features/public-profiles/lib/marketplace-coaches"
import { marketplacePeoplePageHref } from "@/features/public-profiles/lib/marketplace-people"

describe("Marketplace workflows", () => {
  it.each([1, 3])(
    "preserves resource filters when paging People to page %i",
    (page) => {
      const filters = {
        q: "Community & care + support",
        type: "software",
        function: "technology",
        stage: "forming",
        cost: "free-eligible",
      }
      const search = new URLSearchParams({
        ...filters,
        view: "people",
        peoplePage: "2",
      })
      const href = marketplacePeoplePageHref(search.toString(), page)
      const destination = new URL(
        href,
        "https://coachhouse.app/documentation/marketplace"
      )

      expect(destination.pathname).toBe("/documentation/marketplace")
      expect(Object.fromEntries(destination.searchParams)).toEqual({
        ...filters,
        view: "people",
        peoplePage: String(page),
      })
      expect(search.get("peoplePage")).toBe("2")
    }
  )

  it("opens the requested People page without resource filters", () => {
    expect(marketplacePeoplePageHref("", 2)).toBe("?view=people&peoplePage=2")
  })

  it("keeps the coach roster separate from booking capacity and public membership", () => {
    expect(MARKETPLACE_COACHES.map((coach) => coach.name)).toEqual([
      "Joel Hamernick",
      "Paula Hamernick",
      "Franklin Ballenger",
    ])
    expect(
      MARKETPLACE_COACHES.filter((coach) => coach.href === "/coaching").map(
        (coach) => coach.action
      )
    ).toEqual(["Book Joel & Paula", "Book Joel & Paula"])
    expect(
      MARKETPLACE_COACHES.find((coach) => coach.id === "franklin")?.href
    ).toBe("https://www.coachhousesolutions.org/contact")
  })
})
