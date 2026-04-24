"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  APP_PRICING_FEEDBACK_REVEAL_DELAY_MS,
  getAppPricingFeedbackTutorialStorageKeys,
} from "../lib"
import { saveAppPricingFeedback } from "../server/actions"
import type {
  AppPricingFeedbackPrompt,
  AppPricingFeedbackSelection,
  AppPricingFeedbackTutorialKey,
} from "../types"

type TutorialLifecycleEventDetail = {
  tutorial?: string
}

function resolveTutorialLifecycleReady(tutorial: AppPricingFeedbackTutorialKey) {
  if (typeof window === "undefined") return false
  return getAppPricingFeedbackTutorialStorageKeys(tutorial).some(
    (key) => window.localStorage.getItem(key) === "1",
  )
}

export function useAppPricingFeedbackController({
  prompt,
  tutorial,
  tutorialPending,
  routeActive,
}: {
  prompt: AppPricingFeedbackPrompt | null
  tutorial: AppPricingFeedbackTutorialKey
  tutorialPending: boolean
  routeActive: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [presentationReady, setPresentationReady] = useState(false)
  const [isPending, startTransition] = useTransition()
  const confirmationTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current !== null) {
        window.clearTimeout(confirmationTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setError(null)
    setSubmitted(false)
    setShowConfirmation(false)
  }, [prompt?.surveyKey])

  useEffect(() => {
    if (!prompt || !routeActive) {
      setPresentationReady(false)
      setShowConfirmation(false)
      setSubmitted(false)
      setError(null)
      return
    }

    let timeoutId: number | null = null

    const scheduleReady = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(() => {
        setPresentationReady(true)
      }, APP_PRICING_FEEDBACK_REVEAL_DELAY_MS)
    }

    if (!tutorialPending || resolveTutorialLifecycleReady(tutorial)) {
      setPresentationReady(false)
      scheduleReady()
      return () => {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId)
        }
      }
    }

    setPresentationReady(false)

    const handleTutorialResolved = (event: Event) => {
      const resolvedTutorial = (event as CustomEvent<TutorialLifecycleEventDetail>).detail?.tutorial
      if (resolvedTutorial !== tutorial) return
      scheduleReady()
    }

    window.addEventListener("coachhouse:tutorial:completed", handleTutorialResolved as EventListener)
    window.addEventListener("coachhouse:tutorial:dismissed", handleTutorialResolved as EventListener)

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
      window.removeEventListener(
        "coachhouse:tutorial:completed",
        handleTutorialResolved as EventListener,
      )
      window.removeEventListener(
        "coachhouse:tutorial:dismissed",
        handleTutorialResolved as EventListener,
      )
    }
  }, [prompt, routeActive, tutorial, tutorialPending])

  const submit = useCallback((selection: AppPricingFeedbackSelection) => {
    if (!prompt || isPending || submitted) return
    setError(null)

    startTransition(async () => {
      const result = await saveAppPricingFeedback({
        selection,
      })

      if ("error" in result) {
        setError(result.error)
        return
      }

      setShowConfirmation(true)
      if (confirmationTimeoutRef.current !== null) {
        window.clearTimeout(confirmationTimeoutRef.current)
      }
      confirmationTimeoutRef.current = window.setTimeout(() => {
        setSubmitted(true)
        router.refresh()
      }, 1400)
    })
  }, [isPending, prompt, router, submitted])

  return {
    error,
    isPending,
    showConfirmation,
    bannerVisible: routeActive && Boolean(prompt) && presentationReady && !submitted,
    submit,
  }
}
