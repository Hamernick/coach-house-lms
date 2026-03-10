"use client"

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import ReactFlow, {
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  type NodeChange,
  type NodeDragHandler,
  type ReactFlowInstance,
} from "reactflow"
import "reactflow/dist/style.css"

import Undo2Icon from "lucide-react/dist/esm/icons/undo-2"
import Redo2Icon from "lucide-react/dist/esm/icons/redo-2"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import { useTheme } from "next-themes"
import { MAX_HISTORY, SAVE_DEBOUNCE_MS } from "@/components/people/org-chart-canvas/constants"
import { PersonNode } from "@/components/people/org-chart-canvas/components"
import {
  buildGraphLayout,
  getPositionExtent,
  snapshotFromNodes,
  snapshotsEqual,
} from "@/components/people/org-chart-canvas/helpers"
import type {
  FlowNode,
  OrgChartCanvasProps as Props,
  PositionPayload,
  PositionSnapshot,
} from "@/components/people/org-chart-canvas/types"

const ORG_NODE_TYPES = Object.freeze({ person: PersonNode })
const ORG_EDGE_TYPES = Object.freeze({})
const ORG_DEFAULT_VIEWPORT = Object.freeze({ x: 0, y: 0, zoom: 0.38 })
const ORG_PRO_OPTIONS = Object.freeze({ hideAttribution: true })
const ORG_DEFAULT_EDGE_OPTIONS = Object.freeze({
  type: "smoothstep" as const,
  style: Object.freeze({ strokeWidth: 1.4 }),
})

function OrgChartCanvasComponent({ people, extras = false, canEdit = true }: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [reactFlow, setReactFlow] = useState<ReactFlowInstance | null>(null)
  const [pendingFit, setPendingFit] = useState(true)
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(0)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdatesRef = useRef<Map<string, PositionPayload>>(new Map())
  const historyRef = useRef<{ stack: PositionSnapshot[]; index: number }>({
    stack: [],
    index: -1,
  })

  const theme = mounted && resolvedTheme ? resolvedTheme : "light"
  const isDark = theme === "dark"

  const graph = useMemo(() => buildGraphLayout(people), [people])
  const translateExtent = useMemo(() => getPositionExtent(nodes), [nodes])
  const showMiniMap = extras && nodes.length > 24

  const flushPositionUpdates = useCallback(async () => {
    if (pendingUpdatesRef.current.size === 0) return
    const payload = Array.from(pendingUpdatesRef.current.values())
    pendingUpdatesRef.current.clear()
    setIsSaving(true)
    try {
      const response = await fetch("/api/people/position", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ positions: payload }),
      })
      if (!response.ok) {
        throw new Error("Unable to save chart layout.")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save chart layout."
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [])

  const queuePositionPersist = useCallback((updates: PositionPayload[]) => {
    if (updates.length === 0) return
    for (const update of updates) {
      pendingUpdatesRef.current.set(update.id, update)
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void flushPositionUpdates()
    }, SAVE_DEBOUNCE_MS)
  }, [flushPositionUpdates])

  const resetHistory = useCallback((snapshot: PositionSnapshot) => {
    historyRef.current = { stack: [snapshot], index: 0 }
    setHistoryVersion((value) => value + 1)
  }, [])

  const pushHistorySnapshot = useCallback((snapshot: PositionSnapshot) => {
    const current = historyRef.current
    if (snapshotsEqual(current.stack[current.index], snapshot)) return

    const nextStack = current.stack.slice(0, current.index + 1)
    nextStack.push(snapshot)
    if (nextStack.length > MAX_HISTORY) {
      nextStack.splice(0, nextStack.length - MAX_HISTORY)
    }
    historyRef.current = { stack: nextStack, index: nextStack.length - 1 }
    setHistoryVersion((value) => value + 1)
  }, [])

  const applySnapshot = useCallback(
    (snapshot: PositionSnapshot, persist: boolean) => {
      setNodes((previousNodes) => {
        const updates: PositionPayload[] = []
        const nextNodes = previousNodes.map((node) => {
          const nextPos = snapshot[node.id]
          if (!nextPos) return node
          if (node.position.x === nextPos.x && node.position.y === nextPos.y) return node
          updates.push({ id: node.id, x: nextPos.x, y: nextPos.y })
          return { ...node, position: { x: nextPos.x, y: nextPos.y } }
        })
        if (persist) queuePositionPersist(updates)
        return nextNodes
      })
    },
    [queuePositionPersist],
  )

  const canUndo = historyRef.current.index > 0
  const canRedo = historyRef.current.index > -1 && historyRef.current.index < historyRef.current.stack.length - 1
  const handleReactFlowError = useCallback((errorCode: string, message: string) => {
    console.warn(`[org-chart][reactflow:${errorCode}] ${message}`)
  }, [])

  const handleUndo = useCallback(() => {
    const current = historyRef.current
    if (current.index <= 0) return
    const nextIndex = current.index - 1
    const nextSnapshot = current.stack[nextIndex]
    historyRef.current = { stack: current.stack, index: nextIndex }
    setHistoryVersion((value) => value + 1)
    applySnapshot(nextSnapshot, true)
  }, [applySnapshot])

  const handleRedo = useCallback(() => {
    const current = historyRef.current
    if (current.index >= current.stack.length - 1) return
    const nextIndex = current.index + 1
    const nextSnapshot = current.stack[nextIndex]
    historyRef.current = { stack: current.stack, index: nextIndex }
    setHistoryVersion((value) => value + 1)
    applySnapshot(nextSnapshot, true)
  }, [applySnapshot])

  const handleResetLayout = useCallback(async () => {
    const snapshot = snapshotFromNodes(graph.defaultNodes)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    pendingUpdatesRef.current.clear()
    applySnapshot(snapshot, false)
    pushHistorySnapshot(snapshot)
    setPendingFit(true)
    try {
      await fetch("/api/people/position/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    } catch {}
  }, [applySnapshot, graph.defaultNodes, pushHistorySnapshot])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((previousNodes) => applyNodeChanges(changes, previousNodes) as FlowNode[])
  }, [])

  const onNodeDragStop = useCallback<NodeDragHandler>(
    (_, node) => {
      if (!canEdit) return
      setNodes((previousNodes) => {
        const nextNodes = previousNodes.map((item) => {
          if (item.id !== node.id) return item
          return {
            ...item,
            position: {
              x: Math.round(node.position.x),
              y: Math.round(node.position.y),
            },
          }
        })
        const snapshot = snapshotFromNodes(nextNodes)
        pushHistorySnapshot(snapshot)
        queuePositionPersist([
          {
            id: node.id,
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
          },
        ])
        return nextNodes
      })
    },
    [canEdit, pushHistorySnapshot, queuePositionPersist],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setNodes(graph.nodes)
    resetHistory(snapshotFromNodes(graph.nodes))
    setPendingFit(true)
  }, [graph.nodes, resetHistory])

  useEffect(() => {
    if (!reactFlow || !pendingFit) return
    const frame = window.requestAnimationFrame(() => {
      reactFlow.fitView({
        padding: 0.3,
        minZoom: 0.14,
        maxZoom: 0.9,
        duration: 160,
      })
      setPendingFit(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pendingFit, reactFlow, historyVersion])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      void flushPositionUpdates()
    }
  }, [flushPositionUpdates])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {canEdit ? "Drag to reorganize your chart." : "Organization chart"}
        </p>
        {canEdit ? (
          <div className="inline-flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={!canUndo}>
              <Undo2Icon className="mr-1 size-4" />
              Undo
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={!canRedo}>
              <Redo2Icon className="mr-1 size-4" />
              Redo
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetLayout}>
              <RotateCcwIcon className="mr-1 size-4" />
              Reset layout
            </Button>
            {isSaving ? <span className="text-xs text-muted-foreground">Saving…</span> : null}
          </div>
        ) : null}
      </div>
      <div
        className="h-[min(64vh,720px)] w-full rounded-2xl border border-border/60 bg-card/60 shadow-sm"
        style={{ contain: "layout paint" }}
      >
        {!mounted ? (
          <div className="h-full w-full" />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={graph.edges}
            defaultViewport={ORG_DEFAULT_VIEWPORT}
            minZoom={0.12}
            maxZoom={1}
            zoomOnPinch
            zoomOnScroll
            panOnDrag
            panOnScroll={false}
            nodesDraggable={canEdit}
            nodesConnectable={false}
            elementsSelectable={canEdit}
            selectionOnDrag={false}
            selectNodesOnDrag={false}
            onlyRenderVisibleElements
            proOptions={ORG_PRO_OPTIONS}
            defaultEdgeOptions={ORG_DEFAULT_EDGE_OPTIONS}
            nodeTypes={ORG_NODE_TYPES}
            edgeTypes={ORG_EDGE_TYPES}
            translateExtent={translateExtent}
            onError={handleReactFlowError}
            className="org-flow"
            style={{ width: "100%", height: "100%" }}
            onInit={setReactFlow}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
          >
            <Controls position="top-right" showInteractive={false} />
            {showMiniMap ? <MiniMap pannable zoomable /> : null}
            <Background color={isDark ? "#1f2937" : "#e5e7eb"} gap={18} />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}

export const OrgChartCanvas = memo(OrgChartCanvasComponent)
