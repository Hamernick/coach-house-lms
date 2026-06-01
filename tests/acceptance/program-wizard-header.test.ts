import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ProgramWizardHeader } from "@/components/programs/program-wizard/components"

describe("program wizard header", () => {
  it("shows progress context without the old step navigation buttons", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ProgramWizardHeader, {
        mode: "create",
        currentStep: 0,
        completion: 25,
        isAutoSaving: false,
      }),
    )

    expect(markup).toContain("Program setup")
    expect(markup).toContain("Step 1 of")
    expect(markup).not.toContain("<button")
    expect(markup).not.toContain("rounded-full px-2.5 py-1 text-[11px]")
  })
})
