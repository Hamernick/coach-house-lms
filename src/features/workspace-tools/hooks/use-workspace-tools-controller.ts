"use client"

import { useDeferredValue, useMemo, useState } from "react"

import {
  normalizeWorkspaceToolsInput,
  WORKSPACE_TOOL_DEFINITIONS,
  workspaceToolMatchesQuery,
} from "../lib"
import type { WorkspaceToolsInput } from "../types"

export function useWorkspaceToolsController(
  input: WorkspaceToolsInput,
  googleDriveConnected: boolean | null
) {
  const normalizedInput = useMemo(
    () => normalizeWorkspaceToolsInput(input),
    [input]
  )
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const matchingTools = useMemo(
    () =>
      WORKSPACE_TOOL_DEFINITIONS.filter((tool) =>
        workspaceToolMatchesQuery(tool, deferredQuery)
      ),
    [deferredQuery]
  )
  const stripeConnected = normalizedInput.stripeConnection.state === "connected"
  const isInstalled = (
    toolId: (typeof WORKSPACE_TOOL_DEFINITIONS)[number]["id"]
  ) => (toolId === "stripe" ? stripeConnected : googleDriveConnected === true)

  return {
    availableTools: matchingTools.filter((tool) => !isInstalled(tool.id)),
    clearQuery: () => setQuery(""),
    installedTools: matchingTools.filter((tool) => isInstalled(tool.id)),
    query,
    setQuery,
    stripeConnection: normalizedInput.stripeConnection,
  }
}
