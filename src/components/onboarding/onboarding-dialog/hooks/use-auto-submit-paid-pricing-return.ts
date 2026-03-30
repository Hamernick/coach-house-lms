"use client"

import { useEffect, useRef, type RefObject } from "react"
import type { ReadonlyURLSearchParams } from "next/navigation"

import type { PricingPlanTier } from "@/lib/billing/plan-tier"
import { shouldAutoSubmitPaidOnboardingPricingReturn } from "@/lib/onboarding/pricing-return"
import type { OnboardingFlowMode, OnboardingStepId } from "../types"

export function useAutoSubmitPaidPricingReturn({
  open,
  submitting,
  currentStepId,
  searchParams,
  mode,
  builderPlanTier,
  formRef,
}: {
  open: boolean
  submitting: boolean
  currentStepId: OnboardingStepId
  searchParams: ReadonlyURLSearchParams
  mode: OnboardingFlowMode
  builderPlanTier: PricingPlanTier
  formRef: RefObject<HTMLFormElement | null>
}) {
  const autoSubmitPaidPricingReturnRef = useRef(false)

  useEffect(() => {
    if (!open || submitting) return
    if (autoSubmitPaidPricingReturnRef.current) return
    if (currentStepId !== "pricing") return
    if (
      !shouldAutoSubmitPaidOnboardingPricingReturn({
        searchParams,
        mode,
        builderPlanTier,
      })
    ) {
      return
    }
    if (!formRef.current) return

    autoSubmitPaidPricingReturnRef.current = true
    const frameId = window.requestAnimationFrame(() => {
      formRef.current?.requestSubmit()
    })
    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [builderPlanTier, currentStepId, formRef, mode, open, searchParams, submitting])
}
