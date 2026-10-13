"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import type { saveRoadmapSectionAction } from "@/actions/roadmap"
import type { RoadmapSection, RoadmapSectionStatus } from "@/lib/roadmap"
import { hasMeaningfulRoadmapBudgetRows } from "@/lib/roadmap/budget"
import { toast } from "@/lib/toast"
import { createDraft, isRoadmapDraftDirty } from "../helpers"
import { mergeSavedRoadmapDraft } from "../save-state"
import type { RoadmapDraft, RoadmapDraftScope } from "../types"

export type RoadmapSaveIssue = {
  kind: "conflict" | "error" | "scope_changed"
  message: string
}
type SaveRequest = {
  sectionId: string
  showToast: boolean
  nextStatus?: RoadmapSectionStatus
}

export function useRoadmapEditorSave({
  canEdit,
  draftScope,
  saveSection,
  sectionsRef,
  draftsRef,
  update,
}: {
  canEdit: boolean
  draftScope?: RoadmapDraftScope
  saveSection: typeof saveRoadmapSectionAction
  sectionsRef: RefObject<RoadmapSection[]>
  draftsRef: RefObject<Record<string, RoadmapDraft>>
  update: (
    sections: RoadmapSection[],
    drafts: Record<string, RoadmapDraft>
  ) => void
}) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [issues, setIssues] = useState<
    Record<string, RoadmapSaveIssue | undefined>
  >({})
  const issuesRef = useRef(issues)
  const queueRef = useRef(new Map<string, SaveRequest>())
  const savingRef = useRef(false)
  const [offline, setOffline] = useState(false)
  const scopeKey = JSON.stringify(draftScope ?? null)
  const scopeRef = useRef(scopeKey)
  useEffect(() => {
    scopeRef.current = scopeKey
  }, [scopeKey])
  useEffect(() => {
    const updateConnection = () => setOffline(!navigator.onLine)
    updateConnection()
    window.addEventListener("online", updateConnection)
    window.addEventListener("offline", updateConnection)
    return () => {
      window.removeEventListener("online", updateConnection)
      window.removeEventListener("offline", updateConnection)
    }
  }, [])

  const setIssue = useCallback((id: string, issue?: RoadmapSaveIssue) => {
    issuesRef.current = { ...issuesRef.current, [id]: issue }
    setIssues(issuesRef.current)
  }, [])

  const saveSectionById = useCallback(
    (request: SaveRequest) => {
      if (!canEdit || scopeRef.current !== scopeKey || !navigator.onLine) return
      const issue = issuesRef.current[request.sectionId]
      if (issue && (issue.kind !== "error" || !request.showToast)) return
      if (request.showToast) setIssue(request.sectionId)
      queueRef.current.set(request.sectionId, request)
      if (savingRef.current) return
      savingRef.current = true
      void (async () => {
        try {
          // The organization profile is one CAS-protected row: serialize writes
          // across sections, retaining the latest draft for each queued section.
          while (queueRef.current.size && scopeRef.current === scopeKey) {
            const queued = queueRef.current.values().next().value!
            queueRef.current.delete(queued.sectionId)
            if (issuesRef.current[queued.sectionId] || !navigator.onLine)
              continue
            const section = sectionsRef.current.find(
              (entry) => entry.id === queued.sectionId
            )
            if (!section) continue
            const draft = draftsRef.current[section.id] ?? createDraft(section)
            const dirty = isRoadmapDraftDirty(section, draft)
            if (!dirty && queued.nextStatus === undefined) continue
            if (draft.lastUpdated !== section.lastUpdated) {
              setIssue(section.id, {
                kind: "conflict",
                message:
                  "The saved document changed. Review both versions before saving.",
              })
              continue
            }
            setSavingId(section.id)
            try {
              const hasContent =
                draft.content.trim() ||
                draft.title.trim() ||
                draft.subtitle.trim() ||
                hasMeaningfulRoadmapBudgetRows(draft.budgetRows)
              const result = await saveSection({
                sectionId: section.id,
                expectedLastUpdated: draft.lastUpdated,
                expectedOrganizationId: draftScope?.organizationId,
                expectedUserId: draftScope?.userId,
                ...(dirty
                  ? {
                      title: draft.title,
                      subtitle: draft.subtitle,
                      content: draft.content,
                      budgetRows:
                        section.id === "budget" ? draft.budgetRows : undefined,
                      imageUrl: draft.imageUrl,
                    }
                  : {}),
                status:
                  queued.nextStatus ??
                  (section.status === "not_started" && hasContent
                    ? "in_progress"
                    : undefined),
              })
              if (scopeRef.current !== scopeKey) break
              if ("error" in result) {
                const kind =
                  result.code ??
                  (result.error.includes("updated elsewhere")
                    ? "conflict"
                    : "error")
                setIssue(section.id, { kind, message: result.error })
                if (queued.showToast && kind !== "conflict")
                  toast.error(result.error)
                continue
              }
              const nextSections = sectionsRef.current.map((entry) =>
                entry.id === result.section.id ? result.section : entry
              )
              const nextDrafts = {
                ...draftsRef.current,
                [section.id]: mergeSavedRoadmapDraft(
                  result.section,
                  draft,
                  draftsRef.current[section.id]
                ),
              }
              update(nextSections, nextDrafts)
              if (queued.showToast) toast.success("Section saved")
              // Include typing that arrived while this write was pending, even
              // if the user has since moved to another section.
              if (
                isRoadmapDraftDirty(result.section, nextDrafts[section.id]) &&
                !queueRef.current.has(section.id)
              ) {
                queueRef.current.set(section.id, {
                  sectionId: section.id,
                  showToast: false,
                })
              }
            } catch {
              if (scopeRef.current === scopeKey)
                setIssue(section.id, {
                  kind: "error",
                  message:
                    "Could not save. Your draft is still here. Try again.",
                })
            }
          }
        } finally {
          savingRef.current = false
          setSavingId(null)
        }
      })()
    },
    [
      canEdit,
      draftScope,
      draftsRef,
      saveSection,
      scopeKey,
      sectionsRef,
      setIssue,
      update,
    ]
  )

  const resolveConflict = useCallback(
    (section: RoadmapSection, keepDraft: boolean) => {
      if (!canEdit || scopeRef.current !== scopeKey) return
      const draft = draftsRef.current[section.id]
      const next =
        keepDraft && draft
          ? { ...draft, lastUpdated: section.lastUpdated }
          : createDraft(section)
      update(
        sectionsRef.current.map((item) =>
          item.id === section.id ? section : item
        ),
        { ...draftsRef.current, [section.id]: next }
      )
      setIssue(section.id)
      if (keepDraft) saveSectionById({ sectionId: section.id, showToast: true })
    },
    [
      canEdit,
      draftsRef,
      saveSectionById,
      scopeKey,
      sectionsRef,
      setIssue,
      update,
    ]
  )

  return { savingId, issues, offline, saveSectionById, resolveConflict }
}
