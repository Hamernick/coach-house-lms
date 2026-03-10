import { describe, expect, it } from "vitest"

import { computeBudgetBreakdown, serializePayload } from "@/components/programs/program-wizard/helpers"
import { defaultProgramWizardForm } from "@/components/programs/program-wizard/schema"
import { parseErrors } from "@/components/programs/program-wizard/validation-helpers"

describe("program wizard budget flow", () => {
  it("derives total budget and fundraising need from budget-table rows", () => {
    const budget = computeBudgetBreakdown({
      ...defaultProgramWizardForm,
      budgetRows: [
        {
          category: "Staff + facilitators",
          description: "Program leadership",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "12000.00",
          totalCost: "12000.00",
        },
        {
          category: "Space + operations",
          description: "Site costs",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "3000.00",
          totalCost: "3000.00",
        },
        {
          category: "Materials + supplies",
          description: "Program materials",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "1500.00",
          totalCost: "1500.00",
        },
        {
          category: "Other program costs",
          description: "Transportation",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "500.00",
          totalCost: "500.00",
        },
      ],
      costStaffUsd: 0,
      costSpaceUsd: 0,
      costMaterialsUsd: 0,
      costOtherUsd: 0,
      raisedUsd: 2500,
    })

    expect(budget.totalBudget).toBe(17000)
    expect(budget.fundraisingTarget).toBe(14500)
    expect(budget.raised).toBe(2500)
  })

  it("requires at least one budget line item", () => {
    const errors = parseErrors({
      ...defaultProgramWizardForm,
      title: "Future Builders Mentorship Lab",
      oneSentence: "A program summary",
      costStaffUsd: 0,
      costSpaceUsd: 0,
      costMaterialsUsd: 0,
      costOtherUsd: 0,
    })

    expect(errors.budgetUsd).toBe("Add at least one budget line item.")
  })

  it("serializes fundraising target from budget-table rows instead of the raw budget field", () => {
    const payload = serializePayload({
      ...defaultProgramWizardForm,
      title: "Future Builders Mentorship Lab",
      oneSentence: "A program summary",
      servesWho: "High school students",
      participantReceive1: "Mentorship",
      participantReceive2: "Career exposure",
      participantReceive3: "Action plan",
      successOutcome1: "A completed roadmap",
      startMonth: "2026-04",
      durationLabel: "8 weeks",
      frequency: "Weekly",
      budgetRows: [
        {
          category: "Staff + facilitators",
          description: "Program leadership",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "12000.00",
          totalCost: "12000.00",
        },
        {
          category: "Space + operations",
          description: "Site costs",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "3000.00",
          totalCost: "3000.00",
        },
        {
          category: "Materials + supplies",
          description: "Program materials",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "1500.00",
          totalCost: "1500.00",
        },
        {
          category: "Other program costs",
          description: "Transportation",
          costType: "Fixed",
          unit: "Program",
          units: "1",
          costPerUnit: "500.00",
          totalCost: "500.00",
        },
      ],
      costStaffUsd: 0,
      costSpaceUsd: 0,
      costMaterialsUsd: 0,
      costOtherUsd: 0,
      raisedUsd: 2500,
      budgetUsd: 999999,
    })

    expect(payload.goalCents).toBe(1450000)
    expect(payload.raisedCents).toBe(250000)
    expect(payload.wizardSnapshot?.budgetUsd).toBe(17000)
    expect(payload.wizardSnapshot?.goalUsd).toBe(14500)
    expect(payload.wizardSnapshot?.budgetRows).toHaveLength(4)
  })
})
