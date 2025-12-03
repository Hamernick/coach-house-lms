type RoadmapSectionDefinition = {
  id: string
  title: string
  slug: string
  description: string
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
    description: "Set the stage for your organization — who you are, the problem you are solving, and why it matters now.",
    placeholder: "Open with a strong hook and a short overview of the organization.",
  },
  {
    id: "foundations",
    title: "Foundations",
    slug: "foundations",
    description: "Ground readers in your mission, vision, values, and the community need that shaped them.",
    placeholder: "Connect your origin story to the change you want to see.",
  },
  {
    id: "programs_and_pilots",
    title: "Programs & Pilots",
    slug: "programs-and-pilots",
    description: "Describe the experiences, services, and pilot initiatives you are running or planning next.",
    placeholder: "List the cohorts, curricula, or interventions that prove your model.",
  },
  {
    id: "funding",
    title: "Funding & Support",
    slug: "funding",
    description: "Share how you are sustaining the work — revenue mix, fundraising goals, and partnerships.",
    placeholder: "Clarify what support unlocks the next phase.",
  },
  {
    id: "metrics_and_learning",
    title: "Metrics & Learning",
    slug: "metrics-and-learning",
    description: "Highlight signals of progress, outcomes you track, and what you are learning along the way.",
    placeholder: "Call out a few numbers, stories, or milestones that show momentum.",
  },
  {
    id: "timeline",
    title: "Timeline & Next Steps",
    slug: "timeline",
    description: "Outline upcoming milestones so stakeholders can understand how to plug in.",
    placeholder: "Think in quarters: near-term builds, launches, and decisions.",
  },
]

export const ROADMAP_SECTION_IDS = SECTION_DEFINITIONS.map((section) => section.id)

const SECTION_MAP = new Map<string, RoadmapSectionDefinition>(SECTION_DEFINITIONS.map((section) => [section.id, section]))

type StoredSection = {
  content?: unknown
  lastUpdated?: unknown
  isPublic?: unknown
  layout?: unknown
  ctaLabel?: unknown
  ctaUrl?: unknown
}

type StoredRoadmap = {
  sections?: Record<string, StoredSection> | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

function getStoredRoadmap(profile: Record<string, unknown> | null | undefined): StoredRoadmap {
  const roadmap = isRecord(profile?.roadmap) ? (profile!.roadmap as Record<string, unknown>) : {}
  const sectionsRaw = isRecord(roadmap.sections) ? (roadmap.sections as Record<string, StoredSection>) : {}
  return { sections: sectionsRaw }
}

function resolveSectionContent(sectionId: string, stored: StoredSection | undefined): RoadmapSection {
  const meta = SECTION_MAP.get(sectionId)
  if (!meta) {
    throw new Error(`Unknown roadmap section: ${sectionId}`)
  }
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
  const ctaUrl = typeof stored?.ctaUrl === "string" && stored.ctaUrl.trim().length > 0 ? stored.ctaUrl.trim() : undefined

  return {
    ...meta,
    content,
    lastUpdated,
    isPublic,
    layout,
    ctaLabel,
    ctaUrl,
  }
}

export function resolveRoadmapSections(profile: Record<string, unknown> | null | undefined): RoadmapSection[] {
  const storedRoadmap = getStoredRoadmap(profile)
  return SECTION_DEFINITIONS.map((definition) =>
    resolveSectionContent(definition.id, storedRoadmap.sections?.[definition.id]),
  )
}

export function updateRoadmapSection(
  profile: Record<string, unknown> | null | undefined,
  sectionId: string,
  content: string,
  options?: { isPublic?: boolean; layout?: RoadmapSection["layout"]; ctaLabel?: string; ctaUrl?: string },
): { nextProfile: Record<string, unknown>; section: RoadmapSection } {
  if (!SECTION_MAP.has(sectionId)) {
    throw new Error(`Unknown roadmap section: ${sectionId}`)
  }

  const nextProfile = isRecord(profile) ? { ...profile } : {}
  const roadmapRecord = isRecord(nextProfile.roadmap) ? { ...(nextProfile.roadmap as Record<string, unknown>) } : {}
  const sectionsRecord = isRecord(roadmapRecord.sections)
    ? { ...(roadmapRecord.sections as Record<string, StoredSection>) }
    : {}

  const now = new Date().toISOString()
  const currentSection = { ...(sectionsRecord[sectionId] ?? {}) }
  currentSection.content = content
  currentSection.lastUpdated = now
  if (typeof options?.isPublic === "boolean") {
    currentSection.isPublic = options.isPublic
  } else if (typeof currentSection.isPublic !== "boolean") {
    currentSection.isPublic = false
  }
  if (options?.layout) {
    currentSection.layout = options.layout
  }
  if (typeof options?.ctaLabel === "string") {
    currentSection.ctaLabel = options.ctaLabel
  }
  if (typeof options?.ctaUrl === "string") {
    currentSection.ctaUrl = options.ctaUrl
  }
  sectionsRecord[sectionId] = currentSection
  roadmapRecord.sections = sectionsRecord
  nextProfile.roadmap = roadmapRecord

  return {
    nextProfile,
    section: resolveSectionContent(sectionId, currentSection),
  }
}
