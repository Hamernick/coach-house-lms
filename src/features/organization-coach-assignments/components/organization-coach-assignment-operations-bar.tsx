"use client"

import dynamic from "next/dynamic"
import { UsersThree } from "@phosphor-icons/react/dist/ssr"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ORGANIZATION_COACH_FILTER_ALL,
  ORGANIZATION_COACH_FILTER_UNASSIGNED,
} from "../lib"
import type {
  OrganizationCoachAssignmentCoverage,
  OrganizationCoachFilterValue,
  OrganizationCoachOption,
  OrganizationCoachScopeStatus,
  SetOrganizationCoachScopeAction,
} from "../types"

const OrganizationCoachScopeControl = dynamic(
  () =>
    import("./organization-coach-scope-control").then(
      (module) => module.OrganizationCoachScopeControl
    ),
  { ssr: false }
)

function Count({ value }: { value: number }) {
  return (
    <span className="text-muted-foreground ml-auto tabular-nums">{value}</span>
  )
}

export function OrganizationCoachAssignmentOperationsBar({
  coachOptions,
  coverage,
  value,
  onValueChange,
  scopeStatus,
  setScopeAction,
}: {
  coachOptions: OrganizationCoachOption[]
  coverage: OrganizationCoachAssignmentCoverage
  value: OrganizationCoachFilterValue
  onValueChange: (value: OrganizationCoachFilterValue) => void
  scopeStatus: OrganizationCoachScopeStatus
  setScopeAction: SetOrganizationCoachScopeAction
}) {
  return (
    <div className="space-y-3" aria-label="Coach assignment operations">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
            <UsersThree className="text-muted-foreground size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-foreground text-sm font-medium">
              <span className="tabular-nums">{coverage.assigned}</span> of{" "}
              <span className="tabular-nums">{coverage.total}</span> assigned
            </p>
            <p className="text-muted-foreground text-xs">
              <span className="tabular-nums">{coverage.unassigned}</span>{" "}
              unassigned
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-muted-foreground text-xs font-medium">
            Coach
          </span>
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger
              className="h-11 w-full min-w-0 sm:h-9 sm:w-64"
              aria-label="Filter organizations by coach"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="w-72">
              <SelectItem
                value={ORGANIZATION_COACH_FILTER_ALL}
                className="min-h-11 *:[span]:last:flex-1"
              >
                <span>All organizations</span>
                <Count value={coverage.total} />
              </SelectItem>
              <SelectItem
                value={ORGANIZATION_COACH_FILTER_UNASSIGNED}
                className="min-h-11 *:[span]:last:flex-1"
              >
                <span>Unassigned</span>
                <Count value={coverage.unassigned} />
              </SelectItem>
              <SelectSeparator />
              {coachOptions.map((coach) => (
                <SelectItem
                  key={coach.id}
                  value={coach.id}
                  className="min-h-11 *:[span]:last:flex-1"
                >
                  <span className="min-w-0 flex-1 truncate">{coach.name}</span>
                  <Count value={coverage.countByCoachId[coach.id] ?? 0} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {scopeStatus.available ? (
        <OrganizationCoachScopeControl
          coverage={coverage}
          scopeStatus={scopeStatus}
          setScopeAction={setScopeAction}
        />
      ) : null}
    </div>
  )
}
