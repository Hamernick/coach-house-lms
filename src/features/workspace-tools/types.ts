import type { WorkspaceFinanceStripeConnectionInput } from "@/features/workspace-finance"

export type WorkspaceToolId = "stripe" | "google-drive" | "google-calendar"

export type WorkspaceToolDefinition = {
  id: WorkspaceToolId
  name: string
  description: string
  searchTerms: readonly string[]
}

export type WorkspaceToolsInput = {
  stripeConnection: WorkspaceFinanceStripeConnectionInput
}
