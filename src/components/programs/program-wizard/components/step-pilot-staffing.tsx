import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { ProgramWizardFormState } from "../schema"
import type { ProgramWizardFieldErrors, ProgramWizardUpdate } from "../types"
import { NumberField } from "./number-field"

type StepPilotStaffingProps = {
  form: ProgramWizardFormState
  errors: ProgramWizardFieldErrors
  update: ProgramWizardUpdate
}

export function StepPilotStaffing({
  form,
  errors,
  update,
}: StepPilotStaffingProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <NumberField
        id="peopleServed"
        label="People served (pilot target)"
        value={form.pilotPeopleServed}
        onChange={(value) => update({ pilotPeopleServed: value })}
        min={1}
        error={errors.pilotPeopleServed}
      />
      <NumberField
        id="staffCount"
        label="Staff count"
        value={form.staffCount}
        onChange={(value) => update({ staffCount: value })}
        min={1}
        error={errors.staffCount}
      />
      <NumberField
        id="volunteerCount"
        label="Volunteer count (optional)"
        value={form.volunteerCount}
        onChange={(value) => update({ volunteerCount: value })}
        min={0}
      />

      <div className="grid gap-2 sm:col-span-2">
        <div className="flex items-center justify-between">
          <Label>Staff roles (optional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              update({
                staffRoles: [...form.staffRoles, { role: "", hoursPerWeek: 10 }],
              })
            }}
          >
            Add role
          </Button>
        </div>
        {form.staffRoles.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            Add role + hours/week to clarify delivery capacity.
          </p>
        ) : (
          <div className="space-y-2">
            {form.staffRoles.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_160px_auto]"
              >
                <Input
                  value={entry.role}
                  onChange={(event) => {
                    const next = [...form.staffRoles]
                    next[index] = { ...next[index], role: event.currentTarget.value }
                    update({ staffRoles: next })
                  }}
                  placeholder="Program coordinator"
                  className="text-base"
                />
                <Input
                  type="number"
                  min={0}
                  max={168}
                  value={entry.hoursPerWeek}
                  onChange={(event) => {
                    const next = [...form.staffRoles]
                    next[index] = {
                      ...next[index],
                      hoursPerWeek: Number(event.currentTarget.value || "0"),
                    }
                    update({ staffRoles: next })
                  }}
                  placeholder="Hours/week"
                  className="text-base"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10"
                  onClick={() => {
                    const next = form.staffRoles.filter(
                      (_, roleIndex) => roleIndex !== index,
                    )
                    update({ staffRoles: next })
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
