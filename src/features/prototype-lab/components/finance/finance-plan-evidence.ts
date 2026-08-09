import type {
  FinancePlanEvidenceState,
  FinancePlanGateEvidence,
  FinancePlanGateState,
  FinancePlanInputState,
  FinancePlanResearchItem,
} from "./finance-release-plan-data"

export type FinancePlanEvidenceCounts = {
  collecting: number
  notStarted: number
  total: number
  verified: number
}

export function countFinancePlanEvidence(
  evidence: readonly { state: FinancePlanEvidenceState }[]
): FinancePlanEvidenceCounts {
  return {
    collecting: evidence.filter((item) => item.state === "collecting").length,
    notStarted: evidence.filter((item) => item.state === "not_started").length,
    total: evidence.length,
    verified: evidence.filter((item) => item.state === "verified").length,
  }
}

export function deriveFinancePlanGateState(
  evidence: readonly FinancePlanGateEvidence[]
): FinancePlanGateState {
  if (evidence.length && evidence.every((item) => item.state === "verified")) {
    return "proven"
  }

  if (evidence.some((item) => item.state !== "not_started")) {
    return "collecting"
  }

  return "not_started"
}

export function deriveFinancePlanResearchInputState(
  items: readonly FinancePlanResearchItem[]
): FinancePlanInputState {
  return items.length && items.every((item) => item.state === "verified")
    ? "resolved"
    : "open"
}
