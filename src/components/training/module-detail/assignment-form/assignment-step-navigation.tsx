import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left"
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right"

import { Button } from "@/components/ui/button"

import type { AssignmentSection } from "../assignment-sections"

type AssignmentStepNavigationProps = {
  canGoPrevious: boolean
  canGoNext: boolean
  currentSection: AssignmentSection | null
  nextSection?: AssignmentSection | null
  onPrevious?: () => void
  onNext?: () => void
  placement?: "sticky" | "footer"
}

function resolveNextLabel({
  currentSection,
  nextSection,
}: {
  currentSection: AssignmentSection | null
  nextSection?: AssignmentSection | null
}) {
  if (!nextSection) return "Finish lesson"
  if ((currentSection?.fields.length ?? 0) === 0 && nextSection.fields.length > 0) {
    return "Start questions"
  }
  if (nextSection.fields.length > 0) return "Next question"
  return "Continue"
}

export function AssignmentStepNavigation({
  canGoPrevious,
  canGoNext,
  currentSection,
  nextSection,
  onPrevious,
  onNext,
  placement = "sticky",
}: AssignmentStepNavigationProps) {
  const showNext = canGoNext || Boolean(nextSection)
  const showPrevious = canGoPrevious
  if (!showPrevious && !showNext) return null

  return (
    <div
      className={
        placement === "footer"
          ? "flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          : "sticky bottom-0 z-20 mt-auto flex w-full shrink-0 flex-col gap-2 border-t border-border/50 bg-background/95 py-2 shadow-[0_-10px_24px_-26px_rgba(15,23,42,0.35)] backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
      }
    >
      {showPrevious ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 w-full touch-manipulation justify-center gap-1.5 rounded-full px-4 text-xs sm:h-8 sm:w-auto sm:min-w-[104px]"
          onClick={onPrevious}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Previous
        </Button>
      ) : (
        <span className="hidden sm:block" aria-hidden />
      )}
      {showNext ? (
        <Button
          type="button"
          size="sm"
          className="h-9 w-full touch-manipulation justify-center gap-1.5 rounded-full px-4 text-xs sm:h-8 sm:w-auto sm:min-w-[124px]"
          onClick={onNext}
          disabled={!canGoNext}
        >
          {resolveNextLabel({ currentSection, nextSection })}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
