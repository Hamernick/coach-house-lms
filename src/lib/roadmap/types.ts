import type { BudgetTableRow } from "@/lib/modules"

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
  budgetRows?: BudgetTableRow[]
  storageExtras?: Record<string, unknown>
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
  storageExtras?: Record<string, unknown>
}

export type StoredSection = {
  id?: unknown
  title?: unknown
  subtitle?: unknown
  slug?: unknown
  content?: unknown
  budgetRows?: unknown
  imageUrl?: unknown
  lastUpdated?: unknown
  isPublic?: unknown
  layout?: unknown
  status?: unknown
  ctaLabel?: unknown
  ctaUrl?: unknown
  [key: string]: unknown
}

export type StoredRoadmap = {
  sections?: unknown
  heroUrl?: unknown
}
