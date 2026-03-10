import type { RefObject } from "react"

import type { RoadmapSection, RoadmapSectionStatus } from "@/lib/roadmap"

import type { RoadmapDraft, RoadmapEditorProps } from "../types"

export type UseRoadmapEditorStateArgs = Pick<
  RoadmapEditorProps,
  "sections" | "publicSlug" | "canEdit" | "initialSectionId" | "onDirtyChange" | "onRegisterDiscard"
>

export type UseRoadmapEditorStateResult = {
  activeSection: RoadmapSection | undefined
  activeDraft: RoadmapDraft | null
  drafts: Record<string, RoadmapDraft>
  handleSectionSelect: (next: { id: string; slug: string }) => void
  roadmapBasePath: string
  roadmapReturnHref: string | null
  roadmapReturnLabel: string | null
  headerTitle: string
  headerSubtitle: string
  showSectionHeader: boolean
  headerIconSize: number | null
  headerTextRef: RefObject<HTMLDivElement | null>
  status: RoadmapSectionStatus
  statusSelectDisabled: boolean
  isHydrated: boolean
  isCalendarSection: boolean
  contentMaxWidth: string
  editorPlaceholder: string
  handleDraftChange: (updates: Partial<RoadmapDraft>) => void
  handleImageUpload: (file: File) => Promise<string>
  handleSave: () => void
  isDirty: boolean
  savingId: string | null
  handleStatusChange: (nextStatus: RoadmapSectionStatus) => void
}
