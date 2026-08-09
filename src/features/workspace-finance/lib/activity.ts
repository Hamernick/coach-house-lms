import type {
  WorkspaceFinanceOpportunityInput,
  WorkspaceFinanceRecordInput,
} from "../types"

export type WorkspaceFinanceActivityItem =
  | {
      id: string
      kind: "record"
      occurredAt: string
      record: WorkspaceFinanceRecordInput
    }
  | {
      id: string
      kind: "opportunity"
      occurredAt: string | null
      opportunity: WorkspaceFinanceOpportunityInput
    }

export function buildWorkspaceFinanceActivityItems({
  opportunities,
  records,
}: {
  opportunities: WorkspaceFinanceOpportunityInput[]
  records: WorkspaceFinanceRecordInput[]
}): WorkspaceFinanceActivityItem[] {
  return [
    ...records.map(
      (record): WorkspaceFinanceActivityItem => ({
        id: `record:${record.id}`,
        kind: "record",
        occurredAt: record.effectiveAt,
        record,
      })
    ),
    ...opportunities.map(
      (opportunity): WorkspaceFinanceActivityItem => ({
        id: `opportunity:${opportunity.id}`,
        kind: "opportunity",
        occurredAt: opportunity.discoveredAt ?? null,
        opportunity,
      })
    ),
  ].sort(
    (left, right) =>
      (right.occurredAt ?? "").localeCompare(left.occurredAt ?? "") ||
      left.id.localeCompare(right.id)
  )
}
