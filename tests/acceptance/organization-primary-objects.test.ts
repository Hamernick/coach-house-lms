import { describe, expect, it } from "vitest"

import { serializePayload } from "@/components/programs/program-wizard/helpers"
import { defaultProgramWizardForm } from "@/components/programs/program-wizard/schema"
import {
  ORGANIZATION_ACTIVITY_KINDS,
  ORGANIZATION_PRIMARY_OBJECT_KINDS,
  resolveOrganizationActivityKind,
  resolveOrganizationPrimaryObjectKind,
} from "@/lib/organization/primary-objects"
import { resolveProgramCardChips } from "@/lib/programs/display"

describe("organization primary objects", () => {
  it("keeps the supported object taxonomy explicit", () => {
    expect(ORGANIZATION_PRIMARY_OBJECT_KINDS).toEqual([
      "Initiative",
      "Project",
      "Program",
      "Event",
      "Campaign",
      "Service",
      "Activity",
      "Fundraiser",
      "Grant application",
      "Re-grant request",
      "Web resource",
    ])
  })

  it("keeps grant workflow records readable without making them activity wizard choices", () => {
    expect(ORGANIZATION_ACTIVITY_KINDS).toEqual([
      "Initiative",
      "Project",
      "Program",
      "Event",
      "Service",
      "Activity",
      "Web resource",
    ])
    expect(ORGANIZATION_ACTIVITY_KINDS).not.toContain("Campaign")
    expect(ORGANIZATION_ACTIVITY_KINDS).not.toContain("Fundraiser")
    expect(ORGANIZATION_ACTIVITY_KINDS).not.toContain("Grant application")
    expect(ORGANIZATION_ACTIVITY_KINDS).not.toContain("Re-grant request")
    expect(resolveOrganizationActivityKind("Campaign")).toBe("Program")
    expect(resolveOrganizationActivityKind("Fundraiser")).toBe("Program")
    expect(resolveOrganizationActivityKind("Re-grant request")).toBe("Program")
    expect(resolveOrganizationPrimaryObjectKind("Campaign")).toBe("Campaign")
    expect(resolveOrganizationPrimaryObjectKind("Fundraiser")).toBe(
      "Fundraiser"
    )
    expect(resolveOrganizationPrimaryObjectKind("Re-grant request")).toBe(
      "Re-grant request"
    )
    expect(
      resolveProgramCardChips({
        duration_label: "Open request cycle",
        features: ["Re-grant request"],
        wizard_snapshot: { objectKind: "Re-grant request" },
      })
    ).toEqual(
      expect.arrayContaining(["Re-grant request", "Open request cycle"])
    )
    expect(
      resolveProgramCardChips({
        duration_label: "Seasonal campaign",
        features: ["Fundraiser"],
        wizard_snapshot: { objectKind: "Fundraiser" },
      })
    ).toEqual(expect.arrayContaining(["Fundraiser", "Seasonal campaign"]))
    expect(
      resolveProgramCardChips({
        duration_label: "Awareness sprint",
        features: ["Campaign"],
        wizard_snapshot: { objectKind: "Campaign" },
      })
    ).toEqual(expect.arrayContaining(["Campaign", "Awareness sprint"]))
  })

  it("serializes the selected activity kind into saved wizard data and chips", () => {
    const payload = serializePayload({
      ...defaultProgramWizardForm,
      objectKind: "Web resource",
      title: "Neighborhood Resource Hub",
      oneSentence: "A public web resource for neighborhood support services.",
      servesWho: "Families looking for local support resources.",
      participantReceive1: "Resource directory",
      participantReceive2: "Plain-language guides",
      participantReceive3: "Referral information",
      successOutcome1: "Residents can find the right support in one place.",
      startMonth: "2026-04",
      durationLabel: "Always available",
      frequency: "Updated monthly",
      locationMode: "online",
      locationUrl: "https://resources.example.org/hub",
      budgetRows: [
        {
          category: "Content + maintenance",
          description: "Resource hub updates and moderation.",
          costType: "Fixed",
          unit: "Month",
          units: "12",
          costPerUnit: "250.00",
          totalCost: "3000.00",
        },
      ],
      costStaffUsd: 0,
      costSpaceUsd: 0,
      costMaterialsUsd: 0,
      costOtherUsd: 0,
    })

    expect(payload.wizardSnapshot?.objectKind).toBe("Web resource")
    expect(payload.wizardSnapshot?.locationUrl).toBe(
      "https://resources.example.org/hub"
    )
    expect(payload.locationType).toBe("online")
    expect(payload.locationUrl).toBe("https://resources.example.org/hub")
    expect(payload.features).toContain("Web resource")
    expect(
      resolveProgramCardChips({
        duration_label: payload.duration,
        features: payload.features,
        wizard_snapshot: payload.wizardSnapshot,
      })
    ).toEqual(expect.arrayContaining(["Web resource", "Always available"]))
  })

  it("falls back to Program for unknown legacy object values", () => {
    expect(resolveOrganizationPrimaryObjectKind("chapter")).toBe("Program")
  })
})
