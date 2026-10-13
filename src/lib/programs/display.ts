type ProgramDisplayRecord = {
  description?: string | null
  subtitle?: string | null
  image_url?: string | null
  duration_label?: string | null
  features?: string[] | null
  wizard_snapshot?: Record<string, unknown> | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function readSnapshotString(snapshot: unknown, key: string) {
  if (!isRecord(snapshot)) return null
  const value = snapshot[key]
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readDirectString(value: string | null | undefined) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readSnapshotStringArray(snapshot: unknown, key: string) {
  if (!isRecord(snapshot)) return []
  const value = snapshot[key]
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean)
}

export function resolveProgramBannerImageUrl(program: ProgramDisplayRecord) {
  return readSnapshotString(program.wizard_snapshot, "bannerImageUrl")
}

export function resolveProgramSummary(program: ProgramDisplayRecord) {
  return (
    readSnapshotString(program.wizard_snapshot, "oneSentence") ??
    readDirectString(program.description) ??
    readDirectString(program.subtitle)
  )
}

export function resolveProgramProfileImageUrl(program: ProgramDisplayRecord) {
  return readDirectString(program.image_url)
}

export function resolveProgramCardChips(program: ProgramDisplayRecord) {
  const duration =
    readSnapshotString(program.wizard_snapshot, "durationLabel") ??
    readDirectString(program.duration_label)
  const programType = readSnapshotString(program.wizard_snapshot, "programType")
  const coreFormat = readSnapshotString(program.wizard_snapshot, "coreFormat")
  const formatAddons = readSnapshotStringArray(
    program.wizard_snapshot,
    "formatAddons",
  )

  const wizardChips = [duration, programType, coreFormat, ...formatAddons].filter(
    (value): value is string => Boolean(value),
  )
  if (wizardChips.length > 0) return wizardChips

  const featureChips = Array.isArray(program.features)
    ? program.features
        .map((entry) => readDirectString(entry))
        .filter((value): value is string => Boolean(value))
    : []

  return [duration, ...featureChips].filter(
    (value): value is string => Boolean(value),
  )
}
