"use client"

import ArrowRightIcon from "lucide-react/dist/esm/icons/arrow-right"

import { Button } from "@/components/ui/button"
import type { FormationStatus, OnboardingStepId } from "../types"

type StepFooterProps = {
  step: number
  totalSteps: number
  submitting: boolean
  currentStepId: OnboardingStepId
  slugStatus: "idle" | "checking" | "available" | "unavailable"
  formationStatus: FormationStatus | ""
  onPrev: () => void
  onNext: () => void
}

export function StepFooter({
  step,
  totalSteps,
  submitting,
  currentStepId,
  slugStatus,
  formationStatus,
  onPrev,
  onNext,
}: StepFooterProps) {
  const isLastStep = step === totalSteps - 1

  return (
    <div className="border-border/70 bg-background/40 relative z-20 shrink-0 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 md:px-6">
      <div className="flex items-center gap-2">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={onPrev}
            disabled={submitting}
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
            (currentStepId === "org" &&
              (slugStatus !== "available" || !formationStatus))
          }
          className="gap-2"
        >
          {isLastStep ? (
            <>
              Finish
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
  )
}
