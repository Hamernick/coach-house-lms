import { stripHtml } from "@/lib/markdown/convert"
import { sanitizeHtml } from "@/lib/markdown/sanitize"

import { updateRoadmapSection } from "./mutations"
import { resolveRoadmapSections } from "./sections"
import type { RoadmapSection } from "./types"

export const ORGANIZATION_NARRATIVE_SECTION_IDS = {
  mission: "mission_vision_values",
  vision: "vision",
  values: "values",
} as const

export type OrganizationNarrativeKey =
  keyof typeof ORGANIZATION_NARRATIVE_SECTION_IDS

export type OrganizationNarratives = Record<OrganizationNarrativeKey, string>
export type OrganizationNarrativeRevisions = Record<
  OrganizationNarrativeKey,
  string | null
>

const ORGANIZATION_NARRATIVE_KEYS = Object.keys(
  ORGANIZATION_NARRATIVE_SECTION_IDS
) as OrganizationNarrativeKey[]

function readLegacyNarrative(
  profile: Record<string, unknown> | null | undefined,
  key: OrganizationNarrativeKey
): string {
  const value = profile?.[key]
  if (typeof value === "string") return value.trim()
  if (!Array.isArray(value)) return ""
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean)
    .join("\n")
}

export function resolveLegacyOrganizationNarratives(
  profile: Record<string, unknown> | null | undefined
): OrganizationNarratives {
  return ORGANIZATION_NARRATIVE_KEYS.reduce<OrganizationNarratives>(
    (result, key) => {
      result[key] = readLegacyNarrative(profile, key)
      return result
    },
    { mission: "", vision: "", values: "" }
  )
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function plainTextToNarrativeHtml(value: string): string {
  return value
    .trim()
    .split(/\n{2,}/)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`
    )
    .join("")
}

export function normalizeOrganizationNarrativeHtml(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  const hasHtmlElement = /<[a-z][^>]*>/i.test(trimmed)
  return sanitizeHtml(
    hasHtmlElement ? trimmed : plainTextToNarrativeHtml(trimmed)
  ).trim()
}

export function organizationNarrativeHtmlToPlainText(value: string): string {
  return stripHtml(
    value
      .replace(
        /<\/(?:h[1-6]|div|blockquote|pre|table|thead|tbody|tfoot|tr)>/gi,
        "\n\n"
      )
      .replace(
        /<(?:h[1-6]|div|blockquote|pre|table|thead|tbody|tfoot|tr)\b[^>]*>/gi,
        ""
      )
  )
}

export function isOrganizationNarrativeKey(
  value: string
): value is OrganizationNarrativeKey {
  return ORGANIZATION_NARRATIVE_KEYS.includes(value as OrganizationNarrativeKey)
}

export function getOrganizationNarrativeKeyForSectionId(
  sectionId: string
): OrganizationNarrativeKey | null {
  const normalized = sectionId.trim()
  return (
    ORGANIZATION_NARRATIVE_KEYS.find(
      (key) => ORGANIZATION_NARRATIVE_SECTION_IDS[key] === normalized
    ) ?? null
  )
}

export function resolveOrganizationNarratives(
  profile: Record<string, unknown> | null | undefined,
  options: { includeLegacyFallback?: boolean } = {}
): OrganizationNarratives {
  const includeLegacyFallback = options.includeLegacyFallback !== false
  const sectionById = new Map(
    resolveRoadmapSections(profile).map((section) => [section.id, section])
  )

  return ORGANIZATION_NARRATIVE_KEYS.reduce<OrganizationNarratives>(
    (result, key) => {
      const sectionId = ORGANIZATION_NARRATIVE_SECTION_IDS[key]
      const section = sectionById.get(sectionId)
      const content = section?.content ?? ""
      result[key] =
        content.trim().length > 0 ||
        Boolean(section && section.lastUpdated !== null) ||
        !includeLegacyFallback
          ? content
          : normalizeOrganizationNarrativeHtml(
              readLegacyNarrative(profile, key)
            )
      return result
    },
    { mission: "", vision: "", values: "" }
  )
}

export function resolveOrganizationNarrativePlainText(
  profile: Record<string, unknown> | null | undefined,
  key: OrganizationNarrativeKey
): string {
  return organizationNarrativeHtmlToPlainText(
    resolveOrganizationNarratives(profile)[key]
  )
}

export function resolveOrganizationNarrativeRevisions(
  profile: Record<string, unknown> | null | undefined
): OrganizationNarrativeRevisions {
  const sectionById = new Map(
    resolveRoadmapSections(profile).map((section) => [section.id, section])
  )
  return ORGANIZATION_NARRATIVE_KEYS.reduce<OrganizationNarrativeRevisions>(
    (result, key) => {
      result[key] =
        sectionById.get(ORGANIZATION_NARRATIVE_SECTION_IDS[key])?.lastUpdated ??
        null
      return result
    },
    { mission: null, vision: null, values: null }
  )
}

export function findOrganizationNarrativeRevisionConflict({
  profile,
  updates,
  expectedRevisions,
}: {
  profile: Record<string, unknown> | null | undefined
  updates: Partial<OrganizationNarratives>
  expectedRevisions: Partial<OrganizationNarrativeRevisions> | null | undefined
}): OrganizationNarrativeKey | null {
  if (!expectedRevisions) return null
  const current = resolveOrganizationNarrativeRevisions(profile)
  return (
    ORGANIZATION_NARRATIVE_KEYS.find(
      (key) =>
        typeof updates[key] === "string" &&
        Object.prototype.hasOwnProperty.call(expectedRevisions, key) &&
        expectedRevisions[key] !== current[key]
    ) ?? null
  )
}

export function updateOrganizationNarratives(
  profile: Record<string, unknown> | null | undefined,
  updates: Partial<OrganizationNarratives>
): {
  nextProfile: Record<string, unknown>
  sections: Partial<Record<OrganizationNarrativeKey, RoadmapSection>>
} {
  let nextProfile = { ...(profile ?? {}) }
  const sections: Partial<Record<OrganizationNarrativeKey, RoadmapSection>> = {}

  for (const key of ORGANIZATION_NARRATIVE_KEYS) {
    const value = updates[key]
    if (typeof value !== "string") continue
    const result = updateOrganizationNarrativeSection(nextProfile, key, {
      content: value,
    })
    nextProfile = result.nextProfile
    sections[key] = result.section
  }

  return { nextProfile, sections }
}

export function updateOrganizationNarrativeSection(
  profile: Record<string, unknown> | null | undefined,
  key: OrganizationNarrativeKey,
  updates: Parameters<typeof updateRoadmapSection>[2]
): { nextProfile: Record<string, unknown>; section: RoadmapSection } {
  return updateRoadmapSection(
    profile,
    ORGANIZATION_NARRATIVE_SECTION_IDS[key],
    {
      ...updates,
      content:
        typeof updates.content === "string"
          ? normalizeOrganizationNarrativeHtml(updates.content)
          : updates.content,
    }
  )
}
