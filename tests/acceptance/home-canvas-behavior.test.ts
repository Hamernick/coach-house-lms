import { describe, expect, it } from "vitest"

import { resolveCanvasSectionBehavior } from "@/components/public/home-canvas-behavior"

describe("home-canvas section behavior", () => {
  it("marks pricing as the only scrollable section", () => {
    expect(resolveCanvasSectionBehavior("pricing")).toEqual({
      scrollable: true,
      touchAction: "pan-y",
    })

    expect(resolveCanvasSectionBehavior("hero")).toEqual({
      scrollable: false,
      touchAction: "pan-x",
    })

    expect(resolveCanvasSectionBehavior("news")).toEqual({
      scrollable: false,
      touchAction: "pan-x",
    })
  })
})
