type RoadmapSectionDefinition = {
  id: string
  title: string
  subtitle: string
  slug: string
  placeholder?: string
}

export type RoadmapSection = RoadmapSectionDefinition & {
  content: string
  lastUpdated: string | null
  isPublic: boolean
  layout: "square" | "vertical" | "wide"
  ctaLabel?: string
  ctaUrl?: string
}

const SECTION_DEFINITIONS: RoadmapSectionDefinition[] = [
  {
    id: "introduction",
    title: "Introduction",
    slug: "introduction",
    subtitle: "Set the stage for your organization — who you are, the problem you are solving, and why it matters now.",
    placeholder: "Open with a strong hook and a short overview of the organization.",
  },
  {
    id: "foundations",
    title: "Foundations",
    slug: "foundations",
    subtitle: "Ground readers in your mission, vision, values, and the community need that shaped them.",
    placeholder: "Connect your origin story to the change you want to see.",
  },
  {
    id: "programs_and_pilots",
    title: "Programs & Pilots",
    slug: "programs-and-pilots",
    subtitle: "Describe the experiences, services, and pilot initiatives you are running or planning next.",
    placeholder: "List the cohorts, curricula, or interventions that prove your model.",
  },
  {
    id: "funding",
    title: "Funding & Support",
    slug: "funding",
    subtitle: "Share how you are sustaining the work — revenue mix, fundraising goals, and partnerships.",
    placeholder: "Clarify what support unlocks the next phase.",
  },
  {
    id: "metrics_and_learning",
    title: "Metrics & Learning",
    slug: "metrics-and-learning",
    subtitle: "Highlight signals of progress, outcomes you track, and what you are learning along the way.",
    placeholder: "Call out a few numbers, stories, or milestones that show momentum.",
  },
  {
    id: "timeline",
    title: "Timeline & Next Steps",
    slug: "timeline",
    subtitle: "Outline upcoming milestones so stakeholders can understand how to plug in.",
    placeholder: "Think in quarters: near-term builds, launches, and decisions.",
  },
]

export const ROADMAP_SECTION_IDS = SECTION_DEFINITIONS.map((section) => section.id)

const SECTION_MAP = new Map<string, RoadmapSectionDefinition>(SECTION_DEFINITIONS.map((section) => [section.id, section]))

type StoredSection = {
  id?: unknown
  title?: unknown
  subtitle?: unknown
  slug?: unknown
  content?: unknown
  lastUpdated?: unknown
  isPublic?: unknown
  layout?: unknown
  ctaLabel?: unknown
  ctaUrl?: unknown
}

type StoredRoadmap = {
  sections?: unknown
  heroUrl?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : ""

function getStoredRoadmap(profile: Record<string, unknown> | null | undefined): StoredRoadmap {
  const roadmap = isRecord(profile?.roadmap) ? (profile!.roadmap as Record<string, unknown>) : {}
  return { sections: roadmap.sections, heroUrl: roadmap.heroUrl }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function buildRoadmapSection(
  stored: StoredSection | null | undefined,
  fallback: RoadmapSectionDefinition | null,
  index: number,
): RoadmapSection {
  const fallbackId = fallback?.id ?? `section-${index + 1}`
  const id = normalizeText(stored?.id) || fallbackId
  const title = normalizeText(stored?.title) || fallback?.title || "Untitled section"
  const subtitle = normalizeText(stored?.subtitle) || fallback?.subtitle || ""
  const content = typeof stored?.content === "string" ? stored.content : ""
  const lastUpdated =
    typeof stored?.lastUpdated === "string" || stored?.lastUpdated === null ? (stored?.lastUpdated ?? null) : null
  const isPublic = typeof stored?.isPublic === "boolean" ? stored.isPublic : false
  const layout =
    typeof stored?.layout === "string" && ["square", "vertical", "wide"].includes(stored.layout)
      ? (stored.layout as RoadmapSection["layout"])
      : "square"
  const ctaLabel =
    typeof stored?.ctaLabel === "string" && stored.ctaLabel.trim().length > 0 ? stored.ctaLabel.trim() : undefined
  const ctaUrl =
    typeof stored?.ctaUrl === "string" && stored.ctaUrl.trim().length > 0 ? stored.ctaUrl.trim() : undefined
  const slugRaw = normalizeText(stored?.slug)
  const slug = slugRaw || fallback?.slug || slugify(title) || fallbackId

  return {
    id,
    title,
    subtitle,
    slug,
    placeholder: fallback?.placeholder ?? "Start writing…",
    content,
    lastUpdated,
    isPublic,
    layout,
    ctaLabel,
    ctaUrl,
  }
}

function ensureUniqueSlugs(sections: RoadmapSection[]): RoadmapSection[] {
  const used = new Set<string>()
  return sections.map((section, index) => {
    const base = section.slug.trim() || slugify(section.title) || `section-${index + 1}`
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

export function resolveRoadmapSections(profile: Record<string, unknown> | null | undefined): RoadmapSection[] {
  const storedRoadmap = getStoredRoadmap(profile)
  const rawSections = storedRoadmap.sections

  if (Array.isArray(rawSections)) {
    const sections = rawSections
      .map((entry, index) => (isRecord(entry) ? (entry as StoredSection) : null))
      .filter(Boolean)
      .map((entry, index) => {
        const baseId = normalizeText(entry?.id)
        const fallback = baseId ? SECTION_MAP.get(baseId) ?? null : null
        return buildRoadmapSection(entry, fallback, index)
      })

    if (sections.length > 0) {
      return ensureUniqueSlugs(sections)
    }
  }

  if (isRecord(rawSections)) {
    const sections = SECTION_DEFINITIONS.map((definition, index) =>
      buildRoadmapSection(rawSections[definition.id] as StoredSection | undefined, definition, index),
    )
    return ensureUniqueSlugs(sections)
  }

  const fallbackSections = SECTION_DEFINITIONS.map((definition, index) => buildRoadmapSection(null, definition, index))
  return ensureUniqueSlugs(fallbackSections)
}

export function resolveRoadmapHeroUrl(profile: Record<string, unknown> | null | undefined): string | null {
  const storedRoadmap = getStoredRoadmap(profile)
  const heroUrl = storedRoadmap.heroUrl
  if (typeof heroUrl !== "string") return null
  const trimmed = heroUrl.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function updateRoadmapSection(
  profile: Record<string, unknown> | null | undefined,
  sectionId: string | null,
  updates: {
    title?: string
    subtitle?: string
    content?: string
    isPublic?: boolean
    layout?: RoadmapSection["layout"]
    ctaLabel?: string
    ctaUrl?: string
  },
): { nextProfile: Record<string, unknown>; section: RoadmapSection } {
  const nextProfile = isRecord(profile) ? { ...profile } : {}
  const roadmapRecord = isRecord(nextProfile.roadmap) ? { ...(nextProfile.roadmap as Record<string, unknown>) } : {}

  const resolved = resolveRoadmapSections(nextProfile)
  const targetId = normalizeText(sectionId) || `section-${Date.now()}`
  const existingIndex = resolved.findIndex((section) => section.id === targetId)
  const now = new Date().toISOString()

  let nextSection: RoadmapSection
  let nextSections: RoadmapSection[]

  if (existingIndex >= 0) {
    const current = resolved[existingIndex]
    const nextTitleRaw = typeof updates.title === "string" ? updates.title.trim() : current.title
    const nextTitle = nextTitleRaw || "Untitled section"
    const nextSubtitle = typeof updates.subtitle === "string" ? updates.subtitle.trim() : current.subtitle
    const nextContent = typeof updates.content === "string" ? updates.content : current.content
    const nextIsPublic = typeof updates.isPublic === "boolean" ? updates.isPublic : current.isPublic
    const nextLayout = updates.layout ?? current.layout
    const nextCtaLabel = typeof updates.ctaLabel === "string" ? updates.ctaLabel : current.ctaLabel
    const nextCtaUrl = typeof updates.ctaUrl === "string" ? updates.ctaUrl : current.ctaUrl
    const nextSlug = current.slug && current.slug.trim().length > 0 ? current.slug : slugify(nextTitle) || current.id

    nextSection = {
      ...current,
      title: nextTitle,
      subtitle: nextSubtitle,
      content: nextContent,
      isPublic: nextIsPublic,
      layout: nextLayout,
      ctaLabel: nextCtaLabel?.trim() || undefined,
      ctaUrl: nextCtaUrl?.trim() || undefined,
      slug: nextSlug,
      lastUpdated: now,
    }

    nextSections = resolved.map((section, index) => (index === existingIndex ? nextSection : section))
  } else {
    const base = SECTION_MAP.get(targetId) ?? null
    const nextTitle = normalizeText(updates.title) || base?.title || "New section"
    const nextSubtitle = normalizeText(updates.subtitle) || base?.subtitle || ""
    const nextContent = typeof updates.content === "string" ? updates.content : ""
    const nextIsPublic = typeof updates.isPublic === "boolean" ? updates.isPublic : false
    const nextLayout = updates.layout ?? "square"
    const nextCtaLabel = typeof updates.ctaLabel === "string" ? updates.ctaLabel : undefined
    const nextCtaUrl = typeof updates.ctaUrl === "string" ? updates.ctaUrl : undefined
    const nextSlug = slugify(nextTitle) || targetId

    nextSection = {
      ...buildRoadmapSection(
        {
          id: targetId,
          title: nextTitle,
          subtitle: nextSubtitle,
          slug: nextSlug,
          content: nextContent,
          isPublic: nextIsPublic,
          layout: nextLayout,
          ctaLabel: nextCtaLabel,
          ctaUrl: nextCtaUrl,
          lastUpdated: now,
        },
        base,
        resolved.length,
      ),
      lastUpdated: now,
    }

    nextSections = [...resolved, nextSection]
  }

  nextSections = ensureUniqueSlugs(nextSections)
  const updatedSection = nextSections.find((section) => section.id === nextSection.id) ?? nextSection

  roadmapRecord.sections = nextSections.map((section) => ({
    id: section.id,
    title: section.title,
    subtitle: section.subtitle,
    slug: section.slug,
    content: section.content,
    lastUpdated: section.lastUpdated,
    isPublic: section.isPublic,
    layout: section.layout,
    ctaLabel: section.ctaLabel,
    ctaUrl: section.ctaUrl,
  }))
  nextProfile.roadmap = roadmapRecord

  return {
    nextProfile,
    section: updatedSection,
  }
}

export function removeRoadmapSection(
  profile: Record<string, unknown> | null | undefined,
  sectionId: string | null | undefined,
): { nextProfile: Record<string, unknown>; sections: RoadmapSection[]; removed: boolean; error?: string } {
  const nextProfile = isRecord(profile) ? { ...profile } : {}
  const roadmapRecord = isRecord(nextProfile.roadmap) ? { ...(nextProfile.roadmap as Record<string, unknown>) } : {}
  const resolved = resolveRoadmapSections(nextProfile)
  const targetId = normalizeText(sectionId)

  if (!targetId) {
    return { nextProfile, sections: resolved, removed: false, error: "Missing section id." }
  }

  if (resolved.length <= 1) {
    return { nextProfile, sections: resolved, removed: false, error: "At least one section is required." }
  }

  const nextSections = resolved.filter((section) => section.id !== targetId)

  if (nextSections.length === resolved.length) {
    return { nextProfile, sections: resolved, removed: false, error: "Section not found." }
  }

  const updatedSections = ensureUniqueSlugs(nextSections)
  roadmapRecord.sections = updatedSections.map((section) => ({
    id: section.id,
    title: section.title,
    subtitle: section.subtitle,
    slug: section.slug,
    content: section.content,
    lastUpdated: section.lastUpdated,
    isPublic: section.isPublic,
    layout: section.layout,
    ctaLabel: section.ctaLabel,
    ctaUrl: section.ctaUrl,
  }))
  nextProfile.roadmap = roadmapRecord

  return { nextProfile, sections: updatedSections, removed: true }
}
