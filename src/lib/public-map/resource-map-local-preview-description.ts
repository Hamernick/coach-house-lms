const MACHINE_DESCRIPTION_LABELS = new Map<string, string>([
  ["community centre", "community center"],
  ["community center", "community center"],
  ["library", "library"],
  ["sports centre", "sports and recreation center"],
  ["sports center", "sports and recreation center"],
  ["food bank", "food pantry"],
  ["social facility", "social service facility"],
  ["healthcare", "healthcare resource"],
  ["clinic", "clinic"],
  ["doctors", "medical office"],
  ["doctor", "medical office"],
  ["hospital", "hospital"],
  ["dentist", "dental care"],
])

function cleanDescriptionText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null
}

function normalizeMachineDescriptionToken(value: string | null | undefined) {
  const normalized = cleanDescriptionText(value)
    ?.toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\bcentre\b/g, "center")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return normalized || null
}

function formatMachineDescriptionLabel(value: string | null | undefined) {
  const normalized = normalizeMachineDescriptionToken(value)
  if (!normalized || /^[a-z]\d+$/i.test(normalized)) return null
  return MACHINE_DESCRIPTION_LABELS.get(normalized) ?? normalized
}

function readMachineDescriptionLabels(value: string | null | undefined) {
  return [
    ...new Set(
      (value ?? "")
        .split(/[;|,/]+/u)
        .map(formatMachineDescriptionLabel)
        .filter((entry): entry is string => Boolean(entry))
    ),
  ].slice(0, 2)
}

function formatResourceDescriptionList(values: string[]) {
  if (values.length <= 1) return values[0] ?? null
  return `${values[0]} and ${values[1]}`
}

function formatResourceDescriptionArticle(value: string) {
  return /^[aeiou]/i.test(value) ? "an" : "a"
}

function isMachineOnlyDescription({
  description,
  sourceCategoryText,
}: {
  description: string
  sourceCategoryText: string | null
}) {
  const normalizedDescription = normalizeMachineDescriptionToken(description)
  if (!normalizedDescription) return false
  if (description.includes("_")) return true
  if (MACHINE_DESCRIPTION_LABELS.has(normalizedDescription)) return true

  return readMachineDescriptionLabels(sourceCategoryText).some(
    (label) => normalizeMachineDescriptionToken(label) === normalizedDescription
  )
}

export function resolveResourceDescription({
  city,
  description,
  sourceCategoryText,
  state,
}: {
  city: string | null
  description: string | null
  sourceCategoryText: string | null
  state: string | null
}) {
  const cleanedDescription = cleanDescriptionText(description)
  if (
    cleanedDescription &&
    !isMachineOnlyDescription({
      description: cleanedDescription,
      sourceCategoryText,
    })
  ) {
    return cleanedDescription
  }

  const label = formatResourceDescriptionList(
    readMachineDescriptionLabels(sourceCategoryText)
  )
  if (!label) return cleanedDescription

  const location = [city, state].filter(Boolean).join(", ")
  return `Listed as ${formatResourceDescriptionArticle(label)} ${label}${
    location ? ` in ${location}` : ""
  }.`
}
