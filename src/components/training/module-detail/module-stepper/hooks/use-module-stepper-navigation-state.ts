"use client"

import { useEffect, useState, type Dispatch, type SetStateAction } from "react"

type UseModuleStepperNavigationStateArgs = {
  moduleId: string
  stepCount: number
}

type UseModuleStepperNavigationStateResult = {
  activeIndex: number
  setActiveIndex: Dispatch<SetStateAction<number>>
  hydrated: boolean
}

function getModuleStepStorageKey(moduleId: string) {
  return `module-step-${moduleId}`
}

export function useModuleStepperNavigationState({
  moduleId,
  stepCount,
}: UseModuleStepperNavigationStateArgs): UseModuleStepperNavigationStateResult {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    setActiveIndex(() => {
      if (typeof window === "undefined") return 0

      const storedValue = window.sessionStorage.getItem(getModuleStepStorageKey(moduleId))
      const parsed = storedValue != null ? Number.parseInt(storedValue, 10) : NaN
      const fallback = 0
      const maxIndex = Math.max(stepCount - 1, 0)
      const next = Number.isFinite(parsed) && parsed >= 0 && parsed < stepCount ? parsed : fallback

      return Math.min(next, maxIndex)
    })
  }, [moduleId, stepCount])

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      window.sessionStorage.setItem(getModuleStepStorageKey(moduleId), String(activeIndex))
    } catch {
      // ignore storage failures
    }
  }, [activeIndex, moduleId])

  useEffect(() => {
    if (typeof window === "undefined") return

    const handlePrev = () => {
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    }
    const handleNext = () => {
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(stepCount - 1, 0)))
    }

    window.addEventListener("coachhouse:module-step:prev", handlePrev as EventListener)
    window.addEventListener("coachhouse:module-step:next", handleNext as EventListener)

    return () => {
      window.removeEventListener("coachhouse:module-step:prev", handlePrev as EventListener)
      window.removeEventListener("coachhouse:module-step:next", handleNext as EventListener)
    }
  }, [stepCount])

  return {
    activeIndex,
    setActiveIndex,
    hydrated,
  }
}
