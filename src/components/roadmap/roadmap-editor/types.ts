import type {
  RoadmapSection,
  RoadmapSectionStatus,
} from "@/lib/roadmap"

export type RoadmapEditorLayout = "default" | "centered-right"

export type RoadmapEditorProps = {
  sections: RoadmapSection[]
  publicSlug: string | null
  canEdit?: boolean
  layout?: RoadmapEditorLayout
  initialSectionId?: string | null
  onDirtyChange?: (dirty: boolean) => void
  onRegisterDiscard?: (handler: (() => void) | null) => void
}

export type RoadmapDraft = {
  id: string
  title: string
  subtitle: string
  content: string
  imageUrl: string
  layout: RoadmapSection["layout"]
  ctaLabel?: string
  ctaUrl?: string
  slug: string
  lastUpdated: string | null
  placeholder?: string
  status?: RoadmapSectionStatus
}

export type RoadmapDraftStorage = {
  version: number
  updatedAt: string
  drafts: Record<
    string,
    { title?: string; subtitle?: string; content?: string; imageUrl?: string }
  >
}

export type RoadmapTocItem =
  | { type: "item"; section: RoadmapSection; depth: number }
  | {
      type: "group"
      section: RoadmapSection
      depth: number
      children: RoadmapSection[]
    }
