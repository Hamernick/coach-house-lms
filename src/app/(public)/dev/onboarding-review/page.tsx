import { notFound } from "next/navigation"
import {
  loadOnboardingReviewScenario,
  OnboardingReviewPanel,
} from "@/features/onboarding-review"
export default async function OnboardingReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; checkout?: string }>
}) {
  const { scenario = "legacy-paid", checkout } = await searchParams
  const initial = await loadOnboardingReviewScenario(scenario)
  if (!initial) notFound()
  return (
    <OnboardingReviewPanel
      key={initial.id}
      initial={initial}
      checkout={checkout}
    />
  )
}
