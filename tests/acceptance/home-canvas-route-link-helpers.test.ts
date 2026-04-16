import { describe, expect, it } from "vitest"

import { isPrimaryPlainNavigationIntent } from "@/components/public/home-canvas-route-link-helpers"

describe("home canvas route link helpers", () => {
  it("marks plain same-tab clicks as pending-route intents", () => {
    expect(
      isPrimaryPlainNavigationIntent({
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        target: "_self",
      }),
    ).toBe(true)
  })

  it("ignores modified or alternate-tab clicks", () => {
    expect(
      isPrimaryPlainNavigationIntent({
        defaultPrevented: false,
        button: 1,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        target: "_self",
      }),
    ).toBe(false)

    expect(
      isPrimaryPlainNavigationIntent({
        defaultPrevented: false,
        button: 0,
        metaKey: true,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        target: "_self",
      }),
    ).toBe(false)

    expect(
      isPrimaryPlainNavigationIntent({
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        target: "_blank",
      }),
    ).toBe(false)
  })
})
