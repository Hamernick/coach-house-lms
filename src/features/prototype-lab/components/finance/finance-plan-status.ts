import type { FinanceReleasePlanNodeData } from "./finance-release-plan-data"

export type FinancePlanStatusTone =
  | "attention"
  | "complete"
  | "planned"
  | "risk"

export function getFinancePlanNodeStatusTone(
  data: Pick<
    FinanceReleasePlanNodeData,
    "gateState" | "inputState" | "kind" | "readinessState" | "workItems"
  >
): FinancePlanStatusTone {
  if (data.kind === "start" || data.kind === "guardrail") return "risk"

  if (data.inputState) {
    return data.inputState === "resolved" ? "complete" : "attention"
  }

  if (data.gateState) {
    if (data.gateState === "proven") return "complete"
    if (data.gateState === "collecting") return "attention"
    return "planned"
  }

  if (data.workItems?.length) {
    if (data.workItems.every((item) => item.state === "complete")) {
      return "complete"
    }
    if (data.workItems.some((item) => item.state !== "not_started")) {
      return "attention"
    }
  }

  if (data.readinessState) {
    return data.readinessState === "merged" ? "complete" : "attention"
  }

  return "planned"
}

export function getFinancePlanStatusBorderClassName(
  tone: FinancePlanStatusTone
) {
  switch (tone) {
    case "complete":
      return "border-emerald-500/45"
    case "attention":
      return "border-amber-500/45"
    case "risk":
      return "border-red-500/40"
    default:
      return "border-blue-500/35"
  }
}

export function getFinancePlanStatusBadgeClassName(
  tone: FinancePlanStatusTone
) {
  switch (tone) {
    case "complete":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "attention":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "risk":
      return "border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-300"
    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
  }
}

export function getFinancePlanStatusColor(tone: FinancePlanStatusTone) {
  switch (tone) {
    case "complete":
      return "#16a34a"
    case "attention":
      return "#d97706"
    case "risk":
      return "#dc2626"
    default:
      return "#2563eb"
  }
}
