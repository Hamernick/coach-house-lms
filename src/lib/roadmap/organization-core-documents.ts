import { normalizeOrganizationNarrativeHtml } from "./organization-narratives"
import { updateRoadmapSection } from "./mutations"
import { resolveRoadmapSections } from "./sections"
import type { RoadmapSection } from "./types"

export const ORGANIZATION_CORE_DOCUMENT_SECTION_IDS = {
  originStory: "origin_story",
  need: "need",
  mission: "mission_vision_values",
  vision: "vision",
  values: "values",
  theoryOfChange: "theory_of_change",
} as const

export type OrganizationCoreDocumentKey =
  keyof typeof ORGANIZATION_CORE_DOCUMENT_SECTION_IDS

export type OrganizationCoreDocuments = Record<
  OrganizationCoreDocumentKey,
  string
>

const CORE_DOCUMENT_KEYS = Object.keys(
  ORGANIZATION_CORE_DOCUMENT_SECTION_IDS
) as OrganizationCoreDocumentKey[]

const PROFILE_KEY_TO_CORE_DOCUMENT = new Map<
  string,
  OrganizationCoreDocumentKey
>([
  ["originStory", "originStory"],
  ["origin_story", "originStory"],
  ["need", "need"],
  ["needStatement", "need"],
  ["need_statement", "need"],
  ["mission", "mission"],
  ["vision", "vision"],
  ["values", "values"],
  ["theoryOfChange", "theoryOfChange"],
  ["theory_of_change", "theoryOfChange"],
])

function readLegacyValue(
  profile: Record<string, unknown>,
  key: OrganizationCoreDocumentKey
): string {
  const aliases: Record<OrganizationCoreDocumentKey, string[]> = {
    originStory: ["originStory", "origin_story"],
    need: ["need", "needStatement", "need_statement"],
    mission: ["mission"],
    vision: ["vision"],
    values: ["values"],
    theoryOfChange: ["theoryOfChange", "theory_of_change"],
  }
  for (const alias of aliases[key]) {
    const value = profile[alias]
    if (typeof value === "string" && value.trim()) return value.trim()
    if (!Array.isArray(value)) continue
    const joined = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean)
      .join("\n")
    if (joined) return joined
  }
  return ""
}

export function getOrganizationCoreDocumentKey(
  profileKey: string
): OrganizationCoreDocumentKey | null {
  return PROFILE_KEY_TO_CORE_DOCUMENT.get(profileKey.trim()) ?? null
}

export function resolveOrganizationCoreDocuments(
  profile: Record<string, unknown> | null | undefined
): OrganizationCoreDocuments {
  const normalizedProfile = profile ?? {}
  const sectionById = new Map(
    resolveRoadmapSections(normalizedProfile).map((section) => [
      section.id,
      section,
    ])
  )

  return CORE_DOCUMENT_KEYS.reduce<OrganizationCoreDocuments>(
    (result, key) => {
      const section = sectionById.get(
        ORGANIZATION_CORE_DOCUMENT_SECTION_IDS[key]
      )
      result[key] =
        section &&
        (section.content.trim().length > 0 || section.lastUpdated !== null)
          ? section.content
          : normalizeOrganizationNarrativeHtml(
              readLegacyValue(normalizedProfile, key)
            )
      return result
    },
    {
      originStory: "",
      need: "",
      mission: "",
      vision: "",
      values: "",
      theoryOfChange: "",
    }
  )
}

export function updateOrganizationCoreDocuments(
  profile: Record<string, unknown> | null | undefined,
  updates: Partial<OrganizationCoreDocuments>
): {
  nextProfile: Record<string, unknown>
  sections: Partial<Record<OrganizationCoreDocumentKey, RoadmapSection>>
} {
  let nextProfile = { ...(profile ?? {}) }
  const sections: Partial<Record<OrganizationCoreDocumentKey, RoadmapSection>> =
    {}

  for (const key of CORE_DOCUMENT_KEYS) {
    const content = updates[key]
    if (typeof content !== "string") continue
    const currentSection = resolveRoadmapSections(nextProfile).find(
      (section) => section.id === ORGANIZATION_CORE_DOCUMENT_SECTION_IDS[key]
    )
    const result = updateRoadmapSection(
      nextProfile,
      ORGANIZATION_CORE_DOCUMENT_SECTION_IDS[key],
      {
        content: normalizeOrganizationNarrativeHtml(content),
        status:
          currentSection?.status === "not_started" && content.trim()
            ? "in_progress"
            : undefined,
      }
    )
    nextProfile = result.nextProfile
    sections[key] = result.section
  }

  return { nextProfile, sections }
}
