export const MAX_PERSON_TAGS = 24
export const MAX_PERSON_TAG_LENGTH = 32
export const MAX_ORGANIZATION_PERSON_TAGS = 200

export const ORGANIZATION_PEOPLE_TAG_COLORS = [
  "gray",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
] as const

export type OrganizationPeopleTagColor =
  (typeof ORGANIZATION_PEOPLE_TAG_COLORS)[number]

export type OrganizationPeopleTag = {
  id: string
  label: string
  color: OrganizationPeopleTagColor
  memberIds: string[]
}

export const DEFAULT_ORGANIZATION_PEOPLE_TAG_COLOR: OrganizationPeopleTagColor =
  "blue"

export const ORGANIZATION_PEOPLE_TAG_COLOR_OPTIONS: ReadonlyArray<{
  value: OrganizationPeopleTagColor
  label: string
  hex: string
}> = [
  { value: "gray", label: "Gray", hex: "#475569" },
  { value: "red", label: "Red", hex: "#DC2626" },
  { value: "orange", label: "Orange", hex: "#C2410C" },
  { value: "amber", label: "Amber", hex: "#A16207" },
  { value: "green", label: "Green", hex: "#15803D" },
  { value: "teal", label: "Teal", hex: "#0F766E" },
  { value: "blue", label: "Blue", hex: "#2563EB" },
  { value: "violet", label: "Violet", hex: "#7C3AED" },
  { value: "pink", label: "Pink", hex: "#BE185D" },
]

const ORGANIZATION_PEOPLE_TAG_COLOR_SET = new Set<string>(
  ORGANIZATION_PEOPLE_TAG_COLORS
)
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function normalizePersonTag(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_PERSON_TAG_LENGTH)
}

export function isOrganizationPeopleTagUuid(value: string) {
  return UUID_PATTERN.test(value)
}

export function normalizeOrganizationPeopleTagColor(
  value: unknown
): OrganizationPeopleTagColor {
  return typeof value === "string" &&
    ORGANIZATION_PEOPLE_TAG_COLOR_SET.has(value)
    ? (value as OrganizationPeopleTagColor)
    : DEFAULT_ORGANIZATION_PEOPLE_TAG_COLOR
}

export function getOrganizationPeopleTagColorHex(
  color: OrganizationPeopleTagColor
) {
  return (
    ORGANIZATION_PEOPLE_TAG_COLOR_OPTIONS.find(
      (option) => option.value === color
    )?.hex ?? "#2563EB"
  )
}

function normalizeUniqueTags(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const tags: string[] = []
  for (const entry of value) {
    if (typeof entry !== "string") continue
    const tag = normalizePersonTag(entry)
    const key = tag.toLocaleLowerCase()
    if (!tag || seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length === limit) break
  }
  return tags
}

export function normalizePersonTags(value: unknown): string[] {
  return normalizeUniqueTags(value, MAX_PERSON_TAGS)
}

export function collectPersonTagOptions(value: unknown): string[] {
  return normalizeUniqueTags(value, MAX_ORGANIZATION_PERSON_TAGS).sort(
    (left, right) => left.localeCompare(right)
  )
}
