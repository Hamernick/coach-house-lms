"use client"

import { useMemo } from "react"

import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyRootControl,
  WorkspaceOntologyRootId,
  WorkspaceOntologyState,
} from "../types"

export function useWorkspaceOntologyRootControls({
  input,
  state,
  attentionCounts,
  completedCounts,
  descendantCounts,
  toggleRoot,
}: {
  input: WorkspaceOntologyInput
  state: WorkspaceOntologyState
  attentionCounts: ReadonlyMap<WorkspaceOntologyRootId, number>
  completedCounts: ReadonlyMap<WorkspaceOntologyRootId, number>
  descendantCounts: ReadonlyMap<WorkspaceOntologyRootId, number>
  toggleRoot: (rootId: WorkspaceOntologyRootId) => void
}) {
  return useMemo(() => {
    const controls: Partial<
      Record<WorkspaceOntologyRootId, WorkspaceOntologyRootControl>
    > = {}
    for (const root of input.roots) {
      const descendantCount = descendantCounts.get(root.id) ?? 0
      if (descendantCount === 0) continue
      controls[root.id] = {
        expanded: state.expandedRootIds.includes(root.id),
        attentionCount: attentionCounts.get(root.id) ?? 0,
        completedCount: completedCounts.get(root.id) ?? 0,
        descendantCount,
        onToggle: () => toggleRoot(root.id),
      }
    }
    return controls
  }, [
    attentionCounts,
    completedCounts,
    descendantCounts,
    input.roots,
    state.expandedRootIds,
    toggleRoot,
  ])
}
