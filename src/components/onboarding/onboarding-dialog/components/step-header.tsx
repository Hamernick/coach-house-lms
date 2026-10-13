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
    <div className="border-border/70 border-b px-4 py-5 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs font-medium">
            {stepLabel}
          </p>
          {isInline ? (
            <h2 className="text-foreground mt-1 text-2xl font-semibold">
              {currentStep.title}
            </h2>
          ) : (
            <DialogTitle asChild>
              <h2 className="text-foreground mt-1 text-2xl font-semibold">
                {currentStep.title}
              </h2>
            </DialogTitle>
          )}
          {isInline ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {currentStep.description}
            </p>
          ) : (
            <DialogDescription asChild>
              <p className="text-muted-foreground mt-1 text-sm">
                {currentStep.description}
              </p>
            </DialogDescription>
          )}
        </div>
        <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-2">
          <div className="bg-muted h-1.5 w-44 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  )
}
