import type { ProgramWizardFormState } from "../schema"
import type { ProgramWizardFieldErrors, ProgramWizardUpdate } from "../types"
import { StepAudienceOutcomes } from "./step-audience-outcomes"
import { StepBasicInfo } from "./step-basic-info"
import { StepBudgetFeasibility } from "./step-budget-feasibility"
import { StepPilotStaffing } from "./step-pilot-staffing"
import { StepReviewGenerate } from "./step-review-generate"
import { StepScheduleLocation } from "./step-schedule-location"
import { StepTypeFormat } from "./step-type-format"

type ProgramWizardStepContentProps = {
  mode: "create" | "edit"
  currentStep: number
  form: ProgramWizardFormState
  errors: ProgramWizardFieldErrors
  update: ProgramWizardUpdate
  feasibility: {
    costPerParticipant: number | null
    participantsPerStaff: number | null
    serviceIntensity: number | null
    flags: string[]
  }
  onCopyBrief: () => void
}

export function ProgramWizardStepContent({
  mode,
  currentStep,
  form,
  errors,
  update,
  feasibility,
  onCopyBrief,
}: ProgramWizardStepContentProps) {
  switch (currentStep) {
    case 0:
      return <StepBasicInfo mode={mode} form={form} errors={errors} update={update} />
    case 1:
      return <StepTypeFormat form={form} errors={errors} update={update} />
    case 2:
      return <StepAudienceOutcomes form={form} errors={errors} update={update} />
    case 3:
      return <StepPilotStaffing form={form} errors={errors} update={update} />
    case 4:
      return <StepScheduleLocation form={form} errors={errors} update={update} />
    case 5:
      return (
        <StepBudgetFeasibility
          form={form}
          errors={errors}
          update={update}
          feasibility={feasibility}
        />
      )
    case 6:
      return <StepReviewGenerate form={form} onCopyBrief={onCopyBrief} />
    default:
      return null
  }
}
