export type RoadmapSectionDefinition = {
  id: string
  title: string
  subtitle: string
  slug: string
  titleExample?: string
  subtitleExample?: string
  prompt?: string
  placeholder?: string
}

export type RoadmapHomeworkStatus = "complete" | "in_progress" | "not_started"

export type RoadmapSectionStatus = "not_started" | "in_progress" | "complete"

export type RoadmapHomeworkLink = {
  href: string
  label: string
  status: RoadmapHomeworkStatus
  moduleId: string
  moduleTitle: string
  classSlug: string
  moduleIdx: number
}

export type RoadmapSection = RoadmapSectionDefinition & {
  content: string
  imageUrl?: string
  lastUpdated: string | null
  isPublic: boolean
  layout: "square" | "vertical" | "wide"
  status: RoadmapSectionStatus
  ctaLabel?: string
  ctaUrl?: string
  homework?: RoadmapHomeworkLink | null
  templateTitle: string
  templateSubtitle: string
  titleIsTemplate: boolean
  subtitleIsTemplate: boolean
}

const SECTION_DEFINITIONS: RoadmapSectionDefinition[] = [
  {
    id: "origin_story",
    title: "Origin Story",
    slug: "origin-story",
    subtitle: "How the organization started and what sparked the work.",
    titleExample: "Example: Why we began",
    subtitleExample: "Example: The moment that made the need clear",
    prompt: "Share the story behind the mission.",
    placeholder:
      "Describe the moment or pattern that made the need impossible to ignore, and who was affected. Mention the early steps you took and how the organization took shape.",
  },
  {
    id: "need",
    title: "Need",
    slug: "need",
    subtitle: "The community need or problem you are solving.",
    titleExample: "Example: The need we are addressing",
    subtitleExample: "Example: Who is impacted and what is missing",
    prompt: "Describe the gap you are closing.",
    placeholder:
      "Explain the specific problem, who it impacts, and why existing solutions fall short. Use a concrete example or data point to show urgency and scale.",
  },
  {
    id: "mission_vision_values",
    title: "Mission, Vision, Values",
    slug: "mission-vision-values",
    subtitle: "Your guiding statements and principles.",
    titleExample: "Example: Our mission and vision",
    subtitleExample: "Example: The values that guide our decisions",
    prompt: "State the mission, vision, and values in clear language.",
    placeholder:
      "State the mission in one clear sentence, then describe the vision of the future you are working toward. List 3-5 values and describe how they guide decisions.",
  },
  {
    id: "theory_of_change",
    title: "Theory of Change",
    slug: "theory-of-change",
    subtitle: "How your inputs and activities lead to outcomes.",
    titleExample: "Example: How change happens",
    subtitleExample: "Example: The pathway from inputs to impact",
    prompt: "Explain the logic behind your work.",
    placeholder:
      "Explain the chain from inputs to activities to outcomes, in plain language. Call out the key assumptions you are testing and the indicators that prove progress.",
  },
  {
    id: "program",
    title: "Program",
    slug: "program",
    subtitle: "Core programs, services, and delivery model.",
    titleExample: "Example: Core programs and services",
    subtitleExample: "Example: What we deliver and how",
    prompt: "Outline the programs you run and who they serve.",
    placeholder:
      "Outline the core programs or services, the audience served, and how delivery works. Include reach or volume where you can (participants, sites, sessions).",
  },
  {
    id: "evaluation",
    title: "Evaluation",
    slug: "evaluation",
    subtitle: "How you measure progress and learn.",
    titleExample: "Example: Evaluation approach",
    subtitleExample: "Example: What we track and why",
    prompt: "Describe your evaluation plan and key signals.",
    placeholder:
      "Describe how you measure progress and what data you collect. Note how often you review results and how you use findings to improve.",
  },
  {
    id: "people",
    title: "People",
    slug: "people",
    subtitle: "Team, staffing, and volunteers.",
    titleExample: "Example: Our team and roles",
    subtitleExample: "Example: Who does the work",
    prompt: "Highlight the people and roles needed to deliver the work.",
    placeholder:
      "List the key roles needed now and in the next phase, including staff, volunteers, or advisors. Mention gaps or hires that are most critical to success.",
  },
  {
    id: "budget",
    title: "Budget",
    slug: "budget",
    subtitle: "Current budget and near-term financial plan.",
    titleExample: "Example: Budget summary",
    subtitleExample: "Example: What funding covers",
    prompt: "Summarize the budget and financial priorities.",
    placeholder:
      "Summarize the current budget and the biggest cost drivers. Note the near-term investments that would unlock growth or impact.",
  },
  {
    id: "fundraising",
    title: "Fundraising",
    slug: "fundraising",
    subtitle: "Fundraising approach and priorities.",
    titleExample: "Example: Fundraising overview",
    subtitleExample: "Example: Our fundraising goals",
    prompt: "Explain how you plan to raise the resources you need.",
    placeholder:
      "Explain the mix of funding sources you rely on and the goals for the next cycle. Include any upcoming campaigns, renewals, or grants you are pursuing.",
  },
  {
    id: "fundraising_strategy",
    title: "Strategy",
    slug: "fundraising-strategy",
    subtitle: "Funding strategy and target sources.",
    titleExample: "Example: Funding strategy",
    subtitleExample: "Example: Who we plan to approach",
    prompt: "Detail your fundraising strategy and targets.",
    placeholder:
      "List the top funding targets and how you plan to approach them. Include timelines, expected ask sizes, and what proof points you will share.",
  },
  {
    id: "fundraising_presentation",
    title: "Presentation",
    slug: "fundraising-presentation",
    subtitle: "Pitch deck and narrative for funders.",
    titleExample: "Example: Pitch narrative",
    subtitleExample: "Example: How we present the story",
    prompt: "Outline the presentation materials and key messages.",
    placeholder:
      "Describe the story arc of your pitch and the core messages you want funders to remember. Note which assets are ready (deck, one-pager, demo) and what is missing.",
  },
  {
    id: "fundraising_crm_plan",
    title: "Treasure Map / CRM Plan",
    slug: "treasure-map-crm-plan",
    subtitle: "Prospect list and relationship tracking.",
    titleExample: "Example: CRM and prospect plan",
    subtitleExample: "Example: Tracking relationships and outreach",
    prompt: "Document the CRM plan and prospect pipeline.",
    placeholder:
      "Explain how you track prospects, stages, and follow-ups. Include the size of the pipeline and your cadence for outreach and stewardship.",
  },
  {
    id: "communications",
    title: "Communications",
    slug: "communications",
    subtitle: "Messaging, channels, and outreach cadence.",
    titleExample: "Example: Communications plan",
    subtitleExample: "Example: How we share updates",
    prompt: "Describe how you communicate with stakeholders.",
    placeholder:
      "List the primary audiences, channels, and the frequency of outreach. Include the key messages you want consistent across communications.",
  },
  {
    id: "board_strategy",
    title: "Board Strategy",
    slug: "board-strategy",
    subtitle: "Board structure, recruitment, and governance goals.",
    titleExample: "Example: Board strategy",
    subtitleExample: "Example: Governance priorities",
    prompt: "Summarize board strategy and recruitment goals.",
    placeholder:
      "Describe the ideal board composition and the skills or networks you need. Include recruitment targets and governance improvements you want this year.",
  },
  {
    id: "board_calendar",
    title: "Calendar",
    slug: "board-calendar",
    subtitle: "Board meetings, reporting, and key dates.",
    titleExample: "Example: Board calendar",
    subtitleExample: "Example: Key governance milestones",
    prompt: "List the board calendar and important milestones.",
    placeholder:
      "Outline the cadence for meetings, reporting, and committees. Include key dates for budget approvals, strategy reviews, and annual filings.",
  },
  {
    id: "board_handbook",
    title: "Handbook",
    slug: "board-handbook",
    subtitle: "Board roles, policies, and onboarding.",
    titleExample: "Example: Board handbook",
    subtitleExample: "Example: Role expectations and policies",
    prompt: "Capture board policies and onboarding materials.",
    placeholder:
      "List the policies, expectations, and onboarding materials new board members receive. Note anything that needs to be created or updated.",
  },
  {
    id: "next_actions",
    title: "Next Actions",
    slug: "next-actions",
    subtitle: "Immediate priorities and ownership.",
    titleExample: "Example: Next actions",
    subtitleExample: "Example: What we are doing next",
    prompt: "List the next actions and who owns them.",
    placeholder:
      "List the top 3-7 actions for the next 30-90 days with owners and due dates. Focus on moves that unlock the next section of work.",
  },
]

export const ROADMAP_SECTION_IDS = SECTION_DEFINITIONS.map((section) => section.id)
export const ROADMAP_SECTION_LIMIT = 24

const SECTION_MAP = new Map<string, RoadmapSectionDefinition>(SECTION_DEFINITIONS.map((section) => [section.id, section]))

export function getRoadmapSectionDefinition(sectionId: string): RoadmapSectionDefinition | null {
  const normalized = normalizeText(sectionId)
  if (!normalized) return null
  return SECTION_MAP.get(normalized) ?? null
}

type StoredSection = {
  id?: unknown
  title?: unknown
  subtitle?: unknown
  slug?: unknown
  content?: unknown
  imageUrl?: unknown
  lastUpdated?: unknown
  isPublic?: unknown
  layout?: unknown
  status?: unknown
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

const TEST_SECTION_TITLES = new Set(["test", "testing", "foundations"])
const DEPRECATED_SECTION_IDS = new Set(["strategic_roadmap"])
const DEPRECATED_SECTION_SLUGS = new Set(["strategic-roadmap"])

function isTestSectionValue(value: unknown): boolean {
  const normalized = normalizeText(value).toLowerCase()
  return normalized.length > 0 && TEST_SECTION_TITLES.has(normalized)
}

function shouldRemoveTestSection(entry: StoredSection | null | undefined, key?: string): boolean {
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
  const storedTitle = normalizeText(stored?.title)
  const storedSubtitle = normalizeText(stored?.subtitle)
  const templateTitle = fallback?.title ?? ""
  const templateSubtitle = fallback?.subtitle || ""
  const storedTitleIsTemplate = templateTitle.length > 0 && storedTitle === templateTitle.trim()
  const storedSubtitleIsTemplate = templateSubtitle.length > 0 && storedSubtitle === templateSubtitle.trim()
  const effectiveStoredTitle = storedTitleIsTemplate ? "" : storedTitle
  const effectiveStoredSubtitle = storedSubtitleIsTemplate ? "" : storedSubtitle
  const title = effectiveStoredTitle || templateTitle
  const subtitle = effectiveStoredSubtitle || templateSubtitle
  const titleIsTemplate = effectiveStoredTitle.length === 0 && templateTitle.length > 0
  const subtitleIsTemplate = effectiveStoredSubtitle.length === 0 && templateSubtitle.length > 0
  const content = typeof stored?.content === "string" ? stored.content : ""
  const imageUrlRaw = normalizeText(stored?.imageUrl)
  const imageUrl = imageUrlRaw.length > 0 ? imageUrlRaw : undefined
  const lastUpdated =
    typeof stored?.lastUpdated === "string" || stored?.lastUpdated === null ? (stored?.lastUpdated ?? null) : null
  const isPublic = typeof stored?.isPublic === "boolean" ? stored.isPublic : false
  const layout =
    typeof stored?.layout === "string" && ["square", "vertical", "wide"].includes(stored.layout)
      ? (stored.layout as RoadmapSection["layout"])
      : "square"
  const status =
    typeof stored?.status === "string" && ["not_started", "in_progress", "complete"].includes(stored.status)
      ? (stored.status as RoadmapSectionStatus)
      : content.trim().length > 0
        ? "in_progress"
        : "not_started"
  const ctaLabel =
    typeof stored?.ctaLabel === "string" && stored.ctaLabel.trim().length > 0 ? stored.ctaLabel.trim() : undefined
  const ctaUrl =
    typeof stored?.ctaUrl === "string" && stored.ctaUrl.trim().length > 0 ? stored.ctaUrl.trim() : undefined
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
    const entries = rawSections
      .map((entry) => (isRecord(entry) ? (entry as StoredSection) : null))
      .filter((entry): entry is StoredSection => Boolean(entry))

    const storedById = new Map<string, StoredSection>()
    const customEntries: StoredSection[] = []

    entries.forEach((entry) => {
      if (shouldRemoveTestSection(entry)) return
      const id = normalizeText(entry?.id)
      if (!id) return
      if (SECTION_MAP.has(id)) {
        storedById.set(id, entry)
      } else {
        customEntries.push(entry)
      }
    })

    const frameworkSections = SECTION_DEFINITIONS.map((definition, index) =>
      buildRoadmapSection(storedById.get(definition.id), definition, index),
    )
    const customSections = customEntries.map((entry, index) =>
      buildRoadmapSection(entry, null, SECTION_DEFINITIONS.length + index),
    )
    const merged = [...frameworkSections, ...customSections]

    if (merged.length > 0) {
      return ensureUniqueSlugs(merged)
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

export function cleanupRoadmapTestSections(profile: Record<string, unknown> | null | undefined): {
  nextProfile: Record<string, unknown>
  changed: boolean
} {
  const nextProfile = isRecord(profile) ? { ...profile } : {}
  const roadmapRecord = isRecord(nextProfile.roadmap) ? { ...(nextProfile.roadmap as Record<string, unknown>) } : {}
  const rawSections = roadmapRecord.sections
  let changed = false

  if (Array.isArray(rawSections)) {
    const filtered = rawSections.filter((entry) => {
      if (!isRecord(entry)) return true
      return !shouldRemoveTestSection(entry as StoredSection)
    })
    if (filtered.length !== rawSections.length) {
      roadmapRecord.sections = filtered
      changed = true
    }
  } else if (isRecord(rawSections)) {
    const nextSections = { ...(rawSections as Record<string, unknown>) }
    for (const [key, value] of Object.entries(nextSections)) {
      if (!isRecord(value)) {
        if (isTestSectionValue(key)) {
          delete nextSections[key]
          changed = true
        }
        continue
      }
      if (shouldRemoveTestSection(value as StoredSection, key)) {
        delete nextSections[key]
        changed = true
      }
    }
    if (changed) {
      roadmapRecord.sections = nextSections
    }
  }

  if (!changed) {
    return { nextProfile, changed }
  }

  nextProfile.roadmap = roadmapRecord
  return { nextProfile, changed }
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
    imageUrl?: string | null
    isPublic?: boolean
    layout?: RoadmapSection["layout"]
    status?: RoadmapSectionStatus
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
    const templateTitle = current.templateTitle?.trim() ?? ""
    const templateSubtitle = current.templateSubtitle?.trim() ?? ""

    const nextTitleRaw = typeof updates.title === "string" ? updates.title.trim() : current.title
    const storedTitleIsTemplate = templateTitle.length > 0 && nextTitleRaw === templateTitle
    const effectiveTitle = storedTitleIsTemplate ? "" : nextTitleRaw
    const nextTitle = effectiveTitle || templateTitle || ""

    const nextSubtitleRaw = typeof updates.subtitle === "string" ? updates.subtitle.trim() : current.subtitle
    const storedSubtitleIsTemplate = templateSubtitle.length > 0 && nextSubtitleRaw === templateSubtitle
    const effectiveSubtitle = storedSubtitleIsTemplate ? "" : nextSubtitleRaw
    const nextSubtitle = effectiveSubtitle || templateSubtitle || ""

    const nextContent = typeof updates.content === "string" ? updates.content : current.content
    const nextImageUrlRaw =
      typeof updates.imageUrl === "string" ? updates.imageUrl.trim() : updates.imageUrl === null ? "" : (current.imageUrl ?? "")
    const nextImageUrl = nextImageUrlRaw.length > 0 ? nextImageUrlRaw : undefined
    const nextIsPublic = typeof updates.isPublic === "boolean" ? updates.isPublic : current.isPublic
    const nextLayout = updates.layout ?? current.layout
    const nextStatus = updates.status ?? current.status ?? "not_started"
    const nextCtaLabel = typeof updates.ctaLabel === "string" ? updates.ctaLabel : current.ctaLabel
    const nextCtaUrl = typeof updates.ctaUrl === "string" ? updates.ctaUrl : current.ctaUrl
    const nextSlug = current.slug && current.slug.trim().length > 0 ? current.slug : slugify(nextTitle) || current.id

    nextSection = {
      ...current,
      title: nextTitle,
      subtitle: nextSubtitle,
      content: nextContent,
      imageUrl: nextImageUrl,
      isPublic: nextIsPublic,
      layout: nextLayout,
      status: nextStatus,
      ctaLabel: nextCtaLabel?.trim() || undefined,
      ctaUrl: nextCtaUrl?.trim() || undefined,
      slug: nextSlug,
      lastUpdated: now,
      templateTitle,
      templateSubtitle,
      titleIsTemplate: effectiveTitle.length === 0 && templateTitle.length > 0,
      subtitleIsTemplate: effectiveSubtitle.length === 0 && templateSubtitle.length > 0,
    }

    nextSections = resolved.map((section, index) => (index === existingIndex ? nextSection : section))
  } else {
    const base = SECTION_MAP.get(targetId) ?? null
    const nextTitle = normalizeText(updates.title) || base?.title || ""
    const nextSubtitle = normalizeText(updates.subtitle) || base?.subtitle || ""
    const nextContent = typeof updates.content === "string" ? updates.content : ""
    const nextImageUrlRaw =
      typeof updates.imageUrl === "string" ? updates.imageUrl.trim() : updates.imageUrl === null ? "" : ""
    const nextImageUrl = nextImageUrlRaw.length > 0 ? nextImageUrlRaw : undefined
    const nextIsPublic = typeof updates.isPublic === "boolean" ? updates.isPublic : false
    const nextLayout = updates.layout ?? "square"
    const nextStatus =
      typeof updates.status === "string" && ["not_started", "in_progress", "complete"].includes(updates.status)
        ? (updates.status as RoadmapSectionStatus)
        : nextContent.trim().length > 0
          ? "in_progress"
          : "not_started"
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
          imageUrl: nextImageUrl,
          isPublic: nextIsPublic,
          layout: nextLayout,
          status: nextStatus,
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
    imageUrl: section.imageUrl,
    lastUpdated: section.lastUpdated,
    isPublic: section.isPublic,
    layout: section.layout,
    status: section.status,
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
    imageUrl: section.imageUrl,
    lastUpdated: section.lastUpdated,
    isPublic: section.isPublic,
    layout: section.layout,
    status: section.status,
    ctaLabel: section.ctaLabel,
    ctaUrl: section.ctaUrl,
  }))
  nextProfile.roadmap = roadmapRecord

  return { nextProfile, sections: updatedSections, removed: true }
}
