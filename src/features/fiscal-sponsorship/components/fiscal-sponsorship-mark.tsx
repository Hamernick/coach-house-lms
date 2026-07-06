import { cn } from "@/lib/utils"

import type { FiscalSponsorshipActivityEligibilityState } from "../lib/activity-eligibility"

export function FiscalSponsorshipMark({
  className,
  state,
}: {
  className?: string
  state?: FiscalSponsorshipActivityEligibilityState
}) {
  return (
    <span
      className={cn(
        "bg-primary/10 text-primary inline-flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold tracking-tight italic",
        state === "inactive" &&
          "bg-muted text-muted-foreground ring-border/60 ring-1",
        state === "lit" &&
          "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-300",
        state === "active" &&
          "bg-primary text-primary-foreground shadow-xs ring-transparent",
        className
      )}
    >
      FS
    </span>
  )
}
