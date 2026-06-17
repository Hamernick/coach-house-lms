import type {
  OrgProfile,
  OrgProgram,
} from "@/components/organization/org-profile-card/types"
import type {
  FiscalSponsorshipApplicationPrefill,
  FiscalSponsorshipProjectDurationType,
} from "@/features/fiscal-sponsorship"

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function firstText(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const trimmed = cleanText(value)
    if (trimmed) return trimmed
  }

  return null
}

function snapshotString(snapshot: unknown, key: string) {
  if (!isRecord(snapshot)) return null
  const value = snapshot[key]
  return typeof value === "string" ? cleanText(value) : null
}

function snapshotNumber(snapshot: unknown, key: string) {
  if (!isRecord(snapshot)) return null
  const value = snapshot[key]
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null
}

function snapshotStringList(snapshot: unknown, key: string) {
  if (!isRecord(snapshot)) return []
  const value = snapshot[key]
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === "string" ? cleanText(entry) : null))
    .filter((entry): entry is string => Boolean(entry))
}

function positiveCents(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null
}

function dateInputValue(value: string | null | undefined) {
  const trimmed = cleanText(value)
  if (!trimmed) return null

  const dateMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/)
  if (!dateMatch && /^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`
  return dateMatch ? dateMatch[0] : null
}

function splitName(name: string | null) {
  const parts = name?.split(/\s+/).filter(Boolean) ?? []

  return {
    firstName: parts[0] ?? null,
    lastName: parts.slice(1).join(" ") || null,
  }
}

function formatFormationStatus(status: OrgProfile["formationStatus"]) {
  if (status === "approved") return "Approved 501(c)(3)"
  if (status === "pre_501c3") return "Pre-501(c)(3)"
  if (status === "in_progress") return "501(c)(3) in progress"
  return null
}

function resolveLegalEntityHas501c3(status: OrgProfile["formationStatus"]) {
  if (status === "approved") return true
  if (status === "pre_501c3" || status === "in_progress") return false
  return null
}

function joinLocationParts(
  ...parts: Array<string | null | undefined>
): string | null {
  const normalized = parts
    .map((part) => cleanText(part))
    .filter((part): part is string => Boolean(part))

  return normalized.length > 0 ? normalized.join(", ") : null
}

function formatListSummary(values: string[]) {
  if (values.length === 0) return null
  return values.join("; ")
}

function resolveProgramLocation(program: OrgProgram | null) {
  if (!program) return null

  return firstText(
    snapshotString(program.wizard_snapshot, "locationDetails"),
    joinLocationParts(
      program.address_city,
      program.address_state,
      program.address_country
    ),
    program.location
  )
}

function resolveProfileLocation(profile: OrgProfile) {
  return firstText(
    joinLocationParts(
      profile.addressCity,
      profile.addressState,
      profile.addressCountry
    ),
    profile.address
  )
}

function resolveProjectDurationType(
  program: OrgProgram | null
): FiscalSponsorshipProjectDurationType | null {
  if (!program) return null
  if (dateInputValue(program.end_date)) return "temporary"
  if (dateInputValue(program.start_date)) return "ongoing_multi_year"
  if (snapshotString(program.wizard_snapshot, "startMonth")) {
    return "ongoing_multi_year"
  }
  return null
}

function formatProgramFundingSummary(program: OrgProgram | null) {
  if (!program) return null

  const fundingSource = snapshotString(program.wizard_snapshot, "fundingSource")
  const goalCents = positiveCents(program.goal_cents)
  const raisedCents = positiveCents(program.raised_cents)
  const currency = new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  })
  const parts = [
    fundingSource,
    goalCents
      ? `Public fundraising goal: ${currency.format(goalCents / 100)}`
      : null,
    raisedCents
      ? `Raised to date: ${currency.format(raisedCents / 100)}`
      : null,
  ].filter((part): part is string => Boolean(part))

  return parts.length > 0 ? parts.join("; ") : null
}

function resolveBudgetCents(program: OrgProgram | null) {
  if (!program) return null
  const wizardBudgetUsd = snapshotNumber(program.wizard_snapshot, "budgetUsd")
  if (wizardBudgetUsd) return Math.round(wizardBudgetUsd * 100)
  return positiveCents(program.goal_cents)
}

function formatBudgetRows(program: OrgProgram | null) {
  if (!program || !isRecord(program.wizard_snapshot)) return null

  const rows = program.wizard_snapshot.budgetRows
  if (!Array.isArray(rows)) return null

  const summaryRows = rows
    .map((row) => {
      if (!isRecord(row)) return null
      const category =
        typeof row.category === "string" ? cleanText(row.category) : null
      const description =
        typeof row.description === "string" ? cleanText(row.description) : null
      const totalCost =
        typeof row.totalCost === "string" ? cleanText(row.totalCost) : null

      if (!category && !description && !totalCost) return null

      return [category, description, totalCost ? `$${totalCost}` : null]
        .filter((part): part is string => Boolean(part))
        .join(" - ")
    })
    .filter((row): row is string => Boolean(row))

  return formatListSummary(summaryRows)
}

function choosePrimaryProgram(programs: OrgProgram[] | null | undefined) {
  return (
    programs?.find(
      (program) =>
        cleanText(program.title) ||
        cleanText(program.description) ||
        positiveCents(program.goal_cents)
    ) ?? null
  )
}

export function buildFiscalSponsorshipApplicationPrefill({
  applicantEmail,
  applicantFullName,
  initialProfile,
  programs,
}: {
  applicantEmail?: string | null
  applicantFullName?: string | null
  initialProfile: OrgProfile
  programs?: OrgProgram[] | null
}): FiscalSponsorshipApplicationPrefill {
  const primaryProgram = choosePrimaryProgram(programs)
  const contactName = firstText(initialProfile.rep, applicantFullName)
  const contactNameParts = splitName(contactName)
  const primaryEmail = firstText(initialProfile.email, applicantEmail)
  const projectName = firstText(primaryProgram?.title, initialProfile.name)
  const projectDescription = firstText(
    snapshotString(primaryProgram?.wizard_snapshot, "oneSentence"),
    primaryProgram?.description,
    initialProfile.description,
    initialProfile.programs,
    initialProfile.mission
  )
  const successOutcomes = snapshotStringList(
    primaryProgram?.wizard_snapshot,
    "successOutcomes"
  )
  const publicBenefit = firstText(
    formatListSummary(successOutcomes),
    initialProfile.need,
    initialProfile.mission,
    initialProfile.theoryOfChange
  )

  return {
    applicantFullName: contactName,
    applicantFirstName: contactNameParts.firstName,
    applicantLastName: contactNameParts.lastName,
    mailingStreetAddress: firstText(
      initialProfile.addressStreet,
      initialProfile.address
    ),
    mailingStreetAddress2: null,
    mailingCity: cleanText(initialProfile.addressCity),
    mailingState: cleanText(initialProfile.addressState),
    mailingPostalCode: cleanText(initialProfile.addressPostal),
    phoneNumber: cleanText(initialProfile.phone),
    primaryEmail,
    legalEntityHas501c3: resolveLegalEntityHas501c3(
      initialProfile.formationStatus
    ),
    formationStatus: formatFormationStatus(initialProfile.formationStatus),
    projectName,
    projectDurationType: resolveProjectDurationType(primaryProgram),
    temporaryStartDate: firstText(
      dateInputValue(primaryProgram?.start_date),
      dateInputValue(
        snapshotString(primaryProgram?.wizard_snapshot, "startMonth")
      )
    ),
    temporaryEndDate: dateInputValue(primaryProgram?.end_date),
    focusArea: firstText(
      snapshotString(primaryProgram?.wizard_snapshot, "programType"),
      primaryProgram?.features?.[0],
      primaryProgram?.subtitle,
      initialProfile.values
    ),
    projectDescription,
    projectLocation: firstText(
      resolveProgramLocation(primaryProgram),
      resolveProfileLocation(initialProfile)
    ),
    estimatedBudgetCents: resolveBudgetCents(primaryProgram),
    expenseSummary: formatBudgetRows(primaryProgram),
    prospectiveFundingSources: formatProgramFundingSummary(primaryProgram),
    publicBenefit,
    leadershipBackground: null,
    initiativeHistory: cleanText(initialProfile.originStory),
    shortPublicDescription: firstText(
      primaryProgram?.subtitle,
      initialProfile.boilerplate,
      initialProfile.tagline,
      initialProfile.description
    ),
  }
}
