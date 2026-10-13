import type { WorkspaceToolDefinition, WorkspaceToolsInput } from "../types"

export const WORKSPACE_TOOL_DEFINITIONS: readonly WorkspaceToolDefinition[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Sync Stripe transactions into Finance.",
    searchTerms: ["payments", "finance", "transactions"],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Bring Drive files into your organization workspace.",
    searchTerms: ["docs", "documents", "files", "google"],
  },
]

export function normalizeWorkspaceToolsInput(
  input: WorkspaceToolsInput
): WorkspaceToolsInput {
  return {
    stripeConnection: input.stripeConnection ?? {
      state: "not_configured",
    },
  }
}

export function workspaceToolMatchesQuery(
  tool: WorkspaceToolDefinition,
  query: string
) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return true

  return [tool.name, tool.description, ...tool.searchTerms]
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalizedQuery)
}
