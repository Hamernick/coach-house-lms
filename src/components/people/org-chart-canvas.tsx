/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { memo, useCallback, useEffect, useState } from "react"
import ReactFlow, {
  Background,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type NodeDragHandler,
} from "reactflow"
import "reactflow/dist/style.css"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
// Removed toast notifications for drag operations per UX request

type ViewPerson = OrgPerson & { displayImage?: string | null }
type Props = { people: ViewPerson[]; extras?: boolean }

const laneY: Record<OrgPerson["category"], number> = {
  board: 0,
  staff: 150,
  supporter: 300,
}

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

const CATEGORY_STRIP: Record<ViewPerson["category"], string> = {
  board: "bg-violet-500",
  staff: "bg-sky-500",
  supporter: "bg-emerald-500",
}

const PersonNode = memo(function PersonNode({ data }: { data: { name: string; title?: string | null; image?: string | null; category?: ViewPerson["category"] } }) {
  const img = data.image ?? null
  const cat = (data.category ?? "staff") as ViewPerson["category"]
  return (
    <div className="relative w-[240px] rounded-lg border bg-card p-2">
      <div className="flex items-center gap-3 pl-2">
        <Avatar className="size-10">
          <AvatarImage className="object-cover" src={img ?? undefined} alt={data.name} />
          <AvatarFallback>{initials(data.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{data.name}</div>
          <div className="truncate text-xs text-muted-foreground">{data.title}</div>
        </div>
      </div>
      <span className={`pointer-events-none absolute left-2 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full ${CATEGORY_STRIP[cat]}`} aria-hidden="true" />
      <Handle type="target" position={Position.Top} className="!bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent" />
    </div>
  )
})

// Stable node type map (module scope) to avoid creating a new object per render
const ORG_NODE_TYPES = Object.freeze({ person: PersonNode })

function OrgChartCanvasComponent({ people, extras = false }: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const theme = mounted && resolvedTheme ? resolvedTheme : "light"
  const isDark = theme === "dark"
  const [peopleLocal, setPeopleLocal] = useState<ViewPerson[]>(people)
  useEffect(() => setPeopleLocal(people), [people])

  const buildGraph = useCallback((listIn: ViewPerson[]) => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    const grouped: Record<ViewPerson["category"], ViewPerson[]> = {
      board: [],
      staff: [],
      supporter: [],
    }
    for (const p of listIn) grouped[p.category].push(p)

    const xGap = 220
    const yGap = 120

    for (const cat of ["board", "staff", "supporter"] as const) {
      const list = grouped[cat]
      const map = new Map<string, ViewPerson>()
      list.forEach((p) => map.set(p.id, p))

      const depthMemo = new Map<string, number>()
      function depth(id: string, seen: Set<string> = new Set()): number {
        if (seen.has(id)) return 0
        seen.add(id)
        if (depthMemo.has(id)) return depthMemo.get(id) as number
        const n = map.get(id)
        if (!n) return 0
        const parentId = n.reportsToId && map.has(n.reportsToId) ? n.reportsToId : null
        const d = parentId ? 1 + depth(parentId, seen) : 0
        depthMemo.set(id, d)
        return d
      }

      // Build levels
      const levels = new Map<number, ViewPerson[]>()
      for (const p of list) {
        const d = depth(p.id)
        const arr = levels.get(d) || []
        arr.push(p)
        levels.set(d, arr)
      }

      // Add nodes by level with positions
      const startX = 40
      for (const [d, arr] of Array.from(levels.entries()).sort((a, b) => a[0] - b[0])) {
        arr.forEach((p, i) => {
          const x = (p as any).pos?.x ?? startX + i * xGap
          const y = (p as any).pos?.y ?? laneY[cat] + d * yGap
          nodes.push({
            id: p.id,
            position: { x, y },
            data: { name: p.name, title: p.title ?? "", image: (p as any).displayImage ?? p.image ?? null, category: p.category },
            type: "person",
          })
        })
      }

      // Add edges within category
      for (const p of list) {
        if (p.reportsToId && map.has(p.reportsToId)) {
          edges.push({ id: `${p.reportsToId}-${p.id}`, source: p.reportsToId, target: p.id, animated: false })
        }
      }
    }

    return { nodes, edges }
  }, [])

  const [{ nodes, edges }, setGraph] = useState<{ nodes: Node[]; edges: Edge[] }>(() => buildGraph(peopleLocal))
  useEffect(() => {
    setGraph(buildGraph(peopleLocal))
  }, [peopleLocal, buildGraph])

  const onNodeDragStop: NodeDragHandler = useCallback(async (event, node) => {
    void event
    try {
      setGraph((prev) => ({
        nodes: prev.nodes.map((n) => (n.id === node.id ? { ...n, position: node.position } : n)),
        edges: prev.edges,
      }))
      // Silent persistence; no toasts
      await fetch("/api/people/position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: node.id, x: node.position.x, y: node.position.y }),
      })
    } catch (e) {
      // Silently ignore; UI stays responsive
      console.error("Save position failed", e)
    }
  }, [])

  // Smooth live dragging: apply changes as React Flow emits them
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setGraph((prev) => ({ nodes: applyNodeChanges(changes, prev.nodes), edges: prev.edges }))
  }, [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setGraph((prev) => ({ nodes: prev.nodes, edges: applyEdgeChanges(changes, prev.edges) }))
  }, [])

  // nodeTypes must be stable to avoid React Flow warning 002

  return (
    <div className="h-[min(60vh,620px)] w-full" style={{ contain: "layout paint" }}>
      {!mounted ? (
        <div className="h-full w-full" />
      ) : (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        zoomOnPinch
        zoomOnScroll
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        nodeTypes={ORG_NODE_TYPES}
        nodesConnectable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        panOnDrag
        className="org-flow"
        style={{ width: "100%", height: "100%" }}
        onNodeDragStop={onNodeDragStop}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        {extras ? <MiniMap pannable zoomable /> : null}
        {extras ? <Background color={isDark ? "#1f2937" : "#e5e7eb"} gap={16} /> : null}
      </ReactFlow>
      )}
    </div>
  )
}

export const OrgChartCanvas = memo(OrgChartCanvasComponent)
