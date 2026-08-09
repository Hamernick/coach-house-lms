import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import type { FinancePlanCutoverRule } from "./finance-plan-cutover"
import type { FinancePlanEvidenceState } from "./finance-release-plan-data"
import { getFinancePlanningView } from "./finance-plan-views"

function getCutoverStateLabel(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return "Collecting proof"
    case "verified":
      return "Verified"
    default:
      return "Not started"
  }
}

function getCutoverStateIcon(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return Clock3Icon
    case "verified":
      return CircleCheckBigIcon
    default:
      return CircleIcon
  }
}

export function FinancePlanReadinessCutoverList({
  onSelect,
  rules,
}: {
  onSelect: (rule: FinancePlanCutoverRule) => void
  rules: readonly FinancePlanCutoverRule[]
}) {
  return (
    <ol className="space-y-1 p-2 sm:p-3">
      {rules.map((rule, index) => {
        const StateIcon = getCutoverStateIcon(rule.state)
        const view = getFinancePlanningView(rule.target.viewId)

        return (
          <li key={rule.id}>
            <Button
              className="h-auto min-h-16 w-full items-start justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
              data-finance-readiness-cutover-state={rule.state}
              data-finance-readiness-cutover-target={rule.target.nodeId}
              onClick={() => onSelect(rule)}
              type="button"
              variant="ghost"
            >
              <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg">
                <StateIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-xs tabular-nums">
                  Cutover rule {index + 1}
                </span>
                <span className="mt-0.5 block font-medium text-balance">
                  {rule.title}
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <Badge className="rounded-full" variant="secondary">
                    {getCutoverStateLabel(rule.state)}
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
