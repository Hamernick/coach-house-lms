import type {
  WorkspaceFinanceInput,
  WorkspaceFinanceOpportunityInput,
  WorkspaceFinanceProgramInput,
  WorkspaceFinanceRecordInput,
  WorkspaceFinanceStripeConnectionInput,
} from "../types"

type WorkspaceFinanceReadModelLoaders = {
  loadRecords?: () => Promise<WorkspaceFinanceRecordInput[]>
  loadOpportunities?: () => Promise<WorkspaceFinanceOpportunityInput[]>
  loadStripeConnection?: () => Promise<WorkspaceFinanceStripeConnectionInput>
}

export async function loadWorkspaceFinanceReadModel({
  programs,
  loadRecords,
  loadOpportunities,
  loadStripeConnection,
}: WorkspaceFinanceReadModelLoaders & {
  programs: WorkspaceFinanceProgramInput[]
}): Promise<WorkspaceFinanceInput> {
  const [recordsResult, opportunitiesResult, stripeConnectionResult] =
    await Promise.allSettled([
      loadRecords?.(),
      loadOpportunities?.(),
      loadStripeConnection?.(),
    ])

  const recordsConnected = Boolean(loadRecords)
  const opportunitiesConnected = Boolean(loadOpportunities)
  const stripeConnectionConnected = Boolean(loadStripeConnection)

  return {
    programs,
    records:
      recordsConnected && recordsResult.status === "fulfilled"
        ? recordsResult.value
        : undefined,
    recordsState: recordsConnected
      ? recordsResult.status === "fulfilled"
        ? "ready"
        : "error"
      : "idle",
    opportunities:
      opportunitiesConnected && opportunitiesResult.status === "fulfilled"
        ? opportunitiesResult.value
        : undefined,
    opportunitiesState: opportunitiesConnected
      ? opportunitiesResult.status === "fulfilled"
        ? "ready"
        : "error"
      : "idle",
    ...(stripeConnectionConnected
      ? {
          stripeConnection:
            stripeConnectionResult.status === "fulfilled"
              ? stripeConnectionResult.value
              : ({ state: "error" } as const),
        }
      : {}),
  }
}
