"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { WorkspaceFinanceRaisingProgram } from "../types"

function formatCurrency(amountCents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100)
}

export function WorkspaceFinanceProgramTargetsPopover({
  programs,
  unassignedRaisedCents,
}: {
  programs: WorkspaceFinanceRaisingProgram[]
  unassignedRaisedCents: number
}) {
  if (!programs.length) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 rounded-full px-2 text-xs"
        >
          {programs.length} {programs.length === 1 ? "program" : "programs"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(22rem,calc(100vw-2rem))] rounded-xl p-2"
      >
        <div className="px-2 pt-1 pb-2">
          <p className="text-sm font-medium">Programs</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Linked records are measured against each goal, or budget when no
            goal is set.
          </p>
        </div>
        <ul className="max-h-72 divide-y overflow-y-auto">
          {programs.map((program) => (
            <li
              key={program.id}
              className="flex min-w-0 items-center gap-3 px-2 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{program.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                  Raised {formatCurrency(program.raisedCents)} of{" "}
                  {program.targetSource === "goal" ? "goal" : "budget"}{" "}
                  {formatCurrency(program.targetCents)}
                </p>
                <Progress
                  value={program.progressPercent}
                  aria-label={`${program.title} ${Math.round(program.progressPercent)} percent funded`}
                  className="mt-2 h-1.5"
                />
              </div>
              <Badge
                variant={
                  program.status === "complete" ? "secondary" : "outline"
                }
              >
                {program.status === "complete" ? "Complete" : "Raising"}
              </Badge>
            </li>
          ))}
        </ul>
        {unassignedRaisedCents ? (
          <>
            <Separator />
            <p className="text-muted-foreground px-2 pt-2 text-xs tabular-nums">
              Organization-wide {formatCurrency(unassignedRaisedCents)}
            </p>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
