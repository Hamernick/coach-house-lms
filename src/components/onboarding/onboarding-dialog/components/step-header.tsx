"use client"

import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Step } from "../types"

type StepHeaderProps = {
  stepLabel: string
  currentStep: Step
  isInline: boolean
  progress: number
}

export function StepHeader({
  stepLabel,
  currentStep,
  isInline,
  progress,
}: StepHeaderProps) {
  return (
    <div className="border-border/65 bg-muted/20 shrink-0 border-b px-5 py-4 md:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium normal-case tracking-normal">
            {stepLabel}
          </p>
          {isInline ? (
            <h2 className="text-foreground mt-1 text-xl font-semibold tracking-tight md:text-2xl">
              {currentStep.title}
            </h2>
          ) : (
            <DialogTitle asChild>
              <h2 className="text-foreground mt-1 text-xl font-semibold tracking-tight md:text-2xl">
                {currentStep.title}
              </h2>
            </DialogTitle>
          )}
          {isInline ? (
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
              {currentStep.description}
            </p>
          ) : (
            <DialogDescription asChild>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
                {currentStep.description}
              </p>
            </DialogDescription>
          )}
        </div>
        <span className="text-muted-foreground shrink-0 pt-1 text-sm font-medium tabular-nums">
          {progress}%
        </span>
      </div>
    </div>
  )
}
