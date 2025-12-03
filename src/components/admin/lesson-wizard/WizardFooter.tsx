"use client"

import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import Check from "lucide-react/dist/esm/icons/check"
import { DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
  pending: boolean
  isEditMode: boolean
  isDirty: boolean
  step: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  onFinish: () => void
  onCancel: () => void
}

export function WizardFooter({
  pending,
  isEditMode,
  isDirty,
  step,
  totalSteps,
  onBack,
  onNext,
  onFinish,
  onCancel,
}: Props) {
  return (
    <DialogFooter className="">
      <div className="flex w-full items-center justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={step === 1 || pending}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          {step < totalSteps ? (
            <Button type="button" onClick={onNext} disabled={pending}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onFinish}
              disabled={pending || (isEditMode && !isDirty)}
              variant={isEditMode ? "outline" : undefined}
            >
              {pending ? (isEditMode ? "Updating…" : "Creating…") : (
                <span className="flex items-center">
                  <Check className="mr-1 h-4 w-4" />
                  {isEditMode ? "Update" : "Create Lesson"}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </DialogFooter>
  )
}
