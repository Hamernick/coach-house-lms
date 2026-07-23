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

export const WORKSPACE_ONTOLOGY_NODE_SIZE = WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE

export function resolveWorkspaceOntologyNodeSize(
  node: Pick<WorkspaceOntologyProjection["nodes"][number], "hasChildren">
): WorkspaceOntologyNodeSize {
  return node.hasChildren
    ? WORKSPACE_ONTOLOGY_GROUP_NODE_SIZE
    : WORKSPACE_ONTOLOGY_LEAF_NODE_SIZE
}
