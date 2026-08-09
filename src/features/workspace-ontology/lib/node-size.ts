import type {
  WorkspaceOntologyNodeSize,
  WorkspaceOntologyProjection,
} from "../types"

export const WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE = {
  width: 300,
  height: 112,
} as const

export const WORKSPACE_ONTOLOGY_LEAF_NODE_SIZE = {
  width: 280,
  height: 112,
} as const

export const WORKSPACE_ONTOLOGY_SUMMARY_NODE_SIZE = {
  width: 260,
  height: 92,
} as const

export const WORKSPACE_ONTOLOGY_LIST_NODE_WIDTH = 320

export const WORKSPACE_ONTOLOGY_NODE_SIZE = WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE

export function resolveWorkspaceOntologyNodeSize(
  node: Pick<
    WorkspaceOntologyProjection["nodes"][number],
    "hasChildren" | "items"
  > &
    Partial<Pick<WorkspaceOntologyProjection["nodes"][number], "presentation">>
): WorkspaceOntologyNodeSize {
  if (node.presentation === "list") {
    const primaryItemCount =
      node.items?.filter(
        (item) =>
          item.presentation === "action" || item.presentation === "group"
      ).length ?? 0
    const hasSummary = node.items?.some(
      (item) => item.presentation === "more" || item.presentation === "rollup"
    )
    return {
      width: WORKSPACE_ONTOLOGY_LIST_NODE_WIDTH,
      height: Math.max(112, 60 + primaryItemCount * 40 + (hasSummary ? 32 : 0)),
    }
  }
  if (node.presentation === "rollup" || node.presentation === "more") {
    return WORKSPACE_ONTOLOGY_SUMMARY_NODE_SIZE
  }
  return node.hasChildren
    ? WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE
    : WORKSPACE_ONTOLOGY_LEAF_NODE_SIZE
}
