import type { CreateProgramPayload } from "@/actions/programs"

import {
  defaultProgramWizardForm,
  DELIVERY_FORMATS,
  LOCATION_MODES,
  type ProgramWizardFormState,
  PROGRAM_TYPES,
  ProgramWizardSchema,
} from "./schema"

export type ProgramRecord = {
  id: string
  title: string | null
  subtitle?: string | null
  description?: string | null
  location?: string | null
  location_type?: "in_person" | "online" | null
  location_url?: string | null
  image_url?: string | null
  duration_label?: string | null
  features?: string[] | null
  status_label?: string | null
  goal_cents?: number | null
  raised_cents?: number | null
  is_public?: boolean | null
  start_date?: string | null
  end_date?: string | null
  cta_label?: string | null
  cta_url?: string | null
  wizard_snapshot?: Record<string, unknown> | null
}

export type ProgramWizardProgramInput = (Partial<ProgramRecord> & { id: string }) | null | undefined

export const DRAFT_STORAGE_KEY = "coach-house:program-wizard-draft:v1"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean)
}

function toMonthInput(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function monthToIsoStart(value: string) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null
  return `${value}-01T00:00:00.000Z`
}

export function normalizeAddons(coreFormat: string, addons: string[]) {
  const unique = new Set<string>()
  addons.forEach((addon) => {
    const trimmed = addon.trim()
    if (!trimmed || trimmed === coreFormat) return
    unique.add(trimmed)
  })
  return Array.from(unique)
}

function estimateDurationWeeks(durationLabel: string) {
  const normalized = durationLabel.toLowerCase()
  const numeric = normalized.match(/\d+(?:\.\d+)?/)
  const value = numeric ? Number(numeric[0]) : Number.NaN
  if (!Number.isFinite(value)) return null
  if (normalized.includes("month")) return value * 4
  if (normalized.includes("week")) return value
  if (normalized.includes("day")) return value / 7
  return value
}

function estimateSessionsPerWeek(frequency: string) {
  const normalized = frequency.trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes("daily")) return 5
  if (normalized.includes("twice") && normalized.includes("week")) return 2
  if (normalized.includes("weekly")) return 1
  if (normalized.includes("biweekly") || normalized.includes("every other week")) return 0.5
  if (normalized.includes("monthly")) return 0.25
  return 1
}

export function computeFeasibility(form: ProgramWizardFormState) {
  const people = Number(form.pilotPeopleServed) > 0 ? Number(form.pilotPeopleServed) : 0
  const staff = Number(form.staffCount) > 0 ? Number(form.staffCount) : 0
  const budget = Number(form.budgetUsd) > 0 ? Number(form.budgetUsd) : 0

  const costPerParticipant = people > 0 ? budget / people : null
  const participantsPerStaff = staff > 0 ? people / staff : null

  const durationWeeks = estimateDurationWeeks(form.durationLabel)
  const sessionsPerWeek = estimateSessionsPerWeek(form.frequency)
  const serviceIntensity =
    durationWeeks !== null && sessionsPerWeek !== null
      ? Math.max(0, Math.round(durationWeeks * sessionsPerWeek))
      : null

  const flags: string[] = []
  if (costPerParticipant !== null && costPerParticipant > 3000) {
    flags.push("Very high cost per participant")
  }
  if (participantsPerStaff !== null && participantsPerStaff > 40) {
    flags.push("Low staffing for this many participants")
  }
  if (!form.startMonth || !form.frequency.trim() || !form.durationLabel.trim()) {
    flags.push("No schedule yet")
  }

  return {
    costPerParticipant,
    participantsPerStaff,
    serviceIntensity,
    flags,
  }
}

function money(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not enough data"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.max(0, value))
}

function ratio(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not enough data"
  return `${value.toFixed(1)} participants per staff`
}

export function hydrateFromProgram(program: ProgramWizardProgramInput): ProgramWizardFormState {
  if (!program) return defaultProgramWizardForm
  const snapshot = isRecord(program.wizard_snapshot) ? program.wizard_snapshot : {}
  const participants = isRecord(snapshot) ? toStringArray(snapshot.participantReceives) : []
  const outcomes = isRecord(snapshot) ? toStringArray(snapshot.successOutcomes) : []
  const staffRolesRaw = isRecord(snapshot) && Array.isArray(snapshot.staffRoles) ? snapshot.staffRoles : []
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

  const programType = (PROGRAM_TYPES as readonly string[]).includes(snapshotProgramType)
    ? (snapshotProgramType as ProgramWizardFormState["programType"])
    : "Direct Services"

  const coreFormatCandidate =
    (DELIVERY_FORMATS as readonly string[]).includes(snapshotCoreFormat)
      ? snapshotCoreFormat
      : features.find((feature) => (DELIVERY_FORMATS as readonly string[]).includes(feature))

  const coreFormat = (coreFormatCandidate as ProgramWizardFormState["coreFormat"]) ?? "Cohort"

  const addonCandidates = toStringArray(snapshot.formatAddons)
  const fallbackAddons = features.filter((feature) => feature !== coreFormat)
  const formatAddons = normalizeAddons(
    coreFormat,
    addonCandidates.length > 0 ? addonCandidates : fallbackAddons,
  )

  const locationModeRaw = toStringValue(snapshot.locationMode)
  const locationMode = (LOCATION_MODES as readonly string[]).includes(locationModeRaw)
    ? (locationModeRaw as ProgramWizardFormState["locationMode"])
    : program.location_type === "online"
      ? "online"
      : "in_person"

  return {
    ...defaultProgramWizardForm,
    title: toStringValue(snapshot.title, toStringValue(program.title)),
    oneSentence: toStringValue(snapshot.oneSentence, toStringValue(program.description)),
    subtitle: toStringValue(snapshot.subtitle, toStringValue(program.subtitle)),
    imageUrl: toStringValue(snapshot.imageUrl, toStringValue(program.image_url)),
    programType,
    coreFormat,
    formatAddons,
    servesWho: toStringValue(snapshot.servesWho),
    eligibilityRules: toStringValue(snapshot.eligibilityRules),
    participantReceive1: toStringValue(snapshot.participantReceive1, participants[0] ?? ""),
    participantReceive2: toStringValue(snapshot.participantReceive2, participants[1] ?? ""),
    participantReceive3: toStringValue(snapshot.participantReceive3, participants[2] ?? ""),
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
    budgetUsd: toNumberValue(snapshot.budgetUsd, Math.round((program.goal_cents ?? 0) / 100)),
    costStaffUsd: toNumberValue(snapshot.costStaffUsd, 0),
    costSpaceUsd: toNumberValue(snapshot.costSpaceUsd, 0),
    costMaterialsUsd: toNumberValue(snapshot.costMaterialsUsd, 0),
    costOtherUsd: toNumberValue(snapshot.costOtherUsd, 0),
    fundingSource: toStringValue(snapshot.fundingSource),
    statusLabel: toStringValue(snapshot.statusLabel, toStringValue(program.status_label, "Draft")),
    ctaLabel: toStringValue(snapshot.ctaLabel, toStringValue(program.cta_label, "Learn more")),
    ctaUrl: toStringValue(snapshot.ctaUrl, toStringValue(program.cta_url)),
    goalUsd: toNumberValue(snapshot.goalUsd, Math.round((program.goal_cents ?? 0) / 100)),
    raisedUsd: toNumberValue(snapshot.raisedUsd, Math.round((program.raised_cents ?? 0) / 100)),
    features,
    isPublic: typeof program.is_public === "boolean" ? program.is_public : defaultProgramWizardForm.isPublic,
  }
}

export function serializePayload(form: ProgramWizardFormState): CreateProgramPayload {
  const formatAddons = normalizeAddons(form.coreFormat, form.formatAddons)
  const locationType = form.locationMode === "online" ? "online" : "in_person"
  const location =
    form.locationDetails.trim() ||
    (form.locationMode === "online" ? "Online" : form.locationMode === "hybrid" ? "Hybrid" : "In person")

  const participantReceives = [
    form.participantReceive1,
    form.participantReceive2,
    form.participantReceive3,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const successOutcomes = [form.successOutcome1, form.successOutcome2, form.successOutcome3]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const feasibility = computeFeasibility(form)

  const wizardSnapshot = {
    version: 1,
    title: form.title.trim(),
    oneSentence: form.oneSentence.trim(),
    subtitle: form.subtitle.trim(),
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
    budgetUsd: Number(form.budgetUsd),
    costStaffUsd: Number(form.costStaffUsd),
    costSpaceUsd: Number(form.costSpaceUsd),
    costMaterialsUsd: Number(form.costMaterialsUsd),
    costOtherUsd: Number(form.costOtherUsd),
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
    goalCents: Math.round(Number(form.budgetUsd) * 100),
    raisedCents: Math.round(Number(form.raisedUsd) * 100),
    isPublic: Boolean(form.isPublic),
    ctaLabel: form.ctaLabel?.trim() || "Learn more",
    ctaUrl: form.ctaUrl?.trim() || null,
    wizardSnapshot,
  }
}

export function summaryText(form: ProgramWizardFormState) {
  const participantReceives = [
    form.participantReceive1,
    form.participantReceive2,
    form.participantReceive3,
  ]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const outcomes = [form.successOutcome1, form.successOutcome2, form.successOutcome3]
    .map((entry) => entry.trim())
    .filter(Boolean)

  const feasibility = computeFeasibility(form)

  return [
    `Program Brief: ${form.title.trim() || "Untitled program"}`,
    ``,
    `Summary: ${form.oneSentence.trim() || "Not set"}`,
    `Type: ${form.programType}`,
    `Delivery: ${form.coreFormat}${form.formatAddons.length > 0 ? ` + ${form.formatAddons.join(", ")}` : ""}`,
    ``,
    `Who is served: ${form.servesWho.trim() || "Not set"}`,
    `Eligibility: ${form.eligibilityRules.trim() || "Not set"}`,
    `Participants receive: ${participantReceives.length > 0 ? participantReceives.join("; ") : "Not set"}`,
    `Outcomes: ${outcomes.length > 0 ? outcomes.join("; ") : "Not set"}`,
    ``,
    `Pilot size: ${form.pilotPeopleServed} participants`,
    `Staffing: ${form.staffCount} staff, ${form.volunteerCount} volunteers`,
    `Start month: ${form.startMonth || "Not set"}`,
    `Duration: ${form.durationLabel.trim() || "Not set"}`,
    `Frequency: ${form.frequency.trim() || "Not set"}`,
    `Location: ${form.locationMode}${form.locationDetails.trim() ? ` (${form.locationDetails.trim()})` : ""}`,
    `Budget: ${money(Number(form.budgetUsd))}`,
    `Cost per participant: ${money(feasibility.costPerParticipant)}`,
    `Staff ratio: ${ratio(feasibility.participantsPerStaff)}`,
    `Estimated service intensity: ${
      feasibility.serviceIntensity !== null ? `${feasibility.serviceIntensity} sessions` : "Not enough data"
    }`,
    `Feasibility flags: ${feasibility.flags.length > 0 ? feasibility.flags.join("; ") : "None"}`,
  ].join("\n")
}

export function parseErrors(form: ProgramWizardFormState) {
  const parsed = ProgramWizardSchema.safeParse(form)
  if (parsed.success) return {}
  const next: Record<string, string> = {}
  parsed.error.issues.forEach((issue) => {
    const key = issue.path[0]
    if (typeof key === "string" && !next[key]) {
      next[key] = issue.message
    }
  })
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

export function stepForField(field: string) {
  const stepMap: Record<string, number> = {
    title: 0,
    oneSentence: 0,
    subtitle: 0,
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
  return stepMap[field] ?? 0
}

export function deserializeDraft(raw: string | null): ProgramWizardFormState {
  const fallback = { ...defaultProgramWizardForm }
  if (!raw) return fallback

  const parsed = JSON.parse(raw) as Partial<ProgramWizardFormState>
  return {
    ...fallback,
    ...parsed,
    formatAddons: normalizeAddons(
      parsed.coreFormat ?? fallback.coreFormat,
      Array.isArray(parsed.formatAddons) ? parsed.formatAddons.map(String) : fallback.formatAddons,
    ),
    staffRoles: Array.isArray(parsed.staffRoles)
      ? parsed.staffRoles
          .filter((entry) => isRecord(entry))
          .map((entry) => ({
            role: toStringValue(entry.role),
            hoursPerWeek: toNumberValue(entry.hoursPerWeek, 0),
          }))
      : fallback.staffRoles,
  }
}
