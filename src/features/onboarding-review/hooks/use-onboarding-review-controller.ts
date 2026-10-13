"use client"
import { useEffect, useState } from "react"
import { clearOnboardingDraft } from "@/components/onboarding/onboarding-dialog/draft"
import { applyReviewSubmission } from "../lib"
import type { ReviewState } from "../types"
export function useOnboardingReviewController(initial: ReviewState) {
  const [state, setState] = useState(initial)
  const [revision, setRevision] = useState(0)
  const [ready, setReady] = useState(false)
  const storageKey = `coachhouse:onboarding-review:${initial.id}`
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) setState(JSON.parse(saved) as ReviewState)
    } catch {
      /* A corrupted sample can always be reset. */
    }
    setReady(true)
  }, [storageKey])
  const save = async (form: FormData) => {
    const next = applyReviewSubmission(state, form)
    window.localStorage.setItem(storageKey, JSON.stringify(next))
    clearOnboardingDraft()
    setState(next)
    setRevision((value) => value + 1)
  }
  const reset = () => {
    window.localStorage.removeItem(storageKey)
    clearOnboardingDraft()
    setState(initial)
    setRevision((value) => value + 1)
  }
  return { state, revision, ready, save, reset }
}
