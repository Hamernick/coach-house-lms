"use client"

import { useCallback, useEffect, useRef } from "react"
import type { ReactFlowInstance } from "reactflow"

type WorkspaceOntologyWayfindingNode = {
  id: string
  data: {
    node: {
      parentId: string
      rootId: string
    }
  }
}

const WORKSPACE_ONTOLOGY_CAMERA_PUNCH_MS = 520

export function useWorkspaceOntologyWayfinding({
  flowInstance,
  isFlowReady,
  layoutAnimating,
  nodes,
}: {
  flowInstance: ReactFlowInstance | null
  isFlowReady: boolean
  layoutAnimating: boolean
  nodes: WorkspaceOntologyWayfindingNode[]
}) {
  const previousNodeByIdRef = useRef(
    new Map(nodes.map((node) => [node.id, node] as const))
  )
  const fitPendingRef = useRef(false)
  const focusNodeIdRef = useRef<string | null>(null)
  const fitFrameRef = useRef<number | null>(null)

  const cancelPendingFit = useCallback(() => {
    fitPendingRef.current = false
    if (fitFrameRef.current === null) return
    window.cancelAnimationFrame(fitFrameRef.current)
    fitFrameRef.current = null
  }, [])

  useEffect(() => {
    const previousNodeById = previousNodeByIdRef.current
    const nextNodeById = new Map(nodes.map((node) => [node.id, node] as const))
    const addedNode = nodes.find((node) => !previousNodeById.has(node.id))
    const removedNode = Array.from(previousNodeById.values()).find(
      (node) => !nextNodeById.has(node.id)
    )
    if (addedNode || removedNode) {
      fitPendingRef.current = true
      focusNodeIdRef.current =
        addedNode?.id ?? removedNode?.data.node.parentId ?? null
    }
    previousNodeByIdRef.current = nextNodeById
    const opening = Boolean(addedNode)
    if (
      (layoutAnimating && !opening) ||
      !fitPendingRef.current ||
      !isFlowReady
    ) {
      return
    }

    fitPendingRef.current = false
    fitFrameRef.current = window.requestAnimationFrame(() => {
      fitFrameRef.current = null
      if (!flowInstance) return
      const narrowViewport = window.innerWidth < 640
      const focusNodeId = focusNodeIdRef.current
      const sceneIdSet = new Set([
        ...nodes.map((node) => node.id),
        ...nodes.map((node) => node.data.node.rootId),
      ])
      if (narrowViewport && focusNodeId) sceneIdSet.add(focusNodeId)
      const sceneNodes = flowInstance
        .getNodes()
        .filter((node) => sceneIdSet.has(node.id))
      if (sceneNodes.length === 0) return
      const focusNode = narrowViewport
        ? sceneNodes.find((node) => node.id === focusNodeId)
        : undefined
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      void flowInstance.fitView({
        nodes: focusNode ? [focusNode] : sceneNodes,
        padding: focusNode ? 0.12 : 0.16,
        minZoom: narrowViewport ? 0.9 : 0.35,
        maxZoom: 1,
        duration: reducedMotion ? 0 : WORKSPACE_ONTOLOGY_CAMERA_PUNCH_MS,
      })
    })
  }, [flowInstance, isFlowReady, layoutAnimating, nodes])

  useEffect(
    () => () => {
      if (fitFrameRef.current !== null) {
        window.cancelAnimationFrame(fitFrameRef.current)
      }
    },
    []
  )

  return { cancelPendingFit }
}
