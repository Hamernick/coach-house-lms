"use client"

import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"

import { Button } from "@/components/ui/button"
import type { PricingPlanTier } from "@/lib/billing/plan-tier"
import type {
  FormationStatus,
  IntentFocus,
  OnboardingFlowMode,
  OnboardingStepId,
} from "../types"

type StepFooterProps = {
  step: number
  totalSteps: number
  submitting: boolean
  currentStepId: OnboardingStepId
  onboardingMode: OnboardingFlowMode
  intentFocus: IntentFocus | ""
  slugStatus: "idle" | "checking" | "available" | "unavailable"
  formationStatus: FormationStatus | ""
  accountStepReady: boolean
  builderPlanTier: PricingPlanTier
  onPrev: () => void
  onNext: () => void
}

export function StepFooter({
  step,
  totalSteps,
  submitting,
  currentStepId,
  onboardingMode,
  intentFocus,
  slugStatus,
  formationStatus,
  accountStepReady,
  builderPlanTier,
  onPrev,
  onNext,
}: StepFooterProps) {
  const isLastStep = step === totalSteps - 1
  const isPaidPostSignupPricingStep =
    isLastStep &&
    currentStepId === "pricing" &&
    onboardingMode === "post_signup_access" &&
    builderPlanTier !== "free"

  return (
    <div className="border-border/70 bg-background/70 relative z-20 mt-auto shrink-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6 md:py-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex items-center gap-2">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Back
          </Button>
        ) : (
          <span className="text-muted-foreground text-xs">
            You’ll be able to change this later.
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type={isLastStep ? "submit" : "button"}
          onClick={isLastStep ? undefined : onNext}
          disabled={
            submitting ||
            (currentStepId === "intent" && !intentFocus) ||
            (currentStepId === "pricing" && builderPlanTier === "free") ||
            (currentStepId === "org" &&
              (slugStatus !== "available" || !formationStatus)) ||
            (currentStepId === "account" && !accountStepReady)
          }
          className="w-full gap-2 sm:w-auto"
        >
          {isLastStep ? (
            <>
              {isPaidPostSignupPricingStep ? "Enter workspace" : "Finish"}
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              Continue
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </>
          )}
        </Button>
      </div>
      </div>
    </div>
  )
}
