import { SECTION_DEFINITIONS } from "./definitions"
import type {
  RoadmapSection,
  RoadmapSectionDefinition,
  RoadmapSectionStatus,
  StoredRoadmap,
  StoredSection,
} from "./types"

const TEST_SECTION_TITLES = new Set(["test", "testing", "foundations"])
const DEPRECATED_SECTION_IDS = new Set(["strategic_roadmap"])
const DEPRECATED_SECTION_SLUGS = new Set(["strategic-roadmap"])
const ROADMAP_SECTION_LAYOUTS = new Set<RoadmapSection["layout"]>([
  "square",
  "vertical",
  "wide",
])
const ROADMAP_SECTION_STATUSES = new Set<RoadmapSectionStatus>([
  "not_started",
  "in_progress",
  "complete",
])

export const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

export const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

export function isTestSectionValue(value: unknown): boolean {
  const normalized = normalizeText(value).toLowerCase()
  return normalized.length > 0 && TEST_SECTION_TITLES.has(normalized)
}

export function shouldRemoveTestSection(
  entry: StoredSection | null | undefined,
  key?: string,
): boolean {
  if (isTestSectionValue(key)) return true
  const keyNormalized = normalizeText(key).toLowerCase()
  if (DEPRECATED_SECTION_IDS.has(keyNormalized)) return true
  if (!entry) return false
  const entryId = normalizeText(entry.id).toLowerCase()
  const entrySlug = normalizeText(entry.slug).toLowerCase()
  return (
    isTestSectionValue(entry.id) ||
    isTestSectionValue(entry.title) ||
    isTestSectionValue(entry.slug) ||
    DEPRECATED_SECTION_IDS.has(entryId) ||
    DEPRECATED_SECTION_SLUGS.has(entrySlug)
  )
}

export function getStoredRoadmap(
  profile: Record<string, unknown> | null | undefined,
): StoredRoadmap {
  const roadmap = isRecord(profile?.roadmap)
    ? (profile.roadmap as Record<string, unknown>)
    : {}
  return { sections: roadmap.sections, heroUrl: roadmap.heroUrl }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

export function buildRoadmapSection(
  stored: StoredSection | null | undefined,
  fallback: RoadmapSectionDefinition | null,
  index: number,
): RoadmapSection {
  const fallbackId = fallback?.id ?? `section-${index + 1}`
  const id = normalizeText(stored?.id) || fallbackId
  const storedTitle = normalizeText(stored?.title)
  const storedSubtitle = normalizeText(stored?.subtitle)
  const templateTitle = fallback?.title ?? ""
  const templateSubtitle = fallback?.subtitle || ""
  const storedTitleIsTemplate =
    templateTitle.length > 0 && storedTitle === templateTitle.trim()
  const storedSubtitleIsTemplate =
    templateSubtitle.length > 0 && storedSubtitle === templateSubtitle.trim()
  const effectiveStoredTitle = storedTitleIsTemplate ? "" : storedTitle
  const effectiveStoredSubtitle = storedSubtitleIsTemplate ? "" : storedSubtitle
  const title = effectiveStoredTitle || templateTitle
  const subtitle = effectiveStoredSubtitle || templateSubtitle
  const titleIsTemplate =
    effectiveStoredTitle.length === 0 && templateTitle.length > 0
  const subtitleIsTemplate =
    effectiveStoredSubtitle.length === 0 && templateSubtitle.length > 0
  const content = typeof stored?.content === "string" ? stored.content : ""
  const imageUrlRaw = normalizeText(stored?.imageUrl)
  const imageUrl = imageUrlRaw.length > 0 ? imageUrlRaw : undefined
  const lastUpdated =
    typeof stored?.lastUpdated === "string" || stored?.lastUpdated === null
      ? (stored?.lastUpdated ?? null)
      : null
  const isPublic = typeof stored?.isPublic === "boolean" ? stored.isPublic : false
  const layout =
    typeof stored?.layout === "string" &&
    ROADMAP_SECTION_LAYOUTS.has(stored.layout as RoadmapSection["layout"])
      ? (stored.layout as RoadmapSection["layout"])
      : "square"
  const status =
    typeof stored?.status === "string" &&
    ROADMAP_SECTION_STATUSES.has(stored.status as RoadmapSectionStatus)
      ? (stored.status as RoadmapSectionStatus)
      : content.trim().length > 0
        ? "in_progress"
        : "not_started"
  const ctaLabel =
    typeof stored?.ctaLabel === "string" && stored.ctaLabel.trim().length > 0
      ? stored.ctaLabel.trim()
      : undefined
  const ctaUrl =
    typeof stored?.ctaUrl === "string" && stored.ctaUrl.trim().length > 0
      ? stored.ctaUrl.trim()
      : undefined
  const slugRaw = normalizeText(stored?.slug)
  const slug = slugRaw || fallback?.slug || slugify(title) || fallbackId
  const prompt =
    fallback?.prompt ??
    fallback?.placeholder ??
    (storedSubtitle.length > 0
      ? storedSubtitle
      : storedTitle.length > 0
        ? `Write about ${storedTitle}.`
        : "Start writing...")
  const placeholder =
    fallback?.placeholder ??
    (storedSubtitle.length > 0
      ? storedSubtitle
      : storedTitle.length > 0
        ? `Write about ${storedTitle}.`
        : "Start writing...")

  return {
    id,
    title,
    subtitle,
    slug,
    titleExample: fallback?.titleExample,
    subtitleExample: fallback?.subtitleExample,
    prompt,
    placeholder,
    content,
    imageUrl,
    lastUpdated,
    isPublic,
    layout,
    status,
    ctaLabel,
    ctaUrl,
    templateTitle,
    templateSubtitle,
    titleIsTemplate,
    subtitleIsTemplate,
  }
}

export function ensureUniqueSlugs(sections: RoadmapSection[]): RoadmapSection[] {
  const used = new Set<string>()
  return sections.map((section, index) => {
    const base =
      section.slug.trim() || slugify(section.title) || `section-${index + 1}`
    let nextSlug = base
    let suffix = 1
    while (used.has(nextSlug)) {
      nextSlug = `${base}-${suffix}`
      suffix += 1
    }
    used.add(nextSlug)
    if (nextSlug === section.slug) return section
    return { ...section, slug: nextSlug }
  })
}

export function serializeRoadmapSections(sections: RoadmapSection[]) {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    subtitle: section.subtitle,
    slug: section.slug,
    content: section.content,
    imageUrl: section.imageUrl,
    lastUpdated: section.lastUpdated,
    isPublic: section.isPublic,
    layout: section.layout,
    status: section.status,
    ctaLabel: section.ctaLabel,
    ctaUrl: section.ctaUrl,
  }))
}

export function defaultRoadmapSections() {
  return SECTION_DEFINITIONS.map((definition, index) =>
    buildRoadmapSection(null, definition, index),
  )
}
