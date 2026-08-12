import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import type { FinancePlanWorkState } from "./finance-release-plan-data"
import type {
  FinancePlanWave,
  FinancePlanWaveStatus,
} from "./finance-plan-wave-progress"

function getWaveStatusLabel(status: FinancePlanWaveStatus) {
  switch (status) {
    case "active":
      return "Active"
    case "code_complete":
      return "Code complete"
    case "preview_verified":
      return "Preview verified"
    case "production_verified":
      return "Production verified"
    default:
      return "Queued"
  }
}

function getWaveStatusClassName(status: FinancePlanWaveStatus) {
  switch (status) {
    case "production_verified":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "active":
    case "code_complete":
    case "preview_verified":
      return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
  }
}

function getCriterionStateLabel(state: FinancePlanWorkState) {
  switch (state) {
    case "complete":
      return "Complete"
    case "in_progress":
      return "In progress"
    default:
      return "Not started"
  }
}

function getCriterionStateIcon(state: FinancePlanWorkState) {
  switch (state) {
    case "complete":
      return CircleCheckBigIcon
    case "in_progress":
      return Clock3Icon
    default:
      return CircleIcon
  }
}

function getCriterionStateClassName(state: FinancePlanWorkState) {
  switch (state) {
    case "complete":
      return "text-emerald-700 dark:text-emerald-300"
    case "in_progress":
      return "text-amber-700 dark:text-amber-300"
    default:
      return "text-blue-700 dark:text-blue-300"
  }
}

export function FinancePlanWaveProgressList({
  waves,
}: {
  waves: readonly FinancePlanWave[]
}) {
  return (
    <ol className="space-y-2 p-2 sm:p-3">
      {waves.map((wave) => {
        const complete = wave.criteria.filter(
          (criterion) => criterion.state === "complete"
        ).length

        return (
          <li key={wave.id}>
            <section
              aria-labelledby={`${wave.id}-title`}
              className="border-border/60 rounded-xl border"
              data-finance-wave={wave.id}
              data-finance-wave-status={wave.status}
            >
              <header className="px-3 pt-3">
                <span className="text-muted-foreground text-xs tabular-nums">
                  Wave {wave.sequence}
                </span>
                <h3
                  className="mt-0.5 text-sm font-medium text-balance"
                  id={`${wave.id}-title`}
                >
                  {wave.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge
                    className={cn(
                      "rounded-full",
                      getWaveStatusClassName(wave.status)
                    )}
                    variant="outline"
                  >
                    {getWaveStatusLabel(wave.status)}
                  </Badge>
                  <Badge
                    className="rounded-full tabular-nums"
                    variant="outline"
                  >
                    {complete}/{wave.criteria.length} verified
                  </Badge>
                </div>
              </header>

              <ul className="border-border/70 mx-3 mt-3 mb-3 space-y-2 border-t pt-3">
                {wave.criteria.map((criterion) => {
                  const StateIcon = getCriterionStateIcon(criterion.state)

                  return (
                    <li
                      className="text-muted-foreground flex gap-2 text-xs leading-5 text-pretty"
                      data-finance-wave-criterion={criterion.id}
                      data-finance-wave-criterion-state={criterion.state}
                      key={criterion.id}
                    >
                      <StateIcon
                        aria-hidden="true"
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          getCriterionStateClassName(criterion.state)
                        )}
                      />
                      <span className="min-w-0 flex-1 break-words">
                        <span className="sr-only">
                          {getCriterionStateLabel(criterion.state)}.{" "}
                        </span>
                        <span>{criterion.title}</span>
                        {criterion.evidence.length ? (
                          <span className="mt-1 block text-[11px] leading-4">
                            Evidence: {criterion.evidence.join("; ")}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          </li>
        )
      })}
    </ol>
  )
}
