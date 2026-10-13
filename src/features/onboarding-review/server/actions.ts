"use server"
import { createReviewScenario } from "../lib"
export async function loadOnboardingReviewScenario(scenario: string) {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.ONBOARDING_REVIEW_MODE !== "1"
  )
    return null
  return createReviewScenario(scenario)
}
