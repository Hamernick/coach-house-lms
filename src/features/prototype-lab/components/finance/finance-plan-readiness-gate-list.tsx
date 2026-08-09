import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import CircleIcon from "lucide-react/dist/esm/icons/circle"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import ShieldCheckIcon from "lucide-react/dist/esm/icons/shield-check"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import type { FinancePlanGateReadiness } from "./finance-plan-readiness"
import type {
  FinancePlanEvidenceState,
  FinancePlanGateState,
} from "./finance-release-plan-data"

function getGateStateLabel(state: FinancePlanGateState) {
  switch (state) {
    case "collecting":
      return "Collecting"
    case "proven":
      return "Proven"
    default:
      return "Not started"
  }
}

function getEvidenceStateLabel(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return "Collecting"
    case "verified":
      return "Verified"
    default:
      return "Not started"
  }
}

function getEvidenceStateIcon(state: FinancePlanEvidenceState) {
  switch (state) {
    case "collecting":
      return Clock3Icon
    case "verified":
      return CircleCheckBigIcon
    default:
      return CircleIcon
  }
}

export function FinancePlanReadinessGateList({
  gates,
  onSelect,
}: {
  gates: readonly FinancePlanGateReadiness[]
  onSelect: (gate: FinancePlanGateReadiness) => void
}) {
  return (
    <ol className="space-y-1 p-2 sm:p-3">
      {gates.map((gate) => (
        <li key={gate.gateId}>
          <div className="border-border/60 rounded-xl border">
            <Button
              className="h-auto min-h-16 w-full items-start justify-start gap-3 rounded-xl px-3 py-3 text-left whitespace-normal"
              data-finance-readiness-gate-target={gate.gateId}
              onClick={() => onSelect(gate)}
              type="button"
              variant="ghost"
            >
              <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-lg">
                <ShieldCheckIcon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-xs tabular-nums">
                  Gate {gate.sequence}
                </span>
                <span className="mt-0.5 block font-medium text-balance">
                  {gate.title}
                </span>
                <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs leading-5 text-pretty">
                  {gate.summary}
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  <Badge
                    className="rounded-full"
                    data-finance-readiness-gate-state={gate.gateState}
                    variant="secondary"
                  >
                    {getGateStateLabel(gate.gateState)}
                  </Badge>
                  <Badge
                    className="rounded-full tabular-nums"
                    variant="outline"
                  >
                    {gate.evidenceCounts.verified}/{gate.evidenceCounts.total}{" "}
                    verified
                  </Badge>
                </span>
              </span>
            </Button>
            <ul
              className="border-border/70 mx-3 mb-3 space-y-2 border-t pt-3"
              data-finance-readiness-evidence-list={gate.gateId}
            >
              {gate.evidence.map((item) => {
                const EvidenceIcon = getEvidenceStateIcon(item.state)

                return (
                  <li
                    className="text-muted-foreground flex gap-2 text-xs leading-5 text-pretty"
                    data-finance-readiness-evidence-state={item.state}
                    key={item.id}
                  >
                    <EvidenceIcon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <span>
                      <span className="sr-only">
                        {getEvidenceStateLabel(item.state)}:{" "}
                      </span>
                      {item.title}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  )
}
