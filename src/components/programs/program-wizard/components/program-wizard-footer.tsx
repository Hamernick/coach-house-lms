import { Button } from "@/components/ui/button"

type ProgramWizardFooterProps = {
  currentStep: number
  totalSteps: number
  mode: "create" | "edit"
  isPending: boolean
  onCancel: () => void
  onBack: () => void
  onContinue: () => void
  onSubmit: () => void
}

export function ProgramWizardFooter({
  currentStep,
  totalSteps,
  mode,
  isPending,
  onCancel,
  onBack,
  onContinue,
  onSubmit,
}: ProgramWizardFooterProps) {
  return (
    <footer className="border-t border-border/60 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" className="h-9" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={onBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
        </div>
        {currentStep < totalSteps - 1 ? (
          <Button type="button" className="h-9" onClick={onContinue}>
            Continue
          </Button>
        ) : (
          <Button type="button" className="h-9" onClick={onSubmit} disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Generating..."
                : "Saving..."
              : mode === "create"
                ? "Generate brief"
                : "Save brief"}
          </Button>
        )}
      </div>
    </footer>
  )
}
