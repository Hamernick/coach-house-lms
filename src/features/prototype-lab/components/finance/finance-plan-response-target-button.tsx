"use client"

import CircleCheckBigIcon from "lucide-react/dist/esm/icons/circle-check-big"
import Clock3Icon from "lucide-react/dist/esm/icons/clock-3"
import MessageSquareIcon from "lucide-react/dist/esm/icons/message-square"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  FINANCE_PLAN_RESPONSE_ENABLED,
  useFinancePlanResponses,
} from "./finance-plan-response-context"

const RESOLVED_LABELS = {
  agree: "Agreed",
  confirm: "Confirmed",
  deny: "Denied",
} as const

export type FinancePlanResponseTarget = {
  id: string
  title: string
}

export function FinancePlanResponseTargetButton({
  onSelect,
  selected,
  target,
}: {
  onSelect: (target: FinancePlanResponseTarget) => void
  selected: boolean
  target: FinancePlanResponseTarget
}) {
  const { loading, responses } = useFinancePlanResponses()
  const response = responses.find((entry) => entry.nodeId === target.id)
  const resolvedLabel = response?.action
    ? RESOLVED_LABELS[response.action]
    : null
  const resolved = response?.state === "resolved" && resolvedLabel !== null
  const inProgress = response?.state === "in_progress"
  const label = loading
    ? "Loading"
    : resolved
      ? resolvedLabel
      : inProgress
        ? "In progress"
        : "Reply"
  const Icon = resolved
    ? CircleCheckBigIcon
    : inProgress
      ? Clock3Icon
      : MessageSquareIcon

  if (!FINANCE_PLAN_RESPONSE_ENABLED) return null

  return (
    <Button
      aria-label={`${label}: ${target.title}`}
      aria-busy={loading}
      aria-pressed={selected}
      className={cn(
        "h-8 shrink-0 rounded-full px-2.5 text-xs",
        resolved &&
          "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white",
        inProgress &&
          "border-amber-500 bg-amber-500 text-zinc-950 hover:bg-amber-600 hover:text-zinc-950",
        selected && !resolved && !inProgress && "bg-accent"
      )}
      data-finance-plan-response-target={target.id}
      disabled={loading}
      onClick={() => onSelect(target)}
      size="sm"
      type="button"
      variant="outline"
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
    </Button>
  )
}
