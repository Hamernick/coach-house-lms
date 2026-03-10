import { useCallback, useEffect, useRef, useState } from "react"
import type { RefObject } from "react"

import type { FormationStatus, IntentFocus, OnboardingSlugStatus } from "../types"

const PROGRESS_ANIMATION_MS = 260

export function useOnboardingProgress({
  open,
  formRef,
  intentFocus,
  formationStatus,
  slugStatus,
}: {
  open: boolean
  formRef: RefObject<HTMLFormElement | null>
  intentFocus: IntentFocus | ""
  formationStatus: FormationStatus | ""
  slugStatus: OnboardingSlugStatus
}) {
  const [progressTarget, setProgressTarget] = useState(0)
  const [progressDisplay, setProgressDisplay] = useState(0)
  const progressDisplayRef = useRef(0)

  const syncProgress = useCallback(() => {
    const form = formRef.current
    if (!form) {
      setProgressTarget(0)
      return
    }

    const data = new FormData(form)
    const isMemberFlow =
      intentFocus === "find" || intentFocus === "fund" || intentFocus === "support"
    const checks = isMemberFlow
      ? [
          Boolean(intentFocus),
          String(data.get("firstName") ?? "").trim().length > 0,
          String(data.get("lastName") ?? "").trim().length > 0,
        ]
      : [
          Boolean(intentFocus),
          String(data.get("orgName") ?? "").trim().length > 0,
          slugStatus === "available",
          Boolean(formationStatus),
          String(data.get("firstName") ?? "").trim().length > 0,
          String(data.get("lastName") ?? "").trim().length > 0,
        ]
    const completed = checks.filter(Boolean).length
    setProgressTarget(Math.round((completed / checks.length) * 100))
  }, [formationStatus, formRef, intentFocus, slugStatus])

  useEffect(() => {
    if (!open) return
    syncProgress()
  }, [open, syncProgress])

  useEffect(() => {
    progressDisplayRef.current = progressDisplay
  }, [progressDisplay])

  useEffect(() => {
    const from = progressDisplayRef.current
    const to = progressTarget
    if (Math.round(from) === Math.round(to)) {
      progressDisplayRef.current = to
      setProgressDisplay(to)
      return
    }

    let frameId = 0
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / PROGRESS_ANIMATION_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = from + (to - from) * eased
      progressDisplayRef.current = next
      setProgressDisplay(next)
      if (t < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [progressTarget])

  return {
    progress: Math.round(progressDisplay),
    syncProgress,
  }
}
