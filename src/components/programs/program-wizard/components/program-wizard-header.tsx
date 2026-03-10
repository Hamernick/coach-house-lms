import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import { STEPS } from "../constants"

type ProgramWizardHeaderProps = {
  mode: "create" | "edit"
  currentStep: number
  completion: number
  isAutoSaving: boolean
  onStepSelect: (stepIndex: number) => void
}

export function ProgramWizardHeader({
  mode,
  currentStep,
  completion,
  isAutoSaving,
  onStepSelect,
}: ProgramWizardHeaderProps) {
  return (
    <header className="border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Program setup
          </p>
          <h2 className="text-lg font-semibold sm:text-xl">{STEPS[currentStep].title}</h2>
          <p className="text-sm text-muted-foreground">{STEPS[currentStep].helper}</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" ? (
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {isAutoSaving ? "Saving..." : "Autosave on"}
            </Badge>
          ) : null}
          <Badge variant="outline" className="rounded-full text-[11px]">
            Step {currentStep + 1} of {STEPS.length}
          </Badge>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <Progress value={completion} aria-label="Program builder progress" />
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((step, index) => (
            <Button
              key={step.title}
              type="button"
              size="sm"
              variant={index === currentStep ? "secondary" : "outline"}
              onClick={() => onStepSelect(index)}
              className="h-auto rounded-full px-2.5 py-1 text-[11px]"
            >
              {index + 1}. {step.title}
            </Button>
          ))}
        </div>
      </div>
    </header>
  )
}
