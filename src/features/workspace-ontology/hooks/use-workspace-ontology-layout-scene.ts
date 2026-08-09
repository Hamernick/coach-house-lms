"use client"

import { useEffect, useRef, useState } from "react"

import {
  buildWorkspaceOntologyBranchLayoutSignature,
  buildWorkspaceOntologyTransitionWave,
  layoutWorkspaceOntology,
} from "../lib"
import type { WorkspaceOntologyTransitionPhase } from "../lib/transition-wave"
import type {
  WorkspaceOntologyInput,
  WorkspaceOntologyLayoutNode,
  WorkspaceOntologyProjectedEdge,
  WorkspaceOntologyProjection,
  WorkspaceOntologyRootGeometry,
  WorkspaceOntologyRootId,
} from "../types"

function buildTransitionPhases(
  previousIds: ReadonlySet<string>,
  nextIds: ReadonlySet<string>
) {
  return new Map<string, WorkspaceOntologyTransitionPhase>([
    ...Array.from(
      nextIds,
      (id) => [id, previousIds.has(id) ? "stable" : "entering"] as const
    ),
    ...Array.from(previousIds)
      .filter((id) => !nextIds.has(id))
      .map((id) => [id, "exiting"] as const),
  ])
}

function mergeDepartingItems<TItem extends { id: string }>(
  previousItems: TItem[],
  nextItems: TItem[]
) {
  const nextIds = new Set(nextItems.map((item) => item.id))
  return [
    ...nextItems,
    ...previousItems.filter((item) => !nextIds.has(item.id)),
  ]
}

function hasSetChanged(
  previous: ReadonlySet<string>,
  next: ReadonlySet<string>
) {
  return (
    previous.size !== next.size ||
    Array.from(previous).some((id) => !next.has(id))
  )
}

function hasWorkspaceOntologyLayoutMovement({
  previousNodes,
  nextNodes,
}: {
  previousNodes: WorkspaceOntologyLayoutNode[]
  nextNodes: WorkspaceOntologyLayoutNode[]
}) {
  const previousByNodeId = new Map(
    previousNodes.map((node) => [node.id, node] as const)
  )
  const hasNodeMovement = nextNodes.some((node) => {
    const previous = previousByNodeId.get(node.id)
    return (
      previous &&
      (previous.position.x !== node.position.x ||
        previous.position.y !== node.position.y)
    )
  })
  return hasNodeMovement
}

export function useWorkspaceOntologyLayoutScene({
  enabled,
  input,
  projection,
  layoutRootGeometry,
}: {
  enabled: boolean
  input: WorkspaceOntologyInput
  projection: WorkspaceOntologyProjection
  layoutRootGeometry: Partial<
    Record<WorkspaceOntologyRootId, WorkspaceOntologyRootGeometry>
  >
}) {
  const layoutRequestRef = useRef(0)
  const layoutNodesRef = useRef<WorkspaceOntologyLayoutNode[]>([])
  const layoutEdgesRef = useRef<WorkspaceOntologyProjectedEdge[]>([])
  const layoutSignaturesRef = useRef(new Map<WorkspaceOntologyRootId, string>())
  const layoutTransitionTimerRef = useRef<number | null>(null)
  const [layoutNodes, setLayoutNodes] = useState<WorkspaceOntologyLayoutNode[]>(
    []
  )
  const [layoutEdges, setLayoutEdges] = useState<
    WorkspaceOntologyProjectedEdge[]
  >([])
  const [nodeTransitionPhases, setNodeTransitionPhases] = useState(
    new Map<string, WorkspaceOntologyTransitionPhase>()
  )
  const [edgeTransitionPhases, setEdgeTransitionPhases] = useState(
    new Map<string, WorkspaceOntologyTransitionPhase>()
  )
  const [nodeTransitionDelays, setNodeTransitionDelays] = useState(
    new Map<string, number>()
  )
  const [edgeTransitionDelays, setEdgeTransitionDelays] = useState(
    new Map<string, number>()
  )
  const [layoutAnimating, setLayoutAnimating] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (layoutTransitionTimerRef.current !== null) {
      window.clearTimeout(layoutTransitionTimerRef.current)
      layoutTransitionTimerRef.current = null
    }
    if (!enabled) {
      layoutRequestRef.current += 1
      layoutNodesRef.current = []
      layoutEdgesRef.current = []
      layoutSignaturesRef.current.clear()
      setLayoutNodes([])
      setLayoutEdges([])
      setNodeTransitionPhases(new Map())
      setEdgeTransitionPhases(new Map())
      setNodeTransitionDelays(new Map())
      setEdgeTransitionDelays(new Map())
      setLayoutAnimating(false)
      return
    }
    const requestId = layoutRequestRef.current + 1
    layoutRequestRef.current = requestId
    const nextSignatures = new Map<WorkspaceOntologyRootId, string>()
    const dirtyRootIds = new Set<WorkspaceOntologyRootId>()
    for (const rootInput of input.roots) {
      const root = layoutRootGeometry[rootInput.id]
      if (!root) continue
      const signature = buildWorkspaceOntologyBranchLayoutSignature({
        projection,
        rootId: rootInput.id,
        root,
      })
      nextSignatures.set(rootInput.id, signature)
      if (layoutSignaturesRef.current.get(rootInput.id) !== signature) {
        dirtyRootIds.add(rootInput.id)
      }
    }
    setLayoutAnimating(true)
    void layoutWorkspaceOntology({
      projection,
      rootGeometry: layoutRootGeometry,
      previousLayoutNodes: layoutNodesRef.current,
      dirtyRootIds,
    }).then((nextNodes) => {
      if (cancelled || layoutRequestRef.current !== requestId) return
      const previousNodes = layoutNodesRef.current
      const previousEdges = layoutEdgesRef.current
      const nextEdges = projection.edges
      const previousNodeIds = new Set(previousNodes.map((node) => node.id))
      const nextNodeIds = new Set(nextNodes.map((node) => node.id))
      const previousEdgeIds = new Set(previousEdges.map((edge) => edge.id))
      const nextEdgeIds = new Set(nextEdges.map((edge) => edge.id))
      const transitionNodes = mergeDepartingItems(previousNodes, nextNodes)
      const transitionEdges = mergeDepartingItems(previousEdges, nextEdges)
      const hasSceneChange =
        hasSetChanged(previousNodeIds, nextNodeIds) ||
        hasSetChanged(previousEdgeIds, nextEdgeIds)
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      const shouldAnimate =
        !reducedMotion &&
        (hasSceneChange ||
          hasWorkspaceOntologyLayoutMovement({
            previousNodes,
            nextNodes,
          }))

      const nextNodeTransitionPhases = buildTransitionPhases(
        previousNodeIds,
        nextNodeIds
      )
      const nextEdgeTransitionPhases = buildTransitionPhases(
        previousEdgeIds,
        nextEdgeIds
      )
      const transitionWave = buildWorkspaceOntologyTransitionWave({
        previousNodes,
        nextNodes,
        previousEdges,
        nextEdges,
        nodePhases: nextNodeTransitionPhases,
        edgePhases: nextEdgeTransitionPhases,
      })

      setNodeTransitionPhases(nextNodeTransitionPhases)
      setEdgeTransitionPhases(nextEdgeTransitionPhases)
      setNodeTransitionDelays(transitionWave.nodeDelays)
      setEdgeTransitionDelays(transitionWave.edgeDelays)
      // Keep the accepted target scene canonical while transition-only items
      // remain rendered. A rapid follow-up request must never use departing
      // nodes as layout input or pair stale geometry with an older signature.
      layoutNodesRef.current = nextNodes
      layoutEdgesRef.current = nextEdges
      layoutSignaturesRef.current = nextSignatures
      setLayoutNodes(transitionNodes)
      setLayoutEdges(transitionEdges)

      const completeTransition = () => {
        if (cancelled || layoutRequestRef.current !== requestId) return
        layoutTransitionTimerRef.current = null
        layoutNodesRef.current = nextNodes
        layoutEdgesRef.current = nextEdges
        setLayoutNodes(nextNodes)
        setLayoutEdges(nextEdges)
        setNodeTransitionPhases(new Map())
        setEdgeTransitionPhases(new Map())
        setNodeTransitionDelays(new Map())
        setEdgeTransitionDelays(new Map())
        setLayoutAnimating(false)
      }
      if (!shouldAnimate) {
        completeTransition()
        return
      }
      layoutTransitionTimerRef.current = window.setTimeout(
        completeTransition,
        transitionWave.duration
      )
    })
    return () => {
      cancelled = true
      if (layoutTransitionTimerRef.current !== null) {
        window.clearTimeout(layoutTransitionTimerRef.current)
        layoutTransitionTimerRef.current = null
      }
    }
  }, [enabled, input.roots, layoutRootGeometry, projection])

  return {
    layoutNodes,
    layoutEdges,
    nodeTransitionPhases,
    edgeTransitionPhases,
    nodeTransitionDelays,
    edgeTransitionDelays,
    layoutAnimating,
  }
}
