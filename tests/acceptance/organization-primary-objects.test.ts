import { describe, expect, it } from "vitest"

import { serializePayload } from "@/components/programs/program-wizard/helpers"
import { defaultProgramWizardForm } from "@/components/programs/program-wizard/schema"
import {
  ORGANIZATION_PRIMARY_OBJECT_KINDS,
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
    ])
  })

  it("serializes the selected object kind into saved wizard data and chips", () => {
    const payload = serializePayload({
      ...defaultProgramWizardForm,
      objectKind: "Re-grant request",
      title: "Emergency Mutual Aid Re-grant",
      oneSentence: "A re-grant request for direct community relief.",
      servesWho: "Families affected by emergency displacement.",
      participantReceive1: "Direct relief payments",
      participantReceive2: "Referral support",
      participantReceive3: "Follow-up documentation",
      successOutcome1: "Funds reach eligible families within 14 days.",
      startMonth: "2026-04",
      durationLabel: "Open request cycle",
      frequency: "Monthly review",
      budgetRows: [
        {
          category: "Direct re-grants",
          description: "Relief payments to eligible families.",
          costType: "Variable",
          unit: "Grant",
          units: "10",
          costPerUnit: "1000.00",
          totalCost: "10000.00",
        },
      ],
      costStaffUsd: 0,
      costSpaceUsd: 0,
      costMaterialsUsd: 0,
      costOtherUsd: 0,
    })

    expect(payload.wizardSnapshot?.objectKind).toBe("Re-grant request")
    expect(payload.features).toContain("Re-grant request")
    expect(
      resolveProgramCardChips({
        duration_label: payload.duration,
        features: payload.features,
        wizard_snapshot: payload.wizardSnapshot,
      })
    ).toEqual(
      expect.arrayContaining(["Re-grant request", "Open request cycle"])
    )
  })

  it("falls back to Program for unknown legacy object values", () => {
    expect(resolveOrganizationPrimaryObjectKind("chapter")).toBe("Program")
  })
})
