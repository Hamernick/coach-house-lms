import { describe, expect, it, vi } from "vitest"
import {
  createReviewScenario,
  applyReviewSubmission,
  getReviewRequirements,
  REVIEW_SCENARIOS,
} from "@/features/onboarding-review/lib"
import { loadOnboardingReviewScenario } from "@/features/onboarding-review/server/actions"

describe("onboarding review scenarios", () => {
  it("provides distinct repeatable scenarios for all supported paths", () => {
    expect(new Set(REVIEW_SCENARIOS.map(([id]) => id)).size).toBe(14)
    for (const [id] of REVIEW_SCENARIOS)
      expect(createReviewScenario(id).id).toBe(id)
  })
  it("preserves sample documents and the paid tier after recovering missing setup", () => {
    const state = createReviewScenario("legacy-paid")
    expect(getReviewRequirements(state)).toMatchObject({
      required: true,
      mode: "workspace_setup",
    })
    const form = new FormData()
    for (const [key, value] of Object.entries({
      intentFocus: "build",
      onboardingMode: "workspace_setup",
      orgName: "Review House",
      orgSlug: "review-house",
      formationStatus: "approved",
    }))
      form.set(key, value)
    const saved = applyReviewSubmission(state, form)
    expect(getReviewRequirements(saved).required).toBe(false)
    expect(saved.organizationProfile.roadmap).toEqual(
      state.organizationProfile.roadmap
    )
    expect(saved.organizationProfile.documents).toEqual(
      state.organizationProfile.documents
    )
    expect(saved.planTier).toBe("operations_support")
    expect(state.publicSlug).toBeNull()
  })
  it("refuses the review surface outside the explicitly enabled development environment", async () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("ONBOARDING_REVIEW_MODE", "1")
    try {
      expect(await loadOnboardingReviewScenario("legacy-paid")).toBeNull()
    } finally {
      vi.unstubAllEnvs()
    }
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("ONBOARDING_REVIEW_MODE", "")
    try {
      expect(await loadOnboardingReviewScenario("legacy-paid")).toBeNull()
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
