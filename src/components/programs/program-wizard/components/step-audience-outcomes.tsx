import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { ProgramWizardFormState } from "../schema"
import type { ProgramWizardFieldErrors, ProgramWizardUpdate } from "../types"

type StepAudienceOutcomesProps = {
  form: ProgramWizardFormState
  errors: ProgramWizardFieldErrors
  update: ProgramWizardUpdate
}

export function StepAudienceOutcomes({
  form,
  errors,
  update,
}: StepAudienceOutcomesProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="servesWho">Who you serve</Label>
        <Textarea
          id="servesWho"
          value={form.servesWho}
          onChange={(event) => update({ servesWho: event.currentTarget.value })}
          placeholder="Young adults transitioning into mission-driven careers"
          className="min-h-[90px] text-base"
        />
        {errors.servesWho ? <p className="text-xs text-destructive">{errors.servesWho}</p> : null}
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="eligibilityRules">Eligibility rules (optional)</Label>
        <Input
          id="eligibilityRules"
          value={form.eligibilityRules}
          onChange={(event) => update({ eligibilityRules: event.currentTarget.value })}
          placeholder="Ages 18-24, resident in county"
          className="text-base"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="receive1">Participants receive 1</Label>
        <Input
          id="receive1"
          value={form.participantReceive1}
          onChange={(event) => update({ participantReceive1: event.currentTarget.value })}
          placeholder="Weekly coaching"
          className="text-base"
        />
        {errors.participantReceive1 ? (
          <p className="text-xs text-destructive">{errors.participantReceive1}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="receive2">Participants receive 2</Label>
        <Input
          id="receive2"
          value={form.participantReceive2}
          onChange={(event) => update({ participantReceive2: event.currentTarget.value })}
          placeholder="Career readiness toolkit"
          className="text-base"
        />
        {errors.participantReceive2 ? (
          <p className="text-xs text-destructive">{errors.participantReceive2}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="receive3">Participants receive 3</Label>
        <Input
          id="receive3"
          value={form.participantReceive3}
          onChange={(event) => update({ participantReceive3: event.currentTarget.value })}
          placeholder="Employer introductions"
          className="text-base"
        />
        {errors.participantReceive3 ? (
          <p className="text-xs text-destructive">{errors.participantReceive3}</p>
        ) : null}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="outcome1">Success outcome 1</Label>
        <Input
          id="outcome1"
          value={form.successOutcome1}
          onChange={(event) => update({ successOutcome1: event.currentTarget.value })}
          placeholder="80% complete capstone"
          className="text-base"
        />
        {errors.successOutcome1 ? (
          <p className="text-xs text-destructive">{errors.successOutcome1}</p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="outcome2">Success outcome 2 (optional)</Label>
        <Input
          id="outcome2"
          value={form.successOutcome2}
          onChange={(event) => update({ successOutcome2: event.currentTarget.value })}
          placeholder="50% placed into paid internships"
          className="text-base"
        />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="outcome3">Success outcome 3 (optional)</Label>
        <Input
          id="outcome3"
          value={form.successOutcome3}
          onChange={(event) => update({ successOutcome3: event.currentTarget.value })}
          placeholder="Participant confidence score +20%"
          className="text-base"
        />
      </div>
    </section>
  )
}
