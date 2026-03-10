"use client"

import type { FormationStatusOption } from "@/lib/organization/formation-status"
import { cn } from "@/lib/utils"

export function OrganizationFormationStatusSummary({
  formationStatus,
  className,
  contained = true,
}: {
  formationStatus: FormationStatusOption
  className?: string
  contained?: boolean
}) {
  return (
    <div
      className={cn(
        contained &&
          "rounded-xl border border-primary/60 bg-primary/5 p-3 text-left",
        className,
      )}
    >
      <p className="text-sm font-medium text-foreground">
        {formationStatus.label}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {formationStatus.description}
      </p>
    </div>
  )
}
