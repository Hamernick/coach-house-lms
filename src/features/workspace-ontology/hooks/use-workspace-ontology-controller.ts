"use client"

import { useCallback, useMemo, useRef } from "react"

import {
  areWorkspaceOntologyStatesEqual,
  normalizeWorkspaceOntologyState,
} from "../lib"
import {
  type WorkspaceOntologyDetailLevel,
  type WorkspaceOntologyInput,
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

function toggleListValue<TValue extends string>(
  values: TValue[],
  value: TValue
) {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value]
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
      commitState({
        ...stateRef.current,
        expandedRootIds: toggleListValue(
          stateRef.current.expandedRootIds,
          rootId
        ),
      })
    },
    [commitState, stateRef]
  )

  const toggleNode = useCallback(
    (nodeId: string) => {
      commitState({
        ...stateRef.current,
        expandedNodeIds: toggleListValue(
          stateRef.current.expandedNodeIds,
          nodeId
        ),
      })
    },
    [commitState, stateRef]
  )

  const rootControls = useWorkspaceOntologyRootControls({
    input,
    state,
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
    layoutAnimating,
    rootControls,
    toggleNode,
  }
}
