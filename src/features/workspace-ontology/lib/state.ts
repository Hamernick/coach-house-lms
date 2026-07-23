import {
  WORKSPACE_ONTOLOGY_ROOT_IDS,
  type WorkspaceOntologyRootId,
  type WorkspaceOntologyState,
} from "../types"

const ROOT_ID_SET = new Set<WorkspaceOntologyRootId>(
  WORKSPACE_ONTOLOGY_ROOT_IDS
)
function normalizeTimestamp(value: unknown) {
  if (typeof value !== "string") return null
  return Number.isFinite(Date.parse(value)) ? value : null
}

function normalizeUniqueStrings(value: unknown) {
  if (!Array.isArray(value)) return []
  const result: string[] = []
  const seen = new Set<string>()
  for (const entry of value) {
    if (typeof entry !== "string") continue
    const normalized = entry.trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }
  return result
}

function normalizeRootIds(value: unknown) {
  return normalizeUniqueStrings(value).filter(
    (entry): entry is WorkspaceOntologyRootId =>
      ROOT_ID_SET.has(entry as WorkspaceOntologyRootId)
  )
}

export function buildDefaultWorkspaceOntologyState(): WorkspaceOntologyState {
  return {
    updatedAt: null,
    expandedRootIds: [],
    expandedNodeIds: [],
    pinnedNodeIds: [],
    nodePositions: {},
  }
}

export function normalizeWorkspaceOntologyState(
  value: unknown
): WorkspaceOntologyState {
  if (!value || typeof value !== "object") {
    return buildDefaultWorkspaceOntologyState()
  }
  const record = value as Partial<WorkspaceOntologyState>
  return {
    updatedAt: normalizeTimestamp(record.updatedAt),
    expandedRootIds: normalizeRootIds(record.expandedRootIds),
    expandedNodeIds: normalizeUniqueStrings(record.expandedNodeIds),
    // Legacy fields remain serializable, but generated nodes are always
    // positioned by the managed scene layout.
    pinnedNodeIds: [],
    nodePositions: {},
  }
}

export function areWorkspaceOntologyStatesEqual(
  left: WorkspaceOntologyState,
  right: WorkspaceOntologyState
) {
  return JSON.stringify(left) === JSON.stringify(right)
}
