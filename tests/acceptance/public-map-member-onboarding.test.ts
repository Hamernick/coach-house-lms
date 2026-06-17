import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  buildPublicMapMemberOnboardingSteps,
  PublicMapMemberOnboardingOverlay,
} from "@/components/public/public-map-index/member-onboarding-overlay"
import {
  buildPublicMapMemberOnboardingPreviewHref,
  isPublicMapMemberOnboardingPreviewActive,
} from "@/components/public/public-map-index/member-onboarding-preview"

describe("public map member onboarding", () => {
  it("keeps the organization-switching step conditional", () => {
    expect(
      buildPublicMapMemberOnboardingSteps({
        hasOrganizationSwitcher: false,
      }).map((step) => step.id),
    ).toEqual(["map", "search", "save", "notifications"])

    expect(
      buildPublicMapMemberOnboardingSteps({
        hasOrganizationSwitcher: true,
      }).map((step) => step.id),
    ).toEqual(["map", "search", "save", "notifications", "organizations"])
  })

  it("renders a map-native stepped dialog with a compact completion form", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapMemberOnboardingOverlay, {
        intentFocus: "support",
        hasOrganizationSwitcher: false,
        onSubmit: async () => {},
      }),
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain("Resource map")
    expect(markup).toContain("Start here for public organizations")
    expect(markup).toContain("Skip")
    expect(markup).toContain("Continue")
    expect(markup).toContain('name="intentFocus"')
    expect(markup).toContain('value="support"')
    expect(markup).toContain("min-h-[14rem]")
    expect(markup).not.toContain("OnboardingWorkspaceCard")
  })

  it("supports an admin preview mode that dismisses without submitting onboarding", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapMemberOnboardingOverlay, {
        intentFocus: "find",
        hasOrganizationSwitcher: true,
        onDismiss: () => {},
      }),
    )

    expect(markup).toContain('role="dialog"')
    expect(markup).toContain("Resource map")
    expect(markup).toContain("Skip")
    expect(markup).toContain("Continue")
    expect(markup).not.toContain("<form")
    expect(markup).not.toContain('name="intentFocus"')
  })

  it("keeps admin preview state in the find URL instead of auth metadata", () => {
    expect(
      isPublicMapMemberOnboardingPreviewActive({
        canPreview: true,
        memberOnboardingParam: "1",
      }),
    ).toBe(true)
    expect(
      isPublicMapMemberOnboardingPreviewActive({
        canPreview: false,
        memberOnboardingParam: "1",
      }),
    ).toBe(false)

    expect(
      buildPublicMapMemberOnboardingPreviewHref({
        pathname: "/find",
        searchParams: "q=housing",
        enabled: true,
      }),
    ).toBe("/find?q=housing&member_onboarding=1&source=admin_preview")

    expect(
      buildPublicMapMemberOnboardingPreviewHref({
        pathname: "/find",
        searchParams: "q=housing&member_onboarding=1&source=admin_preview",
        enabled: false,
      }),
    ).toBe("/find?q=housing")
  })
})
