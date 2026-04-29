import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { PublicPageSettings } from "@/components/organization/org-profile-card/tabs/company-tab/edit-sections/public-page-settings"

describe("organization public page settings", () => {
  it("clarifies that disabling the public map profile does not cancel billing", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicPageSettings, {
        company: {
          name: "Hadiya's Promise",
          isPublic: true,
          publicSlug: "hadiyas-promise",
          locationType: "in_person",
        },
        errors: {},
        onInputChange: vi.fn(),
        onUpdate: vi.fn(),
        onDirty: vi.fn(),
        onAutoSave: vi.fn(),
        slugStatus: null,
        setSlugStatus: vi.fn(),
      }),
    )

    expect(markup).toContain(
      "Turning this off only hides the public map profile.",
    )
    expect(markup).toContain("It does not cancel Stripe billing")
    expect(markup).toContain('href="/billing"')
  })
})
