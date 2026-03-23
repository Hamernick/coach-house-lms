import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ModuleRightRail } from "@/components/training/module-right-rail"

describe("module right rail", () => {
  it("uses a reserved bottom row for the tool tray instead of a sticky overlay", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ModuleRightRail, {
        moduleId: "module-1",
        resources: [],
        hasDeck: false,
        breakAction: {
          kind: "button",
          label: "Close module",
          onClick: () => undefined,
        },
      }),
    )

    expect(markup).toContain("grid-rows-[minmax(0,1fr)_auto]")
    expect(markup).toContain("overflow-y-auto")
    expect(markup).not.toContain("sticky bottom-0")
  })
})
