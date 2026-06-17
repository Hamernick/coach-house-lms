"use client"

import dynamic from "next/dynamic"
import type { ComponentProps } from "react"

export const AppPricingFeedbackPrompt = dynamic<
  ComponentProps<
    typeof import("./components/app-pricing-feedback-prompt").AppPricingFeedbackPrompt
  >
>(
  () =>
    import("./components/app-pricing-feedback-prompt").then(
      (mod) => mod.AppPricingFeedbackPrompt,
    ),
  { loading: () => null, ssr: false },
)
