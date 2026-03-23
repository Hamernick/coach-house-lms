"use client"

import { OnboardingFlow } from "./onboarding-flow"
import type {
  OnboardingFlowDefaults,
  OnboardingFlowMode,
  OnboardingFlowVisibleStepId,
} from "./onboarding-dialog/types"

type OnboardingWorkspaceCardProps = OnboardingFlowDefaults & {
  onSubmit: (form: FormData) => Promise<void>
  mode?: OnboardingFlowMode
  visibleStepIds?: OnboardingFlowVisibleStepId[]
}

export function OnboardingWorkspaceCard({
  onSubmit,
  mode = "full",
  visibleStepIds,
  ...defaults
}: OnboardingWorkspaceCardProps) {
  return (
    <article className="border-border/70 bg-card/96 nodrag nopan flex h-full min-h-0 max-h-full w-full min-w-0 flex-col overflow-hidden rounded-[24px] border shadow-[0_24px_72px_-46px_rgba(15,23,42,0.42)] backdrop-blur md:rounded-[28px]">
      <OnboardingFlow
        {...defaults}
        open
        isInline
        onSubmit={onSubmit}
        mode={mode}
        visibleStepIds={visibleStepIds}
      />
    </article>
  )
}
