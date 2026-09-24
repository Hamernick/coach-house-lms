import { describe, expect, it } from "vitest"
import { buildAdGrantsCampaignTemplate } from "@/features/nonprofit-documentation/lib/ad-grants-campaign-template"
import { DEFAULT_CAMPAIGN_PLAN } from "@/features/nonprofit-documentation/lib/campaign-plan"
import { MARKETPLACE_RESOURCE_ADDITIONS } from "@/features/nonprofit-documentation/lib/marketplace-resource-additions"
import { MARKETPLACE_RESOURCE_GUIDES } from "@/features/nonprofit-documentation/lib/marketplace-resource-guides"
import { sanitizeMarketplaceShortlist } from "@/features/nonprofit-documentation/lib/marketplace-directory"

describe("Marketplace workflows", () => {
  it("gives every newly researched resource a concrete workflow and primary sources", () => {
    expect(MARKETPLACE_RESOURCE_ADDITIONS).toHaveLength(20)
    for (const resource of MARKETPLACE_RESOURCE_ADDITIONS) {
      const guide = MARKETPLACE_RESOURCE_GUIDES[resource.id]
      expect(guide.steps.length).toBeGreaterThanOrEqual(3)
      expect(guide.preparation.length).toBeGreaterThan(0)
      expect(guide.sources.length).toBeGreaterThan(0)
      expect(
        guide.sources.every(
          (source) => new URL(source.href).protocol === "https:"
        )
      ).toBe(true)
    }
  })

  it("recovers saved references to the consolidated TechSoup listing", () => {
    expect(
      sanitizeMarketplaceShortlist([
        "techsoup-product-selection",
        "techsoup",
        "not-a-resource",
      ])
    ).toEqual(["techsoup"])
  })

  for (const goal of [
    "fundraising",
    "volunteer-recruitment",
    "service-access",
  ] as const) {
    it(`creates an editable ${goal} starter without carrying over approvals or unrelated facts`, () => {
      const current = {
        ...DEFAULT_CAMPAIGN_PLAN,
        organizationName: "Community organization",
        stage: "forming" as const,
        mainMessage: "Old message",
        audienceEvidence: "Unrelated private notes",
        hasLegalChannelReview: true,
      }
      const template = buildAdGrantsCampaignTemplate(goal, current)
      expect(template.organizationName).toBe("Community organization")
      expect(template.stage).toBe("forming")
      expect(template.campaignType).toBe(goal)
      expect(template.mainMessage).toBe("")
      expect(template.audienceEvidence).toBe("")
      expect(template.hasLegalChannelReview).toBe(false)
      expect(template.budgetCapacity).toContain("$10,000 USD/month")
      expect(template.primaryAudience).toContain("[")
      expect(current.mainMessage).toBe("Old message")
    })
  }
})
