import type { RoadmapSaveIssue } from "./use-roadmap-editor-save"
import type { RefObject } from "react"
import type { saveRoadmapSectionAction } from "@/actions/roadmap"

import type { RoadmapSection, RoadmapSectionStatus } from "@/lib/roadmap"

import type { RoadmapDraft, RoadmapEditorProps } from "../types"

export type UseRoadmapEditorStateArgs = Pick<
  RoadmapEditorProps,
  | "sections"
  | "publicSlug"
  | "draftScope"
  | "canEdit"
  | "navigationMode"
  | "initialSectionId"
  | "onDirtyChange"
  | "onRegisterDiscard"
> & { saveSection?: typeof saveRoadmapSectionAction }

export type UseRoadmapEditorStateResult = {
  activeSection: RoadmapSection | undefined
  activeDraft: RoadmapDraft | null
  drafts: Record<string, RoadmapDraft>
  handleSectionSelect: (next: { id: string; slug: string }) => void
  roadmapBasePath: string
  headerTitle: string
  headerSubtitle: string
  showSectionHeader: boolean
  headerIconSize: number | null
  headerTextRef: RefObject<HTMLDivElement | null>
  status: RoadmapSectionStatus
  statusSelectDisabled: boolean
  isHydrated: boolean
  isCalendarSection: boolean
  isBudgetSection: boolean
  contentMaxWidth: string
  editorPlaceholder: string
  handleDraftChange: (updates: Partial<RoadmapDraft>) => void
  handleImageUpload: (file: File) => Promise<string>
  handleSave: () => void
  isDirty: boolean
  savingId: string | null
  saveIssue?: RoadmapSaveIssue
  offline: boolean
  storageFailed: boolean
  resolveConflict: (section: RoadmapSection, keepDraft: boolean) => void
  handleStatusChange: (nextStatus: RoadmapSectionStatus) => void
}
