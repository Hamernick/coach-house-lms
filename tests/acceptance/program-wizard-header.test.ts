import { readFileSync } from "node:fs"
import { join } from "node:path"

import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ProgramWizardHeader } from "@/components/programs/program-wizard/components"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("program wizard header", () => {
  it("shows progress context without the old step navigation buttons", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ProgramWizardHeader, {
        mode: "create",
        currentStep: 0,
        completion: 25,
        isAutoSaving: false,
      })
    )

    expect(markup).toContain("Activity setup")
    expect(markup).toContain("Step 1 of")
    expect(markup).not.toContain("Primary object setup")
    expect(markup).not.toContain("<button")
    expect(markup).not.toContain("rounded-full px-2.5 py-1 text-[11px]")
  })

  it("keeps the wizard chrome responsive on narrow screens", () => {
    const headerSource = readSource(
      "src/components/programs/program-wizard/components/program-wizard-header.tsx"
    )
    const footerSource = readSource(
      "src/components/programs/program-wizard/components/program-wizard-footer.tsx"
    )

    expect(headerSource).toContain("px-3 py-3 sm:px-5 sm:py-4 md:px-6")
    expect(headerSource).toContain("flex min-w-0 flex-1 flex-col gap-1")
    expect(headerSource).toContain("text-pretty")
    expect(headerSource).toContain(
      'className="text-muted-foreground text-[11px] font-medium tabular-nums"'
    )
    expect(headerSource).not.toContain('variant="outline"')
    expect(footerSource).toContain(
      "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between"
    )
    expect(footerSource).toContain("grid grid-cols-2 gap-2 sm:flex")
    expect(footerSource).toContain("h-11 rounded-xl px-4 sm:h-10")
  })
})
