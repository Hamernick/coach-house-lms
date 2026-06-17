"use client"

import { useId } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { INTENT_OPTIONS } from "../constants"
import type { IntentFocus } from "../types"

type IntentStepProps = {
  step: number
  attemptedStep: number | null
  errors: Record<string, string>
  intentFocus: IntentFocus | ""
  onSelectIntent: (value: IntentFocus) => void
}

export function IntentStep({
  step,
  attemptedStep,
  errors,
  intentFocus,
  onSelectIntent,
}: IntentStepProps) {
  const focusLabelId = useId()
  const focusErrorId = useId()
  const showIntentError = attemptedStep === step && Boolean(errors.intentFocus)

  return (
    <div className="space-y-6 py-5" data-onboarding-step-id="intent">
      <div className="space-y-2">
        <Label id={focusLabelId}>Your focus</Label>
        <div
          role="group"
          aria-labelledby={focusLabelId}
          aria-describedby={showIntentError ? focusErrorId : undefined}
          className="grid gap-3 sm:grid-cols-2"
        >
          {INTENT_OPTIONS.map((option) => {
            const selected = intentFocus === option.value
            const Icon = option.icon

            return (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                data-onboarding-primary-focus={
                  option.available ? "true" : undefined
                }
                onClick={() => onSelectIntent(option.value)}
                aria-pressed={selected}
                className={cn(
                  "h-auto min-h-32 flex-col items-start justify-start gap-3 rounded-2xl border p-4 text-left whitespace-normal transition",
                  selected
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/70 bg-background/70 hover:bg-background"
                )}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                      selected
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/70 bg-background text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-foreground text-sm font-semibold">
                    {option.label}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {option.description}
                  </p>
                </div>
              </Button>
            )
          })}
        </div>
        {showIntentError ? (
          <p
            id={focusErrorId}
            className="text-destructive text-xs"
            role="alert"
          >
            {errors.intentFocus}
          </p>
        ) : null}
      </div>
    </div>
  )
}
