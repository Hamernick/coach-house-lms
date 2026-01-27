/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { memo, useCallback, useEffect, useState } from "react"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  Panel,
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type NodeDragHandler,
} from "reactflow"
import "reactflow/dist/style.css"

import type { OrgPerson } from "@/actions/people"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { PERSON_CATEGORY_META, type PersonCategory } from "@/lib/people/categories"
import { cn } from "@/lib/utils"
// Removed toast notifications for drag operations per UX request

type ViewPerson = OrgPerson & { displayImage?: string | null }
type Props = { people: ViewPerson[]; extras?: boolean; canEdit?: boolean }

function initials(name?: string | null) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

const CATEGORY_STRIP: Record<PersonCategory, string> = Object.fromEntries(
  Object.entries(PERSON_CATEGORY_META).map(([key, value]) => [key, value.stripClass]),
) as Record<PersonCategory, string>

const ORG_CHART_PADDING = 60

const PersonNode = memo(function PersonNode({
  data,
}: {
  data: { name: string; title?: string | null; image?: string | null; category?: ViewPerson["category"] }
}) {
  const img = data.image ?? null
  const cat = (data.category ?? "staff") as PersonCategory
  const isSupporter = cat === "supporters"
  return (
    <div className="relative w-[240px] rounded-lg border bg-card p-2">
      <div className="flex items-center gap-3 pl-2">
        <Avatar className={cn("size-10", isSupporter && "rounded-xl bg-muted/60 ring-1 ring-border/60")}>
          <AvatarImage className={cn(isSupporter ? "object-contain p-1.5" : "object-cover")} src={img ?? undefined} alt={data.name} />
          <AvatarFallback className={cn(isSupporter && "rounded-xl")}>{initials(data.name)}</AvatarFallback>
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

function OrgChartCanvasComponent({ people, extras = false, canEdit = true }: Props) {
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

    const grouped: Record<PersonCategory, ViewPerson[]> = {
      governing_board: [],
      advisory_board: [],
      supporters: [],
      staff: [],
      volunteers: [],
    }
    for (const p of listIn) {
      const bucket = grouped[p.category] ?? grouped.staff
      bucket.push(p)
    }

    const xGap = 240
    const yGap = 120
    const lanePadding = ORG_CHART_PADDING
    const laneGap = 80
    const categoryOrder: PersonCategory[] = ["governing_board", "staff", "advisory_board", "supporters", "volunteers"]

    const laneLayout = new Map<PersonCategory, { baseY: number; levels: Map<number, ViewPerson[]> }>()
    const topPadding = ORG_CHART_PADDING
    let cursorY = topPadding

    for (const cat of categoryOrder) {
      const list = grouped[cat]
      if (list.length === 0) continue
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

      const maxDepth = Math.max(0, ...Array.from(levels.keys()))
      const laneHeight = (maxDepth + 1) * yGap + lanePadding
      laneLayout.set(cat, { baseY: cursorY, levels })
      cursorY += laneHeight + laneGap
    }

    for (const cat of categoryOrder) {
      const list = grouped[cat]
      if (list.length === 0) continue
      const map = new Map<string, ViewPerson>()
      list.forEach((p) => map.set(p.id, p))

      const layout = laneLayout.get(cat)
      const baseY = layout?.baseY ?? 0
      const levels = layout?.levels ?? new Map<number, ViewPerson[]>()

      const startX = ORG_CHART_PADDING
      for (const [d, arr] of Array.from(levels.entries()).sort((a, b) => a[0] - b[0])) {
        arr.forEach((p, i) => {
          const x = (p as any).pos?.x ?? startX + i * xGap
          const y = (p as any).pos?.y ?? baseY + d * yGap
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
    if (!canEdit) return
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
  }, [canEdit])

  // Smooth live dragging: apply changes as React Flow emits them
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setGraph((prev) => ({ nodes: applyNodeChanges(changes, prev.nodes), edges: prev.edges }))
  }, [])
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setGraph((prev) => ({ nodes: prev.nodes, edges: applyEdgeChanges(changes, prev.edges) }))
  }, [])

  // nodeTypes must be stable to avoid React Flow warning 002

  return (
    <div className="h-[min(60vh,620px)] w-full rounded-2xl border border-border/60 bg-card/60 shadow-sm" style={{ contain: "layout paint" }}>
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
          nodesDraggable={canEdit}
          nodesConnectable={false}
          elementsSelectable={false}
          selectNodesOnDrag={false}
          panOnDrag
          translateExtent={[
            [-ORG_CHART_PADDING, -ORG_CHART_PADDING],
            [ORG_CHART_PADDING, ORG_CHART_PADDING],
          ]}
          className="org-flow"
          style={{ width: "100%", height: "100%" }}
          onNodeDragStop={onNodeDragStop}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
        >
          {extras ? <Controls position="top-right" showInteractive={false} /> : null}
          {extras ? <MiniMap pannable zoomable /> : null}
          {extras ? <Background color={isDark ? "#1f2937" : "#e5e7eb"} gap={16} /> : null}
        </ReactFlow>
      )}
    </div>
  )
}

export const OrgChartCanvas = memo(OrgChartCanvasComponent)
