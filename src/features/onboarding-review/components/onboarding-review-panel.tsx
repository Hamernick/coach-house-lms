"use client"
import { OnboardingWorkspaceCard } from "@/components/onboarding/onboarding-workspace-card"
import { clearOnboardingDraft } from "@/components/onboarding/onboarding-dialog/draft"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildOnboardingFlowDefaults } from "@/lib/onboarding/defaults"
import { getReviewRequirements, REVIEW_SCENARIOS } from "../lib"
import { useOnboardingReviewController } from "../hooks/use-onboarding-review-controller"
import type { ReviewState } from "../types"
export function OnboardingReviewPanel({
  initial,
  checkout,
}: {
  initial: ReviewState
  checkout?: string
}) {
  const { state, revision, ready, save, reset } =
    useOnboardingReviewController(initial)
  const requirements = getReviewRequirements(state)
  const intent = state.userMetadata.onboarding_intent_focus
  const member = intent === "find" || intent === "fund" || intent === "support"
  const defaults = buildOnboardingFlowDefaults({
    userId: state.userId,
    email: "review@example.com",
    displayName: null,
    avatarUrl: null,
    userMetadata: state.userMetadata,
    orgProfile: state.organizationProfile,
    orgSlug: state.publicSlug,
    builderPlanTier: state.planTier,
  })
  const choose = (id: string) => {
    clearOnboardingDraft()
    window.location.assign(
      `/dev/onboarding-review?scenario=${encodeURIComponent(id)}`
    )
  }
  if (checkout)
    return (
      <main className="mx-auto max-w-xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Local checkout simulation</h1>
        <p>No payment is made. Choose the result you want to review.</p>
        <div className="flex gap-3">
          <Button
            onClick={() =>
              choose(
                checkout === "operations_support"
                  ? "operations-setup"
                  : "organization-setup"
              )
            }
          >
            Simulate successful payment
          </Button>
          <Button variant="outline" onClick={() => choose("fresh")}>
            Cancel checkout
          </Button>
        </div>
      </main>
    )
  return (
    <main className="bg-background mx-auto flex h-dvh max-w-5xl flex-col gap-3 p-4">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold">Onboarding review</h1>
        <Select value={state.id} onValueChange={choose}>
          <SelectTrigger
            className="w-full sm:w-96"
            aria-label="Review scenario"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVIEW_SCENARIOS.map(([id, label]) => (
              <SelectItem key={id} value={id}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={reset}>
          Reset scenario
        </Button>
      </div>
      <p className="text-muted-foreground shrink-0 text-sm">
        Local simulation using the real onboarding forms. No live accounts,
        emails or payments. Use “review-taken” for a collision or “review-error”
        for a lookup failure.
      </p>
      <p className="shrink-0 text-sm" role="status">
        Plan: {state.planTier}. Saved documents: {member ? 0 : 3}.{" "}
        {requirements.required
          ? "Setup required."
          : "Onboarding complete or exempt."}
      </p>
      {ready && requirements.required ? (
        <OnboardingWorkspaceCard
          key={`${state.id}:${revision}`}
          {...defaults}
          mode={member ? "full" : requirements.mode}
          onSubmit={save}
          className="min-h-0 flex-1"
        />
      ) : ready ? (
        <div className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold">
            {state.isPlatformStaff || state.organizationId !== state.userId
              ? "Continue to the existing workspace"
              : member
                ? "Continue to Find"
                : "Workspace ready"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {typeof state.organizationProfile.name === "string"
              ? state.organizationProfile.name
              : "No organization setup required for this path."}
          </p>
          <p className="mt-2 text-sm">
            Reload to check saved local state, or reset this scenario to repeat
            it.
          </p>
        </div>
      ) : (
        <p>Loading saved review state…</p>
      )}
    </main>
  )
}
