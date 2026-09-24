"use client"

import { useEffect, useState } from "react"
import {
  decisionDraftRevision,
  invalidateDecisionReview,
  readDecisionReview,
} from "../lib"
import type { DocumentationDecisionStep } from "../types"

export function useDocumentationDecisionCanvasController({
  steps,
  storageKey,
  draftFingerprint,
  ready,
  hasDraft,
  editingId,
}: {
  steps: DocumentationDecisionStep[]
  storageKey: string
  draftFingerprint: string
  ready: boolean
  hasDraft: boolean
  editingId: string | null
}) {
  const revision = decisionDraftRevision(draftFingerprint)
  const [progress, setProgress] = useState<{
    key: string
    revision: string
    reviewed: string[]
  } | null>(null)
  const [savingUnavailable, setSavingUnavailable] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (!progress || progress.key !== storageKey) {
      let reviewed: string[] = []
      try {
        if (hasDraft)
          reviewed = readDecisionReview(
            localStorage.getItem(storageKey),
            revision,
            steps.map(({ id }) => id)
          )
      } catch {
        setSavingUnavailable(true)
      }
      setProgress({ key: storageKey, revision, reviewed })
    } else if (
      progress.revision !== revision ||
      (!hasDraft && progress.reviewed.length)
    ) {
      setProgress({
        key: storageKey,
        revision,
        reviewed:
          hasDraft && editingId
            ? invalidateDecisionReview(progress.reviewed, editingId, steps)
            : [],
      })
    }
  }, [ready, storageKey, revision, hasDraft, editingId, steps, progress])

  useEffect(() => {
    if (
      !ready ||
      progress?.key !== storageKey ||
      progress.revision !== revision
    )
      return
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress))
      setSavingUnavailable(false)
    } catch {
      setSavingUnavailable(true)
    }
  }, [progress, ready, revision, storageKey])

  const reviewed =
    progress?.key === storageKey && progress.revision === revision
      ? progress.reviewed
      : []
  const markReviewed = (id: string) => {
    if (!ready || !hasDraft || !steps.some((step) => step.id === id)) return
    setProgress({
      key: storageKey,
      revision,
      reviewed: [...new Set([...reviewed, id])],
    })
  }
  return { reviewed, markReviewed, savingUnavailable }
}
