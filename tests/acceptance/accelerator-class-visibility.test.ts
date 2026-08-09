import { describe, expect, it } from "vitest"

import { isNonProductAcceleratorClass } from "@/lib/accelerator/class-visibility"

describe("accelerator class visibility", () => {
  it.each([
    {
      title: "Published Class",
      slug: "published-class",
    },
    {
      title: "Published Class Updated",
      slug: "published-adcd6d30",
    },
    {
      title: "Interrupted RLS Fixture",
      slug: "published-deadbeef",
    },
  ])("hides non-product class $slug", (klass) => {
    expect(isNonProductAcceleratorClass(klass)).toBe(true)
  })

  it("keeps real accelerator classes visible", () => {
    expect(
      isNonProductAcceleratorClass({
        title: "Strategic Foundations",
        slug: "strategic-foundations",
      })
    ).toBe(false)
  })
})
