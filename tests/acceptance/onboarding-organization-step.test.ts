import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { OrganizationStep } from "@/components/onboarding/onboarding-dialog/components/organization-step"

describe("onboarding organization step", () => {
  it("renders formation status choices as card-style toggles instead of grouped button chrome", () => {
    const markup = renderToStaticMarkup(
      createElement(OrganizationStep, {
        step: 1,
        attemptedStep: null,
        errors: {},
        initialOrgName: "",
        initialOrgSlug: "",
        slugStatus: "idle",
        slugHint: null,
        formationStatus: "approved",
        onOrgNameChange: () => undefined,
        onOrgSlugChange: (value: string) => value,
        onFormationStatusSelect: () => undefined,
      }),
    )

    expect(markup).toContain(
      "box-border grid min-w-0 w-full max-w-full items-stretch gap-2 sm:grid-cols-3",
    )
    expect(markup).toContain(
      "flex h-full w-full min-w-0 items-stretch justify-start rounded-2xl border p-0 text-left whitespace-normal shadow-none outline-none transition-colors",
    )
    expect(markup).toContain(
      "flex h-full w-full min-w-0 flex-col gap-2 rounded-2xl p-3 text-left",
    )
    expect(markup).not.toContain("w-fit items-center")
    expect(markup).not.toContain("whitespace-nowrap")
  })
})
