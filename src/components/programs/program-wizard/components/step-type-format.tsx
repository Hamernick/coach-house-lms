import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DELIVERY_FORMATS, PROGRAM_TYPES, ProgramWizardFormState } from "../schema"
import type { ProgramWizardFieldErrors, ProgramWizardUpdate } from "../types"

type StepTypeFormatProps = {
  form: ProgramWizardFormState
  errors: ProgramWizardFieldErrors
  update: ProgramWizardUpdate
}

export function StepTypeFormat({ form, errors, update }: StepTypeFormatProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label>Program type</Label>
        <Select
          value={form.programType}
          onValueChange={(value) =>
            update({ programType: value as ProgramWizardFormState["programType"] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose type" />
          </SelectTrigger>
          <SelectContent>
            {PROGRAM_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.programType ? (
          <p className="text-xs text-destructive">{errors.programType}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label>Core format</Label>
        <Select
          value={form.coreFormat}
          onValueChange={(value) =>
            update({ coreFormat: value as ProgramWizardFormState["coreFormat"] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose core format" />
          </SelectTrigger>
          <SelectContent>
            {DELIVERY_FORMATS.map((format) => (
              <SelectItem key={format} value={format}>
                {format}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.coreFormat ? (
          <p className="text-xs text-destructive">{errors.coreFormat}</p>
        ) : null}
      </div>
      <div className="sm:col-span-2">
        <Label>Add-ons (optional)</Label>
        <p className="mb-2 mt-1 text-xs text-muted-foreground">
          Pick extra delivery modes beyond your core format.
        </p>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_FORMATS.filter((format) => format !== form.coreFormat).map((format) => {
            const selected = form.formatAddons.includes(format)
            return (
              <Button
                key={format}
                type="button"
                variant={selected ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => {
                  const next = selected
                    ? form.formatAddons.filter((entry) => entry !== format)
                    : [...form.formatAddons, format]
                  update({ formatAddons: next })
                }}
              >
                {format}
              </Button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
