import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { BillingPortalCard } from "@/app/(dashboard)/billing/_components/billing-portal-card"
import { SUPPORT_EMAIL } from "@/components/app-shell/constants"

describe("billing portal card", () => {
  it("uses the shared reachable support email", () => {
    const markup = renderToStaticMarkup(
      React.createElement(BillingPortalCard, {
        portalReady: false,
        hasPortalReference: false,
        hasPaidPlan: false,
      }),
    )

    expect(markup).toContain(`mailto:${SUPPORT_EMAIL}`)
    expect(markup).toContain(SUPPORT_EMAIL)
    expect(markup).not.toContain("support@coachhouse.io")
  })
})
