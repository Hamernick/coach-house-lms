import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  RightRailSlot,
  useRightRailContent,
  useRightRailPresence,
} from "@/components/app-shell/right-rail"

function RightRailPresenceProbe() {
  return React.createElement("span", null, useRightRailPresence() ? "present" : "absent")
}

function RightRailContentProbe() {
  return React.createElement("span", null, useRightRailContent() ? "present" : "absent")
}

describe("right rail fallback behavior", () => {
  it("returns empty snapshots when no provider is mounted", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(RightRailPresenceProbe),
        React.createElement(RightRailContentProbe),
      ),
    )

    expect(markup).toContain("absent")
    expect(markup).not.toContain("present")
  })

  it("treats slots outside the provider as a no-op instead of crashing", () => {
    const render = () =>
      renderToStaticMarkup(
        React.createElement(
          RightRailSlot,
          null,
          React.createElement("div", null, "Detached rail content"),
        ),
      )

    expect(render).not.toThrow()
    expect(render()).toBe("")
  })
})
