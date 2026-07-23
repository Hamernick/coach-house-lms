import {
  WORKSPACE_ONTOLOGY_ROOT_IDS,
  type WorkspaceOntologyRootId,
  type WorkspaceOntologyState,
} from "../types"
import { buildDefaultWorkspaceOntologyState } from "./state"

export const WORKSPACE_ONTOLOGY_ROOTS_PARAM = "workspace-details"
export const WORKSPACE_ONTOLOGY_GROUPS_PARAM = "workspace-groups"

const ROOT_ID_SET = new Set<string>(WORKSPACE_ONTOLOGY_ROOT_IDS)
const MAX_EXPANDED_GROUPS = 48
const SAFE_GROUP_ID = /^[a-z0-9:_-]{1,160}$/i

function readUniqueParamValues(
  value: string | null,
  predicate: (entry: string) => boolean,
  limit: number
) {
  if (!value) return []
  const result: string[] = []
  const seen = new Set<string>()
  for (const rawEntry of value.split(",")) {
    const entry = rawEntry.trim()
    if (!entry || seen.has(entry) || !predicate(entry)) continue
    seen.add(entry)
    result.push(entry)
    if (result.length >= limit) break
  }
  return result
}

export function readWorkspaceOntologyUrlState(
  params: Pick<URLSearchParams, "get">
): WorkspaceOntologyState {
  const state = buildDefaultWorkspaceOntologyState()
  return {
    ...state,
    expandedRootIds: readUniqueParamValues(
      params.get(WORKSPACE_ONTOLOGY_ROOTS_PARAM),
      (entry) => ROOT_ID_SET.has(entry),
      WORKSPACE_ONTOLOGY_ROOT_IDS.length
    ) as WorkspaceOntologyRootId[],
    expandedNodeIds: readUniqueParamValues(
      params.get(WORKSPACE_ONTOLOGY_GROUPS_PARAM),
      (entry) => SAFE_GROUP_ID.test(entry),
      MAX_EXPANDED_GROUPS
    ),
  }
}

export function applyWorkspaceOntologyStateToParams(
  params: URLSearchParams,
  state: WorkspaceOntologyState
) {
  const normalized = readWorkspaceOntologyUrlState(
    new URLSearchParams([
      [WORKSPACE_ONTOLOGY_ROOTS_PARAM, state.expandedRootIds.join(",")],
      [WORKSPACE_ONTOLOGY_GROUPS_PARAM, state.expandedNodeIds.join(",")],
    ])
  )

  if (normalized.expandedRootIds.length > 0) {
    params.set(
      WORKSPACE_ONTOLOGY_ROOTS_PARAM,
      normalized.expandedRootIds.join(",")
    )
  } else {
    params.delete(WORKSPACE_ONTOLOGY_ROOTS_PARAM)
  }

  if (normalized.expandedNodeIds.length > 0) {
    params.set(
      WORKSPACE_ONTOLOGY_GROUPS_PARAM,
      normalized.expandedNodeIds.join(",")
    )
  } else {
    params.delete(WORKSPACE_ONTOLOGY_GROUPS_PARAM)
  }

  return params
}
