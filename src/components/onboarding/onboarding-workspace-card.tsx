"use client"

import { OnboardingFlow } from "./onboarding-flow"
import type { OnboardingFlowDefaults } from "./onboarding-dialog/types"

type OnboardingWorkspaceCardProps = OnboardingFlowDefaults & {
  onSubmit: (form: FormData) => Promise<void>
}

export function OnboardingWorkspaceCard({
  onSubmit,
  ...defaults
}: OnboardingWorkspaceCardProps) {
  return (
    <article className="border-border/70 bg-card/96 nodrag nopan flex h-full min-h-0 max-h-full w-full min-w-0 flex-col overflow-hidden rounded-[24px] border shadow-[0_24px_72px_-46px_rgba(15,23,42,0.42)] backdrop-blur md:rounded-[28px]">
      <OnboardingFlow {...defaults} open isInline onSubmit={onSubmit} />
    </article>
  )
}
