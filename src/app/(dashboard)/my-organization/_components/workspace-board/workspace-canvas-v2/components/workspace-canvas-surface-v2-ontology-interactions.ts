"use client"

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEventHandler,
  type MutableRefObject,
} from "react"
import type {
  NodeChange,
  NodeDragHandler,
  NodeMouseHandler,
  OnNodesChange,
  ReactFlowInstance,
  SelectionDragHandler,
} from "reactflow"

import { useWorkspaceOntologyWayfinding } from "@/features/workspace-ontology"

import type { WorkspaceCanvasNode } from "./workspace-canvas-surface-v2-helpers"
import { mergeUniqueWorkspaceCanvasNodes } from "./workspace-canvas-edge-deduplication"
import { applyWorkspaceOntologySelectionChanges } from "./workspace-canvas-ontology-selection"
import type { useWorkspaceCanvasOntology } from "./workspace-canvas-surface-v2-ontology"

function resolveNodeChangeId(change: NodeChange) {
  return change.type === "add" || change.type === "reset"
    ? change.item.id
    : change.id
}

function useStableVisibleNodeIds(nodes: WorkspaceCanvasNode[]) {
  const previousIdsRef = useRef<string[]>([])
  return useMemo(() => {
    const nextIds = nodes.map((node) => node.id)
    const previousIds = previousIdsRef.current
    const unchanged =
      previousIds.length === nextIds.length &&
      nextIds.every((id, index) => previousIds[index] === id)
    if (unchanged) return previousIds
    previousIdsRef.current = nextIds
    return nextIds
  }, [nodes])
}

export function useWorkspaceCanvasOntologyInteractions({
  ontology,
  tutorialActive,
  renderNodes,
  onNodesChange,
  onNodeDragStop,
  onSelectionDragStop,
  flowInstanceRef,
  isFlowReady,
}: {
  ontology: ReturnType<typeof useWorkspaceCanvasOntology>
  tutorialActive: boolean
  renderNodes: WorkspaceCanvasNode[]
  onNodesChange: OnNodesChange
  onNodeDragStop: NodeDragHandler
  onSelectionDragStop: SelectionDragHandler
  flowInstanceRef: MutableRefObject<ReactFlowInstance | null>
  isFlowReady: boolean
}) {
  const { activateNode, layoutAnimating, nodes: ontologyNodes } = ontology
  const [selectedOntologyNodeIds, setSelectedOntologyNodeIds] = useState<
    ReadonlySet<string>
  >(() => new Set())
  const { cancelPendingFit } = useWorkspaceOntologyWayfinding({
    flowInstance: flowInstanceRef.current,
    isFlowReady,
    layoutAnimating,
    nodes: ontologyNodes,
  })
  const handleNodeClick = useCallback<NodeMouseHandler>(
    (event, node) => {
      if (!node.id.startsWith("ontology:")) return
      if (event.shiftKey || event.metaKey || event.ctrlKey) return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("button, a")
      ) {
        return
      }
      activateNode(node.id)
    },
    [activateNode]
  )
  const handleKeyDownCapture = useCallback<
    KeyboardEventHandler<HTMLDivElement>
  >(
    (event) => {
      if ((event.key !== "Enter" && event.key !== " ") || event.repeat) return
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (
        target.closest("button, a, input, textarea, select, [role=menuitem]")
      ) {
        return
      }
      const nodeElement = target.closest<HTMLElement>(
        '.react-flow__node[data-id^="ontology:"]'
      )
      const nodeId = nodeElement?.dataset.id
      if (!nodeId) return
      event.preventDefault()
      activateNode(nodeId)
    },
    [activateNode]
  )
  const nodes = useMemo(() => {
    if (tutorialActive) return renderNodes
    return mergeUniqueWorkspaceCanvasNodes(
      renderNodes,
      ontologyNodes.map((node) => ({
        ...node,
        selected: selectedOntologyNodeIds.has(node.id),
      }))
    )
  }, [ontologyNodes, renderNodes, selectedOntologyNodeIds, tutorialActive])
  const visibleNodeIds = useStableVisibleNodeIds(nodes)
  const handleNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      const dragging = changes.some(
        (change) => change.type === "position" && change.dragging === true
      )
      if (dragging) {
        cancelPendingFit()
      }
      const ontologyChanges = changes.filter((change) =>
        resolveNodeChangeId(change).startsWith("ontology:")
      )
      const workspaceChanges = changes.filter(
        (change) => !resolveNodeChangeId(change).startsWith("ontology:")
      )
      if (ontologyChanges.length > 0) {
        setSelectedOntologyNodeIds((selectedIds) =>
          applyWorkspaceOntologySelectionChanges({
            selectedIds,
            changes: ontologyChanges,
          })
        )
      }
      if (workspaceChanges.length > 0) onNodesChange(workspaceChanges)
    },
    [cancelPendingFit, onNodesChange]
  )
  const handleNodeDragStop = useCallback<NodeDragHandler>(
    (event, node, draggedNodes) => {
      if (node.id.startsWith("ontology:")) {
        return
      }
      onNodeDragStop(event, node, draggedNodes)
    },
    [onNodeDragStop]
  )
  const handleSelectionDragStop = useCallback<SelectionDragHandler>(
    (event, draggedNodes) => {
      const workspaceNodes = draggedNodes.filter(
        (node) => !node.id.startsWith("ontology:")
      )
      if (workspaceNodes.length > 0) onSelectionDragStop(event, workspaceNodes)
    },
    [onSelectionDragStop]
  )
  return {
    nodes,
    visibleNodeIds,
    onNodesChange: handleNodesChange,
    onNodeClick: handleNodeClick,
    onKeyDownCapture: handleKeyDownCapture,
    onNodeDragStop: handleNodeDragStop,
    onSelectionDragStop: handleSelectionDragStop,
  }
}
