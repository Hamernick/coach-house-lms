"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, Handle, Position, Panel, type NodeDragHandler } from "reactflow"
import "reactflow/dist/style.css"

import type { OrgPerson } from "@/app/(dashboard)/people/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { toast } from "sonner"

type ViewPerson = OrgPerson & { displayImage?: string | null }
type Props = { people: ViewPerson[] }

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

function PersonNode({ data }: { data: { name: string; title?: string | null; image?: string | null; category?: ViewPerson["category"] } }) {
  const img = data.image ?? null
  const cat = (data.category ?? "staff") as ViewPerson["category"]
  return (
    <div className="relative w-[240px] rounded-lg border bg-card p-2 shadow-sm">
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
}

export function OrgChartCanvas({ people }: Props) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const theme = mounted && resolvedTheme ? resolvedTheme : "light"
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
      const maxWidth = Math.max(...Array.from(levels.values()).map((arr) => arr.length), 1)
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

  const onNodeDragStop: NodeDragHandler = useCallback(async (_e, node) => {
    try {
      setGraph((prev) => ({
        nodes: prev.nodes.map((n) => (n.id === node.id ? { ...n, position: node.position } : n)),
        edges: prev.edges,
      }))
      const t = toast.loading("Saving position…")
      const res = await fetch("/api/people/position", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: node.id, x: node.position.x, y: node.position.y }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        toast.error(j?.error || "Save failed", { id: t })
      } else {
        toast.success("Position saved", { id: t })
      }
    } catch (e) {
      toast.error("Save failed")
    }
  }, [])

  return (
    <div className="h-[min(60vh,620px)] w-full">
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
        nodeTypes={{ person: PersonNode }}
        className="[&_.react-flow__attribution]:hidden [&_.react-flow__controls]:bg-background/70 [&_.react-flow__controls]:backdrop-blur [&_.react-flow__controls-button]:text-foreground [&_.react-flow__controls-button]:bg-background/80 [&_.react-flow__controls-button]:border [&_.react-flow__controls-button]:border-border [&_.react-flow__controls-button:hover]:bg-accent/60 [&_.react-flow__minimap]:bg-background/80 [&_.react-flow__minimap]:border [&_.react-flow__minimap]:border-border"
        onNodeDragStop={onNodeDragStop}
      >
        <Panel position="top-right" className="m-2 flex gap-2 rounded-md border bg-background/80 p-2 text-xs backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {(["staff","board","supporter"] as const).map((cat) => (
            <button
              key={cat}
              className="inline-flex items-center gap-1 rounded border px-2 py-1 hover:bg-accent"
              onClick={async ()=>{
                const t = toast.loading("Resetting layout…")
                const res = await fetch("/api/people/position/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: cat }) })
                if (!res.ok) {
                  const j = await res.json().catch(()=>({}))
                  toast.error(j?.error || "Reset failed", { id: t })
                  return
                }
                // clear locally and rebuild
                const next = peopleLocal.map((p) => (p.category === cat ? { ...p, pos: null } : p))
                setPeopleLocal(next)
                setGraph(buildGraph(next))
                toast.success("Layout reset", { id: t })
              }}
            >
              Reset {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </Panel>
        <Panel position="top-left" className="m-2 rounded-md border bg-background/80 p-2 text-xs backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-sky-500" /> Staff</div>
            <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-violet-500" /> Board</div>
            <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> Supporters</div>
          </div>
        </Panel>
        <MiniMap
          pannable
          zoomable
          maskColor={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
          nodeColor={() => (theme === "dark" ? "#94a3b8" : "#64748b")}
        />
        <Controls className="!bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        <Background color={theme === "dark" ? "#1f2937" : "#e5e7eb"} gap={16} />
      </ReactFlow>
      )}
    </div>
  )
}
