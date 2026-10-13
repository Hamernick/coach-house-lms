import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { WorkspaceAcceleratorBanner } from "@/features/workspace-accelerator-card"

describe("workspace Accelerator banner", () => {
  it("introduces the Accelerator and animates its leading graphic once", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceAcceleratorBanner)
    )

    expect(markup).toContain("Build your organization with guided lessons.")
    expect(markup).toContain(
      "Move through guided videos, resources, and assignments"
    )
    expect(markup).toContain("bg-zinc-100/80")
    expect(markup).toContain("dark:bg-zinc-900/30")
    expect(markup).toContain("mx-auto mt-4 w-full max-w-3xl")
    expect(markup).toContain("text-center")
    expect(markup).toContain("text-balance")
    expect(markup).toContain("text-pretty")
    expect(markup).toContain("motion-safe:animate-[soft-pop_600ms")
    expect(markup).toContain("motion-reduce:animate-none")
    expect(markup).toContain(
      'data-react-grab-owner-id="workspace-accelerator:banner"'
    )
    expect(markup.indexOf('aria-hidden="true"')).toBeLessThan(
      markup.indexOf('id="workspace-accelerator-title"')
    )
    expect(markup).not.toContain("<button")
  })
})
