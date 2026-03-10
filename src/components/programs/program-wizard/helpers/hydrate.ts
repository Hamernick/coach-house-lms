import {
  defaultProgramWizardForm,
  DELIVERY_FORMATS,
  LOCATION_MODES,
  ProgramWizardFormState,
  PROGRAM_TYPES,
} from "../schema"
import type { ProgramWizardProps } from "../types"
import {
  isRecord,
  normalizeAddons,
  toMonthInput,
  toNumberValue,
  toStringArray,
  toStringValue,
} from "./conversions"
import {
  computeBudgetBreakdown,
  normalizeProgramBudgetRows,
} from "./budget"

export function hydrateFromProgram(
  program: ProgramWizardProps["program"],
): ProgramWizardFormState {
  if (!program) return defaultProgramWizardForm
  const snapshot = isRecord(program.wizard_snapshot) ? program.wizard_snapshot : {}
  const participants = isRecord(snapshot)
    ? toStringArray(snapshot.participantReceives)
    : []
  const outcomes = isRecord(snapshot) ? toStringArray(snapshot.successOutcomes) : []
  const staffRolesRaw =
    isRecord(snapshot) && Array.isArray(snapshot.staffRoles)
      ? snapshot.staffRoles
      : []
  const staffRoles = staffRolesRaw
    .filter((entry) => isRecord(entry))
    .map((entry) => ({
      role: toStringValue(entry.role).trim(),
      hoursPerWeek: toNumberValue(entry.hoursPerWeek, 0),
    }))
    .filter((entry) => entry.role.length > 0)

  const features = Array.isArray(program.features) ? program.features : []
  const snapshotProgramType = toStringValue(snapshot.programType)
  const snapshotCoreFormat = toStringValue(snapshot.coreFormat)

  const programType = (PROGRAM_TYPES as readonly string[]).includes(
    snapshotProgramType,
  )
    ? (snapshotProgramType as ProgramWizardFormState["programType"])
    : "Direct Services"

  const coreFormatCandidate = (DELIVERY_FORMATS as readonly string[]).includes(
    snapshotCoreFormat,
  )
    ? snapshotCoreFormat
    : features.find((feature) =>
        (DELIVERY_FORMATS as readonly string[]).includes(feature),
      )

  const coreFormat =
    (coreFormatCandidate as ProgramWizardFormState["coreFormat"]) ?? "Cohort"

  const addonCandidates = toStringArray(snapshot.formatAddons)
  const fallbackAddons = features.filter((feature) => feature !== coreFormat)
  const formatAddons = normalizeAddons(
    coreFormat,
    addonCandidates.length > 0 ? addonCandidates : fallbackAddons,
  )

  const locationModeRaw = toStringValue(snapshot.locationMode)
  const locationMode = (LOCATION_MODES as readonly string[]).includes(
    locationModeRaw,
  )
    ? (locationModeRaw as ProgramWizardFormState["locationMode"])
    : program.location_type === "online"
      ? "online"
      : "in_person"

  const budgetUsd = toNumberValue(
    snapshot.budgetUsd,
    Math.round((program.goal_cents ?? 0) / 100),
  )
  const costStaffUsd = toNumberValue(snapshot.costStaffUsd, 0)
  const costSpaceUsd = toNumberValue(snapshot.costSpaceUsd, 0)
  const costMaterialsUsd = toNumberValue(snapshot.costMaterialsUsd, 0)
  const fallbackOtherCost =
    costStaffUsd + costSpaceUsd + costMaterialsUsd > 0 ? 0 : budgetUsd
  const costOtherUsd = toNumberValue(snapshot.costOtherUsd, fallbackOtherCost)
  const raisedUsd = toNumberValue(
    snapshot.raisedUsd,
    Math.round((program.raised_cents ?? 0) / 100),
  )
  const budgetRows = normalizeProgramBudgetRows(
    Array.isArray(snapshot.budgetRows) ? snapshot.budgetRows : [],
    [],
  )
  const budget = computeBudgetBreakdown({
    budgetRows,
    costStaffUsd,
    costSpaceUsd,
    costMaterialsUsd,
    costOtherUsd,
    raisedUsd,
  })

  return {
    ...defaultProgramWizardForm,
    title: toStringValue(snapshot.title, toStringValue(program.title)),
    oneSentence: toStringValue(snapshot.oneSentence, toStringValue(program.description)),
    subtitle: toStringValue(snapshot.subtitle, toStringValue(program.subtitle)),
    bannerImageUrl: toStringValue(snapshot.bannerImageUrl),
    imageUrl: toStringValue(snapshot.imageUrl, toStringValue(program.image_url)),
    programType,
    coreFormat,
    formatAddons,
    servesWho: toStringValue(snapshot.servesWho),
    eligibilityRules: toStringValue(snapshot.eligibilityRules),
    participantReceive1: toStringValue(
      snapshot.participantReceive1,
      participants[0] ?? "",
    ),
    participantReceive2: toStringValue(
      snapshot.participantReceive2,
      participants[1] ?? "",
    ),
    participantReceive3: toStringValue(
      snapshot.participantReceive3,
      participants[2] ?? "",
    ),
    successOutcome1: toStringValue(snapshot.successOutcome1, outcomes[0] ?? ""),
    successOutcome2: toStringValue(snapshot.successOutcome2, outcomes[1] ?? ""),
    successOutcome3: toStringValue(snapshot.successOutcome3, outcomes[2] ?? ""),
    pilotPeopleServed: toNumberValue(snapshot.pilotPeopleServed, 25),
    staffCount: toNumberValue(snapshot.staffCount, 2),
    volunteerCount: toNumberValue(snapshot.volunteerCount, 0),
    staffRoles,
    startMonth: toStringValue(snapshot.startMonth, toMonthInput(program.start_date)),
    durationLabel: toStringValue(snapshot.durationLabel, toStringValue(program.duration_label)),
    frequency: toStringValue(snapshot.frequency, "Weekly"),
    locationMode,
    locationDetails: toStringValue(snapshot.locationDetails, toStringValue(program.location)),
    budgetRows: budget.rows,
    budgetUsd: budget.totalBudget,
    costStaffUsd: budget.costStaffUsd,
    costSpaceUsd: budget.costSpaceUsd,
    costMaterialsUsd: budget.costMaterialsUsd,
    costOtherUsd: budget.costOtherUsd,
    fundingSource: toStringValue(snapshot.fundingSource),
    statusLabel: toStringValue(
      snapshot.statusLabel,
      toStringValue(program.status_label, "Draft"),
    ),
    ctaLabel: toStringValue(snapshot.ctaLabel, toStringValue(program.cta_label, "Learn more")),
    ctaUrl: toStringValue(snapshot.ctaUrl, toStringValue(program.cta_url)),
    goalUsd: toNumberValue(
      snapshot.goalUsd,
      budget.fundraisingTarget || Math.round((program.goal_cents ?? 0) / 100),
    ),
    raisedUsd: budget.raised,
    features,
    isPublic:
      typeof program.is_public === "boolean"
        ? program.is_public
        : defaultProgramWizardForm.isPublic,
  }
}
