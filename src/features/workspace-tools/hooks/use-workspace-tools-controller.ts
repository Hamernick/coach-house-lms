"use client"

import { useDeferredValue, useMemo, useState } from "react"

import {
  normalizeWorkspaceToolsInput,
  WORKSPACE_TOOL_DEFINITIONS,
  workspaceToolMatchesQuery,
} from "../lib"
import type { WorkspaceToolsInput } from "../types"

export function useWorkspaceToolsController(input: WorkspaceToolsInput) {
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

  return {
    availableTools: matchingTools.filter(
      (tool) => tool.id !== "stripe" || !stripeConnected
    ),
    clearQuery: () => setQuery(""),
    installedTools: matchingTools.filter(
      (tool) => tool.id === "stripe" && stripeConnected
    ),
    query,
    setQuery,
    stripeConnection: normalizedInput.stripeConnection,
  }
}
