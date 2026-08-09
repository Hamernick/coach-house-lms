import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import type { FinancePlanEvidenceState } from "./finance-release-plan-data"
import type { FinancePlanSecurityControl } from "./finance-plan-security-controls"
import { getFinancePlanningView } from "./finance-plan-views"

function getSecurityStateLabel(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return "Collecting"
    case "verified":
      return "Verified"
    default:
      return "Not started"
  }
}

function getSecurityStateIcon(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return Clock3Icon
    case "verified":
      return CircleCheckBigIcon
    default:
      return CircleIcon
  }
}

export function FinancePlanReadinessSecurityList({
  controls,
  onSelect,
}: {
  controls: readonly FinancePlanSecurityControl[]
  onSelect: (control: FinancePlanSecurityControl) => void
}) {
  return (
    <ol className="space-y-1 p-2 sm:p-3">
      {controls.map((control, index) => {
        const StateIcon = getSecurityStateIcon(control.state)
        const view = getFinancePlanningView(control.target.viewId)

        return (
          <li key={control.id}>
            <Button
              className="h-auto min-h-16 w-full items-start justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
              data-finance-readiness-security-state={control.state}
              data-finance-readiness-security-target={control.target.nodeId}
              onClick={() => onSelect(control)}
              type="button"
              variant="ghost"
            >
              <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg">
                <StateIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-xs tabular-nums">
                  Security control {index + 1}
                </span>
                <span className="mt-0.5 block font-medium text-balance">
                  {control.title}
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <Badge className="rounded-full" variant="secondary">
                    {getSecurityStateLabel(control.state)}
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
