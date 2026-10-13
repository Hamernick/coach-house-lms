import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  computeBudgetBreakdown,
  serializePayload,
} from "@/components/programs/program-wizard/helpers"
import { defaultProgramWizardForm } from "@/components/programs/program-wizard/schema"
import { parseErrors } from "@/components/programs/program-wizard/validation-helpers"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

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

  it("uses the stacked budget layout in the wizard instead of a horizontal table scroller", () => {
    const budgetStepSource = readSource(
      "src/components/programs/program-wizard/components/step-budget-feasibility.tsx"
    )
    const fieldSource = readSource(
      "src/components/training/module-detail/assignment-form/assignment-budget-table-field.tsx"
    )
    const tableSource = readSource(
      "src/components/training/module-detail/budget-table.tsx"
    )
    const stackedRowsSource = readSource(
      "src/components/training/module-detail/budget-table-stacked-rows.tsx"
    )

    expect(budgetStepSource).toContain('layout="stacked"')
    expect(budgetStepSource).toContain(
      'className="flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden"'
    )
    expect(budgetStepSource).toContain("sticky top-0 z-10")
    expect(budgetStepSource.indexOf("Total program budget")).toBeLessThan(
      budgetStepSource.indexOf("<AssignmentBudgetTableField")
    )
    expect(budgetStepSource.indexOf("Fundraising need")).toBeLessThan(
      budgetStepSource.indexOf("<AssignmentBudgetTableField")
    )
    expect(budgetStepSource).not.toContain("lg:grid-cols-[1.2fr_0.8fr]")
    expect(budgetStepSource).not.toContain("grid gap-3 sm:grid-cols-3")
    expect(budgetStepSource).not.toContain("sm:grid-cols-3")
    expect(budgetStepSource).not.toContain("sm:grid-cols-2")
    expect(budgetStepSource).not.toContain('from "@/components/ui/separator"')
    expect(budgetStepSource).not.toContain("<Separator")
    expect(fieldSource).toContain('layout?: "grid" | "stacked"')
    expect(fieldSource).toContain("layout={layout}")
    expect(fieldSource).toContain('layout === "grid" && isStepper')
    expect(fieldSource).toContain("overflow-x-hidden")
    expect(fieldSource).not.toContain("sm:flex-row")
    expect(fieldSource).not.toContain("sm:w-auto")
    expect(tableSource).toContain('layout?: "grid" | "stacked"')
    expect(tableSource).toContain('layout = "grid"')
    expect(tableSource).toContain('layout === "stacked"')
    expect(tableSource).toContain("<BudgetTableStackedRows")
    expect(stackedRowsSource).toContain("BudgetTableStackedRows")
    expect(stackedRowsSource).toContain(
      "flex w-full max-w-full min-w-0 flex-col gap-3 overflow-x-hidden"
    )
    expect(stackedRowsSource).not.toContain("overflow-auto")
    expect(stackedRowsSource).not.toContain("minWidth: BUDGET_TABLE_MIN_WIDTH")
    expect(stackedRowsSource).not.toContain("md:grid-cols")
  })
})
