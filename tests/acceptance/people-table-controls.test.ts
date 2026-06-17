import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("people table controls", () => {
  it("keeps the add-person sheet trigger compact and balanced", () => {
    const controlsSource = readFileSync(
      "src/components/people/people-table-controls.tsx",
      "utf8"
    )
    const dialogSource = readFileSync(
      "src/components/people/create-person-dialog.tsx",
      "utf8"
    )

    expect(controlsSource).toContain(
      '"h-8 w-full justify-center rounded-xl px-2.5"'
    )
    expect(controlsSource).toContain('isInline && "w-auto"')
    expect(controlsSource).not.toContain('"h-10 w-full justify-center"')
    expect(controlsSource).not.toContain('"w-auto px-4"')
    expect(dialogSource).toContain("<span>Add</span>")
    expect(dialogSource).not.toContain('className="ml-2"')
  })

  it("uses one scrollable person edit form instead of a stepped sheet", () => {
    const dialogSource = readFileSync(
      "src/components/people/create-person-dialog.tsx",
      "utf8"
    )
    const fieldsSource = readFileSync(
      "src/components/people/person-profile-form-fields.tsx",
      "utf8"
    )

    expect(dialogSource).toContain("onSubmit={handleSubmit}")
    expect(dialogSource).toContain('className="flex min-h-0 flex-1 flex-col"')
    expect(dialogSource).toContain("overflow-y-auto overscroll-contain")
    expect(dialogSource).toContain("Save changes")
    expect(dialogSource).toContain("Add person")
    expect(dialogSource).toContain("PersonProfileFormFields")
    expect(fieldsSource).toContain("Profile")
    expect(fieldsSource).toContain("Contact")
    expect(fieldsSource).toContain("Profile photo")
    expect(fieldsSource).toContain("ManagerSelect")
    expect(fieldsSource).toContain('className="w-full"')
    expect(dialogSource).not.toContain("const [step")
    expect(dialogSource).not.toContain("Step {step}")
    expect(dialogSource).not.toContain("steps.length")
    expect(dialogSource).not.toContain("currentStep")
    expect(dialogSource).not.toContain("handlePrimary")
    expect(dialogSource).not.toContain("handleSecondary")
    expect(dialogSource).not.toContain(">Continue<")
    expect(dialogSource).not.toContain(">Back<")
  })
})
