import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  defaultProgramWizardForm,
  type ProgramWizardFormState,
} from "@/components/programs/program-wizard/schema"
import {
  parseErrors,
  requiredFieldsForStep,
  stepForField,
} from "@/components/programs/program-wizard/validation-helpers"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("program wizard activity flow", () => {
  const validScheduleForm = {
    ...defaultProgramWizardForm,
    title: "Youth Stewardship Fellows",
    oneSentence:
      "A youth-led operations track for neighborhood resource-night delivery.",
    servesWho: "Youth leaders and neighborhood volunteers",
    participantReceive1: "Training",
    participantReceive2: "Mentorship",
    participantReceive3: "Resource support",
    successOutcome1: "Participants can run a neighborhood resource night.",
    startMonth: "2026-04",
    durationLabel: "12 months",
    frequency: "Monthly",
    budgetRows: [
      {
        category: "Staff + facilitators",
        description: "Program leadership",
        costType: "Fixed",
        unit: "Program",
        units: "1",
        costPerUnit: "14000.00",
        totalCost: "14000.00",
      },
    ],
    budgetUsd: 14000,
  } satisfies ProgramWizardFormState

  it("starts with activity type selection before the detail form", () => {
    const constantsSource = readSource(
      "src/components/programs/program-wizard/constants.ts"
    )
    const stepContentSource = readSource(
      "src/components/programs/program-wizard/components/program-wizard-step-content.tsx"
    )
    const activityKindSource = readSource(
      "src/components/programs/program-wizard/components/step-activity-kind.tsx"
    )
    const typeFormatSource = readSource(
      "src/components/programs/program-wizard/components/step-type-format.tsx"
    )
    const wizardSource = readSource(
      "src/components/programs/program-wizard.tsx"
    )
    const wizardTypesSource = readSource(
      "src/components/programs/program-wizard/types.ts"
    )
    const dialogSource = readSource("src/components/ui/dialog.tsx")

    expect(constantsSource).toContain('title: "Choose activity type"')
    expect(constantsSource).toContain('title: "Activity name"')
    expect(constantsSource).not.toContain('title: "Object name"')
    expect(constantsSource).not.toContain('title: "Object type + format"')

    expect(stepContentSource).toContain(
      "return <StepActivityKind form={form} errors={errors} update={update} />"
    )
    expect(stepContentSource).toContain("<StepBasicInfo")
    expect(activityKindSource).toContain("What are you adding?")
    expect(activityKindSource).toContain(
      "ORGANIZATION_PRIMARY_OBJECT_DEFINITIONS"
    )
    expect(activityKindSource).toContain("hover:border-primary/50")

    expect(typeFormatSource).not.toContain("Object type")
    expect(typeFormatSource).not.toContain("ORGANIZATION_PRIMARY_OBJECT_KINDS")
    expect(wizardSource).toContain("sm:max-w-[56rem]")
    expect(wizardSource).toContain("grid-rows-[auto_minmax(0,1fr)_auto]")
    expect(wizardSource).toContain("max-h-[calc(100svh-1rem)]")
    expect(wizardSource).toContain("w-[calc(100vw-1rem)]")
    expect(wizardSource).toContain("sm:w-[min(calc(100vw-2rem),56rem)]")
    expect(wizardSource).toContain("overflow-y-auto overscroll-contain")
    expect(wizardSource).toContain("px-3 py-3 sm:px-5 sm:py-5")
    expect(wizardSource).toContain("Activity builder")
    expect(wizardSource).not.toContain("Primary object created")
    expect(wizardTypesSource).toContain("portalContainer?: HTMLElement | null")
    expect(dialogSource).toContain("portalContainer")
    expect(dialogSource).toContain("container={portalContainer}")
  })

  it("can render the activity dialog inside the workspace canvas frame", () => {
    const wizardSource = readSource(
      "src/components/programs/program-wizard.tsx"
    )

    expect(wizardSource).toContain(
      "const isCanvasScoped = portalContainer !== undefined"
    )
    expect(wizardSource).toContain(
      "const canRenderDialogContent = !isCanvasScoped || Boolean(portalContainer)"
    )
    expect(wizardSource).toContain(
      "portalContainer={portalContainer ?? undefined}"
    )
    expect(wizardSource).toContain(
      'overlayClassName={\n            isCanvasScoped\n              ? "absolute inset-0 bg-black/50 backdrop-blur-sm"'
    )
    expect(wizardSource).toContain(
      '"bg-background/98 absolute max-h-[calc(100%-1rem)]'
    )
    expect(wizardSource).toContain("w-[calc(100%-1rem)]")
    expect(wizardSource).toContain("sm:max-h-[calc(100%-2rem)]")
    expect(wizardSource).toContain("sm:w-[min(calc(100%-2rem),56rem)]")
  })

  it("keeps validation aligned with the inserted activity type step", () => {
    expect(requiredFieldsForStep(0)).toEqual(["objectKind"])
    expect(requiredFieldsForStep(1)).toEqual(["title", "oneSentence"])
    expect(requiredFieldsForStep(2)).toEqual(["programType", "coreFormat"])
    expect(stepForField("objectKind")).toBe(0)
    expect(stepForField("title")).toBe(1)
    expect(stepForField("budgetUsd")).toBe(6)
  })

  it("shows a user-facing start month error instead of the raw regex message", () => {
    const errors = parseErrors({
      ...validScheduleForm,
      startMonth: "",
    })

    expect(errors.startMonth).toBe("Choose a start month.")
    expect(errors.startMonth).not.toContain("Invalid string")
    expect(errors.startMonth).not.toContain("must match pattern")
  })
})
