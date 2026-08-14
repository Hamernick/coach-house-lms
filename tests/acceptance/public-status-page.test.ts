import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import StatusPage from "@/app/(public)/status/page"
import { SUPPORT_EMAIL } from "@/components/app-shell/constants"

describe("public status page", () => {
  it("avoids unmeasured health claims and provides the configured support path", () => {
    const markup = renderToStaticMarkup(React.createElement(StatusPage))

    expect(markup).toContain("Live status reporting is not configured")
    expect(markup).toContain("Public status unavailable")
    expect(markup).toContain(`mailto:${SUPPORT_EMAIL}`)
    expect(markup).not.toContain("All systems operational")
    expect(markup).not.toContain("Updated moments ago")
  })
})
