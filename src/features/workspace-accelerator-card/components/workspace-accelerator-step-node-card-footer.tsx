import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"

import { AssignmentStepNavigation } from "@/components/training/module-detail/assignment-form/assignment-step-navigation"
import { Button } from "@/components/ui/button"
import { buildAssignmentSections } from "@/lib/modules/assignment-sections"

import type { WorkspaceAcceleratorCardStep } from "../types"

export function resolveAssignmentFooterNavigation(step: WorkspaceAcceleratorCardStep) {
  if (step.stepKind !== "assignment") return null
  const fields = step.moduleContext?.assignmentFields ?? []
  if (fields.length === 0) return null

  const { tabSections } = buildAssignmentSections(fields)
  const activeIndex = step.assignmentSectionId
    ? tabSections.findIndex((section) => section.id === step.assignmentSectionId)
    : 0
  const currentIndex = activeIndex >= 0 ? activeIndex : 0

  return {
    currentSection: tabSections[currentIndex] ?? null,
    nextSection: tabSections[currentIndex + 1] ?? null,
  }
}

type AssignmentFooterNavigation = NonNullable<
  ReturnType<typeof resolveAssignmentFooterNavigation>
>

function WorkspaceAcceleratorFinalAssignmentFooter({
  canGoPrevious,
  completed,
  onComplete,
  onPrevious,
}: {
  canGoPrevious: boolean
  completed: boolean
  onComplete: () => void
  onPrevious: () => void
}) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      {canGoPrevious ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 w-full touch-manipulation justify-center gap-1.5 rounded-full px-4 text-xs sm:h-8 sm:w-auto sm:min-w-[104px]"
          onClick={onPrevious}
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          Previous
        </Button>
      ) : (
        <span className="hidden sm:block" aria-hidden />
      )}
      <Button
        type="button"
        size="sm"
        className="h-9 w-full touch-manipulation justify-center gap-1.5 rounded-full px-4 text-xs sm:h-8 sm:w-auto sm:min-w-[124px]"
        onClick={onComplete}
      >
        {completed ? "Completed" : "Complete"}
        <CheckIcon className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  )
}

export function WorkspaceAcceleratorStepFooter({
  assignmentFooterNavigation,
  canGoNext,
  canGoPrevious,
  completed,
  isFinalAssignmentSection,
  onComplete,
  onNext,
  onPrevious,
}: {
  assignmentFooterNavigation: AssignmentFooterNavigation
  canGoNext: boolean
  canGoPrevious: boolean
  completed: boolean
  isFinalAssignmentSection: boolean
  onComplete: () => void
  onNext: () => void
  onPrevious: () => void
}) {
  return (
    <footer className="border-border/60 bg-muted/15 flex items-center justify-stretch border-t px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 sm:px-4 sm:pb-2">
      {isFinalAssignmentSection ? (
        <WorkspaceAcceleratorFinalAssignmentFooter
          canGoPrevious={canGoPrevious}
          completed={completed}
          onComplete={onComplete}
          onPrevious={onPrevious}
        />
      ) : (
        <AssignmentStepNavigation
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          currentSection={assignmentFooterNavigation.currentSection}
          nextSection={assignmentFooterNavigation.nextSection}
          onPrevious={onPrevious}
          onNext={onNext}
          placement="footer"
        />
      )}
    </footer>
  )
}
