import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ProgramWizardFormState } from "../schema"
import type { ProgramWizardFieldErrors, ProgramWizardUpdate } from "../types"

type StepScheduleLocationProps = {
  form: ProgramWizardFormState
  errors: ProgramWizardFieldErrors
  update: ProgramWizardUpdate
}

export function StepScheduleLocation({
  form,
  errors,
  update,
}: StepScheduleLocationProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="startMonth">Start month</Label>
        <Input
          id="startMonth"
          type="month"
          value={form.startMonth}
          onChange={(event) => update({ startMonth: event.currentTarget.value })}
          className="text-base"
        />
        {errors.startMonth ? (
          <p className="text-xs text-destructive">{errors.startMonth}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="durationLabel">Duration</Label>
        <Input
          id="durationLabel"
          value={form.durationLabel}
          onChange={(event) => update({ durationLabel: event.currentTarget.value })}
          placeholder="12 weeks"
          className="text-base"
        />
        {errors.durationLabel ? (
          <p className="text-xs text-destructive">{errors.durationLabel}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="frequency">Frequency</Label>
        <Select value={form.frequency} onValueChange={(value) => update({ frequency: value })}>
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Weekly">Weekly</SelectItem>
            <SelectItem value="Biweekly">Biweekly</SelectItem>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Twice weekly">Twice weekly</SelectItem>
            <SelectItem value="Custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {errors.frequency ? <p className="text-xs text-destructive">{errors.frequency}</p> : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="locationMode">Location mode</Label>
        <Select
          value={form.locationMode}
          onValueChange={(value) =>
            update({ locationMode: value as ProgramWizardFormState["locationMode"] })
          }
        >
          <SelectTrigger id="locationMode">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_person">In-person</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
        {errors.locationMode ? (
          <p className="text-xs text-destructive">{errors.locationMode}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="locationDetails">Location details (optional)</Label>
        <Input
          id="locationDetails"
          value={form.locationDetails}
          onChange={(event) => update({ locationDetails: event.currentTarget.value })}
          placeholder="South Side Community Center"
          className="text-base"
        />
      </div>
    </section>
  )
}
