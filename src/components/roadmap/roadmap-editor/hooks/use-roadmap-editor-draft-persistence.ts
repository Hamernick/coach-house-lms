"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { type RoadmapSection } from "@/lib/roadmap"

import {
  createDraftMap,
  isRoadmapDraftDirty,
  persistRoadmapDraftsToStorage,
} from "../helpers"
import { type RoadmapDraft } from "../types"

type UseRoadmapEditorDraftPersistenceArgs = {
  sections: RoadmapSection[]
  drafts: Record<string, RoadmapDraft>
  replaceDrafts: (drafts: Record<string, RoadmapDraft>) => void
  storageKey: string | null
  enabled: boolean
  onDirtyChange?: (isDirty: boolean) => void
  onRegisterDiscard?: (discard: (() => void) | null) => void
}

export function useRoadmapEditorDraftPersistence({
  enabled,
  sections,
  drafts,
  replaceDrafts,
  storageKey,
  onDirtyChange,
  onRegisterDiscard,
}: UseRoadmapEditorDraftPersistenceArgs) {
  const [storageFailed, setStorageFailed] = useState(false)
  const hasUnsavedChanges = useMemo(
    () =>
      sections.some((section) => {
        const draft = drafts[section.id]
        if (!draft) return false
        return isRoadmapDraftDirty(section, draft)
      }),
    [sections, drafts]
  )

  const discardDrafts = useCallback(() => {
    const next = createDraftMap(sections)
    replaceDrafts(next)
    // Discard can be followed immediately by navigation/unmount.
    persistRoadmapDraftsToStorage({ storageKey, sections, drafts: next })
  }, [replaceDrafts, sections, storageKey])

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges)
  }, [hasUnsavedChanges, onDirtyChange])

  useEffect(() => {
    onRegisterDiscard?.(discardDrafts)
    return () => onRegisterDiscard?.(null)
  }, [onRegisterDiscard, discardDrafts])

  useEffect(() => {
    if (!enabled) return
    setStorageFailed(
      !persistRoadmapDraftsToStorage({ storageKey, sections, drafts })
    )
  }, [drafts, enabled, sections, storageKey])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [hasUnsavedChanges])
  return storageFailed
}
