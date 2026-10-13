"use client"

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
  return (
    <div className="space-y-6 py-5" data-onboarding-step-id="intent">
      <div className="space-y-2">
        <Label>Your focus</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {INTENT_OPTIONS.map((option) => {
            const selected = intentFocus === option.value
            const Icon = option.icon

            return (
              <Button
                key={option.value}
                type="button"
                variant="ghost"
                data-onboarding-primary-focus={option.available ? "true" : undefined}
                onClick={() => onSelectIntent(option.value)}
                className={cn(
                  "h-auto min-h-32 flex-col items-start justify-start gap-3 whitespace-normal rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/70 bg-background/70 hover:bg-background",
                )}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
                      selected
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/70 bg-background text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </Button>
            )
          })}
        </div>
        {attemptedStep === step && errors.intentFocus ? (
          <p className="text-destructive text-xs">{errors.intentFocus}</p>
        ) : null}
      </div>
    </div>
  )
}
