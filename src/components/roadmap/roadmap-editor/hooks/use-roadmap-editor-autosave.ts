import { useEffect } from "react"

import type { RoadmapDraft } from "@/components/roadmap/roadmap-editor/types"
import type { RoadmapSection } from "@/lib/roadmap"

type UseRoadmapEditorAutosaveArgs = {
  canEdit: boolean
  activeSection: RoadmapSection | undefined
  activeDraft: RoadmapDraft | null
  isDirty: boolean
  bodyDirty: boolean
  isPending: boolean
  savingId: string | null
  saveSectionById: ({ sectionId, showToast }: { sectionId: string; showToast: boolean }) => void
  flushActiveSectionDraft: () => void
}

export function useRoadmapEditorAutosave({
  canEdit,
  activeSection,
  activeDraft,
  isDirty,
  bodyDirty,
  isPending,
  savingId,
  saveSectionById,
  flushActiveSectionDraft,
}: UseRoadmapEditorAutosaveArgs) {
  useEffect(() => {
    if (!canEdit) return
    if (!activeSection || !activeDraft) return
    if (!isDirty) return
    if (savingId || isPending) return

    const timeout = window.setTimeout(() => {
      if (savingId || isPending) return
      saveSectionById({ sectionId: activeSection.id, showToast: false })
    }, bodyDirty ? 2500 : 1200)

    return () => window.clearTimeout(timeout)
  }, [activeDraft, activeSection, bodyDirty, canEdit, isDirty, isPending, saveSectionById, savingId])

  useEffect(() => {
    if (!canEdit) return
    if (!activeSection || !activeDraft) return
    if (!isDirty) return

    const interval = window.setInterval(() => {
      if (!isDirty || isPending || savingId) return
      saveSectionById({ sectionId: activeSection.id, showToast: false })
    }, 10000)

    return () => window.clearInterval(interval)
  }, [activeDraft, activeSection, canEdit, isDirty, isPending, saveSectionById, savingId])

  useEffect(() => {
    if (!canEdit) return
    return () => {
      flushActiveSectionDraft()
    }
  }, [canEdit, flushActiveSectionDraft])
}
