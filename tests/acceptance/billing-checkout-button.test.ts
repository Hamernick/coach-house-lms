import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { BillingCheckoutButton } from "@/app/(dashboard)/billing/billing-checkout-button"

describe("billing checkout button", () => {
  it("renders a guarded server-action form when enabled", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        BillingCheckoutButton,
        {
          plan: "organization",
          className: "w-full rounded-xl",
          attempt: "attempt_123",
        } as React.ComponentProps<typeof BillingCheckoutButton>,
        "Upgrade to Organization"
      )
    )

    expect(markup.startsWith("<form ")).toBe(true)
    expect(markup).toContain('name="plan" value="organization"')
    expect(markup).toContain('name="attempt" value="attempt_123"')
    expect(markup).toContain('type="submit"')
    expect(markup).toContain(">Upgrade to Organization<")
    expect(markup).not.toMatch(/\sdisabled(?:=|>)/)
  })

  it("renders a disabled button when checkout is unavailable", () => {
    const markup = renderToStaticMarkup(
      React.createElement(
        BillingCheckoutButton,
        {
          plan: "operations_support",
          disabled: true,
          variant: "secondary",
        } as React.ComponentProps<typeof BillingCheckoutButton>,
        "Operations plan unavailable"
      )
    )

    expect(markup).toContain("disabled")
    expect(markup).not.toContain("<form")
  })
})
