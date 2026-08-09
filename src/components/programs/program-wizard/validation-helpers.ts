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

  if (form.objectKind === "Web resource" && !form.locationUrl.trim()) {
    next.locationUrl = "Add the resource URL."
  }

  return next
}

export function requiredFieldsForStep(
  step: number
): Array<keyof ProgramWizardFormState> {
  switch (step) {
    case 0:
      return ["objectKind"]
    case 1:
      return ["title", "oneSentence"]
    case 2:
      return ["programType", "coreFormat"]
    case 3:
      return [
        "servesWho",
        "participantReceive1",
        "participantReceive2",
        "participantReceive3",
        "successOutcome1",
      ]
    case 4:
      return ["pilotPeopleServed", "staffCount"]
    case 5:
      return ["startMonth", "durationLabel", "frequency", "locationMode"]
    case 6:
      return ["budgetUsd"]
    default:
      return []
  }
}

const FIELD_STEP_MAP: Record<string, number> = {
  objectKind: 0,
  title: 1,
  oneSentence: 1,
  subtitle: 1,
  bannerImageUrl: 1,
  imageUrl: 1,
  programType: 2,
  coreFormat: 2,
  formatAddons: 2,
  servesWho: 3,
  eligibilityRules: 3,
  participantReceive1: 3,
  participantReceive2: 3,
  participantReceive3: 3,
  successOutcome1: 3,
  successOutcome2: 3,
  successOutcome3: 3,
  pilotPeopleServed: 4,
  staffCount: 4,
  volunteerCount: 4,
  startMonth: 5,
  durationLabel: 5,
  frequency: 5,
  locationMode: 5,
  locationDetails: 5,
  locationUrl: 5,
  budgetUsd: 6,
}

export function stepForField(field: string) {
  return FIELD_STEP_MAP[field] ?? 0
}
