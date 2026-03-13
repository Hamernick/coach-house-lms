"use client"

import CheckIcon from "lucide-react/dist/esm/icons/check"

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
          "flex flex-col gap-2 rounded-2xl border border-primary/60 bg-primary/5 p-3 text-left",
        className,
      )}
    >
      {contained ? (
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground"
          aria-hidden
        >
          <CheckIcon className="h-3 w-3" />
        </span>
      ) : null}
      <span className="w-full">
        <span className="block text-sm font-medium text-foreground">
          {formationStatus.label}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {formationStatus.description}
        </span>
      </span>
    </div>
  )
}
