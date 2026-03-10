import type { CreateProgramPayload } from "@/actions/programs"

import type { ProgramWizardFormState } from "../schema"
import { computeBudgetBreakdown } from "./budget"
import { monthToIsoStart, normalizeAddons } from "./conversions"
import { computeFeasibility } from "./feasibility"

export function serializePayload(
  form: ProgramWizardFormState,
): CreateProgramPayload {
  const budget = computeBudgetBreakdown(form)
  const formatAddons = normalizeAddons(form.coreFormat, form.formatAddons)
  const locationType = form.locationMode === "online" ? "online" : "in_person"
  const location =
    form.locationDetails.trim() ||
    (form.locationMode === "online"
      ? "Online"
      : form.locationMode === "hybrid"
        ? "Hybrid"
        : "In person")

  const participantReceives = [
    form.participantReceive1,
    form.participantReceive2,
    form.participantReceive3,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const successOutcomes = [
    form.successOutcome1,
    form.successOutcome2,
    form.successOutcome3,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const feasibility = computeFeasibility(form)

  const wizardSnapshot = {
    version: 1,
    title: form.title.trim(),
    oneSentence: form.oneSentence.trim(),
    subtitle: form.subtitle.trim(),
    bannerImageUrl: form.bannerImageUrl.trim(),
    imageUrl: form.imageUrl.trim(),
    programType: form.programType,
    coreFormat: form.coreFormat,
    formatAddons,
    servesWho: form.servesWho.trim(),
    eligibilityRules: form.eligibilityRules.trim(),
    participantReceive1: form.participantReceive1.trim(),
    participantReceive2: form.participantReceive2.trim(),
    participantReceive3: form.participantReceive3.trim(),
    participantReceives,
    successOutcome1: form.successOutcome1.trim(),
    successOutcome2: form.successOutcome2.trim(),
    successOutcome3: form.successOutcome3.trim(),
    successOutcomes,
    pilotPeopleServed: Number(form.pilotPeopleServed),
    staffCount: Number(form.staffCount),
    volunteerCount: Number(form.volunteerCount),
    staffRoles: form.staffRoles,
    startMonth: form.startMonth,
    durationLabel: form.durationLabel.trim(),
    frequency: form.frequency.trim(),
    locationMode: form.locationMode,
    locationDetails: form.locationDetails.trim(),
    budgetRows: budget.rows,
    budgetUsd: budget.totalBudget,
    costStaffUsd: budget.costStaffUsd,
    costSpaceUsd: budget.costSpaceUsd,
    costMaterialsUsd: budget.costMaterialsUsd,
    costOtherUsd: budget.costOtherUsd,
    goalUsd: budget.fundraisingTarget,
    raisedUsd: budget.raised,
    fundingSource: form.fundingSource.trim(),
    ctaLabel: form.ctaLabel?.trim() ?? "",
    ctaUrl: form.ctaUrl?.trim() ?? "",
    statusLabel: form.statusLabel?.trim() ?? "Draft",
    metrics: {
      costPerParticipant: feasibility.costPerParticipant,
      participantsPerStaff: feasibility.participantsPerStaff,
      serviceIntensity: feasibility.serviceIntensity,
      flags: feasibility.flags,
    },
    updatedAt: new Date().toISOString(),
  }

  const features = [form.programType, form.coreFormat, ...formatAddons]

  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || null,
    description: form.oneSentence.trim(),
    location,
    locationType,
    locationUrl: locationType === "online" ? null : null,
    imageUrl: form.imageUrl.trim() || null,
    duration: form.durationLabel.trim() || null,
    startDate: monthToIsoStart(form.startMonth),
    endDate: null,
    features,
    statusLabel: form.statusLabel?.trim() || "Draft",
    goalCents: Math.round(budget.fundraisingTarget * 100),
    raisedCents: Math.round(budget.raised * 100),
    isPublic: Boolean(form.isPublic),
    ctaLabel: form.ctaLabel?.trim() || "Learn more",
    ctaUrl: form.ctaUrl?.trim() || null,
    wizardSnapshot,
  }
}
