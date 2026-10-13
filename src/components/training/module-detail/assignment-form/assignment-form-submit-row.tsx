import ArrowRight from "lucide-react/dist/esm/icons/arrow-right"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AssignmentFormSubmitRowProps = {
  isStepper: boolean
  hasMeta: boolean
  helperText: string | null | undefined
  errorMessage: string | null | undefined
  statusNote: string | null | undefined
  autoSaving: boolean
  nextHref: string | null
  currentStep: number | undefined
  totalSteps: number | undefined
}

export function AssignmentFormSubmitRow({
  isStepper,
  hasMeta,
  helperText,
  errorMessage,
  statusNote,
  autoSaving,
  nextHref,
  currentStep,
  totalSteps,
}: AssignmentFormSubmitRowProps) {
  return (
    <div className={cn("flex flex-wrap items-start gap-3 pt-2", isStepper && "justify-center")}>
      <div className={cn("flex flex-wrap items-center gap-3 text-xs text-muted-foreground", !isStepper && "ml-auto")}>
        <div className={cn("flex flex-col gap-1", isStepper ? "text-center" : "text-right")}>
          <div className={cn("min-h-[14px] flex flex-wrap justify-end gap-2", !hasMeta && "opacity-0")}>
            {helperText ? <p className="text-emerald-600">{helperText}</p> : null}
            {errorMessage ? <p className="text-rose-500">{errorMessage}</p> : null}
            {statusNote ? <p className="text-amber-600">{statusNote}</p> : null}
            {autoSaving ? <p>Saving…</p> : null}
          </div>
        </div>
        {!isStepper && nextHref ? (
          <Button asChild size="default" variant="outline" title="Next module" className="relative min-w-[92px] px-2.5">
            <Link href={nextHref} aria-label="Next module" className="inline-flex h-9 items-center justify-center gap-2 px-1">
              {typeof currentStep === "number" && typeof totalSteps === "number" ? (
                <span className="inline-flex items-center justify-center rounded-full bg-card px-1 text-[10px] font-semibold text-muted-foreground">
                  {currentStep + 1} of {totalSteps}
                </span>
              ) : null}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
