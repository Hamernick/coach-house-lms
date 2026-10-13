import { resolveOnboardingRequirements } from "@/lib/onboarding/requirements"
import type { ReviewState } from "../types"
export const REVIEW_SCENARIOS = [
  ["legacy-paid", "Legacy paid owner — missing setup"],
  ["fresh", "New builder — choose free or paid"],
  ["free-setup", "Free builder — organization setup"],
  ["organization-setup", "Organization plan — after checkout"],
  ["operations-setup", "Operations Support — after checkout"],
  ["missing-name", "Returning owner — missing name"],
  ["missing-url", "Returning owner — missing URL"],
  ["missing-formation", "Returning owner — missing formation status"],
  ["complete", "Fully configured owner"],
  ["find", "Find nonprofits — member onboarding"],
  ["fund", "Fund nonprofits — member onboarding"],
  ["support", "Support teams — member onboarding"],
  ["invited", "Invited organization member"],
  ["staff", "Platform staff"],
] as const
export function createReviewScenario(id: string): ReviewState {
  const selected =
    REVIEW_SCENARIOS.find(([key]) => key === id) ?? REVIEW_SCENARIOS[0]
  const state: ReviewState = {
    id: selected[0],
    label: selected[1],
    userId: "review-owner",
    organizationId: "review-owner",
    isPlatformStaff: false,
    userMetadata: {
      onboarding_intent_focus: "build",
      onboarding_completed: true,
      workspace_onboarding_stage: 2,
    },
    organizationProfile: {
      name: "Review Community",
      formationStatus: "approved",
      roadmap: {
        sections: [
          { id: "mission", content: "Existing mission" },
          { id: "vision", content: "Existing vision" },
          { id: "values", content: "Existing values" },
        ],
      },
      documents: { bylaws: { path: "sample/bylaws.pdf" } },
    },
    publicSlug: "review-community",
    planTier: "operations_support",
  }
  if (
    [
      "legacy-paid",
      "fresh",
      "free-setup",
      "organization-setup",
      "operations-setup",
    ].includes(state.id)
  ) {
    delete state.organizationProfile.name
    delete state.organizationProfile.formationStatus
    state.publicSlug = null
  }
  if (state.id === "fresh") {
    state.userMetadata = { onboarding_intent_focus: "build" }
    state.planTier = "free"
  }
  if (state.id.endsWith("-setup"))
    state.userMetadata.onboarding_completed = false
  if (state.id === "free-setup") state.planTier = "free"
  if (state.id === "organization-setup") state.planTier = "organization"
  if (state.id === "missing-name") delete state.organizationProfile.name
  if (state.id === "missing-url") state.publicSlug = null
  if (state.id === "missing-formation")
    delete state.organizationProfile.formationStatus
  if (["find", "fund", "support"].includes(state.id)) {
    state.userMetadata = {
      onboarding_intent_focus: state.id,
      onboarding_completed: false,
    }
    state.organizationProfile = {}
    state.publicSlug = null
    state.planTier = "free"
  }
  if (state.id === "invited") state.organizationId = "inviting-organization"
  if (state.id === "staff") state.isPlatformStaff = true
  return state
}
export function getReviewRequirements(state: ReviewState) {
  return resolveOnboardingRequirements(state)
}
// Local interaction simulation only. The production action's tests and dedicated
// account review cover durable persistence, authentication and real checkout.
export function applyReviewSubmission(
  state: ReviewState,
  form: FormData
): ReviewState {
  const intent = String(form.get("intentFocus") ?? "build")
  if (
    intent === "build" &&
    form.get("onboardingMode") === "post_signup_access"
  ) {
    return {
      ...state,
      userMetadata: {
        ...state.userMetadata,
        onboarding_intent_focus: intent,
        onboarding_completed: false,
        workspace_onboarding_stage: 2,
      },
    }
  }
  return {
    ...state,
    organizationProfile:
      intent === "build"
        ? {
            ...state.organizationProfile,
            name: String(form.get("orgName") ?? "").trim(),
            formationStatus: String(form.get("formationStatus") ?? ""),
          }
        : state.organizationProfile,
    publicSlug:
      intent === "build"
        ? String(form.get("orgSlug") ?? "").trim()
        : state.publicSlug,
    userMetadata: {
      ...state.userMetadata,
      onboarding_completed: true,
      onboarding_intent_focus: intent,
    },
  }
}
