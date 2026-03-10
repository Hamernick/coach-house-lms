type ProgramPreviewLike = {
  title: string
  subtitle: string | null
}

export const PUBLIC_MAP_GROUP_ORDER = [
  "education",
  "community",
  "health",
  "housing",
  "funding",
  "workforce",
  "climate",
  "global",
] as const

export type PublicMapGroupKey = (typeof PUBLIC_MAP_GROUP_ORDER)[number]

export const PUBLIC_MAP_GROUP_LABELS: Record<PublicMapGroupKey, string> = {
  education: "Education",
  community: "Community",
  health: "Health",
  housing: "Housing",
  funding: "Funding",
  workforce: "Workforce",
  climate: "Climate",
  global: "Global",
}

export const PUBLIC_MAP_GROUP_ACCENTS: Record<PublicMapGroupKey, string> = {
  education: "#4f8cff",
  community: "#2f9f8f",
  health: "#4ea7a0",
  housing: "#c98f4d",
  funding: "#7b7be6",
  workforce: "#e19149",
  climate: "#3da472",
  global: "#6774f0",
}

type InferGroupsInput = {
  profile: Record<string, unknown>
  name: string
  tagline: string | null
  description: string | null
  programs: ProgramPreviewLike[]
}

const GROUP_MATCHERS: Record<PublicMapGroupKey, string[]> = {
  education: ["education", "school", "student", "learning", "youth", "after-school", "stem", "literacy"],
  community: ["community", "mutual aid", "neighbors", "grassroots", "civic", "local support", "family support"],
  health: ["health", "wellness", "mental", "medical", "nutrition", "therapy", "care access"],
  housing: ["housing", "shelter", "homeless", "tenant", "affordable housing", "rent", "eviction"],
  funding: ["funding", "grant", "capital", "finance", "philanthropy", "investment"],
  workforce: ["workforce", "jobs", "career", "employment", "upskill", "training", "apprenticeship"],
  climate: ["climate", "sustainability", "environment", "green", "energy", "conservation"],
  global: ["global", "international", "immigrant", "diaspora", "cross-border", "refugee"],
}

const EXPLICIT_PROFILE_KEYS = [
  "onboarding_intent_focus",
  "focus",
  "focus_area",
  "focus_areas",
  "map_group",
  "map_groups",
  "category",
  "categories",
  "sector",
  "sectors",
] as const

function normalizeCandidate(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ")
}

function collectStringValues(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed.length > 0 ? [trimmed] : []
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => (typeof entry === "string" ? collectStringValues(entry) : []))
  }
  return []
}

function detectGroupsFromText(text: string, target: Set<PublicMapGroupKey>) {
  for (const groupKey of PUBLIC_MAP_GROUP_ORDER) {
    const matched = GROUP_MATCHERS[groupKey].some((token) => text.includes(token))
    if (matched) {
      target.add(groupKey)
    }
  }
}

export function inferPublicMapGroups(input: InferGroupsInput): PublicMapGroupKey[] {
  const detected = new Set<PublicMapGroupKey>()

  for (const key of EXPLICIT_PROFILE_KEYS) {
    const values = collectStringValues(input.profile[key])
    for (const value of values) {
      detectGroupsFromText(normalizeCandidate(value), detected)
    }
  }

  const textCorpus = [
    input.name,
    input.tagline ?? "",
    input.description ?? "",
    ...input.programs.map((program) => program.title),
    ...input.programs.map((program) => program.subtitle ?? ""),
  ]
    .join(" ")
    .toLowerCase()

  detectGroupsFromText(textCorpus, detected)

  const ordered = PUBLIC_MAP_GROUP_ORDER.filter((groupKey) => detected.has(groupKey))
  return ordered.length > 0 ? ordered : ["community"]
}
