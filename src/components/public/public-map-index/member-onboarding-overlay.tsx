"use client"

import type { OnboardingFlowDefaults } from "@/components/onboarding/onboarding-dialog/types"
import { OnboardingWorkspaceCard } from "@/components/onboarding/onboarding-workspace-card"

export function PublicMapMemberOnboardingOverlay({
  defaults,
  onSubmit,
}: {
  defaults: OnboardingFlowDefaults
  onSubmit: (form: FormData) => Promise<void>
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-background/50 p-4 backdrop-blur-sm md:p-6">
      <div className="pointer-events-auto w-full max-w-[760px]">
        <OnboardingWorkspaceCard {...defaults} onSubmit={onSubmit} />
      </div>
    </div>
  )
}
