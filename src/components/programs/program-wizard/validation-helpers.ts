import type { ProgramWizardFormState } from "./schema"
import { ProgramWizardSchema } from "./schema"
import { computeBudgetBreakdown } from "./helpers/budget"

export function parseErrors(form: ProgramWizardFormState) {
  const parsed = ProgramWizardSchema.safeParse(form)
  const next: Record<string, string> = {}
  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0]
      if (typeof key === "string" && !next[key]) {
        next[key] = issue.message
      }
    })
  }

  if (computeBudgetBreakdown(form).totalBudget <= 0) {
    next.budgetUsd = "Add at least one budget line item."
  }

  return next
}

export function requiredFieldsForStep(step: number): Array<keyof ProgramWizardFormState> {
  switch (step) {
    case 0:
      return ["title", "oneSentence"]
    case 1:
      return ["programType", "coreFormat"]
    case 2:
      return [
        "servesWho",
        "participantReceive1",
        "participantReceive2",
        "participantReceive3",
        "successOutcome1",
      ]
    case 3:
      return ["pilotPeopleServed", "staffCount"]
    case 4:
      return ["startMonth", "durationLabel", "frequency", "locationMode"]
    case 5:
      return ["budgetUsd"]
    default:
      return []
  }
}

const FIELD_STEP_MAP: Record<string, number> = {
  title: 0,
  oneSentence: 0,
  subtitle: 0,
  bannerImageUrl: 0,
  imageUrl: 0,
  programType: 1,
  coreFormat: 1,
  formatAddons: 1,
  servesWho: 2,
  eligibilityRules: 2,
  participantReceive1: 2,
  participantReceive2: 2,
  participantReceive3: 2,
  successOutcome1: 2,
  successOutcome2: 2,
  successOutcome3: 2,
  pilotPeopleServed: 3,
  staffCount: 3,
  volunteerCount: 3,
  startMonth: 4,
  durationLabel: 4,
  frequency: 4,
  locationMode: 4,
  locationDetails: 4,
  budgetUsd: 5,
}

export function stepForField(field: string) {
  return FIELD_STEP_MAP[field] ?? 0
}
