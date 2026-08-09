import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import type { FinancePlanEvidenceState } from "./finance-release-plan-data"
import type { FinancePlanTestArea } from "./finance-plan-test-matrix"
import { getFinancePlanningView } from "./finance-plan-views"

function getTestStateLabel(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return "Running"
    case "verified":
      return "Verified"
    default:
      return "Not started"
  }
}

function getTestStateIcon(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return Clock3Icon
    case "verified":
      return CircleCheckBigIcon
    default:
      return CircleIcon
  }
}

export function FinancePlanReadinessTestList({
  areas,
  onSelect,
}: {
  areas: readonly FinancePlanTestArea[]
  onSelect: (area: FinancePlanTestArea) => void
}) {
  return (
    <ol className="space-y-1 p-2 sm:p-3">
      {areas.map((area, index) => {
        const StateIcon = getTestStateIcon(area.state)
        const view = getFinancePlanningView(area.target.viewId)

        return (
          <li key={area.id}>
            <Button
              className="h-auto min-h-16 w-full items-start justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
              data-finance-readiness-test-state={area.state}
              data-finance-readiness-test-target={area.target.nodeId}
              onClick={() => onSelect(area)}
              type="button"
              variant="ghost"
            >
              <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg">
                <StateIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-xs tabular-nums">
                  Test area {index + 1}
                </span>
                <span className="mt-0.5 block font-medium text-balance">
                  {area.area}
                </span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5 text-pretty">
                  {area.requiredCases}
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <Badge className="rounded-full" variant="secondary">
                    {getTestStateLabel(area.state)}
                  </Badge>
                  <Badge className="rounded-full" variant="outline">
                    {view.label}
                  </Badge>
                </span>
              </span>
            </Button>
          </li>
        )
      })}
    </ol>
  )
}
