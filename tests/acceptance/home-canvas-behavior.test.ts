import { describe, expect, it } from "vitest"

import { resolveCanvasSectionBehavior } from "@/components/public/home-canvas-behavior"

describe("home-canvas section behavior", () => {
  it("marks pricing as the only scrollable section and locks map navigation gestures", () => {
    expect(resolveCanvasSectionBehavior("pricing")).toEqual({
      lockNavigationGestures: false,
      scrollable: true,
      touchAction: "pan-y",
    })

    expect(resolveCanvasSectionBehavior("hero")).toEqual({
      lockNavigationGestures: false,
      scrollable: false,
      touchAction: "pan-x",
    })

    expect(resolveCanvasSectionBehavior("news")).toEqual({
      lockNavigationGestures: false,
      scrollable: false,
      touchAction: "pan-x",
    })

    expect(resolveCanvasSectionBehavior("find")).toEqual({
      lockNavigationGestures: true,
      scrollable: false,
      touchAction: "auto",
    })
  })
})
