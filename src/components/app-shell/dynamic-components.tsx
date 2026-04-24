"use client"

import dynamic from "next/dynamic"

export const GlobalSearch = dynamic(
  () => import("@/components/global-search").then((mod) => ({ default: mod.GlobalSearch })),
  { loading: () => null, ssr: false },
)

export const AppPricingFeedbackPrompt = dynamic(
  () =>
    import("@/features/app-pricing-feedback").then((mod) => ({
      default: mod.AppPricingFeedbackPrompt,
    })),
  { loading: () => null, ssr: false },
)

export const OnboardingDialogEntry = dynamic(
  () =>
    import("@/components/onboarding/onboarding-dialog-entry").then((mod) => ({
      default: mod.OnboardingDialogEntry,
    })),
  { loading: () => null, ssr: false },
)

export const PaywallOverlay = dynamic(
  () =>
    import("@/components/paywall/paywall-overlay").then((mod) => ({
      default: mod.PaywallOverlay,
    })),
  { loading: () => null, ssr: false },
)

export const TutorialManager = dynamic(
  () =>
    import("@/components/tutorial/tutorial-manager").then((mod) => ({
      default: mod.TutorialManager,
    })),
  { loading: () => null, ssr: false },
)
