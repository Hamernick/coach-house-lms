import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { OrganizationDetailOriginSection } from "@/components/public/public-map-index/organization-detail-sections"

describe("OrganizationDetailOriginSection", () => {
  it('renders the section title as "About"', () => {
    const markup = renderToStaticMarkup(
      React.createElement(OrganizationDetailOriginSection, {
        storyFields: [
          {
            label: "Origin story",
            value: "Started after repeated service gaps.",
          },
        ],
        expandedStoryFields: {},
        onToggleField: () => {},
      }),
    )

    expect(markup).toContain(">About<")
    expect(markup).not.toContain(">Origin<")
    expect(markup).toContain("Origin story")
  })
})
