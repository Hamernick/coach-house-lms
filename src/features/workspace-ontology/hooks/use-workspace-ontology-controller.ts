"use client"

import { useCallback, useMemo, useRef } from "react"

import {
  areWorkspaceOntologyStatesEqual,
  buildWorkspaceOntologyAncestorIdsByNodeId,
  normalizeWorkspaceOntologyState,
} from "../lib"
import {
  type WorkspaceOntologyDetailLevel,
  type WorkspaceOntologyInput,
  type WorkspaceOntologyMode,
  type WorkspaceOntologyObstacle,
  type WorkspaceOntologyRootGeometry,
  type WorkspaceOntologyRootId,
  type WorkspaceOntologyState,
} from "../types"
import { useWorkspaceOntologyRootControls } from "./use-workspace-ontology-controls"
import { useWorkspaceOntologyLayoutScene } from "./use-workspace-ontology-layout-scene"
import { useWorkspaceOntologyProjection } from "./use-workspace-ontology-projection"

function resolveDetailLevel(zoom: number): WorkspaceOntologyDetailLevel {
  if (zoom < 0.48) return "overview"
  if (zoom < 0.78) return "standard"
  return "full"
}

function resolveCanonicalNodePath({
  nodeIds,
  nodeById,
  rootId,
}: {
  nodeIds: string[]
  nodeById: Map<
    string,
    {
      hasChildren: boolean
      id: string
      parentId: string
      rootId: WorkspaceOntologyRootId
    }
  >
  rootId: WorkspaceOntologyRootId | undefined
}) {
  if (!rootId) return []
  const path: string[] = []
  let expectedParentId: string = rootId
  for (const nodeId of nodeIds) {
    const node = nodeById.get(nodeId)
    if (
      !node?.hasChildren ||
      node.rootId !== rootId ||
      node.parentId !== expectedParentId
    ) {
      continue
    }
    path.push(node.id)
    expectedParentId = node.id
  }
  return path
}

function useWorkspaceOntologyStateRef(
  rawState: WorkspaceOntologyState | undefined
) {
  const state = useMemo(
    () => normalizeWorkspaceOntologyState(rawState),
    [rawState]
  )
  const stateRef = useRef(state)
  stateRef.current = state
  return { state, stateRef }
}

export function useWorkspaceOntologyController({
  input,
  state: rawState,
  rootGeometry,
  obstacles,
  enabled,
  zoom,
  onStateChange,
}: {
  input: WorkspaceOntologyInput
  state: WorkspaceOntologyState | undefined
  rootGeometry: Partial<
    Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
  >
  obstacles: WorkspaceOntologyObstacle[]
  enabled: boolean
  zoom: number
  onStateChange: (next: WorkspaceOntologyState) => void
}) {
  const { state, stateRef } = useWorkspaceOntologyStateRef(rawState)
  const {
    layoutRootGeometry,
    attentionCounts,
    completedCounts,
    descendantCounts,
    projection,
  } = useWorkspaceOntologyProjection({
    input,
    state,
    rootGeometry,
    obstacles,
  })
  const {
    edgeTransitionDelays,
    edgeTransitionPhases,
    layoutAnimating,
    layoutEdges,
    layoutNodes,
    nodeTransitionDelays,
    nodeTransitionPhases,
  } = useWorkspaceOntologyLayoutScene({
    enabled,
    input,
    projection,
    layoutRootGeometry,
  })
  const ancestorIdsByNodeId = useMemo(
    () => buildWorkspaceOntologyAncestorIdsByNodeId(input),
    [input]
  )
  const projectedNodeById = useMemo(
    () => new Map(projection.allNodes.map((node) => [node.id, node] as const)),
    [projection.allNodes]
  )
  const canonicalNodePath = useMemo(
    () =>
      resolveCanonicalNodePath({
        nodeIds: state.expandedNodeIds,
        nodeById: projectedNodeById,
        rootId: state.expandedRootIds[0],
      }),
    [projectedNodeById, state.expandedNodeIds, state.expandedRootIds]
  )
  const resolvedState = useMemo(
    () =>
      state.mode === "focus"
        ? { ...state, expandedNodeIds: canonicalNodePath }
        : state,
    [canonicalNodePath, state]
  )
  const commitState = useCallback(
    (next: WorkspaceOntologyState) => {
      const current = stateRef.current
      const candidate = normalizeWorkspaceOntologyState({
        ...next,
        updatedAt: current.updatedAt,
      })
      if (areWorkspaceOntologyStatesEqual(current, candidate)) return
      const normalized = {
        ...candidate,
        updatedAt: new Date().toISOString(),
      }
      onStateChange(normalized)
    },
    [onStateChange, stateRef]
  )

  const toggleRoot = useCallback(
    (rootId: WorkspaceOntologyRootId) => {
      const current = stateRef.current
      if (current.mode === "map") {
        commitState({
          ...current,
          mode: "focus",
          expandedRootIds: [rootId],
          expandedNodeIds: [],
        })
        return
      }
      const closing = current.expandedRootIds[0] === rootId
      commitState({
        ...current,
        expandedRootIds: closing ? [] : [rootId],
        expandedNodeIds: [],
      })
    },
    [commitState, stateRef]
  )

  const toggleNode = useCallback(
    (nodeId: string) => {
      const node = projectedNodeById.get(nodeId)
      if (!node?.hasChildren) return
      const current = stateRef.current
      const ancestorIds = (ancestorIdsByNodeId.get(nodeId) ?? []).filter(
        (ancestorId) => projectedNodeById.get(ancestorId)?.hasChildren
      )
      const closing =
        current.expandedNodeIds[current.expandedNodeIds.length - 1] === nodeId
      commitState({
        ...current,
        mode: "focus",
        expandedRootIds: [node.rootId],
        expandedNodeIds: closing ? ancestorIds : [...ancestorIds, nodeId],
      })
    },
    [ancestorIdsByNodeId, commitState, projectedNodeById, stateRef]
  )

  const setMode = useCallback(
    (mode: WorkspaceOntologyMode) => {
      const current = stateRef.current
      if (current.mode === mode) return
      commitState({
        ...current,
        mode,
        expandedRootIds: current.expandedRootIds.slice(0, 1),
        expandedNodeIds: canonicalNodePath,
      })
    },
    [canonicalNodePath, commitState, stateRef]
  )

  const stepBack = useCallback(() => {
    const current = stateRef.current
    if (current.mode === "map") {
      commitState({ ...current, mode: "focus" })
      return
    }
    if (canonicalNodePath.length > 0) {
      commitState({
        ...current,
        expandedNodeIds: canonicalNodePath.slice(0, -1),
      })
      return
    }
    if (current.expandedRootIds.length > 0) {
      commitState({ ...current, expandedRootIds: [] })
    }
  }, [canonicalNodePath, commitState, stateRef])

  const rootControls = useWorkspaceOntologyRootControls({
    input,
    state: resolvedState,
    attentionCounts,
    completedCounts,
    descendantCounts,
    toggleRoot,
  })

  return {
    state,
    detailLevel: resolveDetailLevel(zoom),
    layoutNodes,
    edges: layoutEdges,
    nodeTransitionPhases,
    edgeTransitionPhases,
    nodeTransitionDelays,
    edgeTransitionDelays,
    visibleNodeCount: projection.nodes.length,
    allNodes: projection.allNodes,
    activeNodeIds: projection.activeNodeIds,
    activeRootId:
      state.mode === "focus" ? (state.expandedRootIds[0] ?? null) : null,
    layoutAnimating,
    rootControls,
    setMode,
    stepBack,
    toggleNode,
  }
}
